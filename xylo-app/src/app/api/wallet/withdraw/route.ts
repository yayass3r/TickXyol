import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse, successResponse, quscoinToUsd } from '@/lib/utils';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

const paymentDetailsSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(5).max(20).optional(),
  account_name: z.string().min(1).max(200).optional(),
  account_id: z.string().min(1).max(200).optional(),
}).refine(
  (data) => data.email || data.phone || data.account_id,
  { message: 'يجب توفير بريد إلكتروني أو رقم هاتف أو معرف حساب للدفع' }
);

const withdrawSchema = z.object({
  quscoin_amount: z.number().int().positive().min(1000, 'الحد الأدنى للسحب هو 1000 QUSCOIN'),
  payment_gateway: z.enum(['STRIPE', 'PAYPAL', 'MOYASAR', 'STC_PAY', 'PAYONEER', 'SKRILL']),
  payment_details: paymentDetailsSchema,
});

// POST /api/wallet/withdraw - Request withdrawal
export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser(request);
  if (!authUser) {
    return errorResponse('يجب تسجيل الدخول أولاً', 401);
  }

  // Rate limiting
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`withdraw:${ip}:${authUser.id}`, RATE_LIMITS.financial);
  if (!rateLimit.allowed) {
    return errorResponse('تم تجاوز الحد الأقصى للمحاولات. يرجى المحاولة لاحقاً', 429);
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

    const usdEquivalent = quscoinToUsd(quscoin_amount);

    // Atomically deduct QUSCOIN using DB function (prevents race conditions)
    const { error: deductError } = await supabase.rpc('deduct_quscoin_for_withdrawal', {
      p_user_id: authUser.id,
      p_quscoin_amount: quscoin_amount,
    });

    if (deductError) {
      return errorResponse(
        deductError.message?.includes('Insufficient')
          ? 'رصيد QUSCOIN غير كافٍ'
          : 'حدث خطأ أثناء معالجة طلب السحب',
        400
      );
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
      // Rollback wallet deduction via atomic refund
      const { error: refundError } = await supabase.rpc('refund_quscoin_to_wallet', {
        p_user_id: authUser.id,
        p_quscoin_amount: quscoin_amount,
      });
      if (refundError) {
        console.error('Critical: Refund failed after withdrawal error:', refundError);
      }
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
