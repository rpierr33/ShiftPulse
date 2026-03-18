import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.clockEvent.deleteMany();
  await db.timeEntry.deleteMany();
  await db.assignment.deleteMany();
  await db.posting.deleteMany();
  await db.shift.deleteMany();
  await db.schedule.deleteMany();
  await db.settings.deleteMany();
  await db.companyMembership.deleteMany();
  await db.companyProfile.deleteMany();
  await db.workerProfile.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.company.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 12);

  // ─── Admin ─────────────────────────────────────────────────────
  const admin = await db.user.create({
    data: {
      name: "Admin User",
      email: "admin@shiftpulse.com",
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log("Created admin:", admin.email);

  // ─── Companies ─────────────────────────────────────────────────
  const companyUser1 = await db.user.create({
    data: {
      name: "Sarah Johnson",
      email: "sarah@sunrisehealth.com",
      passwordHash,
      role: "COMPANY",
    },
  });

  const company1 = await db.company.create({
    data: {
      name: "Sunrise Home Health",
      slug: "sunrise-home-health",
      joinCode: "SUNR1234",
      timezone: "America/New_York",
      address: "2121 W Oak Ave",
      city: "Tampa",
      state: "FL",
      zipCode: "33607",
      allowManualEntry: true,
    },
  });

  await db.companyProfile.create({
    data: { userId: companyUser1.id, companyName: "Sunrise Home Health" },
  });

  await db.companyMembership.create({
    data: {
      userId: companyUser1.id,
      companyId: company1.id,
      status: "APPROVED",
      role: "admin",
      joinedAt: new Date(),
    },
  });

  await db.settings.create({
    data: {
      companyId: company1.id,
      overtimeThreshold: 40,
      roundingIncrement: 15,
    },
  });

  const companyUser2 = await db.user.create({
    data: {
      name: "Michael Chen",
      email: "michael@humanityhealth.com",
      passwordHash,
      role: "COMPANY",
    },
  });

  const company2 = await db.company.create({
    data: {
      name: "Humanity & Blessing Home Health Corp",
      slug: "humanity-blessing",
      joinCode: "HUMA5678",
      timezone: "America/New_York",
      address: "500 Main St",
      city: "Orlando",
      state: "FL",
      zipCode: "32801",
      autoApproveWorkers: true,
      requireShiftSelection: true,
    },
  });

  await db.companyProfile.create({
    data: { userId: companyUser2.id, companyName: "Humanity & Blessing Home Health Corp" },
  });

  await db.companyMembership.create({
    data: {
      userId: companyUser2.id,
      companyId: company2.id,
      status: "APPROVED",
      role: "admin",
      joinedAt: new Date(),
    },
  });

  await db.settings.create({
    data: {
      companyId: company2.id,
      overtimeThreshold: 40,
      roundingIncrement: 15,
      autoApproveTimeEntries: true,
    },
  });

  console.log("Created companies:", company1.name, company2.name);

  // ─── Workers ───────────────────────────────────────────────────
  const workers = [
    { name: "Maria Garcia", email: "maria@example.com", specialties: ["CNA", "Home Health Aide"] },
    { name: "James Wilson", email: "james@example.com", specialties: ["RN", "Wound Care"] },
    { name: "Aisha Patel", email: "aisha@example.com", specialties: ["LPN", "Pediatrics"] },
    { name: "Robert Davis", email: "robert@example.com", specialties: ["CNA", "Geriatrics"] },
    { name: "Lisa Thompson", email: "lisa@example.com", specialties: ["RN", "IV Therapy"] },
    { name: "David Martinez", email: "david@example.com", specialties: ["LPN", "Diabetes Care"] },
  ];

  const createdWorkers = [];
  for (const w of workers) {
    const user = await db.user.create({
      data: {
        name: w.name,
        email: w.email,
        passwordHash,
        role: "WORKER",
        phone: `555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      },
    });

    const profile = await db.workerProfile.create({
      data: {
        userId: user.id,
        specialties: w.specialties,
        licenseNumber: `FL-${String(Math.floor(Math.random() * 90000) + 10000)}`,
        licenseState: "FL",
        hourlyRate: 25 + Math.floor(Math.random() * 20),
      },
    });

    createdWorkers.push({ user, profile });
  }

  // Connect workers to companies
  for (let i = 0; i < createdWorkers.length; i++) {
    const w = createdWorkers[i];
    // First 4 workers to company 1
    if (i < 4) {
      await db.companyMembership.create({
        data: {
          userId: w.user.id,
          companyId: company1.id,
          status: "APPROVED",
          joinedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
    // Last 4 workers to company 2
    if (i >= 2) {
      await db.companyMembership.create({
        data: {
          userId: w.user.id,
          companyId: company2.id,
          status: i === 5 ? "PENDING" : "APPROVED",
          joinedAt: i === 5 ? null : new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log("Created workers:", createdWorkers.map((w) => w.user.name).join(", "));

  // ─── Shifts for current week ───────────────────────────────────
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(monday.getDate() - monday.getDay() + 1);
  monday.setHours(0, 0, 0, 0);

  const shiftTemplates = [
    { title: "Morning Visit - Patient A", hour: 7, duration: 4, location: "123 Oak St, Tampa FL" },
    { title: "Afternoon Visit - Patient B", hour: 13, duration: 3, location: "456 Pine Ave, Tampa FL" },
    { title: "Evening Check-in - Patient C", hour: 17, duration: 2, location: "789 Elm Rd, Tampa FL" },
    { title: "Morning Shift - Facility", hour: 6, duration: 8, location: "Sunrise Care Center" },
    { title: "Night Shift - Facility", hour: 22, duration: 8, location: "Sunrise Care Center" },
  ];

  const createdShifts = [];
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(monday);
    date.setDate(date.getDate() + dayOffset);

    // 2-3 shifts per day for company 1
    const numShifts = dayOffset < 5 ? 3 : 1; // fewer on weekends
    for (let s = 0; s < numShifts; s++) {
      const template = shiftTemplates[s % shiftTemplates.length];
      const startTime = new Date(date);
      startTime.setHours(template.hour, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + template.duration);

      const shift = await db.shift.create({
        data: {
          companyId: company1.id,
          title: template.title,
          location: template.location,
          date,
          startTime,
          endTime,
          capacity: s === 3 ? 3 : 1,
          status: dayOffset < now.getDay() - 1 ? "COMPLETED" : dayOffset === now.getDay() - 1 ? "IN_PROGRESS" : "OPEN",
        },
      });
      createdShifts.push(shift);
    }
  }

  // Shifts for company 2
  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const date = new Date(monday);
    date.setDate(date.getDate() + dayOffset);

    for (let s = 0; s < 2; s++) {
      const template = shiftTemplates[s + 1];
      const startTime = new Date(date);
      startTime.setHours(template.hour, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + template.duration);

      await db.shift.create({
        data: {
          companyId: company2.id,
          title: template.title,
          location: "500 Main St, Orlando FL",
          date,
          startTime,
          endTime,
          status: dayOffset < now.getDay() - 1 ? "COMPLETED" : "OPEN",
        },
      });
    }
  }

  console.log("Created shifts for current week");

  // ─── Schedules ─────────────────────────────────────────────────
  const weekEnd = new Date(monday);
  weekEnd.setDate(weekEnd.getDate() + 6);

  await db.schedule.create({
    data: {
      companyId: company1.id,
      name: "Week of " + monday.toLocaleDateString(),
      description: "Regular weekly schedule",
      startDate: monday,
      endDate: weekEnd,
      isPublished: true,
    },
  });

  // ─── Assignments ───────────────────────────────────────────────
  for (let i = 0; i < Math.min(createdShifts.length, 12); i++) {
    const workerIdx = i % 4;
    await db.assignment.create({
      data: {
        workerProfileId: createdWorkers[workerIdx].profile.id,
        shiftId: createdShifts[i].id,
        status: createdShifts[i].status === "COMPLETED" ? "COMPLETED" : "CONFIRMED",
        confirmedAt: new Date(),
      },
    });
  }

  console.log("Created assignments");

  // ─── Time Entries ──────────────────────────────────────────────
  // Past entries (completed)
  for (let dayOffset = 0; dayOffset < Math.min(now.getDay(), 5); dayOffset++) {
    const date = new Date(monday);
    date.setDate(date.getDate() + dayOffset);

    for (let wIdx = 0; wIdx < 4; wIdx++) {
      const worker = createdWorkers[wIdx];
      const clockIn = new Date(date);
      clockIn.setHours(7 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 30), 0, 0);
      const clockOut = new Date(clockIn);
      clockOut.setHours(clockIn.getHours() + 6 + Math.floor(Math.random() * 3));
      const duration = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);

      const statuses = ["APPROVED", "APPROVED", "APPROVED", "PENDING"] as const;

      const entry = await db.timeEntry.create({
        data: {
          userId: worker.user.id,
          companyId: company1.id,
          clockInTime: clockIn,
          clockOutTime: clockOut,
          duration,
          status: statuses[wIdx],
          ...(statuses[wIdx] === "APPROVED"
            ? { approvedBy: companyUser1.id, approvedAt: new Date() }
            : {}),
        },
      });

      // Clock events
      await db.clockEvent.create({
        data: {
          userId: worker.user.id,
          companyId: company1.id,
          type: "CLOCK_IN",
          timestamp: clockIn,
          serverTime: clockIn,
        },
      });
      await db.clockEvent.create({
        data: {
          userId: worker.user.id,
          companyId: company1.id,
          type: "CLOCK_OUT",
          timestamp: clockOut,
          serverTime: clockOut,
        },
      });
    }
  }

  // Active entry (someone currently clocked in)
  if (now.getHours() >= 7) {
    const activeWorker = createdWorkers[0];
    const clockIn = new Date();
    clockIn.setHours(7, 0, 0, 0);

    await db.timeEntry.create({
      data: {
        userId: activeWorker.user.id,
        companyId: company1.id,
        clockInTime: clockIn,
        status: "PENDING",
      },
    });

    await db.clockEvent.create({
      data: {
        userId: activeWorker.user.id,
        companyId: company1.id,
        type: "CLOCK_IN",
        timestamp: clockIn,
        serverTime: clockIn,
      },
    });
  }

  // Company 2 entries
  for (let dayOffset = 0; dayOffset < Math.min(now.getDay(), 3); dayOffset++) {
    const date = new Date(monday);
    date.setDate(date.getDate() + dayOffset);

    for (let wIdx = 2; wIdx < 5; wIdx++) {
      const worker = createdWorkers[wIdx];
      const clockIn = new Date(date);
      clockIn.setHours(9, Math.floor(Math.random() * 15), 0, 0);
      const clockOut = new Date(clockIn);
      clockOut.setHours(clockIn.getHours() + 4 + Math.floor(Math.random() * 4));
      const duration = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);

      await db.timeEntry.create({
        data: {
          userId: worker.user.id,
          companyId: company2.id,
          clockInTime: clockIn,
          clockOutTime: clockOut,
          duration,
          status: "APPROVED",
          approvedBy: companyUser2.id,
          approvedAt: new Date(),
        },
      });
    }
  }

  console.log("Created time entries and clock events");

  // ─── Audit Logs ────────────────────────────────────────────────
  const auditEntries = [
    { actorId: companyUser1.id, companyId: company1.id, action: "SETTINGS_CHANGED" as const, entityType: "Settings", entityId: company1.id },
    { actorId: companyUser1.id, companyId: company1.id, action: "SHIFT_CREATED" as const, entityType: "Shift", entityId: createdShifts[0]?.id || "unknown" },
    { actorId: companyUser1.id, companyId: company1.id, action: "MEMBERSHIP_APPROVED" as const, entityType: "CompanyMembership", entityId: createdWorkers[0].user.id },
    { actorId: admin.id, companyId: null, action: "USER_CREATED" as const, entityType: "User", entityId: admin.id },
    { actorId: createdWorkers[0].user.id, companyId: company1.id, action: "CLOCK_IN" as const, entityType: "TimeEntry", entityId: "seed-entry" },
    { actorId: createdWorkers[0].user.id, companyId: company1.id, action: "CLOCK_OUT" as const, entityType: "TimeEntry", entityId: "seed-entry" },
    { actorId: companyUser1.id, companyId: company1.id, action: "TIME_ENTRY_APPROVED" as const, entityType: "TimeEntry", entityId: "seed-entry" },
    { actorId: companyUser2.id, companyId: company2.id, action: "SCHEDULE_CREATED" as const, entityType: "Schedule", entityId: "seed-schedule" },
  ];

  for (const entry of auditEntries) {
    await db.auditLog.create({ data: entry });
  }

  console.log("Created audit logs");

  // ─── Notifications ─────────────────────────────────────────────
  await db.notification.createMany({
    data: [
      {
        userId: createdWorkers[0].user.id,
        title: "Shift Reminder",
        message: "You have a morning shift tomorrow at 7:00 AM",
        type: "shift_reminder",
        link: "/worker/shifts",
      },
      {
        userId: companyUser1.id,
        title: "New Worker Request",
        message: "David Martinez has requested to join your company",
        type: "membership_update",
        link: "/company/workers",
      },
      {
        userId: companyUser1.id,
        title: "Time Entry Pending",
        message: "3 time entries are awaiting your approval",
        type: "approval_request",
        link: "/company/time-entries",
      },
    ],
  });

  console.log("Created notifications");
  console.log("\n✅ Seed complete!\n");
  console.log("Demo accounts (password: password123):");
  console.log("  Admin:   admin@shiftpulse.com");
  console.log("  Company: sarah@sunrisehealth.com (Sunrise Home Health)");
  console.log("  Company: michael@humanityhealth.com (Humanity & Blessing)");
  console.log("  Worker:  maria@example.com");
  console.log("  Worker:  james@example.com");
  console.log("  Worker:  aisha@example.com");
  console.log("  Worker:  robert@example.com");
  console.log("  Worker:  lisa@example.com");
  console.log("  Worker:  david@example.com");
  console.log("\nJoin codes:");
  console.log("  Sunrise Home Health: SUNR1234");
  console.log("  Humanity & Blessing: HUMA5678");
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
