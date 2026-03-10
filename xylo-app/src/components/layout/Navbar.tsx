"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import NotificationBell from "@/components/ui/NotificationBell";
import type { AuthUser } from "@/types";

interface NavbarProps {
  user: AuthUser | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-purple-700 dark:text-purple-400">زايلو</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/articles" className="text-gray-600 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-400 transition font-medium">
              المقالات
            </Link>
            {user && (
              <>
                <Link href="/wallet" className="text-gray-600 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-400 transition font-medium">
                  المحفظة
                </Link>
                {(user.role === "CREATOR" || user.role === "ADMIN") && (
                  <Link href="/analytics" className="text-gray-600 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-400 transition font-medium">
                    إحصائياتي
                  </Link>
                )}
                <Link href="/profile" className="text-gray-600 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-400 transition font-medium">
                  الملف الشخصي
                </Link>
                {(user.role === "ADMIN" || user.role === "MODERATOR") && (
                  <Link href="/admin" className="text-gray-600 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-400 transition font-medium">
                    لوحة التحكم
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Auth buttons + Theme toggle + Notifications + Mobile toggle */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="تبديل المظهر"
            >
              {theme === "dark" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Notification Bell */}
            <NotificationBell user={user} />

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 rounded-full px-3 py-1.5">
                  <span className="text-yellow-600 text-sm font-semibold">🪙</span>
                  <span className="text-xs text-gray-600 dark:text-gray-300">MALCOIN</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden md:block text-gray-500 dark:text-gray-400 hover:text-red-600 text-sm transition"
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
                <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-purple-700 transition text-sm">
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
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
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
        <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-4 pb-4">
          <div className="space-y-1 py-3">
            <Link
              href="/articles"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-400 font-medium transition"
            >
              📰 المقالات
            </Link>
            {user ? (
              <>
                <Link
                  href="/wallet"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-400 font-medium transition"
                >
                  💰 المحفظة
                </Link>
                {(user.role === "CREATOR" || user.role === "ADMIN") && (
                  <Link
                    href="/analytics"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-400 font-medium transition"
                  >
                    📊 إحصائياتي
                  </Link>
                )}
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-400 font-medium transition"
                >
                  👤 الملف الشخصي
                </Link>
                {(user.role === "ADMIN" || user.role === "MODERATOR") && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-400 font-medium transition"
                  >
                    ⚙️ لوحة التحكم
                  </Link>
                )}
                <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-right px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition"
                  >
                    🚪 تسجيل الخروج
                  </button>
                </div>
              </>
            ) : (
              <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-3 flex gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center border border-purple-600 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-full text-sm font-semibold transition hover:bg-purple-50 dark:hover:bg-purple-900/20"
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
