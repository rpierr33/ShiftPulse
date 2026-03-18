import type { UserRole } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  timezone: string;
};

export type DashboardMetric = {
  label: string;
  value: number | string;
  change?: number;
  color?: string;
  icon?: string;
};

export type ClockStatus = {
  isClockedIn: boolean;
  currentEntryId?: string;
  clockInTime?: Date;
  shiftTitle?: string;
  companyName?: string;
};

export type WeeklyHours = {
  day: string;
  hours: number;
  date: string;
};

export type VisitStatus = {
  label: string;
  count: number;
  color: string;
};
