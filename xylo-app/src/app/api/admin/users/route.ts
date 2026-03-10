import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

// GET /api/admin/users - List users with pagination
export async function GET(request: NextRequest) {
  const authUser = await getCurrentUser(request);
  if (!authUser || !requireRole(authUser.role, 'MODERATOR')) {
    return errorResponse('غير مصرح', 403);
  }

  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
  const offset = (page - 1) * limit;
  const search = searchParams.get('search');
  const role = searchParams.get('role');

  let query = supabase
    .from('users')
    .select('id, email, username, display_name, role, is_active, is_verified, kyc_status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    // Sanitize search value to prevent PostgREST filter injection
    const sanitized = search.replace(/[,.()]/g, '');
    query = query.or(`email.ilike.%${sanitized}%,username.ilike.%${sanitized}%`);
  }

  if (role) {
    query = query.eq('role', role);
  }

  const { data: users, error, count } = await query;

  if (error) {
    return errorResponse('حدث خطأ أثناء جلب المستخدمين', 500);
  }

  return successResponse({
    users,
    pagination: { page, limit, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) },
  });
}
