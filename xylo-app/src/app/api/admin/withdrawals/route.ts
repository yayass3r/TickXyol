import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

// GET /api/admin/withdrawals - List withdrawal requests
export async function GET(request: NextRequest) {
  const authUser = await getCurrentUser(request);
  if (!authUser || !requireRole(authUser.role, 'ADMIN')) {
    return errorResponse('غير مصرح', 403);
  }

  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('withdrawal_requests')
    .select('*, user:user_id(id, username, display_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: withdrawals, error, count } = await query;

  if (error) {
    return errorResponse('حدث خطأ أثناء جلب طلبات السحب', 500);
  }

  return successResponse({
    withdrawals,
    pagination: { page, limit, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) },
  });
}
