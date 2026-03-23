import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Star,
  BadgeCheck,
  MapPin,
  Clock,
  Briefcase,
  Calendar,
  ArrowRight,
  ChevronLeft,
  Award,
} from "lucide-react";
import { getWorkerMarketplaceProfile } from "@/actions/marketplace";
import { WORKER_TYPE_LABELS, CREDENTIAL_TYPES } from "@/types";
import { getWorkerScoreTier, formatScore } from "@/lib/scoring";
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

function getCredentialLabel(type: string): string {
  const found = CREDENTIAL_TYPES.find((c) => c.value === type);
  return found ? found.label : type;
}

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

export default async function WorkerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getWorkerMarketplaceProfile(id);

  if (!profile) notFound();

  const tier = getWorkerScoreTier(profile.score);

  return (
    <div className="relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/marketplace/workers"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 mb-6 transition-colors"
        >
          <ChevronLeft size={14} /> Back to Workers
        </Link>

        {/* Hero Card */}
        <div className="glass rounded-2xl p-8 border border-white/5 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-lg shadow-blue-500/20">
              {profile.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                <div className="flex items-center gap-2">
                  {profile.workerType && (
                    <span className="px-2.5 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                      {WORKER_TYPE_LABELS[profile.workerType]}
                    </span>
                  )}
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-semibold",
                      tier.bgColor,
                      tier.color
                    )}
                  >
                    {tier.label} &middot; {formatScore(profile.score)}
                  </span>
                </div>
              </div>

              {profile.city && profile.state && (
                <p className="flex items-center gap-1.5 text-sm text-slate-400 mb-4">
                  <MapPin size={14} />
                  {profile.city}, {profile.state}
                  {profile.serviceRadiusMiles && (
                    <span className="text-slate-600">
                      &middot; {profile.serviceRadiusMiles} mi radius
                    </span>
                  )}
                </p>
              )}

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-6 text-sm">
                {profile.yearsExperience !== null && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Briefcase size={14} className="text-slate-500" />
                    <span>
                      <strong className="text-white">{profile.yearsExperience}</strong> yrs experience
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock size={14} className="text-slate-500" />
                  <span>
                    <strong className="text-white">{profile.shiftsCompleted}</strong> shifts completed
                  </span>
                </div>
                {profile.averageRating !== null && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span>
                      <strong className="text-white">{profile.averageRating}</strong> ({profile.totalReviews} reviews)
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-400">
                  <BadgeCheck size={14} className="text-emerald-400" />
                  <span>
                    <strong className="text-white">{profile.verifiedCredentialsCount}</strong> verified credentials
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
            {profile.bio && (
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h2 className="text-base font-semibold text-white mb-3">About</h2>
                <p className="text-sm text-slate-400 whitespace-pre-line leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Credentials */}
            {profile.credentials.length > 0 && (
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h2 className="text-base font-semibold text-white mb-4">Credentials</h2>
                <div className="space-y-2">
                  {profile.credentials.map((cred) => (
                    <div
                      key={cred.id}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <Award size={14} className="text-slate-500" />
                        <span className="text-sm text-slate-300">
                          {cred.name || getCredentialLabel(cred.type)}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded-md",
                          cred.status === "VERIFIED"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        )}
                      >
                        {cred.status === "VERIFIED" ? "Verified" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h2 className="text-base font-semibold text-white mb-4">
                Reviews ({profile.totalReviews})
              </h2>
              {profile.reviews.length === 0 ? (
                <p className="text-sm text-slate-500">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {profile.reviews.map((review) => (
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
                Interested in {profile.name.split(" ")[0]}?
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Sign in or create an account to connect with this healthcare worker.
              </p>
              <Link
                href={`/login?callbackUrl=/marketplace/workers/${profile.userId}`}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-blue-600/20"
              >
                Connect with {profile.name.split(" ")[0]}
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Specialties */}
            {profile.specialties.length > 0 && (
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="text-sm font-semibold text-white mb-3">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 text-xs bg-white/5 text-slate-400 rounded-lg border border-white/5"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Availability */}
            {profile.availability.length > 0 && (
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="text-sm font-semibold text-white mb-3">
                  <Calendar size={14} className="inline mr-1.5" />
                  Availability
                </h3>
                <div className="space-y-1.5">
                  {profile.availability.map((slot, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-400 font-medium">
                        {DAY_LABELS[slot.dayOfWeek] ?? slot.dayOfWeek}
                      </span>
                      <span className="text-slate-500">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Member since */}
            <div className="glass rounded-2xl p-6 border border-white/5">
              <p className="text-xs text-slate-500">
                Member since{" "}
                {new Date(profile.memberSince).toLocaleDateString("en-US", {
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
