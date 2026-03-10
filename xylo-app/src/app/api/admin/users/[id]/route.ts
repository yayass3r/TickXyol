import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

const updateUserSchema = z.object({
  role: z.enum(['USER', 'CREATOR', 'MODERATOR', 'ADMIN']).optional(),
  is_active: z.boolean().optional(),
  kyc_status: z.enum(['NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
});

// GET /api/admin/users/[id] - Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getCurrentUser(request);
  if (!authUser || !requireRole(authUser.role, 'MODERATOR')) {
    return errorResponse('غير مصرح', 403);
  }

  const { id } = await params;
  const supabase = createServerClient();

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, username, display_name, role, is_active, is_verified, kyc_status, referral_code, created_at')
    .eq('id', id)
    .single();

  if (error || !user) {
    return errorResponse('المستخدم غير موجود', 404);
  }

  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', id)
    .single();

  return successResponse({ user, wallet });
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getCurrentUser(request);
  if (!authUser || !requireRole(authUser.role, 'ADMIN')) {
    return errorResponse('غير مصرح', 403);
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const supabase = createServerClient();
    const { data: user, error } = await supabase
      .from('users')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, email, username, role, is_active, kyc_status')
      .single();

    if (error || !user) {
      return errorResponse('حدث خطأ أثناء تحديث المستخدم', 500);
    }

    return successResponse({ user });
  } catch (error) {
    console.error('Admin user PATCH error:', error);
    return errorResponse('حدث خطأ في الخادم', 500);
  }
}
