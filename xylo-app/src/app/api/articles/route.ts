import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse, successResponse, sanitizeHtml } from '@/lib/utils';

const articleSchema = z.object({
  title: z.string().min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل').max(500),
  content: z.string().min(100, 'المحتوى يجب أن يكون 100 حرف على الأقل'),
  excerpt: z.string().max(500).optional(),
  cover_image_url: z.string().url().optional(),
  tags: z.array(z.string()).max(10).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional().default('DRAFT'),
});

function generateSlug(title: string): string {
  // Simple slug generation from title (keep Arabic chars as-is for readability)
  const slug = title
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 200);
  return `${slug}-${Date.now()}`;
}

// GET /api/articles - List published articles
export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '10'));
  const offset = (page - 1) * limit;
  const search = searchParams.get('search');
  const tag = searchParams.get('tag');

  let query = supabase
    .from('articles')
    .select('id, title, slug, excerpt, cover_image_url, view_count, like_count, comment_count, gift_count, tags, published_at, author:author_id(id, username, display_name, avatar_url)', { count: 'exact' })
    .eq('status', 'PUBLISHED')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
  }

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  const { data: articles, error, count } = await query;

  if (error) {
    return errorResponse('حدث خطأ أثناء جلب المقالات', 500);
  }

  return successResponse({
    articles,
    pagination: { page, limit, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) },
  });
}

// POST /api/articles - Create new article
export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser(request);
  if (!authUser) {
    return errorResponse('يجب تسجيل الدخول أولاً', 401);
  }

  if (authUser.role !== 'CREATOR' && authUser.role !== 'ADMIN') {
    return errorResponse('فقط المبدعون يمكنهم نشر المقالات', 403);
  }

  try {
    const body = await request.json();
    const parsed = articleSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const { title, content, excerpt, cover_image_url, tags, status } = parsed.data;
    const supabase = createServerClient();

    const slug = generateSlug(title);

    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        author_id: authUser.id,
        title: sanitizeHtml(title),
        slug,
        content,
        excerpt: excerpt ? sanitizeHtml(excerpt) : null,
        cover_image_url: cover_image_url ?? null,
        tags: tags ?? [],
        status: status === 'PUBLISHED' ? 'UNDER_REVIEW' : 'DRAFT',
        published_at: status === 'PUBLISHED' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Article creation error:', error);
      return errorResponse('حدث خطأ أثناء إنشاء المقال', 500);
    }

    return successResponse({ article }, 201);
  } catch (error) {
    console.error('Article error:', error);
    return errorResponse('حدث خطأ في الخادم', 500);
  }
}
