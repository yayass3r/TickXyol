import { getCurrentUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    redirect("/");
  }

  const supabase = createServerClient();

  const [
    { count: totalUsers },
    { count: totalCreators },
    { count: totalArticles },
    { count: pendingWithdrawals },
    { data: rechargeStats },
    { data: giftStats },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "CREATOR"),
    supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "PUBLISHED"),
    supabase.from("withdrawal_requests").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    supabase.from("transactions").select("malcoin_amount").eq("type", "RECHARGE").eq("status", "COMPLETED"),
    supabase.from("gift_transactions").select("platform_fee"),
  ]);

  const totalMalcoinRecharged = (rechargeStats || []).reduce(
    (sum, t) => sum + (t.malcoin_amount || 0), 0
  );
  const totalPlatformRevenue = (giftStats || []).reduce(
    (sum, g) => sum + (g.platform_fee || 0), 0
  );

  const stats = [
    { label: "إجمالي المستخدمين", value: (totalUsers || 0).toLocaleString(), icon: "👥", color: "bg-blue-50 text-blue-700" },
    { label: "الكُتّاب", value: (totalCreators || 0).toLocaleString(), icon: "✍️", color: "bg-purple-50 text-purple-700" },
    { label: "المقالات المنشورة", value: (totalArticles || 0).toLocaleString(), icon: "📰", color: "bg-green-50 text-green-700" },
    { label: "طلبات سحب معلّقة", value: (pendingWithdrawals || 0).toLocaleString(), icon: "💸", color: "bg-orange-50 text-orange-700" },
    { label: "MALCOIN المُشحون", value: totalMalcoinRecharged.toLocaleString(), icon: "🪙", color: "bg-yellow-50 text-yellow-700" },
    { label: "إيرادات المنصة (MALCOIN)", value: totalPlatformRevenue.toLocaleString(), icon: "💰", color: "bg-emerald-50 text-emerald-700" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-500 mt-1">مرحباً، {user.display_name || user.username}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-5">إجراءات سريعة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: "/admin/users", label: "إدارة المستخدمين", icon: "👥" },
            { href: "/admin/packages", label: "إدارة الباقات", icon: "📦" },
            { href: "/admin/withdrawals", label: "طلبات السحب", icon: "💸" },
            { href: "/articles", label: "استعراض المقالات", icon: "📰" },
          ].map((action) => (
            <a
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-100 hover:border-purple-500 hover:bg-purple-50 transition"
            >
              <span className="text-3xl">{action.icon}</span>
              <span className="text-sm font-medium text-gray-700 text-center">{action.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
