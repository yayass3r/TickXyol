"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import type { AuthUser } from "@/types";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

async function loadNotifications(): Promise<{ notifications: NotificationItem[]; unread_count: number }> {
  const res = await fetch("/api/notifications?limit=10");
  const data = await res.json();
  if (data.success) {
    return {
      notifications: data.data.notifications || [],
      unread_count: data.data.unread_count || 0,
    };
  }
  return { notifications: [], unread_count: 0 };
}

export default function NotificationBell({ user }: { user: AuthUser | null }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    function doFetch() {
      loadNotifications().then((result) => {
        if (!cancelled) {
          setNotifications(result.notifications);
          setUnreadCount(result.unread_count);
        }
      });
    }

    doFetch();
    const interval = setInterval(doFetch, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all_read: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // Silently fail
    }
  }

  if (!user) return null;

  const iconForType = (type: string) => {
    switch (type) {
      case "gift": return "🎁";
      case "comment": return "💬";
      case "referral": return "👥";
      default: return "🔔";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition"
        aria-label="الإشعارات"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute left-0 mt-2 w-80 rounded-xl shadow-lg border z-50 ${
          theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}>
          <div className={`flex items-center justify-between p-3 border-b ${
            theme === "dark" ? "border-gray-700" : "border-gray-100"
          }`}>
            <h3 className={`font-bold text-sm ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>
              الإشعارات
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
              >
                تعيين الكل كمقروء
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className={`text-center py-8 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                لا توجد إشعارات
              </p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 border-b last:border-0 transition ${
                    !notif.is_read
                      ? theme === "dark" ? "bg-purple-900/20" : "bg-purple-50"
                      : ""
                  } ${theme === "dark" ? "border-gray-700 hover:bg-gray-700" : "border-gray-50 hover:bg-gray-50"}`}
                >
                  <div className="flex gap-3">
                    <span className="text-lg">{iconForType(notif.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>
                        {notif.title}
                      </p>
                      <p className={`text-xs mt-0.5 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        {notif.message}
                      </p>
                      <p className={`text-xs mt-1 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                        {new Date(notif.created_at).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
