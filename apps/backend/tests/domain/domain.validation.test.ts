import * as assert from "node:assert/strict";
import { test } from "node:test";

import {
  validateConfirmationEvent,
  validateHydrationPlan,
  validateMedication,
  validateMedicationSchedule,
  validateRefillEvent,
  validateReminderEvent,
} from "../../src/domain";

const auditFields = {
  createdAtUtc: "2026-04-09T08:00:00.000Z",
  updatedAtUtc: "2026-04-09T08:00:00.000Z",
};

test("validateMedication accepts a valid medication payload", () => {
  const result = validateMedication({
    ...auditFields,
    id: "med-1",
    userId: "user-1",
    name: "Metformin",
    dosageText: "500mg",
    instructions: "Take after breakfast",
    startDate: "2026-04-09",
    timezone: "Asia/Kolkata",
    stockCount: 30,
    refillThreshold: 5,
    refillLeadTimeDays: 3,
    isActive: true,
  });

  assert.equal(result.ok, true);
  assert.equal(result.issues.length, 0);
});

test("validateMedication rejects invalid medication payload", () => {
  const result = validateMedication({
    ...auditFields,
    id: "",
    userId: "user-1",
    name: "",
    dosageText: "",
    startDate: "not-a-date",
    timezone: "IST",
    stockCount: -1,
    isActive: "yes",
  });

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.field === "name"));
  assert.ok(result.issues.some((issue) => issue.field === "startDate"));
  assert.ok(result.issues.some((issue) => issue.field === "timezone"));
});

test("validateMedicationSchedule enforces weekly schedule and custom time rules", () => {
  const invalidWeekly = validateMedicationSchedule({
    ...auditFields,
    id: "schedule-1",
    medicationId: "med-1",
    userId: "user-1",
    scheduleType: "WEEKLY",
    timeSlot: "CUSTOM",
    timezone: "Asia/Kolkata",
    graceWindowMinutes: 15,
    missWindowMinutes: 60,
    isActive: true,
  });

  assert.equal(invalidWeekly.ok, false);
  assert.ok(invalidWeekly.issues.some((issue) => issue.field === "customTime24h"));
  assert.ok(invalidWeekly.issues.some((issue) => issue.field === "weekdays"));
});

test("validateHydrationPlan accepts a valid hydration plan", () => {
  const result = validateHydrationPlan({
    ...auditFields,
    id: "hydration-1",
    userId: "user-1",
    dailyGoalMl: 2500,
    intervalMinutes: 120,
    activeWindowStart24h: "08:00",
    activeWindowEnd24h: "21:00",
    timezone: "Asia/Kolkata",
    isActive: true,
  });

  assert.equal(result.ok, true);
});

test("validateReminderEvent requires canonical event fields", () => {
  const result = validateReminderEvent({
    ...auditFields,
    eventId: "event-1",
    eventType: "MEDICATION_DUE",
    path: "MEDICATION",
    status: "PENDING",
    userId: "user-1",
    dueAtUtc: "2026-04-09T08:15:00.000Z",
    timezone: "Asia/Kolkata",
    policyId: "policy-1",
    payload: {
      medicationId: "med-1",
      scheduleId: "schedule-1",
    },
  });

  assert.equal(result.ok, true);
});

test("validateConfirmationEvent and validateRefillEvent reject malformed payloads", () => {
  const confirmation = validateConfirmationEvent({
    ...auditFields,
    id: "confirm-1",
    eventId: "",
    actorUserId: "user-1",
    source: "APP_SCREEN",
    action: "CONFIRM",
    actedAtUtc: "bad-date",
  });

  const refill = validateRefillEvent({
    ...auditFields,
    id: "refill-1",
    medicationId: "med-1",
    userId: "user-1",
    remainingStock: -3,
    threshold: 5,
    expectedRunOutDate: "2026-04-20",
    caregiverNotificationEnabled: true,
    status: "DONE",
  });

  assert.equal(confirmation.ok, false);
  assert.ok(confirmation.issues.some((issue) => issue.field === "eventId"));
  assert.ok(confirmation.issues.some((issue) => issue.field === "actedAtUtc"));

  assert.equal(refill.ok, false);
  assert.ok(refill.issues.some((issue) => issue.field === "remainingStock"));
  assert.ok(refill.issues.some((issue) => issue.field === "status"));
});
