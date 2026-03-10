import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

// POST /api/upload - Upload image to Supabase Storage
export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser(request);
  if (!authUser) {
    return errorResponse('يجب تسجيل الدخول أولاً', 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('يرجى اختيار ملف للرفع');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse('نوع الملف غير مدعوم. يُسمح بـ JPEG, PNG, WebP, GIF فقط');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return errorResponse('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
    }

    const supabase = createServerClient();

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${authUser.id}/${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return errorResponse('حدث خطأ أثناء رفع الصورة', 500);
    }

    const { data: publicUrl } = supabase.storage
      .from('covers')
      .getPublicUrl(filename);

    return successResponse({ url: publicUrl.publicUrl }, 201);
  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse('حدث خطأ في الخادم', 500);
  }
}
