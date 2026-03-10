import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

const updateWithdrawalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED']),
  admin_notes: z.string().optional(),
});

// PATCH /api/admin/withdrawals/[id] - Process withdrawal request
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
    const parsed = updateWithdrawalSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const supabase = createServerClient();

    // Get current withdrawal
    const { data: withdrawal } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (!withdrawal) {
      return errorResponse('طلب السحب غير موجود', 404);
    }

    // If rejected, refund QUSCOIN to user
    if (parsed.data.status === 'REJECTED' && withdrawal.status === 'PENDING') {
      // Fetch current balance then increment
      const { data: wallet } = await supabase
        .from('wallets')
        .select('quscoin_balance')
        .eq('user_id', withdrawal.user_id)
        .single();

      if (wallet) {
        await supabase
          .from('wallets')
          .update({ quscoin_balance: wallet.quscoin_balance + withdrawal.quscoin_amount })
          .eq('user_id', withdrawal.user_id);
      }
    }

    const { data: updated, error } = await supabase
      .from('withdrawal_requests')
      .update({
        status: parsed.data.status,
        admin_notes: parsed.data.admin_notes ?? withdrawal.admin_notes,
        processed_by: authUser.id,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return errorResponse('حدث خطأ أثناء تحديث طلب السحب', 500);
    }

    return successResponse({ withdrawal: updated });
  } catch (error) {
    console.error('Admin withdrawal PATCH error:', error);
    return errorResponse('حدث خطأ في الخادم', 500);
  }
}
