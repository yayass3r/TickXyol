import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

const rechargeSchema = z.object({
  package_id: z.string().uuid(),
  payment_gateway: z.enum(['STRIPE', 'PAYPAL', 'MOYASAR', 'STC_PAY', 'PAYONEER', 'SKRILL']),
  payment_reference: z.string().optional(),
});

// POST /api/wallet/recharge - Process a recharge
export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser(request);
  if (!authUser) {
    return errorResponse('يجب تسجيل الدخول أولاً', 401);
  }

  try {
    const body = await request.json();
    const parsed = rechargeSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const { package_id, payment_gateway, payment_reference } = parsed.data;
    const supabase = createServerClient();

    // Call the atomic process_recharge database function
    const { data, error } = await supabase.rpc('process_recharge', {
      p_user_id: authUser.id,
      p_package_id: package_id,
      p_payment_reference: payment_reference ?? null,
      p_payment_gateway: payment_gateway,
    });

    if (error) {
      console.error('Recharge error:', error);
      return errorResponse(error.message || 'حدث خطأ أثناء عملية الشحن', 400);
    }

    // Fetch updated wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('malcoin_balance, quscoin_balance')
      .eq('user_id', authUser.id)
      .single();

    return successResponse({
      ...data,
      wallet,
    });
  } catch (error) {
    console.error('Recharge error:', error);
    return errorResponse('حدث خطأ في الخادم', 500);
  }
}
