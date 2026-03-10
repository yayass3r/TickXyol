"use client";

import { useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export default function SearchBar({ onSearch, initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const { theme } = useTheme();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(query);
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث في المقالات..."
        className={`w-full pl-10 pr-4 py-2.5 rounded-full border text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500 ${
          theme === "dark"
            ? "bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400"
            : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
        }`}
      />
      <button
        type="submit"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </form>
  );
}

/**
 * Highlights search terms in text by wrapping matches in <mark> tags.
 */
export function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;

  const terms = query.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return text;

  // Escape special regex characters
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-700 text-inherit rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}
