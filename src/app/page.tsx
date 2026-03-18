import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Clock, Users, BarChart3, CheckCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield size={18} />
          </div>
          <span className="text-xl font-bold">ShiftPulse</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-white text-blue-900 hover:bg-gray-100">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 text-sm text-blue-300 mb-8">
          <Clock size={14} />
          Workforce Timekeeping Made Simple
        </div>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
          Track shifts.<br />
          <span className="text-blue-400">Manage time.</span><br />
          Stay compliant.
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">
          The modern workforce management platform for nurse registries, home health agencies,
          and staffing organizations. Clock in, track hours, and manage your team — all in one place.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8">
              Start Free Trial
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8">
              View Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Clock size={28} />,
              title: "One-Tap Clock In/Out",
              description:
                "Workers clock in and out with a single tap. Mobile-first design with large, unmissable buttons.",
            },
            {
              icon: <Users size={28} />,
              title: "Shift Management",
              description:
                "Create schedules, assign shifts, and track attendance. Real-time visibility into who's working where.",
            },
            {
              icon: <BarChart3 size={28} />,
              title: "Reporting & Compliance",
              description:
                "Automated timesheets, audit trails, and compliance-ready reports. Every action is tracked.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8"
            >
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-slate-400 mb-6">Built for healthcare staffing</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {["EVV Ready", "HIPAA Conscious", "Audit Trails", "Real-time Tracking", "Multi-company"].map(
              (item) => (
                <div key={item} className="flex items-center gap-2 text-slate-300">
                  <CheckCircle size={16} className="text-green-400" />
                  <span className="text-sm">{item}</span>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} ShiftPulse. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
