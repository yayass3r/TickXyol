import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

const updatePackageSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  name_ar: z.string().min(2).max(100).optional(),
  price_usd: z.number().positive().optional(),
  malcoin_amount: z.number().int().positive().optional(),
  bonus_percentage: z.number().min(0).max(100).optional(),
  bonus_malcoin: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  is_promotional: z.boolean().optional(),
  first_purchase_only: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
});

// PUT /api/admin/packages/[id] - Update package
export async function PUT(
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
    const parsed = updatePackageSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const supabase = createServerClient();
    const { data: pkg, error } = await supabase
      .from('recharge_packages')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return errorResponse('حدث خطأ أثناء تحديث الباقة', 500);
    }

    if (!pkg) {
      return errorResponse('الباقة غير موجودة', 404);
    }

    return successResponse({ package: pkg });
  } catch (error) {
    console.error('Admin package PUT error:', error);
    return errorResponse('حدث خطأ في الخادم', 500);
  }
}

// DELETE /api/admin/packages/[id] - Delete (soft-delete by deactivating) package
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getCurrentUser(request);
  if (!authUser || !requireRole(authUser.role, 'ADMIN')) {
    return errorResponse('غير مصرح', 403);
  }

  const { id } = await params;
  const supabase = createServerClient();

  const { error } = await supabase
    .from('recharge_packages')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return errorResponse('حدث خطأ أثناء حذف الباقة', 500);
  }

  return successResponse({ message: 'تم تعطيل الباقة بنجاح' });
}
