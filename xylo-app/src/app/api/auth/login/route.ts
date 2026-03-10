import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { verifyPassword, createToken, setAuthCookie } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`login:${ip}`, RATE_LIMITS.auth);
    if (!rateLimit.allowed) {
      return errorResponse('تم تجاوز الحد الأقصى للمحاولات. يرجى المحاولة لاحقاً', 429);
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('البريد الإلكتروني أو كلمة المرور غير صالحة');
    }

    const { email, password } = parsed.data;

    let supabase;
    try {
      supabase = createServerClient();
    } catch {
      console.error('Login error: Failed to create Supabase client. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
      return errorResponse('حدث خطأ في إعدادات الخادم', 500);
    }

    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('id, email, username, display_name, role, avatar_url, password_hash, is_active')
      .eq('email', email.toLowerCase())
      .single();

    if (dbError && dbError.code !== 'PGRST116') {
      console.error('Login DB error:', dbError.message);
      return errorResponse('حدث خطأ في الاتصال بقاعدة البيانات', 500);
    }

    if (!user) {
      return errorResponse('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
    }

    if (!user.is_active) {
      return errorResponse('هذا الحساب معطّل. يرجى التواصل مع الدعم', 403);
    }

    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return errorResponse('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      display_name: user.display_name,
      role: user.role,
      avatar_url: user.avatar_url,
    });

    await setAuthCookie(token);

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        role: user.role,
        avatar_url: user.avatar_url,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('حدث خطأ في الخادم', 500);
  }
}
