import { db } from "@/lib/db";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number; // seconds
}

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

/**
 * Database-backed rate limiter.
 * Key format: "action:identifier" e.g. "login:email:foo@bar.com"
 */
export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const now = new Date();

  // Clean up expired entries periodically (1% chance per request)
  if (Math.random() < 0.01) {
    await db.rateLimitEntry.deleteMany({
      where: { expiresAt: { lt: now } },
    }).catch(() => {}); // non-critical
  }

  const existing = await db.rateLimitEntry.findUnique({
    where: { key },
  });

  // No existing entry or expired — allow
  if (!existing || existing.expiresAt < now) {
    await db.rateLimitEntry.upsert({
      where: { key },
      create: {
        key,
        attempts: 1,
        lastAttempt: now,
        expiresAt: new Date(now.getTime() + WINDOW_MS),
      },
      update: {
        attempts: 1,
        lastAttempt: now,
        expiresAt: new Date(now.getTime() + WINDOW_MS),
      },
    });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  // Still within window
  if (existing.attempts >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  // Increment
  await db.rateLimitEntry.update({
    where: { key },
    data: {
      attempts: existing.attempts + 1,
      lastAttempt: now,
    },
  });

  return { allowed: true, remaining: MAX_ATTEMPTS - existing.attempts - 1 };
}

/**
 * Reset rate limit for a key (e.g., after successful login)
 */
export async function resetRateLimit(key: string): Promise<void> {
  await db.rateLimitEntry.deleteMany({
    where: { key },
  }).catch(() => {});
}
