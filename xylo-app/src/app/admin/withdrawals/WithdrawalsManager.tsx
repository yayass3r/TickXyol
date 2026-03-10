"use client";

import { useState } from "react";
import type { WithdrawalRequest } from "@/types";

interface WithdrawalsManagerProps {
  initialWithdrawals: (WithdrawalRequest & { user?: { username: string; display_name: string | null; email: string } })[];
}

const statusLabels: Record<string, string> = {
  PENDING: "معلّق",
  APPROVED: "موافق",
  REJECTED: "مرفوض",
  PROCESSING: "قيد المعالجة",
  COMPLETED: "مكتمل",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  PROCESSING: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
};

const gatewayLabels: Record<string, string> = {
  STRIPE: "Stripe",
  PAYPAL: "PayPal",
  MOYASAR: "Moyasar",
  STC_PAY: "STC Pay",
  PAYONEER: "Payoneer",
  SKRILL: "Skrill",
};

export default function WithdrawalsManager({ initialWithdrawals }: WithdrawalsManagerProps) {
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("PENDING");

  async function updateStatus(id: string, status: string, admin_notes?: string) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin_notes }),
      });
      const data = await res.json();
      if (data.success) {
        setWithdrawals(
          withdrawals.map((w) => (w.id === id ? { ...w, ...data.data.withdrawal } : w))
        );
      }
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = filter === "ALL"
    ? withdrawals
    : withdrawals.filter((w) => w.status === filter);

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["ALL", "PENDING", "APPROVED", "PROCESSING", "COMPLETED", "REJECTED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === s
                ? "bg-purple-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-purple-400"
            }`}
          >
            {s === "ALL" ? "الكل" : statusLabels[s]}
            {s !== "ALL" && (
              <span className="mr-1.5 text-xs opacity-70">
                ({withdrawals.filter((w) => w.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">المستخدم</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">المبلغ</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">بوابة الدفع</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">الحالة</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">التاريخ</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((w) => (
              <tr key={w.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-800">
                    {w.user?.display_name || w.user?.username}
                  </p>
                  <p className="text-xs text-gray-400">{w.user?.email}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-green-600">
                    {w.quscoin_amount.toLocaleString()} 💎
                  </p>
                  <p className="text-xs text-gray-400">
                    ≈ ${Number(w.usd_equivalent).toFixed(2)} USD
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{gatewayLabels[w.payment_gateway] || w.payment_gateway}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[w.status] || "bg-gray-100 text-gray-600"}`}>
                    {statusLabels[w.status] || w.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-400">
                  {new Date(w.created_at).toLocaleDateString("ar-SA")}
                </td>
                <td className="px-6 py-4">
                  {w.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(w.id, "APPROVED")}
                        disabled={updatingId === w.id}
                        className="bg-green-100 hover:bg-green-200 text-green-700 text-xs px-3 py-1.5 rounded-lg transition"
                      >
                        موافقة
                      </button>
                      <button
                        onClick={() => updateStatus(w.id, "REJECTED", "تم الرفض من قبل الإدارة")}
                        disabled={updatingId === w.id}
                        className="bg-red-100 hover:bg-red-200 text-red-700 text-xs px-3 py-1.5 rounded-lg transition"
                      >
                        رفض
                      </button>
                    </div>
                  )}
                  {w.status === "APPROVED" && (
                    <button
                      onClick={() => updateStatus(w.id, "COMPLETED")}
                      disabled={updatingId === w.id}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs px-3 py-1.5 rounded-lg transition"
                    >
                      تأكيد الإرسال
                    </button>
                  )}
                  {w.admin_notes && (
                    <p className="text-xs text-gray-400 mt-1">{w.admin_notes}</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">لا توجد طلبات</div>
        )}
      </div>
    </div>
  );
}
