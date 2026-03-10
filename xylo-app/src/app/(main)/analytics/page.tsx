import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "CREATOR" && user.role !== "ADMIN") redirect("/articles");

  const supabase = createServerClient();

  // Fetch user's articles with stats
  const { data: articles } = await supabase
    .from("articles")
    .select("id, title, slug, status, view_count, like_count, comment_count, gift_count, total_malcoin_received, published_at, created_at")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  // Calculate totals
  const totalViews = articles?.reduce((s, a) => s + (a.view_count || 0), 0) ?? 0;
  const totalLikes = articles?.reduce((s, a) => s + (a.like_count || 0), 0) ?? 0;
  const totalComments = articles?.reduce((s, a) => s + (a.comment_count || 0), 0) ?? 0;
  const totalGifts = articles?.reduce((s, a) => s + (a.gift_count || 0), 0) ?? 0;
  const totalEarnings = articles?.reduce((s, a) => s + (a.total_malcoin_received || 0), 0) ?? 0;

  const statusLabel = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "منشور";
      case "DRAFT": return "مسودة";
      case "UNDER_REVIEW": return "قيد المراجعة";
      case "REJECTED": return "مرفوض";
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "DRAFT": return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
      case "UNDER_REVIEW": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "REJECTED": return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">📊 إحصائيات المقالات</h1>
        <Link
          href="/articles/new"
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition"
        >
          + اكتب مقالاً
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-2xl font-bold text-blue-600">👁 {totalViews}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">مشاهدة</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-2xl font-bold text-red-500">❤️ {totalLikes}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">إعجاب</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-2xl font-bold text-blue-500">💬 {totalComments}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">تعليق</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-2xl font-bold text-purple-600">🎁 {totalGifts}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">هدية</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-2xl font-bold text-yellow-600">🪙 {totalEarnings}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">MALCOIN مكتسب</p>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            مقالاتي ({articles?.length || 0})
          </h2>
        </div>

        {(!articles || articles.length === 0) ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📝</div>
            <p className="text-gray-500 dark:text-gray-400">لم تنشر أي مقالات بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <th className="text-right py-3 px-4 font-medium">المقال</th>
                  <th className="text-center py-3 px-4 font-medium">الحالة</th>
                  <th className="text-center py-3 px-4 font-medium">👁</th>
                  <th className="text-center py-3 px-4 font-medium">❤️</th>
                  <th className="text-center py-3 px-4 font-medium">💬</th>
                  <th className="text-center py-3 px-4 font-medium">🎁</th>
                  <th className="text-center py-3 px-4 font-medium">🪙 MALCOIN</th>
                  <th className="text-center py-3 px-4 font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="py-3 px-4">
                      <Link
                        href={`/articles/${article.slug}`}
                        className="font-medium text-gray-900 dark:text-gray-100 hover:text-purple-600 transition line-clamp-1"
                      >
                        {article.title}
                      </Link>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(article.status)}`}>
                        {statusLabel(article.status)}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">{article.view_count}</td>
                    <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">{article.like_count}</td>
                    <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">{article.comment_count}</td>
                    <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">{article.gift_count}</td>
                    <td className="text-center py-3 px-4 font-semibold text-yellow-600">{article.total_malcoin_received}</td>
                    <td className="text-center py-3 px-4 text-gray-400 text-xs">
                      {article.published_at
                        ? new Date(article.published_at).toLocaleDateString("ar-SA")
                        : new Date(article.created_at).toLocaleDateString("ar-SA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
