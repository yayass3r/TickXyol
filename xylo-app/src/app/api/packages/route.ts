import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

// GET /api/packages - List active packages (shows promotional if first-time buyer)
export async function GET(request: NextRequest) {
  const supabase = createServerClient();

  // Get all active packages
  const { data: packages, error } = await supabase
    .from('recharge_packages')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    return errorResponse('حدث خطأ أثناء جلب الباقات', 500);
  }

  // Check if user is logged in and has previous purchases (for promo package filtering)
  const authUser = await getCurrentUser(request);
  let isFirstPurchase = false;

  if (authUser) {
    const { data: prevPurchase } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('type', 'RECHARGE')
      .eq('status', 'COMPLETED')
      .limit(1)
      .single();

    isFirstPurchase = !prevPurchase;
  }

  // Filter: hide first_purchase_only packages if user has already purchased
  const filtered = (packages || []).filter((pkg) => {
    if (pkg.first_purchase_only) {
      return isFirstPurchase;
    }
    return true;
  });

  return successResponse({ packages: filtered, is_first_purchase: isFirstPurchase });
}
