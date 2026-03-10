import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { errorResponse, successResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const authUser = await getCurrentUser(request);
  if (!authUser) {
    return errorResponse('غير مصرح', 401);
  }

  const supabase = createServerClient();
  const { data: user } = await supabase
    .from('users')
    .select('id, email, username, display_name, role, avatar_url, bio, is_verified, referral_code, created_at')
    .eq('id', authUser.id)
    .single();

  if (!user) {
    return errorResponse('المستخدم غير موجود', 404);
  }

  const { data: wallet } = await supabase
    .from('wallets')
    .select('malcoin_balance, quscoin_balance')
    .eq('user_id', authUser.id)
    .single();

  return successResponse({ ...user, wallet });
}
