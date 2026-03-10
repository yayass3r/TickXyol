import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  const authUser = await getCurrentUser(request);
  if (!authUser) {
    return errorResponse('يجب تسجيل الدخول أولاً', 401);
  }

  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
  const unreadOnly = searchParams.get('unread') === 'true';

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data: notifications, error } = await query;

  if (error) {
    return errorResponse('حدث خطأ أثناء جلب الإشعارات', 500);
  }

  // Get unread count
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', authUser.id)
    .eq('is_read', false);

  return successResponse({ notifications, unread_count: count ?? 0 });
}

// POST /api/notifications - Mark notifications as read
export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser(request);
  if (!authUser) {
    return errorResponse('يجب تسجيل الدخول أولاً', 401);
  }

  try {
    const body = await request.json();
    const supabase = createServerClient();

    if (body.mark_all_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', authUser.id)
        .eq('is_read', false);
    } else if (body.notification_id) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', body.notification_id)
        .eq('user_id', authUser.id);
    }

    return successResponse({ message: 'تم تحديث الإشعارات' });
  } catch {
    return errorResponse('حدث خطأ في الخادم', 500);
  }
}
