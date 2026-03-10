import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

// GET /api/admin/stats - Platform statistics
export async function GET(request: NextRequest) {
  const authUser = await getCurrentUser(request);
  if (!authUser || !requireRole(authUser.role, 'MODERATOR')) {
    return errorResponse('غير مصرح', 403);
  }

  const supabase = createServerClient();

  const [
    { count: totalUsers },
    { count: totalCreators },
    { count: totalArticles },
    { count: pendingWithdrawals },
    { data: rechargeStats },
    { data: giftStats },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'CREATOR'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'PUBLISHED'),
    supabase.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
    supabase.from('transactions').select('malcoin_amount').eq('type', 'RECHARGE').eq('status', 'COMPLETED'),
    supabase.from('gift_transactions').select('platform_fee'),
  ]);

  const totalMalcoinRecharged = (rechargeStats || []).reduce(
    (sum, t) => sum + (t.malcoin_amount || 0),
    0
  );
  const totalPlatformRevenue = (giftStats || []).reduce(
    (sum, g) => sum + (g.platform_fee || 0),
    0
  );

  return successResponse({
    total_users: totalUsers ?? 0,
    total_creators: totalCreators ?? 0,
    total_articles: totalArticles ?? 0,
    pending_withdrawals: pendingWithdrawals ?? 0,
    total_malcoin_recharged: totalMalcoinRecharged,
    total_platform_revenue: totalPlatformRevenue,
  });
}
