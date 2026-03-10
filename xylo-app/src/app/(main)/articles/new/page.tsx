"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewArticlePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    cover_image_url: "",
    tags: "",
    status: "DRAFT" as "DRAFT" | "PUBLISHED",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const tags = formData.tags
        ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10)
        : [];

      if (tags.length > 10) {
        setError("الحد الأقصى 10 وسوم فقط");
        return;
      }

      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt || undefined,
          cover_image_url: formData.cover_image_url || undefined,
          tags,
          status: formData.status,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "حدث خطأ أثناء إنشاء المقال");
        return;
      }

      router.push("/articles");
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">كتابة مقال جديد</h1>

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              عنوان المقال <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              minLength={5}
              maxLength={500}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 text-lg"
              placeholder="اكتب عنواناً جذاباً لمقالك..."
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملخص المقال (اختياري)
            </label>
            <textarea
              maxLength={500}
              rows={2}
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 resize-none"
              placeholder="وصف مختصر يظهر في بطاقة المقال..."
            />
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رابط صورة الغلاف (اختياري)
            </label>
            <input
              type="url"
              value={formData.cover_image_url}
              onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              placeholder="https://example.com/image.jpg"
              dir="ltr"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              محتوى المقال <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              minLength={100}
              rows={15}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 leading-relaxed resize-y"
              placeholder="اكتب محتوى مقالك هنا... (100 حرف على الأقل)"
            />
            <p className="text-xs text-gray-400 mt-1">
              {formData.content.length} حرف
              {formData.content.length < 100 && (
                <span className="text-red-400"> (يجب أن يكون 100 حرف على الأقل)</span>
              )}
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الوسوم (اختياري)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              placeholder="تقنية, برمجة, ذكاء اصطناعي (مفصولة بفاصلة)"
            />
            <p className="text-xs text-gray-400 mt-1">حد أقصى 10 وسوم، مفصولة بفاصلة</p>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center gap-4 py-2">
            <label className="text-sm font-medium text-gray-700">حالة النشر:</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: "DRAFT" })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  formData.status === "DRAFT"
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                مسودة
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: "PUBLISHED" })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  formData.status === "PUBLISHED"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                نشر للمراجعة
              </button>
            </div>
          </div>

          {formData.status === "PUBLISHED" && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg p-3 text-sm">
              ℹ️ سيتم إرسال المقال للمراجعة قبل النشر
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading
                ? "جارٍ الحفظ..."
                : formData.status === "PUBLISHED"
                ? "إرسال للمراجعة"
                : "حفظ كمسودة"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium rounded-lg transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
