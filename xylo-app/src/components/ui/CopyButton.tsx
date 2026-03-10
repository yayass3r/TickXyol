"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}

export default function CopyButton({
  text,
  label = "نسخ",
  copiedLabel = "تم النسخ ✓",
  className = "bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Both methods failed - inform user
        alert("لم يتم النسخ. يرجى نسخ النص يدوياً.");
      }
    }
  }

  return (
    <button onClick={handleCopy} className={className}>
      {copied ? copiedLabel : label}
    </button>
  );
}
