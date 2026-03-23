/**
 * Scoring system for marketplace visibility.
 *
 * Workers with higher scores appear higher in provider search results.
 * Providers with higher scores appear higher in worker search results.
 *
 * Score range: 0–100
 */

// ─── Worker Score ────────────────────────────────────────────────

export type WorkerScoreFactors = {
  profileComplete: boolean;         // Bio, photo, contact info filled out
  workerTypeSet: boolean;           // Has selected their role type
  hasVerifiedCredentials: number;   // Count of verified credentials
  totalCredentials: number;         // Count of all credentials uploaded
  yearsExperience: number | null;
  hasAvailability: boolean;         // Has set availability slots
  averageRating: number | null;     // 1-5 from reviews
  totalReviews: number;
  shiftsCompleted: number;
  noShowCount: number;
  onTimePercentage: number | null;  // % of shifts clocked in on time
  hasSpecialties: boolean;
  hasBio: boolean;
  hasPhoto: boolean;
};

export function calculateWorkerScore(factors: WorkerScoreFactors): number {
  let score = 0;

  // Profile completeness (max 20 points)
  if (factors.profileComplete) score += 5;
  if (factors.workerTypeSet) score += 3;
  if (factors.hasSpecialties) score += 3;
  if (factors.hasBio) score += 4;
  if (factors.hasPhoto) score += 3;
  if (factors.hasAvailability) score += 2;

  // Credentials (max 25 points)
  if (factors.totalCredentials > 0) {
    const verifiedRatio = factors.hasVerifiedCredentials / factors.totalCredentials;
    score += Math.round(verifiedRatio * 15);
    // Bonus for having multiple verified credentials
    score += Math.min(factors.hasVerifiedCredentials * 2, 10);
  }

  // Experience (max 15 points)
  if (factors.yearsExperience !== null) {
    score += Math.min(factors.yearsExperience * 1.5, 15);
  }

  // Ratings (max 20 points)
  if (factors.averageRating !== null && factors.totalReviews > 0) {
    // Base rating score (up to 15)
    score += Math.round((factors.averageRating / 5) * 15);
    // Bonus for review volume (up to 5)
    score += Math.min(factors.totalReviews, 5);
  }

  // Reliability (max 20 points)
  if (factors.shiftsCompleted > 0) {
    // Completed shifts (up to 10)
    score += Math.min(factors.shiftsCompleted * 0.5, 10);
    // On-time percentage (up to 8)
    if (factors.onTimePercentage !== null) {
      score += Math.round((factors.onTimePercentage / 100) * 8);
    }
    // No-show penalty
    score -= factors.noShowCount * 3;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getWorkerScoreTier(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score >= 85) return { label: "Elite", color: "text-amber-500", bgColor: "bg-amber-500/10" };
  if (score >= 70) return { label: "Excellent", color: "text-emerald-500", bgColor: "bg-emerald-500/10" };
  if (score >= 50) return { label: "Good", color: "text-blue-500", bgColor: "bg-blue-500/10" };
  if (score >= 30) return { label: "Building", color: "text-slate-500", bgColor: "bg-slate-500/10" };
  return { label: "New", color: "text-gray-400", bgColor: "bg-gray-400/10" };
}

// ─── Provider Score ──────────────────────────────────────────────

export type ProviderScoreFactors = {
  profileComplete: boolean;
  hasDescription: boolean;
  hasLogo: boolean;
  hasNpi: boolean;
  hasWebsite: boolean;
  yearsActive: number;             // Based on account creation date
  averageRating: number | null;
  totalReviews: number;
  totalWorkersEmployed: number;    // Active memberships
  avgPayRate: number | null;       // Average hourly rate offered
  shiftsCompleted: number;
  onTimePayment: boolean;          // Pays on time (future: from payroll data)
  servicesOfferedCount: number;
  responseRate: number | null;     // % of messages responded to
};

export function calculateProviderScore(factors: ProviderScoreFactors): number {
  let score = 0;

  // Profile completeness (max 15 points)
  if (factors.profileComplete) score += 3;
  if (factors.hasDescription) score += 3;
  if (factors.hasLogo) score += 2;
  if (factors.hasNpi) score += 4;
  if (factors.hasWebsite) score += 3;

  // Establishment / trust (max 15 points)
  score += Math.min(factors.yearsActive * 3, 15);

  // Ratings (max 25 points)
  if (factors.averageRating !== null && factors.totalReviews > 0) {
    score += Math.round((factors.averageRating / 5) * 18);
    score += Math.min(factors.totalReviews, 7);
  }

  // Workforce (max 15 points)
  score += Math.min(factors.totalWorkersEmployed * 1.5, 10);
  score += Math.min(factors.shiftsCompleted * 0.1, 5);

  // Compensation (max 15 points)
  if (factors.avgPayRate !== null) {
    // Higher pay = higher score (benchmarked against FL average ~$20-35/hr for CNAs/LPNs)
    if (factors.avgPayRate >= 35) score += 15;
    else if (factors.avgPayRate >= 28) score += 12;
    else if (factors.avgPayRate >= 22) score += 8;
    else if (factors.avgPayRate >= 18) score += 5;
    else score += 2;
  }

  // Responsiveness (max 10 points)
  if (factors.responseRate !== null) {
    score += Math.round((factors.responseRate / 100) * 8);
  }
  if (factors.onTimePayment) score += 2;

  // Services breadth (max 5 points)
  score += Math.min(factors.servicesOfferedCount, 5);

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getProviderScoreTier(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score >= 85) return { label: "Top Rated", color: "text-amber-500", bgColor: "bg-amber-500/10" };
  if (score >= 70) return { label: "Highly Rated", color: "text-emerald-500", bgColor: "bg-emerald-500/10" };
  if (score >= 50) return { label: "Established", color: "text-blue-500", bgColor: "bg-blue-500/10" };
  if (score >= 30) return { label: "Growing", color: "text-slate-500", bgColor: "bg-slate-500/10" };
  return { label: "New", color: "text-gray-400", bgColor: "bg-gray-400/10" };
}

// ─── Display Helpers ─────────────────────────────────────────────

export function formatScore(score: number): string {
  return `${score}/100`;
}

export function getScoreBreakdown(score: number): {
  stars: number;
  percentage: number;
} {
  return {
    stars: Math.round((score / 100) * 5 * 10) / 10, // e.g., 4.2
    percentage: score,
  };
}
