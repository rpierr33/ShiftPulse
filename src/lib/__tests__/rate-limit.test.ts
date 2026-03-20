jest.mock("@/lib/db", () => ({
  db: {
    rateLimitEntry: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";

const mockDb = db as jest.Mocked<typeof db>;
const rateLimitEntry = mockDb.rateLimitEntry as jest.Mocked<typeof mockDb.rateLimitEntry>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("checkRateLimit", () => {
  it("allows first request when no existing entry", async () => {
    (rateLimitEntry.findUnique as jest.Mock).mockResolvedValue(null);
    (rateLimitEntry.upsert as jest.Mock).mockResolvedValue({});
    (rateLimitEntry.deleteMany as jest.Mock).mockResolvedValue({});

    const result = await checkRateLimit("login:test@example.com");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
    expect(rateLimitEntry.upsert).toHaveBeenCalled();
  });

  it("allows request when existing entry is expired", async () => {
    const expired = new Date(Date.now() - 60_000); // 1 minute ago
    (rateLimitEntry.findUnique as jest.Mock).mockResolvedValue({
      key: "login:test@example.com",
      attempts: 5,
      lastAttempt: expired,
      expiresAt: expired,
    });
    (rateLimitEntry.upsert as jest.Mock).mockResolvedValue({});
    (rateLimitEntry.deleteMany as jest.Mock).mockResolvedValue({});

    const result = await checkRateLimit("login:test@example.com");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("allows request and decrements remaining when under limit", async () => {
    const future = new Date(Date.now() + 10 * 60_000); // 10 minutes from now
    (rateLimitEntry.findUnique as jest.Mock).mockResolvedValue({
      key: "login:test@example.com",
      attempts: 3,
      lastAttempt: new Date(),
      expiresAt: future,
    });
    (rateLimitEntry.update as jest.Mock).mockResolvedValue({});
    (rateLimitEntry.deleteMany as jest.Mock).mockResolvedValue({});

    const result = await checkRateLimit("login:test@example.com");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(6); // 10 - 3 - 1
    expect(rateLimitEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: "login:test@example.com" },
        data: expect.objectContaining({ attempts: 4 }),
      })
    );
  });

  it("blocks request when at max attempts", async () => {
    const future = new Date(Date.now() + 5 * 60_000);
    (rateLimitEntry.findUnique as jest.Mock).mockResolvedValue({
      key: "login:test@example.com",
      attempts: 10,
      lastAttempt: new Date(),
      expiresAt: future,
    });
    (rateLimitEntry.deleteMany as jest.Mock).mockResolvedValue({});

    const result = await checkRateLimit("login:test@example.com");

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
    expect(rateLimitEntry.update).not.toHaveBeenCalled();
  });

  it("blocks request when over max attempts", async () => {
    const future = new Date(Date.now() + 5 * 60_000);
    (rateLimitEntry.findUnique as jest.Mock).mockResolvedValue({
      key: "login:test@example.com",
      attempts: 15,
      lastAttempt: new Date(),
      expiresAt: future,
    });
    (rateLimitEntry.deleteMany as jest.Mock).mockResolvedValue({});

    const result = await checkRateLimit("login:test@example.com");

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});

describe("resetRateLimit", () => {
  it("deletes the rate limit entry for the given key", async () => {
    (rateLimitEntry.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    await resetRateLimit("login:test@example.com");

    expect(rateLimitEntry.deleteMany).toHaveBeenCalledWith({
      where: { key: "login:test@example.com" },
    });
  });

  it("does not throw when entry does not exist", async () => {
    (rateLimitEntry.deleteMany as jest.Mock).mockRejectedValue(new Error("not found"));

    await expect(resetRateLimit("nonexistent")).resolves.toBeUndefined();
  });
});
