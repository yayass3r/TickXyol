import { getCurrentUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const transactionTypeLabels: Record<string, string> = {
  RECHARGE: "شحن رصيد",
  GIFT_SENT: "هدية مُرسلة",
  GIFT_RECEIVED: "هدية مُستلمة",
  WITHDRAWAL: "سحب رصيد",
  REFERRAL_BONUS: "مكافأة إحالة",
  REFERRAL_COMMISSION: "عمولة إحالة",
  PLATFORM_FEE: "رسوم المنصة",
};

const transactionTypeIcons: Record<string, string> = {
  RECHARGE: "💳",
  GIFT_SENT: "🎁",
  GIFT_RECEIVED: "🎉",
  WITHDRAWAL: "💸",
  REFERRAL_BONUS: "🎯",
  REFERRAL_COMMISSION: "💰",
  PLATFORM_FEE: "🏦",
};

const statusLabels: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: "مكتملة", color: "bg-green-100 text-green-700" },
  PENDING: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-700" },
  FAILED: { label: "فشلت", color: "bg-red-100 text-red-700" },
  REVERSED: { label: "مُعكوسة", color: "bg-gray-100 text-gray-600" },
};

interface TransactionsPageProps {
  searchParams: Promise<{ page?: string; type?: string }>;
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/wallet/transactions");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const typeFilter = params.type || "";
  const limit = 20;
  const offset = (page - 1) * limit;

  const supabase = createServerClient();

  let query = supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (typeFilter) {
    query = query.eq("type", typeFilter);
  }

  const { data: transactions, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / limit);

  const transactionTypes = [
    { value: "", label: "الكل" },
    { value: "RECHARGE", label: "شحن" },
    { value: "GIFT_SENT", label: "هدايا مُرسلة" },
    { value: "GIFT_RECEIVED", label: "هدايا مُستلمة" },
    { value: "WITHDRAWAL", label: "سحب" },
    { value: "REFERRAL_BONUS", label: "مكافآت إحالة" },
    { value: "REFERRAL_COMMISSION", label: "عمولات" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">سجل المعاملات</h1>
          <p className="text-gray-500 text-sm mt-1">
            إجمالي {(count ?? 0).toLocaleString()} معاملة
          </p>
        </div>
        <Link
          href="/wallet"
          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
        >
          → العودة للمحفظة
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-2">
          {transactionTypes.map((t) => (
            <Link
              key={t.value}
              href={`/wallet/transactions${t.value ? `?type=${t.value}` : ""}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                typeFilter === t.value
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {(!transactions || transactions.length === 0) ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-500">لا توجد معاملات{typeFilter ? " من هذا النوع" : ""}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map((tx) => {
              const status = statusLabels[tx.status] || statusLabels.PENDING;
              return (
                <div key={tx.id} className="flex items-center justify-between p-5 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl">
                      {transactionTypeIcons[tx.type] || "📄"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {transactionTypeLabels[tx.type] || tx.type}
                      </p>
                      {tx.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{tx.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(tx.created_at).toLocaleDateString("ar-SA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-left flex flex-col items-end gap-1">
                    {tx.malcoin_amount > 0 && (
                      <p
                        className={`font-semibold text-sm ${
                          tx.type === "GIFT_SENT" ? "text-red-600" : "text-yellow-600"
                        }`}
                      >
                        {tx.type === "GIFT_SENT" ? "-" : "+"}
                        {tx.malcoin_amount.toLocaleString()} 🪙
                      </p>
                    )}
                    {tx.quscoin_amount > 0 && (
                      <p className="font-semibold text-sm text-green-600">
                        +{tx.quscoin_amount.toLocaleString()} 💎
                      </p>
                    )}
                    {tx.usd_amount > 0 && (
                      <p className="text-xs text-gray-400">${tx.usd_amount.toFixed(2)}</p>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
            {page > 1 && (
              <Link
                href={`/wallet/transactions?page=${page - 1}${typeFilter ? `&type=${typeFilter}` : ""}`}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
              >
                السابق
              </Link>
            )}
            <span className="text-sm text-gray-500 px-3">
              صفحة {page} من {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/wallet/transactions?page=${page + 1}${typeFilter ? `&type=${typeFilter}` : ""}`}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
              >
                التالي
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
