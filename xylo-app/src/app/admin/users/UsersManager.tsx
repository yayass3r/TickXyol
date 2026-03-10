"use client";

import { useState } from "react";
import type { User } from "@/types";

interface UsersManagerProps {
  initialUsers: Partial<User>[];
  isAdmin: boolean;
}

const roleColors: Record<string, string> = {
  USER: "bg-blue-100 text-blue-700",
  CREATOR: "bg-purple-100 text-purple-700",
  MODERATOR: "bg-orange-100 text-orange-700",
  ADMIN: "bg-red-100 text-red-700",
};

const roleLabels: Record<string, string> = {
  USER: "قارئ",
  CREATOR: "كاتب",
  MODERATOR: "مشرف",
  ADMIN: "مدير",
};

export default function UsersManager({ initialUsers, isAdmin }: UsersManagerProps) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function updateUser(id: string, updates: Record<string, unknown>) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map((u) => (u.id === id ? { ...u, ...data.data.user } : u)));
      }
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = users.filter(
    (u) =>
      !search ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="بحث بالاسم أو البريد..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">المستخدم</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">الدور</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">KYC</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">الحالة</th>
              {isAdmin && <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">إجراءات</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-gray-800">{u.display_name || u.username}</p>
                    <p className="text-xs text-gray-400">@{u.username}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {isAdmin ? (
                    <select
                      value={u.role || "USER"}
                      disabled={updatingId === u.id}
                      onChange={(e) => updateUser(u.id!, { role: e.target.value })}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs"
                    >
                      {Object.entries(roleLabels).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColors[u.role || "USER"]}`}>
                      {roleLabels[u.role || "USER"]}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {isAdmin ? (
                    <select
                      value={u.kyc_status || "NOT_SUBMITTED"}
                      disabled={updatingId === u.id}
                      onChange={(e) => updateUser(u.id!, { kyc_status: e.target.value })}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs"
                    >
                      <option value="NOT_SUBMITTED">لم يُقدَّم</option>
                      <option value="PENDING">قيد المراجعة</option>
                      <option value="APPROVED">موافق</option>
                      <option value="REJECTED">مرفوض</option>
                    </select>
                  ) : (
                    <span className="text-xs text-gray-500">{u.kyc_status}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {isAdmin ? (
                    <button
                      onClick={() => updateUser(u.id!, { is_active: !u.is_active })}
                      disabled={updatingId === u.id}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                        u.is_active
                          ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                          : "bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700"
                      }`}
                    >
                      {updatingId === u.id ? "..." : u.is_active ? "نشط" : "معطّل"}
                    </button>
                  ) : (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {u.is_active ? "نشط" : "معطّل"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">لا توجد نتائج</div>
        )}
      </div>
    </div>
  );
}
