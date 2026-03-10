"use client";

import { useState } from "react";
import GiftModal from "@/components/ui/GiftModal";
import Link from "next/link";

interface ArticleActionsProps {
  articleId: string;
  authorName: string;
  isLoggedIn: boolean;
}

export default function ArticleActions({ articleId, authorName, isLoggedIn }: ArticleActionsProps) {
  const [giftModalOpen, setGiftModalOpen] = useState(false);

  return (
    <>
      {isLoggedIn ? (
        <button
          onClick={() => setGiftModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          🎁 أرسل هدية
        </button>
      ) : (
        <Link
          href="/login"
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          🎁 سجّل دخول لإرسال هدية
        </Link>
      )}

      <GiftModal
        articleId={articleId}
        authorName={authorName}
        isOpen={giftModalOpen}
        onClose={() => setGiftModalOpen(false)}
      />
    </>
  );
}
