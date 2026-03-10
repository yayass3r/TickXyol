import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ArticlesPage() {
  const supabase = createServerClient();

  const { data: articles } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, cover_image_url, view_count, like_count, comment_count, gift_count, tags, published_at, author:author_id(id, username, display_name, avatar_url)")
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false })
    .limit(20);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">أحدث المقالات</h1>
        <Link
          href="/articles/new"
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition"
        >
          + اكتب مقالاً
        </Link>
      </div>

      {(!articles || articles.length === 0) ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">لا توجد مقالات بعد</h2>
          <p className="text-gray-400">كن أول من ينشر مقالاً على زايلو!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => {
            const author = Array.isArray(article.author) ? article.author[0] : article.author;
            return (
              <Link
                key={article.id}
                href={`/articles/${article.slug}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                {article.cover_image_url && (
                  <img
                    src={article.cover_image_url}
                    alt={article.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                {!article.cover_image_url && (
                  <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                    <span className="text-5xl">📖</span>
                  </div>
                )}
                <div className="p-5">
                  <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {article.title}
                  </h2>
                  {article.excerpt && (
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4">{article.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-sm">
                        {author?.display_name?.[0] || author?.username?.[0] || "؟"}
                      </div>
                      <span className="text-sm text-gray-600">
                        {author?.display_name || author?.username}
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
                          className="bg-purple-50 text-purple-600 text-xs px-2 py-0.5 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
