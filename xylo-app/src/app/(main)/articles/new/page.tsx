"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ImageUpload from "@/components/ui/ImageUpload";

const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center text-gray-400">
      جارٍ تحميل المحرر...
    </div>
  ),
});

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

  function getTextLength(html: string): number {
    // Strip HTML tags and decode entities to get approximate text length
    if (typeof document !== "undefined") {
      const div = document.createElement("div");
      div.innerHTML = html;
      return (div.textContent || "").length;
    }
    return html.replace(/<[^>]*>/g, "").length;
  }

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

      const textLength = getTextLength(formData.content);
      if (textLength < 100) {
        setError("محتوى المقال يجب أن يكون 100 حرف على الأقل");
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

  const textLength = getTextLength(formData.content);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">كتابة مقال جديد</h1>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              عنوان المقال <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              minLength={5}
              maxLength={500}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 dark:bg-gray-700 text-lg"
              placeholder="اكتب عنواناً جذاباً لمقالك..."
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ملخص المقال (اختياري)
            </label>
            <textarea
              maxLength={500}
              rows={2}
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 dark:bg-gray-700 resize-none"
              placeholder="وصف مختصر يظهر في بطاقة المقال..."
            />
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              صورة الغلاف (اختياري)
            </label>
            <ImageUpload
              onUpload={(url) => setFormData({ ...formData, cover_image_url: url })}
              currentUrl={formData.cover_image_url || undefined}
            />
          </div>

          {/* Content - Rich Text Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              محتوى المقال <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              content={formData.content}
              onChange={(html) => setFormData({ ...formData, content: html })}
              placeholder="اكتب محتوى مقالك هنا... (100 حرف على الأقل)"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {textLength} حرف
              {textLength < 100 && (
                <span className="text-red-400"> (يجب أن يكون 100 حرف على الأقل)</span>
              )}
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الوسوم (اختياري)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 dark:bg-gray-700"
              placeholder="تقنية, برمجة, ذكاء اصطناعي (مفصولة بفاصلة)"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">حد أقصى 10 وسوم، مفصولة بفاصلة</p>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center gap-4 py-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">حالة النشر:</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: "DRAFT" })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  formData.status === "DRAFT"
                    ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
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
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                نشر للمراجعة
              </button>
            </div>
          </div>

          {formData.status === "PUBLISHED" && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 rounded-lg p-3 text-sm">
              ℹ️ سيتم إرسال المقال للمراجعة قبل النشر
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm">
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
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium rounded-lg transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
