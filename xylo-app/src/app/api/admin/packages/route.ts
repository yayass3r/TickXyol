import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

const packageSchema = z.object({
  name: z.string().min(2).max(100),
  name_ar: z.string().min(2).max(100),
  price_usd: z.number().positive(),
  malcoin_amount: z.number().int().positive(),
  bonus_percentage: z.number().min(0).max(100).optional().default(0),
  bonus_malcoin: z.number().int().min(0).optional().default(0),
  is_active: z.boolean().optional().default(true),
  is_promotional: z.boolean().optional().default(false),
  first_purchase_only: z.boolean().optional().default(false),
  display_order: z.number().int().min(0).optional().default(0),
});

// GET /api/admin/packages - List all packages (including inactive)
export async function GET(request: NextRequest) {
  const authUser = await getCurrentUser(request);
  if (!authUser || !requireRole(authUser.role, 'ADMIN')) {
    return errorResponse('غير مصرح', 403);
  }

  const supabase = createServerClient();
  const { data: packages, error } = await supabase
    .from('recharge_packages')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    return errorResponse('حدث خطأ أثناء جلب الباقات', 500);
  }

  return successResponse({ packages });
}

// POST /api/admin/packages - Create new package
export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser(request);
  if (!authUser || !requireRole(authUser.role, 'ADMIN')) {
    return errorResponse('غير مصرح', 403);
  }

  try {
    const body = await request.json();
    const parsed = packageSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const supabase = createServerClient();
    const { data: pkg, error } = await supabase
      .from('recharge_packages')
      .insert(parsed.data)
      .select()
      .single();

    if (error) {
      return errorResponse('حدث خطأ أثناء إنشاء الباقة', 500);
    }

    return successResponse({ package: pkg }, 201);
  } catch (error) {
    console.error('Admin packages POST error:', error);
    return errorResponse('حدث خطأ في الخادم', 500);
  }
}
