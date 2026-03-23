import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Users,
  ArrowRight,
  Sparkles,
  UserPlus,
  Search,
  Briefcase,
  FileText,
  CalendarCheck,
  MapPin,
  CheckCircle,
  Star,
  BadgeCheck,
  Building2,
  ShieldCheck,
  Lock,
  Quote,
  ChevronRight,
  Heart,
} from "lucide-react";

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
        {/* ─── 1. NAV BAR ─── */}
        <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Shield size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">CareCircle</span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            <a href="#how-it-works">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">
                How It Works
              </Button>
            </a>
            <a href="#features">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">
                Features
              </Button>
            </a>
            <Link href="/marketplace">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">
                Marketplace
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">
                Pricing
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-white/10 hidden sm:inline-flex">
                Get Started
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </nav>

        {/* ─── 2. HERO ─── */}
        <section className="max-w-7xl mx-auto px-6 pt-20 md:pt-24 pb-28 md:pb-36 text-center">
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 rounded-full px-5 py-2 text-sm text-blue-300 mb-6 glass">
              <Sparkles size={14} className="text-blue-400" />
              The Healthcare Workforce Marketplace
            </div>
            <p className="text-lg md:text-xl text-slate-300 italic mb-10">
              &ldquo;The Uber of Healthcare Staffing&rdquo;
            </p>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-8 tracking-tight animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Vetted healthcare workers,
            <br />
            <span className="gradient-text">one platform.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
            CareCircle connects credentialed nurses, aides, and caregivers with providers
            and families. Browse, book, and manage — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            <Link href="/signup">
              <Button size="xl" className="bg-blue-600 hover:bg-blue-500 text-lg px-10 shadow-xl shadow-blue-600/25 transition-all hover:shadow-blue-500/40 hover:-translate-y-0.5 w-full sm:w-auto">
                Get Started Free
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-white/5 hover:border-slate-500 text-lg px-8 transition-all hover:-translate-y-0.5 w-full sm:w-auto">
                <Search size={18} />
                Explore the Marketplace
              </Button>
            </Link>
          </div>

          {/* Connection graphic — floating cards syncing through CareCircle */}
          <div className="mt-16 max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
            <div className="relative flex items-center justify-center gap-0 min-h-[280px]">
              {/* Left — Workers */}
              <div className="flex-1 flex flex-col items-end gap-3 pr-4 md:pr-6">
                <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 border border-emerald-500/20 animate-float" style={{ animationDelay: "0s" }}>
                  <div>
                    <p className="text-sm font-semibold text-emerald-300">Maria A.</p>
                    <p className="text-[11px] text-slate-500">CNA &bull; 4.8 ★</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-emerald-500/20">MA</div>
                </div>
                <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 border border-blue-500/20 animate-float" style={{ animationDelay: "1s" }}>
                  <div>
                    <p className="text-sm font-semibold text-blue-300">James R.</p>
                    <p className="text-[11px] text-slate-500">RN &bull; 4.9 ★</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-blue-500/20">JR</div>
                </div>
                <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 border border-purple-500/20 animate-float" style={{ animationDelay: "2s" }}>
                  <div>
                    <p className="text-sm font-semibold text-purple-300">Lisa K.</p>
                    <p className="text-[11px] text-slate-500">LPN &bull; 4.7 ★</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-purple-500/20">LK</div>
                </div>
              </div>

              {/* Center — CareCircle hub */}
              <div className="relative z-10 flex flex-col items-center mx-2 md:mx-4">
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-emerald-500/30 via-blue-500/50 to-rose-500/30" />
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse-ring" />
                  <div className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 ring-4 ring-blue-500/20">
                    <Shield size={28} className="md:hidden" />
                    <Shield size={32} className="hidden md:block" />
                  </div>
                </div>
                <p className="mt-3 text-[10px] md:text-xs font-bold text-blue-400 tracking-widest uppercase">Connected</p>
              </div>

              {/* Right — Providers & Families */}
              <div className="flex-1 flex flex-col items-start gap-3 pl-4 md:pl-6">
                <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 border border-amber-500/20 animate-float" style={{ animationDelay: "0.5s" }}>
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-amber-500/20">SH</div>
                  <div>
                    <p className="text-sm font-semibold text-amber-300">Sunrise Health</p>
                    <p className="text-[11px] text-slate-500">Home Health &bull; 4.9 ★</p>
                  </div>
                </div>
                <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 border border-cyan-500/20 animate-float" style={{ animationDelay: "1.5s" }}>
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-cyan-500/20">HB</div>
                  <div>
                    <p className="text-sm font-semibold text-cyan-300">Humanity &amp; Blessing</p>
                    <p className="text-[11px] text-slate-500">Private Duty &bull; 4.8 ★</p>
                  </div>
                </div>
                <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 border border-rose-500/20 animate-float" style={{ animationDelay: "2.5s" }}>
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-rose-500/20">
                    <Heart size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-rose-300">Patricia W.</p>
                    <p className="text-[11px] text-slate-500">Family &bull; Seeking CNA</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social proof */}
          <div className="mt-16 flex items-center justify-center gap-6 text-sm text-slate-500 animate-fade-in-up" style={{ animationDelay: "0.7s" }}>
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-slate-300">
                  {["JD", "MK", "AS", "LP"][i]}
                </div>
              ))}
            </div>
            <span>Trusted by <strong className="text-slate-300">500+</strong> healthcare organizations and families</span>
          </div>
        </section>

        {/* ─── 3. HOW IT WORKS — FOR WORKERS ─── */}
        <section id="how-it-works" className="py-24 border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-6">
              <h2 className="text-4xl md:text-5xl font-bold mb-2">How It Works</h2>
              <p className="text-lg text-slate-400">Simple for every side of the marketplace</p>
            </div>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/20 rounded-full px-4 py-1.5 text-xs font-medium text-emerald-300 mb-6">
                FOR HEALTHCARE WORKERS
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Start working in three steps
              </h3>
              <p className="text-slate-400 max-w-xl mx-auto">
                Create your profile, get matched with top providers, and take control of your career.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  icon: <UserPlus size={24} />,
                  title: "Create Your Profile",
                  description: "Build your professional profile, upload credentials, set your availability and preferred work areas.",
                  gradient: "from-emerald-500/20 to-teal-500/20",
                  iconBg: "from-emerald-500 to-teal-500",
                },
                {
                  step: "02",
                  icon: <Search size={24} />,
                  title: "Get Matched",
                  description: "Browse providers, apply to organizations, and get discovered based on your score and credentials.",
                  gradient: "from-blue-500/20 to-cyan-500/20",
                  iconBg: "from-blue-500 to-cyan-500",
                },
                {
                  step: "03",
                  icon: <Briefcase size={24} />,
                  title: "Start Working",
                  description: "Accept shifts, clock in/out, track your hours, and grow your healthcare career.",
                  gradient: "from-purple-500/20 to-pink-500/20",
                  iconBg: "from-purple-500 to-pink-500",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="group relative rounded-2xl p-8 glass card-hover animate-fade-in-up"
                  style={{ animationDelay: `${0.3 + i * 0.15}s` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className="text-xs font-bold text-slate-600 mb-4 tracking-widest">{item.step}</div>
                    <div className={`w-12 h-12 bg-gradient-to-br ${item.iconBg} rounded-xl flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 4. HOW IT WORKS — FOR PROVIDERS ─── */}
        <section className="py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 rounded-full px-4 py-1.5 text-xs font-medium text-blue-300 mb-6">
                FOR HEALTHCARE PROVIDERS
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Fill shifts with vetted professionals
              </h3>
              <p className="text-slate-400 max-w-xl mx-auto">
                Post your needs, browse pre-screened workers, and manage everything from one dashboard.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  icon: <FileText size={24} />,
                  title: "Post Your Needs",
                  description: "List open shifts, set requirements, define your service areas and preferred qualifications.",
                  gradient: "from-blue-500/20 to-indigo-500/20",
                  iconBg: "from-blue-500 to-indigo-500",
                },
                {
                  step: "02",
                  icon: <Users size={24} />,
                  title: "Find Vetted Workers",
                  description: "Browse pre-screened nurses and aides ranked by credentials, experience, and reliability scores.",
                  gradient: "from-amber-500/20 to-orange-500/20",
                  iconBg: "from-amber-500 to-orange-500",
                },
                {
                  step: "03",
                  icon: <CalendarCheck size={24} />,
                  title: "Manage Everything",
                  description: "Schedule, track time, verify EVV, run payroll — all in one place with full compliance.",
                  gradient: "from-emerald-500/20 to-teal-500/20",
                  iconBg: "from-emerald-500 to-teal-500",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="group relative rounded-2xl p-8 glass card-hover animate-fade-in-up"
                  style={{ animationDelay: `${0.3 + i * 0.15}s` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className="text-xs font-bold text-slate-600 mb-4 tracking-widest">{item.step}</div>
                    <div className={`w-12 h-12 bg-gradient-to-br ${item.iconBg} rounded-xl flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 4b. HOW IT WORKS — FOR FAMILIES & INDIVIDUALS ─── */}
        <section className="py-24 border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-400/20 rounded-full px-4 py-1.5 text-xs font-medium text-rose-300 mb-6">
                FOR FAMILIES &amp; INDIVIDUALS
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Find care in three steps
              </h3>
              <p className="text-slate-400 max-w-xl mx-auto">
                Whether it&apos;s for a parent, a spouse, or yourself — find trusted, vetted caregivers on your terms.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  icon: <FileText size={24} />,
                  title: "Tell Us What You Need",
                  description: "Describe the care you need, your schedule, and your location.",
                  gradient: "from-rose-500/20 to-pink-500/20",
                  iconBg: "from-rose-500 to-pink-500",
                },
                {
                  step: "02",
                  icon: <Search size={24} />,
                  title: "Browse Vetted Workers",
                  description: "Search pre-screened nurses, aides, and sitters ranked by credentials and reviews.",
                  gradient: "from-amber-500/20 to-orange-500/20",
                  iconBg: "from-amber-500 to-orange-500",
                },
                {
                  step: "03",
                  icon: <Heart size={24} />,
                  title: "Book Directly",
                  description: "Request a caregiver, agree on terms, and start receiving care.",
                  gradient: "from-emerald-500/20 to-teal-500/20",
                  iconBg: "from-emerald-500 to-teal-500",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="group relative rounded-2xl p-8 glass card-hover animate-fade-in-up"
                  style={{ animationDelay: `${0.3 + i * 0.15}s` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className="text-xs font-bold text-slate-600 mb-4 tracking-widest">{item.step}</div>
                    <div className={`w-12 h-12 bg-gradient-to-br ${item.iconBg} rounded-xl flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 5. MARKETPLACE PREVIEW ─── */}
        <section id="marketplace-preview" className="py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                A Marketplace Built on Trust
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                Workers, providers, and private clients all benefit from verified credentials, reviews, and reliability scores.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Worker Card */}
              <div className="group relative rounded-2xl p-8 glass card-hover animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-xs font-medium uppercase tracking-widest text-slate-500">Worker Profile</div>
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star size={14} className="fill-amber-400" />
                      <span className="text-sm font-semibold">4.8</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-lg font-bold shadow-lg">
                      MA
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Maria Alvarez</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 bg-blue-500/15 text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-medium">
                          <BadgeCheck size={12} />
                          CNA
                        </span>
                        <span className="text-slate-500 text-xs">Miami, FL</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-400">87</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">Score</div>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-center">
                      <div className="text-sm font-semibold text-emerald-300">Excellent</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">Rating</div>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-center">
                      <div className="text-sm font-semibold">5</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">Credentials</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CheckCircle size={12} className="text-emerald-400" />
                    <span>5 verified credentials</span>
                  </div>
                </div>
              </div>

              {/* Provider Card */}
              <div className="group relative rounded-2xl p-8 glass card-hover animate-fade-in-up" style={{ animationDelay: "0.45s" }}>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-xs font-medium uppercase tracking-widest text-slate-500">Provider Profile</div>
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star size={14} className="fill-amber-400" />
                      <span className="text-sm font-semibold">4.9</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-lg font-bold shadow-lg">
                      SC
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Sunrise Care Group</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 bg-purple-500/15 text-purple-300 px-2.5 py-0.5 rounded-full text-xs font-medium">
                          <Building2 size={12} />
                          Home Health Agency
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-400">92</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">Score</div>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-center">
                      <div className="text-sm font-semibold text-amber-300">Top Rated</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">Rating</div>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-center">
                      <div className="text-sm font-semibold">12</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">Workers</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CheckCircle size={12} className="text-blue-400" />
                    <span>12 active workers on staff</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 6. FEATURES GRID ─── */}
        <section id="features" className="py-24 border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                Everything you need to manage your workforce
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                Built specifically for healthcare staffing with compliance and simplicity at its core.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <Search size={24} />,
                  title: "Marketplace Discovery",
                  description: "Find workers and providers in your area. Search by credentials, availability, ratings, and service type.",
                  gradient: "from-blue-500/20 to-cyan-500/20",
                  iconBg: "from-blue-500 to-cyan-500",
                },
                {
                  icon: <BadgeCheck size={24} />,
                  title: "Credential Management",
                  description: "Upload, verify, and track license expirations. Automatic alerts before credentials lapse.",
                  gradient: "from-emerald-500/20 to-teal-500/20",
                  iconBg: "from-emerald-500 to-teal-500",
                },
                {
                  icon: <CalendarCheck size={24} />,
                  title: "Smart Scheduling",
                  description: "Create shifts, manage assignments, auto-fill openings. Real-time visibility into who is working where.",
                  gradient: "from-purple-500/20 to-pink-500/20",
                  iconBg: "from-purple-500 to-pink-500",
                },
                {
                  icon: <MapPin size={24} />,
                  title: "Time Tracking & EVV",
                  description: "GPS-verified clock in/out with electronic visit verification. Accurate to the second, compliant by default.",
                  gradient: "from-amber-500/20 to-orange-500/20",
                  iconBg: "from-amber-500 to-orange-500",
                },
                {
                  icon: <FileText size={24} />,
                  title: "Claims & Documentation",
                  description: "CMS-1500 forms and service documentation. Streamlined billing and record-keeping in one place.",
                  gradient: "from-rose-500/20 to-pink-500/20",
                  iconBg: "from-rose-500 to-pink-500",
                },
                {
                  icon: <ShieldCheck size={24} />,
                  title: "Compliance Ready",
                  description: "Florida labor law compliance built in. Audit trails, overtime rules, and regulatory reporting automated.",
                  gradient: "from-indigo-500/20 to-blue-500/20",
                  iconBg: "from-indigo-500 to-blue-500",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group relative rounded-2xl p-8 glass card-hover animate-fade-in-up"
                  style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                >
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
          </div>
        </section>

        {/* ─── 7. PRICING PREVIEW ─── */}
        <section id="pricing" className="py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                Simple, transparent pricing
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                Start free. Scale as you grow. No hidden fees.
              </p>
              <p className="text-sm text-slate-500 mt-3 animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
                Workers and private clients use CareCircle for free. Pricing plans are for healthcare organizations.
              </p>
            </div>

            {/* Free tier */}
            <div className="max-w-3xl mx-auto mb-8">
              <div className="glass rounded-2xl p-6 border border-emerald-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-white">Free</h3>
                      <span className="text-2xl font-extrabold text-emerald-400">$0</span>
                      <span className="text-slate-500 text-sm">forever</span>
                    </div>
                    <p className="text-slate-400 text-sm">Workers, families, and companies getting started</p>
                  </div>
                  <Link href="/signup">
                    <Button className="bg-white/10 hover:bg-white/15 text-white border border-white/10">
                      Get Started <ArrowRight size={14} />
                    </Button>
                  </Link>
                </div>
                <div className="mt-4 grid sm:grid-cols-2 gap-2">
                  {["Create profile & get vetted", "Browse marketplace", "Book workers (families)", "Upload credentials", "Direct messaging", "Companies: limited view"].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle size={12} className="text-emerald-400 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Paid tiers */}
            <p className="text-center text-xs text-slate-500 mb-6">Paid plans for healthcare organizations</p>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  name: "Basic",
                  price: "$19.99",
                  period: "/month",
                  description: "Full marketplace access with scheduling",
                  features: ["Full worker profiles & contact info", "Basic shift scheduling", "Direct messaging", "Join code invitations", "Basic reporting"],
                  gradient: "from-slate-500/20 to-slate-600/20",
                  popular: false,
                },
                {
                  name: "Professional",
                  price: "$99.99",
                  period: "/month",
                  description: "Workforce management for agencies",
                  features: ["Everything in Basic", "GPS clock in/out with EVV", "Credential management & tracking", "Florida compliance rules", "Reports & payroll export", "Multi-location management"],
                  gradient: "from-blue-500/20 to-indigo-500/20",
                  popular: true,
                },
                {
                  name: "Enterprise",
                  price: "$199.99",
                  period: "/month",
                  description: "For large organizations",
                  features: ["Everything in Professional", "CMS-1500 claim forms", "Service documentation", "Auto-fill scheduling", "Advanced analytics", "Priority support"],
                  gradient: "from-purple-500/20 to-pink-500/20",
                  popular: false,
                },
              ].map((plan, i) => (
                <div
                  key={i}
                  className={`group relative rounded-2xl p-8 glass card-hover ${plan.popular ? "ring-2 ring-blue-500/50" : ""}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    {plan.popular && (
                      <div className="inline-flex items-center gap-1 bg-blue-500/20 border border-blue-400/30 rounded-full px-3 py-1 text-xs font-medium text-blue-300 mb-4">
                        <Sparkles size={12} />
                        Most Popular
                      </div>
                    )}
                    <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-slate-500 text-sm">{plan.period}</span>
                    </div>
                    <p className="text-slate-500 text-sm mb-6">{plan.description}</p>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, fi) => (
                        <li key={fi} className="flex items-center gap-2.5 text-sm text-slate-300">
                          <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link href="/signup?role=COMPANY" className="block">
                      <Button
                        className={`w-full transition-all hover:-translate-y-0.5 ${
                          plan.popular
                            ? "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25"
                            : "bg-white/10 hover:bg-white/15 text-white"
                        }`}
                      >
                        Get Started
                        <ArrowRight size={16} />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-slate-600 mt-6">A small service fee applies to bookings made through the platform.</p>

            <div className="text-center mt-8 animate-fade-in-up" style={{ animationDelay: "0.75s" }}>
              <Link href="/pricing" className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                View full pricing details
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── 8. TRUST BAR ─── */}
        <section className="py-16 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm text-slate-500 mb-8 uppercase tracking-widest font-medium">Built for healthcare staffing</p>
            <div className="flex items-center justify-center gap-4 md:gap-6 flex-wrap">
              {[
                { label: "EVV Ready", icon: <MapPin size={14} /> },
                { label: "HIPAA Conscious", icon: <Lock size={14} /> },
                { label: "FL Compliant", icon: <ShieldCheck size={14} /> },
                { label: "Credential Verified", icon: <BadgeCheck size={14} /> },
                { label: "Secure Platform", icon: <Shield size={14} /> },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 text-slate-400 glass rounded-full px-4 py-2 animate-fade-in-up"
                  style={{ animationDelay: `${0.1 + i * 0.1}s` }}
                >
                  <span className="text-emerald-400">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 9. TESTIMONIALS ─── */}
        <section className="py-24 border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                What our users say
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  quote: "CareCircle made it so easy to find reliable agencies in my area. I set my availability, and the shifts come to me. The clock-in process is seamless.",
                  name: "Danielle R.",
                  role: "Registered Nurse",
                  gradient: "from-emerald-500/20 to-teal-500/20",
                },
                {
                  quote: "We cut our scheduling time in half after switching to CareCircle. The credential verification alone saves us hours every week. Highly recommend for any agency.",
                  name: "Marcus T.",
                  role: "Agency Owner",
                  gradient: "from-blue-500/20 to-indigo-500/20",
                },
                {
                  quote: "The compliance features give me peace of mind. EVV tracking, audit trails, and automated reports mean I can focus on patient care instead of paperwork.",
                  name: "Patricia L.",
                  role: "Clinical Administrator",
                  gradient: "from-purple-500/20 to-pink-500/20",
                },
              ].map((testimonial, i) => (
                <div
                  key={i}
                  className="group relative rounded-2xl p-8 glass card-hover animate-fade-in-up"
                  style={{ animationDelay: `${0.3 + i * 0.15}s` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <Quote size={24} className="text-slate-700 mb-4" />
                    <p className="text-slate-300 text-sm leading-relaxed mb-6">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold">
                        {testimonial.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{testimonial.name}</div>
                        <div className="text-xs text-slate-500">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 10. FINAL CTA ─── */}
        <section className="py-24 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Join CareCircle today
            </h2>
            <p className="text-slate-400 mb-12 max-w-xl mx-auto">
              Whether you provide care, need care, or manage a team — get started for free.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <Link href="/signup?role=WORKER" className="group glass rounded-2xl p-6 border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                  <UserPlus size={20} />
                </div>
                <p className="font-semibold text-white mb-1">I provide care</p>
                <p className="text-xs text-slate-500">Nurses, aides, therapists</p>
              </Link>
              <Link href="/signup?role=COMPANY" className="group glass rounded-2xl p-6 border border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <Building2 size={20} />
                </div>
                <p className="font-semibold text-white mb-1">I manage a team</p>
                <p className="text-xs text-slate-500">Agencies, facilities, registries</p>
              </Link>
              <Link href="/signup?role=CLIENT" className="group glass rounded-2xl p-6 border border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-500/5 transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-transform">
                  <Heart size={20} />
                </div>
                <p className="font-semibold text-white mb-1">I need care</p>
                <p className="text-xs text-slate-500">Families, individuals</p>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── DISCLAIMER ─── */}
        <section className="py-8 border-t border-white/5">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="text-xs text-slate-600 leading-relaxed">
              CareCircle is a marketplace platform that connects healthcare workers with providers and individuals seeking care. CareCircle does not employ, recommend, or endorse any worker or provider. All workers are independent professionals. Users are responsible for verifying qualifications and agreeing to terms of engagement. CareCircle is not a party to any agreement between users.
            </p>
          </div>
        </section>

        {/* ─── 11. FOOTER ─── */}
        <footer className="border-t border-white/5 py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-2 text-slate-500">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                  <Shield size={14} />
                </div>
                <span className="text-sm font-semibold text-slate-400">CareCircle</span>
              </div>

              <div className="flex items-center gap-6 flex-wrap justify-center">
                {[
                  { label: "Features", href: "#features" },
                  { label: "Marketplace", href: "#marketplace-preview" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "About", href: "#" },
                  { label: "Contact", href: "#" },
                  { label: "Privacy", href: "#" },
                  { label: "Terms", href: "#" },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <p className="text-sm text-slate-600">
                &copy; {new Date().getFullYear()} CareCircle. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
