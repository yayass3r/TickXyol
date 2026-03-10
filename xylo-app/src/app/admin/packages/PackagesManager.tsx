"use client";

import { useState } from "react";
import type { RechargePackage } from "@/types";

interface PackagesManagerProps {
  initialPackages: RechargePackage[];
}

const emptyPackage = {
  name: "",
  name_ar: "",
  price_usd: 0,
  malcoin_amount: 0,
  bonus_percentage: 0,
  bonus_malcoin: 0,
  is_active: true,
  is_promotional: false,
  first_purchase_only: false,
  display_order: 0,
};

export default function PackagesManager({ initialPackages }: PackagesManagerProps) {
  const [packages, setPackages] = useState<RechargePackage[]>(initialPackages);
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<RechargePackage | null>(null);
  const [formData, setFormData] = useState(emptyPackage);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function openCreateForm() {
    setEditingPackage(null);
    setFormData(emptyPackage);
    setShowForm(true);
  }

  function openEditForm(pkg: RechargePackage) {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      name_ar: pkg.name_ar,
      price_usd: pkg.price_usd,
      malcoin_amount: pkg.malcoin_amount,
      bonus_percentage: pkg.bonus_percentage,
      bonus_malcoin: pkg.bonus_malcoin,
      is_active: pkg.is_active,
      is_promotional: pkg.is_promotional,
      first_purchase_only: pkg.first_purchase_only,
      display_order: pkg.display_order,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const url = editingPackage
        ? `/api/admin/packages/${editingPackage.id}`
        : "/api/admin/packages";
      const method = editingPackage ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        setMessage(`خطأ: ${data.error}`);
        return;
      }

      if (editingPackage) {
        setPackages(packages.map((p) => (p.id === editingPackage.id ? data.data.package : p)));
        setMessage("تم تحديث الباقة بنجاح ✅");
      } else {
        setPackages([...packages, data.data.package]);
        setMessage("تم إنشاء الباقة بنجاح ✅");
      }

      setShowForm(false);
    } catch {
      setMessage("حدث خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(pkg: RechargePackage) {
    const res = await fetch(`/api/admin/packages/${pkg.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !pkg.is_active }),
    });
    const data = await res.json();
    if (data.success) {
      setPackages(packages.map((p) => (p.id === pkg.id ? data.data.package : p)));
    }
  }

  return (
    <div>
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes("خطأ") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </div>
      )}

      <button
        onClick={openCreateForm}
        className="mb-6 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
      >
        + إضافة باقة جديدة
      </button>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingPackage ? "تعديل الباقة" : "إضافة باقة جديدة"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم (English)</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم بالعربي</label>
                  <input
                    type="text"
                    required
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">السعر (USD)</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={formData.price_usd}
                    onChange={(e) => setFormData({ ...formData, price_usd: parseFloat(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">كمية MALCOIN</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.malcoin_amount}
                    onChange={(e) => setFormData({ ...formData, malcoin_amount: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نسبة البونص (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.bonus_percentage}
                    onChange={(e) => setFormData({ ...formData, bonus_percentage: parseFloat(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">بونص إضافي (MALCOIN)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bonus_malcoin}
                    onChange={(e) => setFormData({ ...formData, bonus_malcoin: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ترتيب العرض</label>
                <input
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  dir="ltr"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm font-medium text-gray-700">الباقة مفعّلة</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_promotional}
                    onChange={(e) => setFormData({ ...formData, is_promotional: e.target.checked })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm font-medium text-gray-700">باقة ترويجية</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.first_purchase_only}
                    onChange={(e) => setFormData({ ...formData, first_purchase_only: e.target.checked })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm font-medium text-gray-700">للشراء الأول فقط</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  {loading ? "جارٍ الحفظ..." : editingPackage ? "تحديث الباقة" : "إنشاء الباقة"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Packages Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">الباقة</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">السعر</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">MALCOIN</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">البونص</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">الحالة</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {packages.map((pkg) => (
              <tr key={pkg.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-gray-800">{pkg.name_ar}</p>
                    <p className="text-xs text-gray-400">{pkg.name}</p>
                    {pkg.is_promotional && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                        ترويجية
                      </span>
                    )}
                    {pkg.first_purchase_only && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full mr-1">
                        أول شراء
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-gray-800">${pkg.price_usd}</td>
                <td className="px-6 py-4 font-semibold text-yellow-600">
                  {pkg.malcoin_amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-green-600 text-sm">
                  {pkg.bonus_malcoin > 0 ? `+${pkg.bonus_malcoin} (${pkg.bonus_percentage}%)` : "-"}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleActive(pkg)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      pkg.is_active
                        ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                        : "bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700"
                    } transition`}
                  >
                    {pkg.is_active ? "مفعّلة" : "معطّلة"}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => openEditForm(pkg)}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    تعديل
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {packages.length === 0 && (
          <div className="text-center py-12 text-gray-400">لا توجد باقات</div>
        )}
      </div>
    </div>
  );
}
