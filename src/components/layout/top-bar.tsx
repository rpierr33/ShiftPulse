"use client";

import { NotificationDropdown } from "./notification-dropdown";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <header className="h-16 border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 -mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <NotificationDropdown />
      </div>
    </header>
  );
}
