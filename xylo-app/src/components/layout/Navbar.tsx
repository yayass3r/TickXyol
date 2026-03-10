"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AuthUser } from "@/types";

interface NavbarProps {
  user: AuthUser | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

          {/* Desktop Nav Links */}
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

          {/* Auth buttons + Mobile toggle */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 bg-purple-50 rounded-full px-3 py-1.5">
                  <span className="text-yellow-600 text-sm font-semibold">🪙</span>
                  <span className="text-xs text-gray-600">MALCOIN</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden md:block text-gray-500 hover:text-red-600 text-sm transition"
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
              <div className="hidden md:flex items-center gap-3">
                <Link href="/login" className="text-gray-600 hover:text-purple-700 transition text-sm">
                  دخول
                </Link>
                <Link
                  href="/register"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition"
                >
                  انضم الآن
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4">
          <div className="space-y-1 py-3">
            <Link
              href="/articles"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-700 font-medium transition"
            >
              📰 المقالات
            </Link>
            {user ? (
              <>
                <Link
                  href="/wallet"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-700 font-medium transition"
                >
                  💰 المحفظة
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-700 font-medium transition"
                >
                  👤 الملف الشخصي
                </Link>
                {(user.role === "ADMIN" || user.role === "MODERATOR") && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-700 font-medium transition"
                  >
                    ⚙️ لوحة التحكم
                  </Link>
                )}
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-right px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 font-medium transition"
                  >
                    🚪 تسجيل الخروج
                  </button>
                </div>
              </>
            ) : (
              <div className="border-t border-gray-100 mt-2 pt-3 flex gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center border border-purple-600 text-purple-600 px-4 py-2 rounded-full text-sm font-semibold transition hover:bg-purple-50"
                >
                  دخول
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition"
                >
                  انضم الآن
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
