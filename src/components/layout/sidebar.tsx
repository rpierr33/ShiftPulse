"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Clock,
  Calendar,
  History,
  User,
  Users,
  Building2,
  FileText,
  BarChart3,
  Settings,
  Shield,

  LogOut,
  Menu,
  X,
  Briefcase,
  CalendarDays,
} from "lucide-react";
import { useState } from "react";
import { signOutAction } from "@/actions/auth";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const workerNav: NavItem[] = [
  { label: "Dashboard", href: "/worker/dashboard", icon: <LayoutDashboard size={20} /> },
  { label: "My Shifts", href: "/worker/shifts", icon: <Calendar size={20} /> },
  { label: "Clock In/Out", href: "/worker/clock", icon: <Clock size={20} /> },
  { label: "Time History", href: "/worker/history", icon: <History size={20} /> },
  { label: "Profile", href: "/worker/profile", icon: <User size={20} /> },
];

const companyNav: NavItem[] = [
  { label: "Dashboard", href: "/company/dashboard", icon: <LayoutDashboard size={20} /> },
  { label: "Workers", href: "/company/workers", icon: <Users size={20} /> },
  { label: "Schedules", href: "/company/schedules", icon: <CalendarDays size={20} /> },
  { label: "Shifts", href: "/company/shifts", icon: <Calendar size={20} /> },
  { label: "Assignments", href: "/company/assignments", icon: <Briefcase size={20} /> },
  { label: "Time Entries", href: "/company/time-entries", icon: <Clock size={20} /> },
  { label: "Reports", href: "/company/reports", icon: <BarChart3 size={20} /> },
  { label: "Settings", href: "/company/settings", icon: <Settings size={20} /> },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
  { label: "Companies", href: "/admin/companies", icon: <Building2 size={20} /> },
  { label: "Users", href: "/admin/users", icon: <Users size={20} /> },
  { label: "Time Entries", href: "/admin/time-entries", icon: <Clock size={20} /> },
  { label: "Audit Log", href: "/admin/audit-log", icon: <FileText size={20} /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings size={20} /> },
];

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case "WORKER":
      return workerNav;
    case "COMPANY":
      return companyNav;
    case "ADMIN":
      return adminNav;
    default:
      return [];
  }
}

interface SidebarProps {
  role: string;
  userName: string;
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(role);
  const [mobileOpen, setMobileOpen] = useState(false);

  const roleLabel = role === "COMPANY" ? "Company" : role === "ADMIN" ? "Admin" : "Worker";

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col z-50 transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield size={16} />
            </div>
            <div>
              <h1 className="font-bold text-sm">ShiftPulse</h1>
              <span className="text-xs text-slate-400">{roleLabel} Portal</span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-blue-600 text-white font-medium"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-700 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-medium">
              {userName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-slate-400">{roleLabel}</p>
            </div>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-full"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
