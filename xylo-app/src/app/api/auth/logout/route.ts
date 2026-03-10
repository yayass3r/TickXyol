import { clearAuthCookie } from '@/lib/auth';
import { successResponse } from '@/lib/utils';

export async function POST() {
  await clearAuthCookie();
  return successResponse({ message: 'تم تسجيل الخروج بنجاح' });
}
