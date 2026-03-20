"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck } from "lucide-react";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/actions/notifications";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const refreshUnreadCount = useCallback(() => {
    getUnreadCount().then(setUnreadCount).catch(() => {});
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (open) {
      getNotifications()
        .then(setNotifications)
        .catch(() => setNotifications([]));
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleNotificationClick(n: Notification) {
    startTransition(async () => {
      if (!n.isRead) {
        await markNotificationRead(n.id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
        );
      }
      if (n.link) {
        router.push(n.link);
        setOpen(false);
      }
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 relative transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg shadow-red-500/30">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 z-50 overflow-hidden animate-scale-in">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50">
            <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium transition-colors"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-10">
                <Bell size={24} className="mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 border-b border-gray-50 transition-colors ${
                    !n.isRead ? "bg-blue-50/40" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!n.isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0 shadow-sm shadow-blue-500/50" />
                    )}
                    {n.isRead && (
                      <Check size={12} className="text-gray-300 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.message}</p>
                      <p className="text-[11px] text-gray-400 mt-1.5">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
