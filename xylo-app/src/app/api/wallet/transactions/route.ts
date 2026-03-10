import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

// GET /api/wallet/transactions - Get user transaction history
export async function GET(request: NextRequest) {
  const authUser = await getCurrentUser(request);
  if (!authUser) {
    return errorResponse('يجب تسجيل الدخول أولاً', 401);
  }

  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
  const offset = (page - 1) * limit;
  const type = searchParams.get('type');

  let query = supabase
    .from('transactions')
    .select('*, related_user:related_user_id(username, display_name, avatar_url)', { count: 'exact' })
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) {
    query = query.eq('type', type);
  }

  const { data: transactions, error, count } = await query;

  if (error) {
    return errorResponse('حدث خطأ أثناء جلب المعاملات', 500);
  }

  return successResponse({
    transactions,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      pages: Math.ceil((count ?? 0) / limit),
    },
  });
}
