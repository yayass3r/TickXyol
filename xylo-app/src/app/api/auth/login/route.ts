import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { verifyPassword, createToken, setAuthCookie } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('البريد الإلكتروني أو كلمة المرور غير صالحة');
    }

    const { email, password } = parsed.data;
    const supabase = createServerClient();

    const { data: user } = await supabase
      .from('users')
      .select('id, email, username, display_name, role, avatar_url, password_hash, is_active')
      .eq('email', email.toLowerCase())
      .single();

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
