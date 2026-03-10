import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse, successResponse, quscoinToUsd } from '@/lib/utils';

const withdrawSchema = z.object({
  quscoin_amount: z.number().int().positive().min(1000, 'الحد الأدنى للسحب هو 1000 QUSCOIN'),
  payment_gateway: z.enum(['STRIPE', 'PAYPAL', 'MOYASAR', 'STC_PAY', 'PAYONEER', 'SKRILL']),
  payment_details: z.object({}).passthrough(),
});

// POST /api/wallet/withdraw - Request withdrawal
export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser(request);
  if (!authUser) {
    return errorResponse('يجب تسجيل الدخول أولاً', 401);
  }

  if (authUser.role !== 'CREATOR' && authUser.role !== 'ADMIN') {
    return errorResponse('فقط المبدعون يمكنهم طلب السحب', 403);
  }

  try {
    const body = await request.json();
    const parsed = withdrawSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const { quscoin_amount, payment_gateway, payment_details } = parsed.data;
    const supabase = createServerClient();

    // Check KYC status
    const { data: user } = await supabase
      .from('users')
      .select('kyc_status')
      .eq('id', authUser.id)
      .single();

    if (user?.kyc_status !== 'APPROVED') {
      return errorResponse('يجب إتمام التحقق من الهوية (KYC) قبل السحب', 403);
    }

    // Check wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('quscoin_balance')
      .eq('user_id', authUser.id)
      .single();

    if (!wallet || wallet.quscoin_balance < quscoin_amount) {
      return errorResponse('رصيد QUSCOIN غير كافٍ', 400);
    }

    const usdEquivalent = quscoinToUsd(quscoin_amount);

    // Deduct from wallet and create withdrawal request atomically
    const { error: deductError } = await supabase
      .from('wallets')
      .update({ quscoin_balance: wallet.quscoin_balance - quscoin_amount })
      .eq('user_id', authUser.id);

    if (deductError) {
      return errorResponse('حدث خطأ أثناء معالجة طلب السحب', 500);
    }

    const { data: withdrawal, error: withdrawError } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: authUser.id,
        quscoin_amount,
        usd_equivalent: usdEquivalent,
        payment_gateway,
        payment_details,
        status: 'PENDING',
      })
      .select()
      .single();

    if (withdrawError) {
      // Rollback wallet deduction
      await supabase
        .from('wallets')
        .update({ quscoin_balance: wallet.quscoin_balance })
        .eq('user_id', authUser.id);
      return errorResponse('حدث خطأ أثناء إنشاء طلب السحب', 500);
    }

    // Record transaction
    await supabase.from('transactions').insert({
      user_id: authUser.id,
      type: 'WITHDRAWAL',
      status: 'PENDING',
      quscoin_amount,
      usd_amount: usdEquivalent,
      description: 'طلب سحب رصيد QUSCOIN',
      reference_id: withdrawal.id,
      reference_type: 'withdrawal',
    });

    return successResponse({ withdrawal });
  } catch (error) {
    console.error('Withdraw error:', error);
    return errorResponse('حدث خطأ في الخادم', 500);
  }
}
