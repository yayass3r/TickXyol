import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { errorResponse, successResponse } from '@/lib/utils';

// GET /api/gifts - List available gifts
export async function GET(_request: NextRequest) {
  const supabase = createServerClient();

  const { data: gifts, error } = await supabase
    .from('gifts')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    return errorResponse('حدث خطأ أثناء جلب الهدايا', 500);
  }

  return successResponse({ gifts });
}
