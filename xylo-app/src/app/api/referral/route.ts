import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

// GET /api/referral - Get referral info and stats for current user
export async function GET(request: NextRequest) {
  const authUser = await getCurrentUser(request);
  if (!authUser) {
    return errorResponse('يجب تسجيل الدخول أولاً', 401);
  }

  const supabase = createServerClient();

  // Get user's referral code
  const { data: user } = await supabase
    .from('users')
    .select('referral_code')
    .eq('id', authUser.id)
    .single();

  // Get referrals made by this user
  const { data: referrals } = await supabase
    .from('referrals')
    .select('id, status, signup_bonus_paid, total_commission_earned, created_at, referred:referred_id(username, display_name, avatar_url, created_at)')
    .eq('referrer_id', authUser.id)
    .order('created_at', { ascending: false });

  const totalCommission = (referrals || []).reduce(
    (sum, r) => sum + (r.total_commission_earned || 0),
    0
  );
  const totalReferrals = referrals?.length ?? 0;

  const referralUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register?ref=${user?.referral_code}`;

  return successResponse({
    referral_code: user?.referral_code,
    referral_url: referralUrl,
    total_referrals: totalReferrals,
    total_commission_earned: totalCommission,
    referrals: referrals || [],
  });
}
