"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@/types";

interface NavbarProps {
  user: AuthUser | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-purple-700">زايلو</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/articles" className="text-gray-600 hover:text-purple-700 transition font-medium">
              المقالات
            </Link>
            {user && (
              <>
                <Link href="/wallet" className="text-gray-600 hover:text-purple-700 transition font-medium">
                  المحفظة
                </Link>
                <Link href="/profile" className="text-gray-600 hover:text-purple-700 transition font-medium">
                  الملف الشخصي
                </Link>
                {(user.role === "ADMIN" || user.role === "MODERATOR") && (
                  <Link href="/admin" className="text-gray-600 hover:text-purple-700 transition font-medium">
                    لوحة التحكم
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-purple-50 rounded-full px-3 py-1.5">
                  <span className="text-yellow-600 text-sm font-semibold">🪙</span>
                  <span className="text-xs text-gray-600">MALCOIN</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600 text-sm transition"
                >
                  خروج
                </button>
                <Link
                  href="/profile"
                  className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold"
                >
                  {(user.display_name || user.username)?.[0]?.toUpperCase()}
                </Link>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-purple-700 transition text-sm">
                  دخول
                </Link>
                <Link
                  href="/register"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition"
                >
                  انضم الآن
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
