import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    redirect("/");
  }

  const navItems = [
    { href: "/admin", label: "الإحصائيات", icon: "📊" },
    { href: "/admin/users", label: "المستخدمون", icon: "👥" },
    { href: "/admin/packages", label: "الباقات", icon: "📦" },
    { href: "/admin/withdrawals", label: "طلبات السحب", icon: "💸" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm flex-shrink-0">
        <div className="p-6 border-b">
          <Link href="/" className="text-2xl font-bold text-purple-700">زايلو</Link>
          <p className="text-xs text-gray-400 mt-1">لوحة التحكم</p>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition"
            >
              <span>{item.icon}</span>
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t mt-auto">
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 text-sm font-bold">
              {user.display_name?.[0] || user.username?.[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{user.display_name || user.username}</p>
              <p className="text-xs text-gray-400">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
