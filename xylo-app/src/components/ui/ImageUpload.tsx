"use client";

import { useState, useRef } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentUrl?: string;
}

export default function ImageUpload({ onUpload, currentUrl }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    // Client-side validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("نوع الملف غير مدعوم. يُسمح بـ JPEG, PNG, WebP, GIF فقط");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الملف يجب أن يكون أقل من 5 ميجابايت");
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        onUpload(data.data.url);
      } else {
        setError(data.error || "حدث خطأ أثناء رفع الصورة");
        setPreview(currentUrl || null);
      }
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition ${
          uploading ? "opacity-50 pointer-events-none" : ""
        } ${
          theme === "dark"
            ? "border-gray-600 hover:border-purple-400 bg-gray-800"
            : "border-gray-300 hover:border-purple-400 bg-gray-50"
        }`}
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="معاينة الغلاف"
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition">
              <span className="text-white text-sm font-medium">تغيير الصورة</span>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <div className="text-4xl mb-2">📷</div>
            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              {uploading ? "جارٍ الرفع..." : "اضغط لرفع صورة الغلاف"}
            </p>
            <p className={`text-xs mt-1 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
              JPEG, PNG, WebP, GIF — حد أقصى 5 ميجابايت
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-2">{error}</p>
      )}
    </div>
  );
}
