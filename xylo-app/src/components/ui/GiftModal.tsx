"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

interface Gift {
  id: string;
  name: string;
  name_ar: string;
  icon_url: string | null;
  malcoin_cost: number;
}

interface GiftModalProps {
  articleId: string;
  authorName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function GiftModal({ articleId, authorName, isOpen, onClose }: GiftModalProps) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { theme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      fetchGifts();
      setSuccess(false);
      setError("");
      setSelectedGift(null);
    }
  }, [isOpen]);

  async function fetchGifts() {
    try {
      const res = await fetch("/api/gifts");
      const data = await res.json();
      if (data.success) {
        setGifts(data.data.gifts || []);
      }
    } catch {
      setError("حدث خطأ أثناء جلب الهدايا");
    }
  }

  async function handleSendGift() {
    if (!selectedGift) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gift_id: selectedGift.id,
          article_id: articleId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "حدث خطأ أثناء إرسال الهدية");
      }
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setSending(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className={`relative w-full max-w-md rounded-2xl shadow-xl p-6 ${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      }`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 left-4 p-1 rounded-lg transition ${
            theme === "dark" ? "text-gray-400 hover:bg-gray-700" : "text-gray-400 hover:bg-gray-100"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>
              تم إرسال الهدية!
            </h3>
            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              شكراً لدعمك {authorName}
            </p>
            <button
              onClick={onClose}
              className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition"
            >
              إغلاق
            </button>
          </div>
        ) : (
          <>
            <h3 className={`text-xl font-bold mb-1 ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>
              🎁 إرسال هدية
            </h3>
            <p className={`text-sm mb-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              ادعم {authorName} بإرسال هدية
            </p>

            {/* Gift Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {gifts.map((gift) => (
                <button
                  key={gift.id}
                  type="button"
                  onClick={() => setSelectedGift(gift)}
                  className={`p-4 rounded-xl border-2 transition text-center ${
                    selectedGift?.id === gift.id
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                      : theme === "dark"
                      ? "border-gray-600 hover:border-gray-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-3xl mb-2">
                    {gift.icon_url || "🎁"}
                  </div>
                  <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-900"}`}>
                    {gift.name_ar}
                  </p>
                  <p className="text-xs text-yellow-600 font-semibold mt-1">
                    🪙 {gift.malcoin_cost} MALCOIN
                  </p>
                </button>
              ))}
            </div>

            {gifts.length === 0 && !error && (
              <p className={`text-center py-4 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                جارٍ تحميل الهدايا...
              </p>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm mb-4">
                {error}
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSendGift}
              disabled={!selectedGift || sending}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 rounded-lg transition"
            >
              {sending
                ? "جارٍ الإرسال..."
                : selectedGift
                ? `إرسال ${selectedGift.name_ar} (🪙 ${selectedGift.malcoin_cost})`
                : "اختر هدية للإرسال"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
