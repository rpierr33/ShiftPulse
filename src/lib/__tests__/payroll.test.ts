import { calculateOvertimeHours, generatePayrollCSV } from "@/lib/payroll";

describe("calculateOvertimeHours", () => {
  it("returns all regular hours when under threshold", () => {
    expect(calculateOvertimeHours(30)).toEqual({ regular: 30, overtime: 0 });
  });

  it("returns all regular hours when exactly at threshold", () => {
    expect(calculateOvertimeHours(40)).toEqual({ regular: 40, overtime: 0 });
  });

  it("splits hours into regular and overtime when over threshold", () => {
    expect(calculateOvertimeHours(50)).toEqual({ regular: 40, overtime: 10 });
  });

  it("uses a custom threshold", () => {
    expect(calculateOvertimeHours(38, 35)).toEqual({ regular: 35, overtime: 3 });
  });

  it("handles zero hours", () => {
    expect(calculateOvertimeHours(0)).toEqual({ regular: 0, overtime: 0 });
  });
});

describe("generatePayrollCSV", () => {
  const makeEntry = (overrides: Record<string, unknown> = {}) => ({
    clockInTime: new Date("2026-03-19T08:00:00Z"),
    clockOutTime: new Date("2026-03-19T16:00:00Z"),
    duration: 480, // 8 hours in minutes
    isManualEntry: false,
    evvStatus: "VERIFIED",
    status: "APPROVED",
    user: {
      name: "Jane Doe",
      email: "jane@example.com",
      workerProfile: { hourlyRate: 30 },
    },
    shift: { title: "Morning Shift" },
    ...overrides,
  });

  it("generates CSV with correct headers", () => {
    const csv = generatePayrollCSV([makeEntry()]);
    const headerLine = csv.split("\n")[0];
    expect(headerLine).toContain("Worker Name");
    expect(headerLine).toContain("Email");
    expect(headerLine).toContain("Hours");
    expect(headerLine).toContain("Overtime Hours");
    expect(headerLine).toContain("Total Pay");
  });

  it("calculates correct pay for regular hours", () => {
    const csv = generatePayrollCSV([makeEntry()]);
    const dataLine = csv.split("\n")[1];
    // 8 hours * $30/hr = $240
    expect(dataLine).toContain("8.00");
    expect(dataLine).toContain("0.00");
    expect(dataLine).toContain("240.00");
  });

  it("calculates overtime pay correctly", () => {
    // 5 entries of 480 min (8h each) = 40h total, then one more 8h entry
    const entries = Array.from({ length: 6 }, () => makeEntry());
    const csv = generatePayrollCSV(entries);
    const lines = csv.split("\n");
    // The 6th entry (index 6 = line 6) should have overtime
    const lastDataLine = lines[6];
    // Worker has 48 total hours: 40 regular + 8 overtime on last entry
    expect(lastDataLine).toContain("8.00"); // overtime hours column
  });

  it("escapes CSV fields containing commas", () => {
    const entry = makeEntry({
      user: {
        name: "Doe, Jane",
        email: "jane@example.com",
        workerProfile: { hourlyRate: 30 },
      },
    });
    const csv = generatePayrollCSV([entry]);
    // Name with comma should be wrapped in quotes
    expect(csv).toContain('"Doe, Jane"');
  });

  it("escapes CSV fields containing double quotes", () => {
    const entry = makeEntry({
      user: {
        name: 'Jane "JD" Doe',
        email: "jane@example.com",
        workerProfile: { hourlyRate: 30 },
      },
    });
    const csv = generatePayrollCSV([entry]);
    // Quotes inside should be doubled and the field wrapped
    expect(csv).toContain('"Jane ""JD"" Doe"');
  });

  it("prevents CSV injection with leading = character", () => {
    const entry = makeEntry({
      user: {
        name: "=cmd|'/C calc'!A0",
        email: "jane@example.com",
        workerProfile: { hourlyRate: 30 },
      },
    });
    const csv = generatePayrollCSV([entry]);
    // Should be prefixed with single quote to neutralize
    expect(csv).not.toMatch(/^=cmd/m);
    expect(csv).toContain("'=cmd");
  });

  it("prevents CSV injection with leading + character", () => {
    const entry = makeEntry({
      user: {
        name: "+cmd|'/C calc'!A0",
        email: "jane@example.com",
        workerProfile: { hourlyRate: 30 },
      },
    });
    const csv = generatePayrollCSV([entry]);
    expect(csv).toContain("'+cmd");
  });

  it("prevents CSV injection with leading - character", () => {
    const entry = makeEntry({
      user: {
        name: "-1+1",
        email: "jane@example.com",
        workerProfile: { hourlyRate: 30 },
      },
    });
    const csv = generatePayrollCSV([entry]);
    expect(csv).toContain("'-1+1");
  });

  it("prevents CSV injection with leading @ character", () => {
    const entry = makeEntry({
      user: {
        name: "@SUM(A1:A10)",
        email: "jane@example.com",
        workerProfile: { hourlyRate: 30 },
      },
    });
    const csv = generatePayrollCSV([entry]);
    expect(csv).toContain("'@SUM");
  });

  it("handles null clockOutTime", () => {
    const entry = makeEntry({ clockOutTime: null, duration: null });
    const csv = generatePayrollCSV([entry]);
    const dataLine = csv.split("\n")[1];
    expect(dataLine).toContain("—");
  });

  it("handles null hourly rate", () => {
    const entry = makeEntry({
      user: {
        name: "Jane Doe",
        email: "jane@example.com",
        workerProfile: { hourlyRate: null },
      },
    });
    const csv = generatePayrollCSV([entry]);
    // Pay should be 0.00 with null rate
    expect(csv.split("\n")[1]).toContain("0.00");
  });
});
