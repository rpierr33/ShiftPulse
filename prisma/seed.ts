import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data (order matters for FK constraints)
  await db.booking.deleteMany();
  await db.review.deleteMany();
  await db.message.deleteMany();
  await db.conversationParticipant.deleteMany();
  await db.conversation.deleteMany();
  await db.cMS1500Form.deleteMany();
  await db.serviceLog.deleteMany();
  await db.credential.deleteMany();
  await db.subscription.deleteMany();
  await db.location.deleteMany();
  await db.payrollExport.deleteMany();
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.clockEvent.deleteMany();
  await db.timeEntry.deleteMany();
  await db.assignment.deleteMany();
  await db.posting.deleteMany();
  await db.shift.deleteMany();
  await db.schedule.deleteMany();
  await db.shiftTemplate.deleteMany();
  await db.availabilitySlot.deleteMany();
  await db.settings.deleteMany();
  await db.companyMembership.deleteMany();
  await db.companyProfile.deleteMany();
  await db.workerProfile.deleteMany();
  await db.clientProfile.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.company.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 12);

  // ─── Admin ─────────────────────────────────────────────────────
  const admin = await db.user.create({
    data: {
      name: "Admin User",
      email: "admin@carecircle.com",
      passwordHash,
      role: "ADMIN",
      onboardingCompleted: true,
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
      onboardingCompleted: true,
    },
  });

  const company1 = await db.company.create({
    data: {
      name: "Sunrise Home Health",
      slug: "sunrise-home-health",
      joinCode: "SUNR1234",
      providerType: "HOME_HEALTH_AGENCY",
      description: "Providing compassionate home health services across Tampa Bay since 2015. We specialize in skilled nursing, personal care, and companion services for seniors and individuals recovering from surgery.",
      servicesOffered: ["Skilled Nursing", "Personal Care", "Companion Care", "Wound Care", "Medication Management", "IV Therapy"],
      serviceAreas: ["Tampa", "St. Petersburg", "Clearwater", "Brandon"],
      isMarketplaceVisible: true,
      timezone: "America/New_York",
      address: "2121 W Oak Ave",
      city: "Tampa",
      state: "FL",
      zipCode: "33607",
      phone: "813-555-0100",
      latitude: 27.9506,
      longitude: -82.4572,
      allowManualEntry: true,
      enableGeofencing: true,
    },
  });

  await db.companyProfile.create({
    data: {
      userId: companyUser1.id,
      companyName: "Sunrise Home Health",
      description: "Providing compassionate home health services across Tampa Bay since 2015.",
      providerType: "HOME_HEALTH_AGENCY",
      address: "2121 W Oak Ave",
      city: "Tampa",
      state: "FL",
      zipCode: "33607",
      phone: "813-555-0100",
      website: "https://sunrisehomehealth.example.com",
      npiNumber: "1234567890",
    },
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
      enableEvv: true,
    },
  });

  await db.subscription.create({
    data: {
      companyId: company1.id,
      tier: "PROFESSIONAL",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await db.location.create({
    data: {
      companyId: company1.id,
      name: "Main Office",
      address: "2121 W Oak Ave",
      city: "Tampa",
      state: "FL",
      zipCode: "33607",
      latitude: 27.9506,
      longitude: -82.4572,
      isDefault: true,
    },
  });

  const companyUser2 = await db.user.create({
    data: {
      name: "Michael Chen",
      email: "michael@humanityhealth.com",
      passwordHash,
      role: "COMPANY",
      onboardingCompleted: true,
    },
  });

  const company2 = await db.company.create({
    data: {
      name: "Humanity & Blessing Home Health Corp",
      slug: "humanity-blessing",
      joinCode: "HUMA5678",
      providerType: "PRIVATE_DUTY_NURSING",
      description: "A faith-based private duty nursing agency serving Central Florida. We provide 24/7 skilled nursing and home health aide services with a focus on dignity and respect.",
      servicesOffered: ["Private Duty Nursing", "Home Health Aide", "Respite Care", "Companion Care", "Hospice Support"],
      serviceAreas: ["Orlando", "Kissimmee", "Winter Park", "Sanford"],
      isMarketplaceVisible: true,
      timezone: "America/New_York",
      address: "500 Main St",
      city: "Orlando",
      state: "FL",
      zipCode: "32801",
      phone: "407-555-0200",
      latitude: 28.5383,
      longitude: -81.3792,
      autoApproveWorkers: true,
      requireShiftSelection: true,
    },
  });

  await db.companyProfile.create({
    data: {
      userId: companyUser2.id,
      companyName: "Humanity & Blessing Home Health Corp",
      description: "A faith-based private duty nursing agency serving Central Florida.",
      providerType: "PRIVATE_DUTY_NURSING",
      address: "500 Main St",
      city: "Orlando",
      state: "FL",
      zipCode: "32801",
      phone: "407-555-0200",
      npiNumber: "0987654321",
    },
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

  await db.subscription.create({
    data: {
      companyId: company2.id,
      tier: "BASIC",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("Created companies:", company1.name, company2.name);

  // ─── Private Clients ──────────────────────────────────────────
  const clientUser1 = await db.user.create({
    data: {
      name: "Patricia Williams",
      email: "patricia@example.com",
      passwordHash,
      role: "CLIENT",
      phone: "813-555-0300",
      onboardingCompleted: true,
    },
  });

  await db.clientProfile.create({
    data: {
      userId: clientUser1.id,
      relationship: "parent",
      careRecipientName: "Dorothy Williams",
      careNeeds: "My mother needs companion care 3 days a week. She has mild dementia and needs help with daily activities, meal preparation, and medication reminders.",
      address: "456 Maple Dr",
      city: "Tampa",
      state: "FL",
      zipCode: "33629",
      preferredSchedule: "mornings",
    },
  });

  const clientUser2 = await db.user.create({
    data: {
      name: "Marcus Johnson",
      email: "marcus@example.com",
      passwordHash,
      role: "CLIENT",
      phone: "407-555-0400",
      onboardingCompleted: true,
    },
  });

  await db.clientProfile.create({
    data: {
      userId: clientUser2.id,
      relationship: "self",
      careNeeds: "Recovering from hip replacement surgery. Need skilled nursing visits 2x/week for wound care and physical therapy assistance.",
      address: "789 Lake Ave",
      city: "Orlando",
      state: "FL",
      zipCode: "32806",
      preferredSchedule: "afternoons",
    },
  });

  console.log("Created clients:", clientUser1.name, clientUser2.name);

  // ─── Workers ───────────────────────────────────────────────────
  // Service offerings and rates by worker type
  const servicesByType: Record<string, { servicesOffered: string[]; preferredRates: Record<string, number> }> = {
    CNA: {
      servicesOffered: ["companion_care", "personal_care", "respite_care", "medication_management", "babysitting", "childcare"],
      preferredRates: { companion_care: 20, personal_care: 22, respite_care: 22, medication_management: 24, babysitting: 18, childcare: 18 },
    },
    RN: {
      servicesOffered: ["skilled_nursing", "wound_care", "iv_therapy", "medication_management", "assessment"],
      preferredRates: { skilled_nursing: 40, wound_care: 42, iv_therapy: 45, medication_management: 38, assessment: 45 },
    },
    LPN: {
      servicesOffered: ["skilled_nursing", "medication_management", "wound_care", "personal_care"],
      preferredRates: { skilled_nursing: 30, medication_management: 28, wound_care: 32, personal_care: 28 },
    },
    PHYSICAL_THERAPIST: {
      servicesOffered: ["physical_therapy", "assessment", "post_surgical_care"],
      preferredRates: { physical_therapy: 55, assessment: 60, post_surgical_care: 55 },
    },
    HHA: {
      servicesOffered: ["personal_care", "companion_care", "respite_care", "babysitting", "childcare"],
      preferredRates: { personal_care: 18, companion_care: 18, respite_care: 20, babysitting: 16, childcare: 16 },
    },
  };

  const workerData = [
    { name: "Maria Garcia", email: "maria@example.com", workerType: "CNA" as const, specialties: ["Home Health Aide", "Geriatrics", "Fall Prevention"], bio: "Dedicated CNA with 6 years of experience in home health and assisted living. Passionate about providing compassionate care to seniors.", yearsExperience: 6, city: "Tampa", state: "FL", zipCode: "33612", hourlyRate: 22 },
    { name: "James Wilson", email: "james@example.com", workerType: "RN" as const, specialties: ["Wound Care", "IV Therapy", "Post-Surgical Care"], bio: "Registered Nurse specializing in wound care and post-surgical recovery. 10+ years in home health and hospital settings.", yearsExperience: 12, city: "Tampa", state: "FL", zipCode: "33609", hourlyRate: 38 },
    { name: "Aisha Patel", email: "aisha@example.com", workerType: "LPN" as const, specialties: ["Pediatrics", "Medication Management", "Diabetes Care"], bio: "Licensed Practical Nurse with a focus on pediatric home health. Bilingual English/Hindi.", yearsExperience: 4, city: "St. Petersburg", state: "FL", zipCode: "33701", hourlyRate: 28 },
    { name: "Robert Davis", email: "robert@example.com", workerType: "CNA" as const, specialties: ["Geriatrics", "Dementia Care", "Hospice Care"], bio: "Experienced CNA with specialized training in memory care and hospice support.", yearsExperience: 8, city: "Clearwater", state: "FL", zipCode: "33755", hourlyRate: 24 },
    { name: "Lisa Thompson", email: "lisa@example.com", workerType: "RN" as const, specialties: ["IV Therapy", "Mental Health", "Ventilator Care"], bio: "Critical care RN transitioning to home health. Strong skills in IV therapy and ventilator management.", yearsExperience: 7, city: "Orlando", state: "FL", zipCode: "32803", hourlyRate: 42 },
    { name: "David Martinez", email: "david@example.com", workerType: "LPN" as const, specialties: ["Diabetes Care", "Medication Management", "Wound Care"], bio: "Bilingual LPN (English/Spanish) serving the Orlando metro area. Experienced in chronic disease management.", yearsExperience: 5, city: "Kissimmee", state: "FL", zipCode: "34741", hourlyRate: 30 },
    { name: "Jennifer Brooks", email: "jennifer@example.com", workerType: "HHA" as const, specialties: ["Personal Care", "Companion Care", "Fall Prevention"], bio: "Caring Home Health Aide dedicated to helping seniors maintain independence at home.", yearsExperience: 3, city: "Brandon", state: "FL", zipCode: "33511", hourlyRate: 18 },
    { name: "Carlos Rivera", email: "carlos@example.com", workerType: "PHYSICAL_THERAPIST" as const, specialties: ["Post-Surgical Care", "Fall Prevention", "Geriatrics"], bio: "Licensed Physical Therapist providing in-home rehabilitation services. Specializing in orthopedic recovery.", yearsExperience: 9, city: "Tampa", state: "FL", zipCode: "33606", hourlyRate: 55 },
  ];

  const createdWorkers = [];
  for (const w of workerData) {
    const user = await db.user.create({
      data: {
        name: w.name,
        email: w.email,
        passwordHash,
        role: "WORKER",
        phone: `555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        onboardingCompleted: true,
      },
    });

    const typeServices = servicesByType[w.workerType] || { servicesOffered: [], preferredRates: {} };

    const profile = await db.workerProfile.create({
      data: {
        userId: user.id,
        workerType: w.workerType,
        specialties: w.specialties,
        bio: w.bio,
        yearsExperience: w.yearsExperience,
        city: w.city,
        state: w.state,
        zipCode: w.zipCode,
        licenseNumber: `FL-${String(Math.floor(Math.random() * 90000) + 10000)}`,
        licenseState: "FL",
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        hourlyRate: w.hourlyRate,
        isAvailable: true,
        isMarketplaceVisible: true,
        isValidated: true,
        acceptsPrivateClients: true,
        servicesOffered: typeServices.servicesOffered,
        preferredRates: typeServices.preferredRates,
        profileCompleteness: 85 + Math.floor(Math.random() * 15),
        serviceRadiusMiles: 25 + Math.floor(Math.random() * 25),
      },
    });

    // Add credentials for each worker
    const credentialTypes = [
      { type: "CPR_BLS", name: "CPR / BLS Certification", daysValid: 730 },
      { type: "TB_TEST", name: "TB Test", daysValid: 365 },
      { type: "BACKGROUND_CHECK", name: "Level 2 Background Check", daysValid: 1825 },
    ];

    // Add role-specific credential
    if (w.workerType === "RN") {
      credentialTypes.push({ type: "RN_LICENSE", name: "RN License - Florida", daysValid: 730 });
    } else if (w.workerType === "LPN") {
      credentialTypes.push({ type: "LPN_LICENSE", name: "LPN License - Florida", daysValid: 730 });
    } else if (w.workerType === "CNA") {
      credentialTypes.push({ type: "CNA_CERTIFICATION", name: "CNA Certification - Florida", daysValid: 730 });
    } else if (w.workerType === "HHA") {
      credentialTypes.push({ type: "HHA_CERTIFICATION", name: "HHA Certification", daysValid: 730 });
    }

    for (const cred of credentialTypes) {
      await db.credential.create({
        data: {
          workerProfileId: profile.id,
          type: cred.type,
          name: cred.name,
          licenseNumber: `${cred.type}-${Math.floor(Math.random() * 900000) + 100000}`,
          issuingAuthority: "Florida Department of Health",
          issueDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          expiryDate: new Date(Date.now() + cred.daysValid * 24 * 60 * 60 * 1000),
          status: "VERIFIED",
          verifiedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    createdWorkers.push({ user, profile });
  }

  // Connect workers to companies
  for (let i = 0; i < createdWorkers.length; i++) {
    const w = createdWorkers[i];
    if (i < 5) {
      await db.companyMembership.create({
        data: {
          userId: w.user.id,
          companyId: company1.id,
          status: "APPROVED",
          joinedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        },
      });
    }
    if (i >= 3) {
      await db.companyMembership.create({
        data: {
          userId: w.user.id,
          companyId: company2.id,
          status: i === 7 ? "PENDING" : "APPROVED",
          joinedAt: i === 7 ? null : new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log("Created", createdWorkers.length, "workers with credentials");

  // ─── Private Client Bookings ──────────────────────────────────
  // Patricia books Maria (CNA) for companion care
  await db.booking.create({
    data: {
      clientId: clientUser1.id,
      workerProfileId: createdWorkers[0].profile.id, // Maria - CNA
      status: "accepted",
      serviceType: "companion_care",
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      startTime: "09:00",
      endTime: "13:00",
      isRecurring: true,
      recurringDays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
      hourlyRate: 20,
      notes: "Mom enjoys puzzles and light gardening. Please arrive 5 minutes early.",
    },
  });

  // Marcus books Lisa (RN) for wound care
  await db.booking.create({
    data: {
      clientId: clientUser2.id,
      workerProfileId: createdWorkers[4].profile.id, // Lisa - RN
      status: "pending",
      serviceType: "wound_care",
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      startTime: "14:00",
      endTime: "15:30",
      isRecurring: true,
      recurringDays: ["TUESDAY", "THURSDAY"],
      hourlyRate: 42,
      notes: "Post hip replacement. Incision site needs checking and dressing change.",
    },
  });

  console.log("Created bookings for private clients");

  // ─── Reviews ───────────────────────────────────────────────────
  // Workers review companies
  for (let i = 0; i < 4; i++) {
    await db.review.create({
      data: {
        reviewerId: createdWorkers[i].user.id,
        targetCompanyId: company1.id,
        rating: 4 + Math.floor(Math.random() * 2),
        title: ["Great place to work", "Professional team", "Reliable shifts", "Good communication"][i],
        content: ["Always pays on time and communicates clearly.", "Supportive management team.", "Consistent schedule and fair pay.", "Responsive to concerns."][i],
        isVerified: true,
      },
    });
  }
  // Companies review workers
  for (let i = 0; i < 4; i++) {
    await db.review.create({
      data: {
        reviewerId: companyUser1.id,
        targetUserId: createdWorkers[i].user.id,
        rating: 4 + Math.floor(Math.random() * 2),
        title: ["Excellent worker", "Very reliable", "Great with patients", "Skilled professional"][i],
        content: ["Consistently arrives on time and provides great care.", "Very dependable and professional.", "Patients love working with them.", "Highly skilled and knowledgeable."][i],
        isVerified: true,
      },
    });
  }

  console.log("Created reviews");

  // ─── Shifts for current week ───────────────────────────────────
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(monday.getDate() - monday.getDay() + 1);
  monday.setHours(0, 0, 0, 0);

  const shiftTemplates = [
    { title: "Morning Visit", hour: 7, duration: 4, location: "123 Oak St, Tampa FL" },
    { title: "Afternoon Visit", hour: 13, duration: 3, location: "456 Pine Ave, Tampa FL" },
    { title: "Evening Check-in", hour: 17, duration: 2, location: "789 Elm Rd, Tampa FL" },
    { title: "Morning Shift - Facility", hour: 6, duration: 8, location: "Sunrise Care Center" },
    { title: "Night Shift - Facility", hour: 22, duration: 8, location: "Sunrise Care Center" },
  ];

  const createdShifts = [];
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(monday);
    date.setDate(date.getDate() + dayOffset);

    const numShifts = dayOffset < 5 ? 3 : 1;
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
          hourlyRate: 25 + Math.floor(Math.random() * 20),
          status: dayOffset < now.getDay() - 1 ? "COMPLETED" : dayOffset === now.getDay() - 1 ? "IN_PROGRESS" : "OPEN",
        },
      });
      createdShifts.push(shift);
    }
  }

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
          hourlyRate: 22 + Math.floor(Math.random() * 15),
          status: dayOffset < now.getDay() - 1 ? "COMPLETED" : "OPEN",
        },
      });
    }
  }

  console.log("Created shifts");

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
    const workerIdx = i % 5;
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

      await db.timeEntry.create({
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

      await db.clockEvent.create({
        data: { userId: worker.user.id, companyId: company1.id, type: "CLOCK_IN", timestamp: clockIn, serverTime: clockIn },
      });
      await db.clockEvent.create({
        data: { userId: worker.user.id, companyId: company1.id, type: "CLOCK_OUT", timestamp: clockOut, serverTime: clockOut },
      });
    }
  }

  // Company 2 entries
  for (let dayOffset = 0; dayOffset < Math.min(now.getDay(), 3); dayOffset++) {
    const date = new Date(monday);
    date.setDate(date.getDate() + dayOffset);

    for (let wIdx = 3; wIdx < 6; wIdx++) {
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

  console.log("Created time entries");

  // ─── Audit Logs ────────────────────────────────────────────────
  const auditEntries = [
    { actorId: companyUser1.id, companyId: company1.id, action: "SETTINGS_CHANGED" as const, entityType: "Settings", entityId: company1.id },
    { actorId: companyUser1.id, companyId: company1.id, action: "SHIFT_CREATED" as const, entityType: "Shift", entityId: createdShifts[0]?.id || "unknown" },
    { actorId: companyUser1.id, companyId: company1.id, action: "MEMBERSHIP_APPROVED" as const, entityType: "CompanyMembership", entityId: createdWorkers[0].user.id },
    { actorId: admin.id, companyId: null, action: "USER_CREATED" as const, entityType: "User", entityId: admin.id },
  ];

  for (const entry of auditEntries) {
    await db.auditLog.create({ data: entry });
  }

  // ─── Notifications ─────────────────────────────────────────────
  await db.notification.createMany({
    data: [
      { userId: createdWorkers[0].user.id, title: "Shift Reminder", message: "You have a morning shift tomorrow at 7:00 AM", type: "shift_reminder", link: "/worker/shifts" },
      { userId: companyUser1.id, title: "New Worker Request", message: "Carlos Rivera has requested to join your company", type: "membership_update", link: "/company/workers" },
      { userId: companyUser1.id, title: "Time Entry Pending", message: "3 time entries are awaiting your approval", type: "approval_request", link: "/company/time-entries" },
    ],
  });

  console.log("\n✅ Seed complete!\n");
  console.log("Demo accounts (password: password123):");
  console.log("  Admin:   admin@carecircle.com");
  console.log("  Company: sarah@sunrisehealth.com (Sunrise Home Health - Professional)");
  console.log("  Company: michael@humanityhealth.com (Humanity & Blessing - Basic)");
  console.log("  Client:  patricia@example.com (Private - Companion care for parent)");
  console.log("  Client:  marcus@example.com (Private - Post-surgery nursing)");
  console.log("  Workers: maria@example.com (CNA), james@example.com (RN)");
  console.log("           aisha@example.com (LPN), robert@example.com (CNA)");
  console.log("           lisa@example.com (RN), david@example.com (LPN)");
  console.log("           jennifer@example.com (HHA), carlos@example.com (PT)");
  console.log("\nJoin codes: SUNR1234, HUMA5678");
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
