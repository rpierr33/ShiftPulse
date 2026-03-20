"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUpAction } from "@/actions/auth";
import { Shield, User, Building2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"WORKER" | "COMPANY">("WORKER");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.set("role", role);

    const result = await signUpAction(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (role === "WORKER") router.push("/worker/dashboard");
    else router.push("/company/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/40 to-slate-950" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-500/6 rounded-full blur-3xl animate-float-slow" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
              <Shield className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">ShiftPulse</span>
          </Link>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/20">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Create an account</h1>
            <p className="text-sm text-slate-400">Join ShiftPulse and get started</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button
              type="button"
              onClick={() => setRole("WORKER")}
              className={cn(
                "flex flex-col items-center gap-3 p-5 rounded-xl border transition-all duration-300",
                role === "WORKER"
                  ? "border-blue-500/50 bg-blue-500/10 text-blue-400 shadow-lg shadow-blue-500/10"
                  : "border-white/10 text-slate-400 hover:border-white/20 hover:bg-white/5"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                role === "WORKER" ? "bg-blue-500/20" : "bg-white/5"
              )}>
                <User size={20} />
              </div>
              <span className="text-sm font-medium">Worker</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("COMPANY")}
              className={cn(
                "flex flex-col items-center gap-3 p-5 rounded-xl border transition-all duration-300",
                role === "COMPANY"
                  ? "border-blue-500/50 bg-blue-500/10 text-blue-400 shadow-lg shadow-blue-500/10"
                  : "border-white/10 text-slate-400 hover:border-white/20 hover:bg-white/5"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                role === "COMPANY" ? "bg-blue-500/20" : "bg-white/5"
              )}>
                <Building2 size={20} />
              </div>
              <span className="text-sm font-medium">Company</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-scale-in">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </div>
            {role === "COMPANY" && (
              <div className="animate-scale-in">
                <label htmlFor="companyName" className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder="Your organization name"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                />
              </div>
            )}
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all hover:shadow-blue-500/40" loading={loading}>
              Create Account
              <ArrowRight size={16} />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
