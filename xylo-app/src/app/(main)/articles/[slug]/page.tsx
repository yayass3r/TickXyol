import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServerClient();
  const { data: article } = await supabase
    .from("articles")
    .select("title, excerpt")
    .eq("slug", slug)
    .eq("status", "PUBLISHED")
    .limit(1);

  const a = article?.[0];
  if (!a) return { title: "مقال غير موجود - زايلو" };
  return {
    title: `${a.title} - زايلو`,
    description: a.excerpt || a.title,
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const supabase = createServerClient();
  const user = await getCurrentUser();

  const { data: articles } = await supabase
    .from("articles")
    .select(
      "id, title, slug, content, excerpt, cover_image_url, view_count, like_count, comment_count, gift_count, total_malcoin_received, tags, published_at, created_at, author:author_id(id, username, display_name, avatar_url, bio)"
    )
    .eq("slug", slug)
    .eq("status", "PUBLISHED")
    .limit(1);

  const article = articles?.[0];
  if (!article) notFound();

  const author = Array.isArray(article.author) ? article.author[0] : article.author;

  // Fetch comments
  const { data: comments } = await supabase
    .from("comments")
    .select("id, content, created_at, is_hidden, author:author_id(id, username, display_name, avatar_url)")
    .eq("article_id", article.id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: true })
    .limit(50);

  // Check if user liked this article
  let userLiked = false;
  if (user) {
    const { data: likes } = await supabase
      .from("article_likes")
      .select("id")
      .eq("article_id", article.id)
      .eq("user_id", user.id)
      .limit(1);
    userLiked = (likes?.length ?? 0) > 0;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Link */}
      <Link
        href="/articles"
        className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm mb-6"
      >
        → العودة للمقالات
      </Link>

      {/* Cover Image */}
      {article.cover_image_url ? (
        <img
          src={article.cover_image_url}
          alt={article.title}
          className="w-full h-64 md:h-96 object-cover rounded-2xl mb-8"
        />
      ) : (
        <div className="w-full h-48 md:h-64 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center rounded-2xl mb-8">
          <span className="text-7xl">📖</span>
        </div>
      )}

      {/* Article Header */}
      <article className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-gray-100 mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-relaxed">
          {article.title}
        </h1>

        {/* Author Info */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl font-bold text-purple-700">
            {author?.display_name?.[0] || author?.username?.[0] || "؟"}
          </div>
          <div className="flex-1">
            <Link
              href={`/profile/${author?.username}`}
              className="font-semibold text-gray-900 hover:text-purple-600 transition"
            >
              {author?.display_name || author?.username}
            </Link>
            <p className="text-sm text-gray-400">
              {article.published_at
                ? new Date(article.published_at).toLocaleDateString("ar-SA", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : ""}
            </p>
          </div>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {article.tags.map((tag: string) => (
              <span
                key={tag}
                className="bg-purple-50 text-purple-600 text-sm px-3 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none text-gray-800 leading-loose whitespace-pre-wrap">
          {article.content}
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 mt-8 pt-6 border-t border-gray-100 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            👁 <span>{article.view_count}</span> مشاهدة
          </span>
          <span className={`flex items-center gap-1.5 ${userLiked ? "text-red-500 font-semibold" : ""}`}>
            ❤️ <span>{article.like_count}</span> إعجاب
          </span>
          <span className="flex items-center gap-1.5">
            💬 <span>{article.comment_count}</span> تعليق
          </span>
          <span className="flex items-center gap-1.5">
            🎁 <span>{article.gift_count}</span> هدية
          </span>
        </div>
      </article>

      {/* Author Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">عن الكاتب</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-2xl font-bold text-purple-700">
            {author?.display_name?.[0] || author?.username?.[0] || "؟"}
          </div>
          <div>
            <p className="font-bold text-gray-900">{author?.display_name || author?.username}</p>
            <p className="text-sm text-gray-500">@{author?.username}</p>
            {author?.bio && <p className="text-sm text-gray-600 mt-1">{author.bio}</p>}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6">
          التعليقات ({comments?.length || 0})
        </h3>

        {!user && (
          <div className="bg-gray-50 rounded-xl p-4 text-center mb-6">
            <p className="text-gray-500 text-sm">
              <Link href={`/login?redirect=/articles/${slug}`} className="text-purple-600 hover:underline font-medium">
                سجّل الدخول
              </Link>{" "}
              لإضافة تعليق
            </p>
          </div>
        )}

        {(!comments || comments.length === 0) ? (
          <p className="text-center text-gray-400 py-8">لا توجد تعليقات بعد. كن أول من يعلّق!</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const commentAuthor = Array.isArray(comment.author)
                ? comment.author[0]
                : comment.author;
              return (
                <div key={comment.id} className="border-b border-gray-50 pb-4 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 text-sm font-bold">
                      {commentAuthor?.display_name?.[0] || commentAuthor?.username?.[0] || "؟"}
                    </div>
                    <div>
                      <span className="font-medium text-gray-800 text-sm">
                        {commentAuthor?.display_name || commentAuthor?.username}
                      </span>
                      <span className="text-xs text-gray-400 mr-2">
                        {new Date(comment.created_at).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm pr-11">{comment.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
