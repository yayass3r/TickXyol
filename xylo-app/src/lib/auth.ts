import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import type { JwtPayload, AuthUser, UserRole } from '@/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'xylo_platform_jwt_secret_key_change_in_production_min32'
);

const TOKEN_COOKIE = 'xylo_token';
const TOKEN_EXPIRY = '7d';

// ==========================================
// Password utilities
// ==========================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ==========================================
// JWT utilities
// ==========================================

export async function createToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

// ==========================================
// Cookie management
// ==========================================

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
}

export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE)?.value ?? null;
}

// ==========================================
// Authentication helpers
// ==========================================

export async function getCurrentUser(req?: NextRequest): Promise<AuthUser | null> {
  let token: string | null = null;

  if (req) {
    // From request (middleware)
    token = req.cookies.get(TOKEN_COOKIE)?.value ?? null;
    // Also check Authorization header
    if (!token) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }
  } else {
    // From server component
    token = await getTokenFromCookies();
  }

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.userId,
    email: payload.email,
    username: payload.username as string,
    display_name: payload.display_name as string | null,
    role: payload.role,
    avatar_url: payload.avatar_url as string | null,
  };
}

export function requireRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    USER: 1,
    CREATOR: 2,
    MODERATOR: 3,
    ADMIN: 4,
  };
  return hierarchy[userRole] >= hierarchy[requiredRole];
}

// ==========================================
// Referral code generation
// ==========================================

export function generateReferralCode(username: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `${username.slice(0, 4).toUpperCase()}_${random}`;
}

// ==========================================
// CSRF token utilities
// ==========================================

export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}
