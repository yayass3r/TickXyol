import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { hashPassword, createToken, setAuthCookie, generateReferralCode } from '@/lib/auth';
import { errorResponse, successResponse, sanitizeHtml } from '@/lib/utils';

const registerSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  username: z
    .string()
    .min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, 'اسم المستخدم يجب أن يحتوي على أحرف وأرقام وشرطة سفلية فقط'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  display_name: z.string().min(2).max(100).optional(),
  referral_code: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const { email, username, password, display_name, referral_code } = parsed.data;
    const supabase = createServerClient();

    // Check if email or username already exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id, email, username')
      .or(`email.eq.${email},username.eq.${username}`)
      .limit(1);

    const existingUser = existingUsers?.[0];
    if (existingUser) {
      if (existingUser.email === email) {
        return errorResponse('البريد الإلكتروني مستخدم بالفعل', 409);
      }
      return errorResponse('اسم المستخدم مستخدم بالفعل', 409);
    }

    // Find referrer if referral code provided
    let referrerId: string | null = null;
    if (referral_code) {
      const { data: referrers } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', referral_code.toUpperCase())
        .limit(1);
      referrerId = referrers?.[0]?.id ?? null;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate unique referral code
    let newReferralCode = generateReferralCode(username);
    // Ensure uniqueness
    let codeExists = true;
    while (codeExists) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', newReferralCode)
        .limit(1);
      if (!existing || existing.length === 0) codeExists = false;
      else newReferralCode = generateReferralCode(username);
    }

    // Create user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        username,
        display_name: display_name ? sanitizeHtml(display_name) : username,
        password_hash: passwordHash,
        referral_code: newReferralCode,
        referred_by: referrerId,
      })
      .select('id, email, username, display_name, role, avatar_url, referral_code')
      .single();

    if (insertError || !newUser) {
      console.error('Registration error:', insertError);
      return errorResponse('حدث خطأ أثناء إنشاء الحساب', 500);
    }

    // Create referral record if referred
    if (referrerId) {
      await supabase.from('referrals').insert({
        referrer_id: referrerId,
        referred_id: newUser.id,
        signup_bonus_paid: false,
      });
    }

    // Create JWT token
    const token = await createToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
      display_name: newUser.display_name,
      role: newUser.role,
      avatar_url: newUser.avatar_url,
    });

    await setAuthCookie(token);

    return successResponse(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          display_name: newUser.display_name,
          role: newUser.role,
          referral_code: newUser.referral_code,
        },
        token,
      },
      201
    );
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse('حدث خطأ في الخادم', 500);
  }
}
