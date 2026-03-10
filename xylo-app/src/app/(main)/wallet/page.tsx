import { getCurrentUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { QUSCOIN_TO_USD_RATE } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function WalletPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/wallet");

  const supabase = createServerClient();

  const [{ data: wallet }, { data: packages }, { data: transactions }] = await Promise.all([
    supabase.from("wallets").select("*").eq("user_id", user.id).single(),
    supabase
      .from("recharge_packages")
      .select("*")
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const transactionTypeLabels: Record<string, string> = {
    RECHARGE: "شحن رصيد",
    GIFT_SENT: "هدية مُرسلة",
    GIFT_RECEIVED: "هدية مُستلمة",
    WITHDRAWAL: "سحب رصيد",
    REFERRAL_BONUS: "مكافأة إحالة",
    REFERRAL_COMMISSION: "عمولة إحالة",
    PLATFORM_FEE: "رسوم المنصة",
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">محفظتي</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🪙</span>
            <div>
              <p className="text-yellow-100 text-sm">رصيد MALCOIN</p>
              <p className="text-3xl font-bold">{(wallet?.malcoin_balance || 0).toLocaleString()}</p>
            </div>
          </div>
          <p className="text-yellow-100 text-xs">للشحن والهدايا</p>
        </div>

        <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">💎</span>
            <div>
              <p className="text-green-100 text-sm">رصيد QUSCOIN</p>
              <p className="text-3xl font-bold">{(wallet?.quscoin_balance || 0).toLocaleString()}</p>
            </div>
          </div>
          <p className="text-green-100 text-xs">
            يعادل ${((wallet?.quscoin_balance || 0) * QUSCOIN_TO_USD_RATE).toFixed(2)} USD
          </p>
        </div>
      </div>

      {/* Recharge Packages */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-5">شحن الرصيد</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(packages || []).map((pkg) => (
            <div
              key={pkg.id}
              className={`border-2 rounded-xl p-4 text-center hover:border-purple-500 cursor-pointer transition ${
                pkg.is_promotional
                  ? "border-yellow-400 bg-yellow-50"
                  : "border-gray-200"
              }`}
            >
              {pkg.is_promotional && (
                <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block">
                  عرض خاص ✨
                </div>
              )}
              <div className="text-2xl font-bold text-purple-700 mb-1">
                {pkg.malcoin_amount.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mb-1">MALCOIN</div>
              {pkg.bonus_malcoin > 0 && (
                <div className="text-green-600 text-xs font-semibold mb-2">
                  + {pkg.bonus_malcoin} بونص ({pkg.bonus_percentage}%)
                </div>
              )}
              <div className="text-lg font-bold text-gray-800">${pkg.price_usd}</div>
              <div className="text-xs text-gray-400 mb-3">{pkg.name_ar}</div>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 rounded-lg transition">
                شحن الآن
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">سجل المعاملات</h2>
          <Link href="/wallet/transactions" className="text-purple-600 text-sm hover:underline">
            عرض الكل
          </Link>
        </div>

        {(!transactions || transactions.length === 0) ? (
          <p className="text-center text-gray-400 py-8">لا توجد معاملات بعد</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {transactionTypeLabels[tx.type] || tx.type}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.created_at).toLocaleDateString("ar-SA")}
                  </p>
                  {tx.description && (
                    <p className="text-xs text-gray-500">{tx.description}</p>
                  )}
                </div>
                <div className="text-left">
                  {tx.malcoin_amount > 0 && (
                    <p
                      className={`font-semibold ${
                        tx.type === "GIFT_SENT" ? "text-red-600" : "text-yellow-600"
                      }`}
                    >
                      {tx.type === "GIFT_SENT" ? "-" : "+"}{tx.malcoin_amount.toLocaleString()} 🪙
                    </p>
                  )}
                  {tx.quscoin_amount > 0 && (
                    <p className="font-semibold text-green-600">
                      +{tx.quscoin_amount.toLocaleString()} 💎
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
