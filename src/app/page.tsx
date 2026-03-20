import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Clock, Users, BarChart3, CheckCircle, ArrowRight, Sparkles, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/50 to-slate-950" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-cyan-500/8 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Shield size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">ShiftPulse</span>
          </div>
          <div className="flex items-center gap-3">
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
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 pt-24 pb-36 text-center">
          <div className="animate-fade-in-up opacity-0" style={{ animationDelay: "0.1s" }}>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 rounded-full px-5 py-2 text-sm text-blue-300 mb-10 glass">
              <Sparkles size={14} className="text-blue-400" />
              Workforce Timekeeping Made Simple
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-8 tracking-tight animate-fade-in-up opacity-0" style={{ animationDelay: "0.2s" }}>
            Track shifts.
            <br />
            <span className="gradient-text">Manage time.</span>
            <br />
            Stay compliant.
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up opacity-0" style={{ animationDelay: "0.35s" }}>
            The modern workforce management platform for nurse registries, home health agencies,
            and staffing organizations. Clock in, track hours, and manage your team — all in one place.
          </p>

          <div className="flex items-center justify-center gap-4 animate-fade-in-up opacity-0" style={{ animationDelay: "0.5s" }}>
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-lg px-8 shadow-xl shadow-blue-600/25 transition-all hover:shadow-blue-500/40 hover:-translate-y-0.5">
                <Zap size={18} />
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-white/5 hover:border-slate-500 text-lg px-8 transition-all hover:-translate-y-0.5">
                View Demo
              </Button>
            </Link>
          </div>

          {/* Social proof bar */}
          <div className="mt-16 flex items-center justify-center gap-6 text-sm text-slate-500 animate-fade-in-up opacity-0" style={{ animationDelay: "0.7s" }}>
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-slate-300">
                  {["JD", "MK", "AS", "LP"][i]}
                </div>
              ))}
            </div>
            <span>Trusted by <strong className="text-slate-300">500+</strong> healthcare organizations</span>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-6 pb-36">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up opacity-0" style={{ animationDelay: "0.1s" }}>
              Everything you need to manage your workforce
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto animate-fade-in-up opacity-0" style={{ animationDelay: "0.2s" }}>
              Built specifically for healthcare staffing with compliance and simplicity at its core.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Clock size={24} />,
                title: "One-Tap Clock In/Out",
                description:
                  "Workers clock in and out with a single tap. Mobile-first design with GPS verification and real-time tracking.",
                gradient: "from-blue-500/20 to-cyan-500/20",
                iconBg: "from-blue-500 to-cyan-500",
              },
              {
                icon: <Users size={24} />,
                title: "Shift Management",
                description:
                  "Create schedules, assign shifts, and track attendance. Real-time visibility into who's working where.",
                gradient: "from-purple-500/20 to-pink-500/20",
                iconBg: "from-purple-500 to-pink-500",
              },
              {
                icon: <BarChart3 size={24} />,
                title: "Reporting & Compliance",
                description:
                  "Automated timesheets, audit trails, and compliance-ready reports. Every action is tracked and verified.",
                gradient: "from-amber-500/20 to-orange-500/20",
                iconBg: "from-amber-500 to-orange-500",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative rounded-2xl p-8 glass card-hover animate-fade-in-up opacity-0"
                style={{ animationDelay: `${0.3 + i * 0.15}s` }}
              >
                {/* Hover gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10">
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.iconBg} rounded-xl flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats section */}
        <section className="border-y border-white/5 py-20 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "99.9%", label: "Uptime SLA" },
                { value: "500+", label: "Organizations" },
                { value: "50K+", label: "Shifts Tracked" },
                { value: "<1s", label: "Clock-in Time" },
              ].map((stat, i) => (
                <div key={i} className="text-center animate-fade-in-up opacity-0" style={{ animationDelay: `${0.1 + i * 0.1}s` }}>
                  <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm text-slate-500 mb-8 uppercase tracking-widest font-medium">Built for healthcare staffing</p>
            <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap">
              {["EVV Ready", "HIPAA Conscious", "Audit Trails", "Real-time Tracking", "Multi-company"].map(
                (item, i) => (
                  <div
                    key={item}
                    className="flex items-center gap-2.5 text-slate-400 glass rounded-full px-4 py-2 animate-fade-in-up opacity-0"
                    style={{ animationDelay: `${0.1 + i * 0.1}s` }}
                  >
                    <CheckCircle size={16} className="text-emerald-400" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-24">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="glass rounded-3xl p-12 md:p-16 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to streamline your workforce?</h2>
                <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                  Join hundreds of healthcare organizations already using ShiftPulse to manage their teams.
                </p>
                <Link href="/signup">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-lg px-10 shadow-xl shadow-blue-600/25 transition-all hover:shadow-blue-500/40 hover:-translate-y-0.5">
                    Get Started for Free
                    <ArrowRight size={18} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <Shield size={12} />
              </div>
              <span className="text-sm font-medium">ShiftPulse</span>
            </div>
            <p className="text-sm text-slate-600">
              &copy; {new Date().getFullYear()} ShiftPulse. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
