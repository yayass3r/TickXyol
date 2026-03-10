"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SearchBar, { highlightText } from "@/components/ui/SearchBar";

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  gift_count: number;
  tags: string[];
  published_at: string | null;
  author: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles("");
  }, []);

  async function fetchArticles(query: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (query) params.set("search", query);
      const res = await fetch(`/api/articles?${params}`);
      const data = await res.json();
      if (data.success) {
        const items = (data.data.articles || []).map((a: Record<string, unknown>) => ({
          ...a,
          author: Array.isArray(a.author) ? (a.author as Record<string, unknown>[])[0] : a.author,
        }));
        setArticles(items);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(query: string) {
    setSearchQuery(query);
    fetchArticles(query);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">أحدث المقالات</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchBar onSearch={handleSearch} initialQuery={searchQuery} />
          <Link
            href="/articles/new"
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition whitespace-nowrap"
          >
            + اكتب مقالاً
          </Link>
        </div>
      </div>

      {searchQuery && (
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          نتائج البحث عن: <span className="font-semibold text-purple-600 dark:text-purple-400">&ldquo;{searchQuery}&rdquo;</span>
          <button
            onClick={() => handleSearch("")}
            className="text-red-500 hover:text-red-600 mr-3 text-xs"
          >
            مسح البحث ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4 animate-pulse">⏳</div>
          <p className="text-gray-500 dark:text-gray-400">جارٍ تحميل المقالات...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
            {searchQuery ? "لم يتم العثور على نتائج" : "لا توجد مقالات بعد"}
          </h2>
          <p className="text-gray-400">
            {searchQuery ? "جرّب كلمات بحث مختلفة" : "كن أول من ينشر مقالاً على زايلو!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
            >
              {article.cover_image_url && (
                <img
                  src={article.cover_image_url}
                  alt={article.title}
                  className="w-full h-48 object-cover"
                />
              )}
              {!article.cover_image_url && (
                <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 flex items-center justify-center">
                  <span className="text-5xl">📖</span>
                </div>
              )}
              <div className="p-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                  {highlightText(article.title, searchQuery)}
                </h2>
                {article.excerpt && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                    {highlightText(article.excerpt, searchQuery)}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold text-sm">
                      {article.author?.display_name?.[0] || article.author?.username?.[0] || "؟"}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {article.author?.display_name || article.author?.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>👁 {article.view_count}</span>
                    <span>❤️ {article.like_count}</span>
                    <span>🎁 {article.gift_count}</span>
                  </div>
                </div>

                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {article.tags.slice(0, 3).map((tag: string) => (
                      <span
                        key={tag}
                        className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs px-2 py-0.5 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
