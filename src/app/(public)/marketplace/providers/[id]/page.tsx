import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Star,
  BadgeCheck,
  MapPin,
  Users,
  Clock,
  Calendar,
  ArrowRight,
  ChevronLeft,
  Globe,
} from "lucide-react";
import { getProviderMarketplaceProfile } from "@/actions/marketplace";
import { PROVIDER_TYPE_LABELS } from "@/types";
import { getProviderScoreTier, formatScore } from "@/lib/scoring";
import { cn } from "@/lib/utils";

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={cn(
            i < Math.round(rating)
              ? "text-amber-400 fill-amber-400"
              : "text-gray-600"
          )}
        />
      ))}
    </div>
  );
}

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const provider = await getProviderMarketplaceProfile(id);

  if (!provider) notFound();

  const tier = getProviderScoreTier(provider.score);

  return (
    <div className="relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/marketplace/providers"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 mb-6 transition-colors"
        >
          <ChevronLeft size={14} /> Back to Providers
        </Link>

        {/* Hero Card */}
        <div className="glass rounded-2xl p-8 border border-white/5 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Logo placeholder */}
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-lg shadow-purple-500/20">
              {provider.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{provider.name}</h1>
                <div className="flex items-center gap-2">
                  {provider.providerType && (
                    <span className="px-2.5 py-1 text-xs font-medium bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
                      {PROVIDER_TYPE_LABELS[provider.providerType]}
                    </span>
                  )}
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-semibold",
                      tier.bgColor,
                      tier.color
                    )}
                  >
                    {tier.label} &middot; {formatScore(provider.score)}
                  </span>
                </div>
              </div>

              {provider.city && provider.state && (
                <p className="flex items-center gap-1.5 text-sm text-slate-400 mb-4">
                  <MapPin size={14} />
                  {provider.city}, {provider.state}
                </p>
              )}

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar size={14} className="text-slate-500" />
                  <span>
                    <strong className="text-white">{provider.yearsActive}</strong> yr{provider.yearsActive !== 1 ? "s" : ""} active
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Users size={14} className="text-slate-500" />
                  <span>
                    <strong className="text-white">{provider.activeWorkers}</strong> active worker{provider.activeWorkers !== 1 ? "s" : ""}
                  </span>
                </div>
                {provider.averageRating !== null && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span>
                      <strong className="text-white">{provider.averageRating}</strong> ({provider.totalReviews} reviews)
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock size={14} className="text-slate-500" />
                  <span>
                    <strong className="text-white">{provider.shiftsCompleted}</strong> shifts completed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {provider.description && (
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h2 className="text-base font-semibold text-white mb-3">About</h2>
                <p className="text-sm text-slate-400 whitespace-pre-line leading-relaxed">
                  {provider.description}
                </p>
              </div>
            )}

            {/* Services Offered */}
            {provider.servicesOffered.length > 0 && (
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h2 className="text-base font-semibold text-white mb-4">Services Offered</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.servicesOffered.map((service) => (
                    <span
                      key={service}
                      className="px-3 py-1.5 text-xs bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h2 className="text-base font-semibold text-white mb-4">
                Reviews ({provider.totalReviews})
              </h2>
              {provider.reviews.length === 0 ? (
                <p className="text-sm text-slate-500">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {provider.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="py-4 border-b border-white/5 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
                            {review.reviewerName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-300">
                              {review.reviewerName}
                            </p>
                            <p className="text-xs text-slate-600">
                              {new Date(review.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <StarRating rating={review.rating} size={12} />
                      </div>
                      {review.title && (
                        <p className="text-sm font-medium text-white mb-1">
                          {review.title}
                        </p>
                      )}
                      {review.content && (
                        <p className="text-sm text-slate-400">{review.content}</p>
                      )}
                      {review.isVerified && (
                        <span className="inline-flex items-center gap-1 mt-2 text-xs text-emerald-400">
                          <BadgeCheck size={10} /> Verified
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* CTA */}
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-base font-semibold text-white mb-3">
                Want to join {provider.name}?
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Sign in or create an account to apply to this provider.
              </p>
              <Link
                href={`/login?callbackUrl=/marketplace/providers/${provider.id}`}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-blue-600/20"
              >
                Apply to {provider.name.split(" ")[0]}
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Service Areas */}
            {provider.serviceAreas.length > 0 && (
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="text-sm font-semibold text-white mb-3">
                  <Globe size={14} className="inline mr-1.5" />
                  Service Areas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {provider.serviceAreas.map((area) => (
                    <span
                      key={area}
                      className="px-2.5 py-1 text-xs bg-white/5 text-slate-400 rounded-lg border border-white/5"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Member since */}
            <div className="glass rounded-2xl p-6 border border-white/5">
              <p className="text-xs text-slate-500">
                On CareCircle since{" "}
                {new Date(provider.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
