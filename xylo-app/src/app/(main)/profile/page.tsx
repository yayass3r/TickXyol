import { getCurrentUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/profile");

  const supabase = createServerClient();

  const [{ data: profile }, { data: wallet }, { data: referralData }] = await Promise.all([
    supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single(),
    supabase.from("wallets").select("*").eq("user_id", user.id).single(),
    supabase
      .from("referrals")
      .select("id, total_commission_earned, created_at")
      .eq("referrer_id", user.id),
  ]);

  const referralUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/register?ref=${profile?.referral_code}`;
  const totalReferrals = referralData?.length || 0;
  const totalCommission = (referralData || []).reduce(
    (sum, r) => sum + (r.total_commission_earned || 0),
    0
  );

  const roleBadges: Record<string, { label: string; color: string }> = {
    USER: { label: "قارئ", color: "bg-blue-100 text-blue-700" },
    CREATOR: { label: "كاتب", color: "bg-purple-100 text-purple-700" },
    MODERATOR: { label: "مشرف", color: "bg-orange-100 text-orange-700" },
    ADMIN: { label: "مدير", color: "bg-red-100 text-red-700" },
  };

  const roleBadge = roleBadges[profile?.role || "USER"];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-3xl font-bold text-purple-700 flex-shrink-0">
            {profile?.display_name?.[0] || profile?.username?.[0] || "؟"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {profile?.display_name || profile?.username}
              </h1>
              {roleBadge && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleBadge.color}`}>
                  {roleBadge.label}
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mb-2">@{profile?.username}</p>
            {profile?.bio && <p className="text-gray-600 text-sm">{profile.bio}</p>}
            <p className="text-gray-400 text-xs mt-2">
              عضو منذ {new Date(profile?.created_at || "").toLocaleDateString("ar-SA")}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-yellow-600">
            {(wallet?.malcoin_balance || 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">🪙 MALCOIN</div>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-green-600">
            {(wallet?.quscoin_balance || 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">💎 QUSCOIN</div>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-purple-600">{totalReferrals}</div>
          <div className="text-xs text-gray-500 mt-1">👥 إحالات</div>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-orange-600">{totalCommission.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">🪙 عمولات</div>
        </div>
      </div>

      {/* Referral Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">رابط الإحالة</h2>
        <p className="text-gray-500 text-sm mb-4">
          شارك رابطك الخاص للحصول على{" "}
          <span className="font-semibold text-yellow-600">50 MALCOIN</span> لكل صديق تدعوه، و
          <span className="font-semibold text-green-600"> عمولة 2%</span> من كل شحن يقوم به!
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            readOnly
            value={referralUrl}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 bg-gray-50"
            dir="ltr"
          />
          <button
            onClick={() => navigator.clipboard?.writeText(referralUrl)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            نسخ
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          كود الإحالة: <span className="font-mono font-bold text-gray-600">{profile?.referral_code}</span>
        </p>
      </div>

      {/* KYC Status for Creators */}
      {(profile?.role === "CREATOR" || profile?.role === "ADMIN") && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">حالة التحقق من الهوية (KYC)</h2>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            profile?.kyc_status === "APPROVED"
              ? "bg-green-100 text-green-700"
              : profile?.kyc_status === "PENDING"
              ? "bg-yellow-100 text-yellow-700"
              : profile?.kyc_status === "REJECTED"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-600"
          }`}>
            {profile?.kyc_status === "APPROVED" && "✅ تم التحقق"}
            {profile?.kyc_status === "PENDING" && "⏳ قيد المراجعة"}
            {profile?.kyc_status === "REJECTED" && "❌ مرفوض"}
            {profile?.kyc_status === "NOT_SUBMITTED" && "📋 لم يُقدَّم بعد"}
          </div>
          {profile?.kyc_status === "NOT_SUBMITTED" && (
            <p className="text-sm text-gray-500 mt-3">
              لسحب أرباحك، يجب إتمام التحقق من الهوية أولاً.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
