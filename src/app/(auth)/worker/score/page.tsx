import { requireRole } from "@/lib/auth-utils";
import { getWorkerScoreBreakdown } from "@/actions/marketplace";
import { getWorkerScoreTier } from "@/lib/scoring";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Star,
  Award,
  Briefcase,
  Clock,
  Lightbulb,
  CheckCircle2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";
import { VisibilityToggle } from "./visibility-toggle";

export default async function WorkerScorePage() {
  await requireRole("WORKER");
  const data = await getWorkerScoreBreakdown();

  if (!data) {
    redirect("/worker/profile");
  }

  const tier = getWorkerScoreTier(data.score);

  // Calculate section scores for display
  const profilePoints = calculateProfilePoints(data.factors);
  const credentialPoints = calculateCredentialPoints(data.factors);
  const experiencePoints = calculateExperiencePoints(data.factors);
  const ratingPoints = calculateRatingPoints(data.factors);
  const reliabilityPoints = calculateReliabilityPoints(data.factors);

  return (
    <div>
      <TopBar title="Marketplace Score" />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Score Overview */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Score Circle */}
              <div className="relative w-32 h-32 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-gray-100"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={`${(data.score / 100) * 264} 264`}
                    strokeLinecap="round"
                    className={tier.color}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">{data.score}</span>
                  <span className="text-xs text-gray-500">/100</span>
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                  <h2 className="text-xl font-bold text-gray-900">Your Marketplace Score</h2>
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-semibold",
                      tier.color === "text-amber-500" ? "bg-amber-50 text-amber-700" :
                      tier.color === "text-emerald-500" ? "bg-emerald-50 text-emerald-700" :
                      tier.color === "text-blue-500" ? "bg-blue-50 text-blue-700" :
                      tier.color === "text-slate-500" ? "bg-gray-100 text-gray-600" :
                      "bg-gray-50 text-gray-500"
                    )}
                  >
                    {tier.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Your score determines how high you appear in provider search results.
                  Higher scores mean more visibility and better opportunities.
                </p>
                <VisibilityToggle isVisible={data.isMarketplaceVisible} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ScoreSection
            title="Profile Completeness"
            icon={<User size={16} />}
            points={profilePoints}
            maxPoints={20}
            items={[
              { label: "Profile complete", done: data.factors.profileComplete, points: 5 },
              { label: "Worker type set", done: data.factors.workerTypeSet, points: 3 },
              { label: "Specialties added", done: data.factors.hasSpecialties, points: 3 },
              { label: "Professional bio", done: data.factors.hasBio, points: 4 },
              { label: "Profile photo", done: data.factors.hasPhoto, points: 3 },
              { label: "Availability set", done: data.factors.hasAvailability, points: 2 },
            ]}
          />

          <ScoreSection
            title="Credentials"
            icon={<Award size={16} />}
            points={credentialPoints}
            maxPoints={25}
            items={[
              {
                label: `${data.factors.hasVerifiedCredentials} of ${data.factors.totalCredentials} credentials verified`,
                done: data.factors.hasVerifiedCredentials > 0,
                points: credentialPoints,
              },
            ]}
          />

          <ScoreSection
            title="Experience"
            icon={<Briefcase size={16} />}
            points={experiencePoints}
            maxPoints={15}
            items={[
              {
                label: data.factors.yearsExperience !== null
                  ? `${data.factors.yearsExperience} years of experience`
                  : "Years of experience not set",
                done: data.factors.yearsExperience !== null && data.factors.yearsExperience > 0,
                points: experiencePoints,
              },
            ]}
          />

          <ScoreSection
            title="Ratings & Reviews"
            icon={<Star size={16} />}
            points={ratingPoints}
            maxPoints={20}
            items={[
              {
                label: data.factors.averageRating !== null
                  ? `${parseFloat(data.factors.averageRating.toFixed(1))} avg rating from ${data.factors.totalReviews} review${data.factors.totalReviews !== 1 ? "s" : ""}`
                  : "No reviews yet",
                done: data.factors.totalReviews > 0,
                points: ratingPoints,
              },
            ]}
          />

          <ScoreSection
            title="Reliability"
            icon={<Clock size={16} />}
            points={reliabilityPoints}
            maxPoints={20}
            items={[
              {
                label: `${data.factors.shiftsCompleted} shifts completed`,
                done: data.factors.shiftsCompleted > 0,
                points: reliabilityPoints,
              },
              {
                label: data.factors.noShowCount > 0
                  ? `${data.factors.noShowCount} no-shows (-${data.factors.noShowCount * 3} pts)`
                  : "No no-shows",
                done: data.factors.noShowCount === 0,
                points: 0,
              },
            ]}
          />
        </div>

        {/* Tips to Improve */}
        {data.tips.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb size={18} className="text-amber-500" />
                Tips to Improve Your Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.tips.map((tip, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100"
                  >
                    <TrendingUp size={14} className="text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-800">{tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Score Section Component ────────────────────────────────────

function ScoreSection({
  title,
  icon,
  points,
  maxPoints,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  points: number;
  maxPoints: number;
  items: { label: string; done: boolean; points: number }[];
}) {
  const percentage = maxPoints > 0 ? Math.min((points / maxPoints) * 100, 100) : 0;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">{icon}</span>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          </div>
          <span className="text-sm font-bold text-gray-900">
            {Math.round(points)}/{maxPoints}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              percentage >= 80
                ? "bg-emerald-500"
                : percentage >= 50
                ? "bg-blue-500"
                : percentage > 0
                ? "bg-amber-500"
                : "bg-gray-200"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {item.done ? (
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 shrink-0" />
              )}
              <span
                className={cn(
                  "text-xs",
                  item.done ? "text-gray-700" : "text-gray-400"
                )}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Score Calculation Helpers ───────────────────────────────────

function calculateProfilePoints(factors: {
  profileComplete: boolean;
  workerTypeSet: boolean;
  hasSpecialties: boolean;
  hasBio: boolean;
  hasPhoto: boolean;
  hasAvailability: boolean;
}) {
  let pts = 0;
  if (factors.profileComplete) pts += 5;
  if (factors.workerTypeSet) pts += 3;
  if (factors.hasSpecialties) pts += 3;
  if (factors.hasBio) pts += 4;
  if (factors.hasPhoto) pts += 3;
  if (factors.hasAvailability) pts += 2;
  return pts;
}

function calculateCredentialPoints(factors: {
  hasVerifiedCredentials: number;
  totalCredentials: number;
}) {
  if (factors.totalCredentials === 0) return 0;
  const verifiedRatio = factors.hasVerifiedCredentials / factors.totalCredentials;
  let pts = Math.round(verifiedRatio * 15);
  pts += Math.min(factors.hasVerifiedCredentials * 2, 10);
  return pts;
}

function calculateExperiencePoints(factors: {
  yearsExperience: number | null;
}) {
  if (factors.yearsExperience === null) return 0;
  return Math.min(factors.yearsExperience * 1.5, 15);
}

function calculateRatingPoints(factors: {
  averageRating: number | null;
  totalReviews: number;
}) {
  if (factors.averageRating === null || factors.totalReviews === 0) return 0;
  let pts = Math.round((factors.averageRating / 5) * 15);
  pts += Math.min(factors.totalReviews, 5);
  return pts;
}

function calculateReliabilityPoints(factors: {
  shiftsCompleted: number;
  noShowCount: number;
  onTimePercentage: number | null;
}) {
  if (factors.shiftsCompleted === 0) return 0;
  let pts = Math.min(factors.shiftsCompleted * 0.5, 10);
  if (factors.onTimePercentage !== null) {
    pts += Math.round((factors.onTimePercentage / 100) * 8);
  }
  pts -= factors.noShowCount * 3;
  return Math.max(0, pts);
}
