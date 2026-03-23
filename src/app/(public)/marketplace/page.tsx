import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, Building2, Star, ArrowRight, BadgeCheck, TrendingUp } from "lucide-react";
import { searchWorkers, searchProviders } from "@/actions/marketplace";
import { WORKER_TYPE_LABELS, PROVIDER_TYPE_LABELS } from "@/types";
import { getWorkerScoreTier, getProviderScoreTier } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import { auth } from "@/auth";

export default async function MarketplacePage() {
  // Redirect logged-in users to the relevant marketplace side
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as Record<string, any> | undefined;
  if (user?.role === "WORKER") redirect("/marketplace/providers");
  if (user?.role === "COMPANY") redirect("/marketplace/workers");
  const [topWorkers, topProviders] = await Promise.all([
    searchWorkers({ sortBy: "score", limit: 6 }),
    searchProviders({ sortBy: "score", limit: 6 }),
  ]);

  return (
    <div className="relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/40 to-slate-950" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/6 rounded-full blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Hero */}
      <section className="relative z-10 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <TrendingUp size={14} />
            Marketplace
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6">
            Connect with the Best in{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Healthcare
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-12">
            Find top-rated healthcare workers and providers. Scores rank
            professionals by credentials, reliability, and reviews.
          </p>

          {/* Two CTAs */}
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Link
              href="/marketplace/providers"
              className="group glass rounded-2xl p-8 text-left hover:bg-white/[0.06] transition-all border border-white/5 hover:border-blue-500/30"
            >
              <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                <Building2 className="text-blue-400" size={28} />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                I&apos;m a Healthcare Worker
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Browse providers, find your next opportunity, and apply directly.
              </p>
              <span className="inline-flex items-center gap-1 text-blue-400 text-sm font-medium group-hover:gap-2 transition-all">
                Browse Providers <ArrowRight size={14} />
              </span>
            </Link>

            <Link
              href="/marketplace/workers"
              className="group glass rounded-2xl p-8 text-left hover:bg-white/[0.06] transition-all border border-white/5 hover:border-purple-500/30"
            >
              <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                <Users className="text-purple-400" size={28} />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                I&apos;m a Healthcare Provider
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Find qualified nurses, aides, and therapists for your team.
              </p>
              <span className="inline-flex items-center gap-1 text-purple-400 text-sm font-medium group-hover:gap-2 transition-all">
                Browse Workers <ArrowRight size={14} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Workers */}
      {topWorkers.workers.length > 0 && (
        <section className="relative z-10 py-16 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">Top Healthcare Workers</h2>
                <p className="text-sm text-slate-400 mt-1">Highest-scored professionals on the platform</p>
              </div>
              <Link
                href="/marketplace/workers"
                className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topWorkers.workers.map((worker) => {
                const tier = getWorkerScoreTier(worker.score);
                return (
                  <Link
                    key={worker.id}
                    href={`/marketplace/workers/${worker.userId}`}
                    className="group glass rounded-2xl p-6 hover:bg-white/[0.06] transition-all border border-white/5 hover:border-white/10"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {worker.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white font-semibold truncate group-hover:text-blue-400 transition-colors">
                          {worker.name}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {worker.workerType
                            ? WORKER_TYPE_LABELS[worker.workerType]
                            : "Healthcare Worker"}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-semibold",
                          tier.bgColor,
                          tier.color
                        )}
                      >
                        {worker.score}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                      {worker.yearsExperience !== null && (
                        <span>{worker.yearsExperience}yr exp</span>
                      )}
                      {worker.averageRating !== null && (
                        <span className="flex items-center gap-1">
                          <Star size={10} className="text-amber-400 fill-amber-400" />
                          {worker.averageRating}
                        </span>
                      )}
                      {worker.verifiedCredentialsCount > 0 && (
                        <span className="flex items-center gap-1">
                          <BadgeCheck size={10} className="text-emerald-400" />
                          {worker.verifiedCredentialsCount} verified
                        </span>
                      )}
                    </div>
                    {worker.city && worker.state && (
                      <p className="text-xs text-slate-500 mt-2">
                        {worker.city}, {worker.state}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Providers */}
      {topProviders.providers.length > 0 && (
        <section className="relative z-10 py-16 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">Top Healthcare Providers</h2>
                <p className="text-sm text-slate-400 mt-1">Highest-scored organizations on the platform</p>
              </div>
              <Link
                href="/marketplace/providers"
                className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topProviders.providers.map((provider) => {
                const tier = getProviderScoreTier(provider.score);
                return (
                  <Link
                    key={provider.id}
                    href={`/marketplace/providers/${provider.id}`}
                    className="group glass rounded-2xl p-6 hover:bg-white/[0.06] transition-all border border-white/5 hover:border-white/10"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {provider.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white font-semibold truncate group-hover:text-purple-400 transition-colors">
                          {provider.name}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {provider.providerType
                            ? PROVIDER_TYPE_LABELS[provider.providerType]
                            : "Healthcare Provider"}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-semibold",
                          tier.bgColor,
                          tier.color
                        )}
                      >
                        {provider.score}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                      {provider.averageRating !== null && (
                        <span className="flex items-center gap-1">
                          <Star size={10} className="text-amber-400 fill-amber-400" />
                          {provider.averageRating}
                        </span>
                      )}
                      <span>{provider.activeWorkers} workers</span>
                    </div>
                    {provider.city && provider.state && (
                      <p className="text-xs text-slate-500 mt-2">
                        {provider.city}, {provider.state}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="relative z-10 py-20 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-slate-400 mb-8">
            Join thousands of healthcare professionals and providers already using
            CareCircle to connect, schedule, and grow.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/25"
            >
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="text-slate-400 hover:text-white px-6 py-3 rounded-xl font-medium transition-colors border border-white/10 hover:border-white/20"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
