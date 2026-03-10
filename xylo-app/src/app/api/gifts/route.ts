import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

// GET /api/gifts - List available gifts
export async function GET() {
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

const sendGiftSchema = z.object({
  gift_id: z.string().uuid('معرف الهدية غير صالح'),
  article_id: z.string().uuid('معرف المقال غير صالح'),
});

// POST /api/gifts - Send a gift to an article's author
export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser(request);
  if (!authUser) {
    return errorResponse('يجب تسجيل الدخول أولاً', 401);
  }

  try {
    const body = await request.json();
    const parsed = sendGiftSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const { gift_id, article_id } = parsed.data;
    const supabase = createServerClient();

    // Get article to find the author
    const { data: article } = await supabase
      .from('articles')
      .select('id, author_id')
      .eq('id', article_id)
      .eq('status', 'PUBLISHED')
      .single();

    if (!article) {
      return errorResponse('المقال غير موجود', 404);
    }

    if (article.author_id === authUser.id) {
      return errorResponse('لا يمكنك إرسال هدية لنفسك', 400);
    }

    // Call the atomic process_gift database function
    const { data, error } = await supabase.rpc('process_gift', {
      p_sender_id: authUser.id,
      p_receiver_id: article.author_id,
      p_gift_id: gift_id,
      p_article_id: article_id,
    });

    if (error) {
      console.error('Gift error:', error);
      const msg = error.message || '';
      if (msg.includes('Insufficient')) {
        return errorResponse('رصيد MALCOIN غير كافٍ لإرسال هذه الهدية', 400);
      }
      if (msg.includes('Gift not found')) {
        return errorResponse('الهدية غير موجودة أو غير متاحة', 400);
      }
      return errorResponse('حدث خطأ أثناء إرسال الهدية', 500);
    }

    // Create notification for the receiver (non-blocking; gift already succeeded)
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: article.author_id,
      type: 'gift',
      title: 'هدية جديدة! 🎁',
      message: `أرسل لك ${authUser.display_name || authUser.username} هدية على مقالك`,
      link: `/articles/${article_id}`,
    });
    if (notifError) {
      console.error('Failed to create gift notification:', notifError);
    }

    return successResponse(data, 201);
  } catch (error) {
    console.error('Gift error:', error);
    return errorResponse('حدث خطأ في الخادم', 500);
  }
}
