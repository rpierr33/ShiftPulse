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
  ChevronRight,
  MessageSquare,
  Search,
  BadgeCheck,
  CreditCard,
  MapPin,
  ClipboardList,
  Scale,
  Sparkles,
  Star,
} from "lucide-react";
import { useState } from "react";
import { signOutAction } from "@/actions/auth";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

const workerSections: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/worker/dashboard", icon: <LayoutDashboard size={18} /> },
      { label: "Find Providers", href: "/marketplace/providers", icon: <Search size={18} /> },
    ],
  },
  {
    title: "Work",
    items: [
      { label: "My Shifts", href: "/worker/shifts", icon: <Calendar size={18} /> },
      { label: "Clock In/Out", href: "/worker/clock", icon: <Clock size={18} /> },
      { label: "Time History", href: "/worker/history", icon: <History size={18} /> },
    ],
  },
  {
    title: "Profile",
    items: [
      { label: "My Credentials", href: "/worker/credentials", icon: <BadgeCheck size={18} /> },
      { label: "My Score", href: "/worker/score", icon: <Star size={18} /> },
      { label: "Profile", href: "/worker/profile", icon: <User size={18} /> },
    ],
  },
  {
    title: "Connect",
    items: [
      { label: "Messages", href: "/messages", icon: <MessageSquare size={18} /> },
    ],
  },
];

const companySections: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/company/dashboard", icon: <LayoutDashboard size={18} /> },
      { label: "Find Workers", href: "/marketplace/workers", icon: <Search size={18} /> },
    ],
  },
  {
    title: "Workforce",
    items: [
      { label: "Workers", href: "/company/workers", icon: <Users size={18} /> },
      { label: "Credentials", href: "/company/credentials", icon: <BadgeCheck size={18} /> },
      { label: "Schedules", href: "/company/schedules", icon: <CalendarDays size={18} /> },
      { label: "Shifts", href: "/company/shifts", icon: <Calendar size={18} /> },
      { label: "Assignments", href: "/company/assignments", icon: <Briefcase size={18} /> },
    ],
  },
  {
    title: "Time & Pay",
    items: [
      { label: "Time Entries", href: "/company/time-entries", icon: <Clock size={18} /> },
      { label: "Claims", href: "/company/claims", icon: <ClipboardList size={18} /> },
      { label: "Reports", href: "/company/reports", icon: <BarChart3 size={18} /> },
    ],
  },
  {
    title: "Connect",
    items: [
      { label: "Messages", href: "/messages", icon: <MessageSquare size={18} /> },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Compliance", href: "/company/compliance", icon: <Scale size={18} /> },
      { label: "Locations", href: "/company/locations", icon: <MapPin size={18} /> },
      { label: "Billing", href: "/company/billing", icon: <CreditCard size={18} /> },
      { label: "Settings", href: "/company/settings", icon: <Settings size={18} /> },
    ],
  },
];

const clientSections: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/client/dashboard", icon: <LayoutDashboard size={18} /> },
      { label: "Find Workers", href: "/marketplace/workers", icon: <Search size={18} /> },
    ],
  },
  {
    title: "Care",
    items: [
      { label: "My Bookings", href: "/client/bookings", icon: <CalendarDays size={18} /> },
    ],
  },
  {
    title: "Connect",
    items: [
      { label: "Messages", href: "/messages", icon: <MessageSquare size={18} /> },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", href: "/client/profile", icon: <User size={18} /> },
    ],
  },
];

const adminSections: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard size={18} /> },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Companies", href: "/admin/companies", icon: <Building2 size={18} /> },
      { label: "Users", href: "/admin/users", icon: <Users size={18} /> },
      { label: "Subscriptions", href: "/admin/subscriptions", icon: <CreditCard size={18} /> },
      { label: "Marketplace", href: "/admin/marketplace", icon: <Sparkles size={18} /> },
    ],
  },
  {
    title: "Monitoring",
    items: [
      { label: "Time Entries", href: "/admin/time-entries", icon: <Clock size={18} /> },
      { label: "Audit Log", href: "/admin/audit-log", icon: <FileText size={18} /> },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Settings", href: "/admin/settings", icon: <Settings size={18} /> },
    ],
  },
];

function getNavSections(role: string): NavSection[] {
  switch (role) {
    case "WORKER":
      return workerSections;
    case "COMPANY":
      return companySections;
    case "CLIENT":
      return clientSections;
    case "ADMIN":
      return adminSections;
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
  const navSections = getNavSections(role);
  const [mobileOpen, setMobileOpen] = useState(false);

  const roleLabel = role === "COMPANY" ? "Provider" : role === "ADMIN" ? "Admin" : role === "CLIENT" ? "Client" : "Worker";
  const roleColor = role === "COMPANY" ? "from-purple-500 to-purple-700" : role === "ADMIN" ? "from-amber-500 to-orange-600" : role === "CLIENT" ? "from-orange-500 to-amber-500" : "from-blue-500 to-blue-700";

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors"
      >
        <Menu size={20} className="text-gray-700" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-[270px] bg-slate-950 text-white flex flex-col z-50 transition-transform duration-300 ease-out lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 bg-gradient-to-br ${roleColor} rounded-xl flex items-center justify-center shadow-lg`}>
              <Shield size={16} />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight">CareCircle</h1>
              <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{roleLabel}</span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 overflow-y-auto py-3 px-3">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className={cn(sIdx > 0 && "mt-4")}>
              {section.title && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 group",
                        isActive
                          ? "bg-blue-600/15 text-blue-400 font-medium"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-500 rounded-r-full" />
                      )}
                      <span className={cn(
                        "transition-colors",
                        isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                      )}>
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-md">
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight size={14} className="text-blue-400/50" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="relative border-t border-white/5 p-4">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-default">
            <div className={`w-9 h-9 bg-gradient-to-br ${roleColor} rounded-xl flex items-center justify-center text-xs font-bold shadow-md`}>
              {userName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-[11px] text-slate-500">{roleLabel} Account</p>
            </div>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-2.5 text-sm text-slate-500 hover:text-red-400 transition-colors w-full px-2 py-2 rounded-lg hover:bg-red-500/5"
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
