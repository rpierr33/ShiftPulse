"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/actions/auth";
import { Shield, ArrowRight, ArrowLeft, Lock } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    formData.append("token", token ?? "");

    const result = await resetPassword(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  const isInvalidToken = !token;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/40 to-slate-950" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/6 rounded-full blur-3xl animate-float-slow" />

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
            <span className="text-2xl font-bold text-white tracking-tight">CareCircle</span>
          </Link>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/20">
          {isInvalidToken ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="text-red-400" size={28} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Invalid reset link</h1>
              <p className="text-sm text-slate-400 mb-8">
                This password reset link is invalid or missing. Please request a new one.
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/forgot-password">
                  <Button className="w-full bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all hover:shadow-blue-500/40">
                    Request new reset link
                    <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="w-full border-white/10 text-slate-300 hover:bg-white/5 hover:text-white">
                    <ArrowLeft size={16} />
                    Back to login
                  </Button>
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="text-green-400" size={28} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Password reset successful</h1>
              <p className="text-sm text-slate-400 mb-8">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all hover:shadow-blue-500/40">
                  Sign in
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Set new password</h1>
                <p className="text-sm text-slate-400">
                  Enter your new password below. It must be at least 8 characters.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-scale-in">
                    {error}
                    {(error.includes("expired") || error.includes("Invalid")) && (
                      <Link href="/forgot-password" className="block mt-2 text-blue-400 hover:text-blue-300 underline">
                        Request a new reset link
                      </Link>
                    )}
                  </div>
                )}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">New password</label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter new password"
                    required
                    minLength={8}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">Confirm password</label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all hover:shadow-blue-500/40" loading={loading}>
                  Reset password
                  <ArrowRight size={16} />
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/5 text-center">
                <Link href="/login" className="text-sm text-slate-400 hover:text-blue-400 transition-colors inline-flex items-center gap-2">
                  <ArrowLeft size={14} />
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
