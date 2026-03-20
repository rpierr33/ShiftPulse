import {
  cn,
  formatDuration,
  formatTime,
  formatDate,
  formatDateTime,
  formatDateRange,
  generateJoinCode,
  computeDurationMinutes,
  getWeekRange,
} from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("deduplicates conflicting Tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("formatDuration", () => {
  it("returns only minutes when less than an hour", () => {
    expect(formatDuration(45)).toBe("45m");
  });

  it("returns only hours when minutes are zero", () => {
    expect(formatDuration(120)).toBe("2h");
  });

  it("returns hours and minutes combined", () => {
    expect(formatDuration(90)).toBe("1h 30m");
  });

  it("returns 0m for zero minutes", () => {
    expect(formatDuration(0)).toBe("0m");
  });

  it("rounds fractional minutes", () => {
    expect(formatDuration(61.7)).toBe("1h 2m");
  });
});

describe("formatTime", () => {
  it("formats a Date object to a time string", () => {
    const date = new Date("2026-03-19T14:30:00Z");
    const result = formatTime(date, "UTC");
    expect(result).toMatch(/2:30\s*PM/i);
  });

  it("formats a string date to a time string", () => {
    const result = formatTime("2026-03-19T08:00:00Z", "UTC");
    expect(result).toMatch(/8:00\s*AM/i);
  });
});

describe("formatDate", () => {
  it("formats a Date to a short date string", () => {
    const date = new Date("2026-03-19T00:00:00Z");
    const result = formatDate(date, "UTC");
    expect(result).toBe("Mar 19, 2026");
  });

  it("formats a string date", () => {
    const result = formatDate("2026-01-05T00:00:00Z", "UTC");
    expect(result).toBe("Jan 5, 2026");
  });
});

describe("formatDateTime", () => {
  it("returns both date and time", () => {
    const result = formatDateTime("2026-06-15T09:45:00Z", "UTC");
    expect(result).toMatch(/Jun 15, 2026/);
    expect(result).toMatch(/9:45\s*AM/i);
  });
});

describe("formatDateRange", () => {
  it("formats a start and end date as a range", () => {
    const result = formatDateRange(
      "2026-03-01T00:00:00Z",
      "2026-03-07T00:00:00Z",
      "UTC"
    );
    expect(result).toBe("Mar 1, 2026 - Mar 7, 2026");
  });
});

describe("generateJoinCode", () => {
  it("returns an 8-character string", () => {
    const code = generateJoinCode();
    expect(code).toHaveLength(8);
  });

  it("contains only allowed characters (no ambiguous chars like 0, O, 1, I)", () => {
    const allowed = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for (let i = 0; i < 20; i++) {
      const code = generateJoinCode();
      for (const ch of code) {
        expect(allowed).toContain(ch);
      }
    }
  });
});

describe("computeDurationMinutes", () => {
  it("computes the duration between two dates in minutes", () => {
    const start = new Date("2026-03-19T08:00:00Z");
    const end = new Date("2026-03-19T10:30:00Z");
    expect(computeDurationMinutes(start, end)).toBe(150);
  });

  it("returns 0 when start equals end", () => {
    const date = new Date("2026-03-19T12:00:00Z");
    expect(computeDurationMinutes(date, date)).toBe(0);
  });

  it("returns negative for reversed dates", () => {
    const start = new Date("2026-03-19T12:00:00Z");
    const end = new Date("2026-03-19T11:00:00Z");
    expect(computeDurationMinutes(start, end)).toBe(-60);
  });
});

describe("getWeekRange", () => {
  it("returns a Sunday-to-Saturday range", () => {
    // Wednesday March 19, 2026
    const date = new Date(2026, 2, 19);
    const { start, end } = getWeekRange(date);

    expect(start.getDay()).toBe(0); // Sunday
    expect(end.getDay()).toBe(6); // Saturday
  });

  it("sets start to midnight and end to 23:59:59.999", () => {
    const date = new Date(2026, 2, 19);
    const { start, end } = getWeekRange(date);

    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);

    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
  });

  it("handles a Sunday input (start of week)", () => {
    const sunday = new Date(2026, 2, 15); // Sunday
    const { start } = getWeekRange(sunday);
    expect(start.getDate()).toBe(15);
  });
});
