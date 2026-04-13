import * as assert from "node:assert/strict";
import { test } from "node:test";

import {
  canTransitionReminderStatus,
  computeGraceWindowEndsAtUtc,
  computeMissWindowEndsAtUtc,
  confirmationActionToReminderStatus,
  isPastMissWindow,
  shouldMarkReminderMissed,
  transitionReminderStatus,
} from "../../src/domain";

const reminderEvent = {
  createdAtUtc: "2026-04-10T08:00:00.000Z",
  updatedAtUtc: "2026-04-10T08:00:00.000Z",
  eventId: "evt-1",
  eventType: "MEDICATION_DUE" as const,
  path: "MEDICATION" as const,
  status: "SENT" as const,
  userId: "user-1",
  dueAtUtc: "2026-04-10T08:00:00.000Z",
  timezone: "Asia/Kolkata",
  policyId: "policy-1",
  payload: {
    medicationId: "med-1",
    scheduleId: "sched-1",
  },
};

test("confirmation actions map to canonical reminder statuses", () => {
  assert.equal(confirmationActionToReminderStatus("CONFIRM"), "ACKED");
  assert.equal(confirmationActionToReminderStatus("SNOOZE"), "SNOOZED");
  assert.equal(confirmationActionToReminderStatus("SKIP"), "SKIPPED");
});

test("valid reminder status transitions are allowed", () => {
  assert.equal(canTransitionReminderStatus("PENDING", "SENT"), true);
  assert.equal(canTransitionReminderStatus("SENT", "ACKED"), true);
  assert.equal(canTransitionReminderStatus("SNOOZED", "SENT"), true);
});

test("invalid reminder status transitions are rejected", () => {
  assert.equal(canTransitionReminderStatus("ACKED", "SENT"), false);
  assert.equal(canTransitionReminderStatus("MISSED", "ACKED"), false);

  const result = transitionReminderStatus("SKIPPED", "SENT");
  assert.equal(result.ok, false);
  assert.match(result.reason ?? "", /Invalid reminder status transition/);
});

test("grace and miss windows are computed from due time", () => {
  const graceEndsAt = computeGraceWindowEndsAtUtc(reminderEvent.dueAtUtc, {
    graceWindowMinutes: 15,
    missWindowMinutes: 60,
  });
  const missEndsAt = computeMissWindowEndsAtUtc(reminderEvent.dueAtUtc, {
    graceWindowMinutes: 15,
    missWindowMinutes: 60,
  });

  assert.equal(graceEndsAt, "2026-04-10T08:15:00.000Z");
  assert.equal(missEndsAt, "2026-04-10T09:00:00.000Z");
});

test("miss-window checks only mark unfinished reminders as missed", () => {
  const policy = { graceWindowMinutes: 15, missWindowMinutes: 60 };

  assert.equal(
    isPastMissWindow(reminderEvent.dueAtUtc, policy, "2026-04-10T08:59:59.000Z"),
    false,
  );
  assert.equal(
    isPastMissWindow(reminderEvent.dueAtUtc, policy, "2026-04-10T09:00:00.000Z"),
    true,
  );
  assert.equal(
    shouldMarkReminderMissed(reminderEvent, policy, "2026-04-10T09:00:00.000Z"),
    true,
  );
  assert.equal(
    shouldMarkReminderMissed(
      {
        ...reminderEvent,
        status: "ACKED",
      },
      policy,
      "2026-04-10T09:00:00.000Z",
    ),
    false,
  );
});
