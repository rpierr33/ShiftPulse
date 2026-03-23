import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight } from "lucide-react";
import { auth } from "@/auth";

export default async function PricingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as Record<string, any> | undefined;
  const isLoggedIn = !!user;
  const dashboardUrl = user?.role === "WORKER" ? "/worker/dashboard" : user?.role === "COMPANY" ? "/company/dashboard" : "/admin/dashboard";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Shield size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">CareCircle</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/marketplace">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">
              Marketplace
            </Button>
          </Link>
          {isLoggedIn ? (
            <Link href={dashboardUrl}>
              <Button className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-white/10">
                Dashboard
                <ArrowRight size={16} />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-white/10">
                  Get Started
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>
      {children}
    </div>
  );
}
