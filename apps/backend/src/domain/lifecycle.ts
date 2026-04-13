import type { ConfirmationAction, ReminderEvent, ReminderEventStatus } from "./models";

export const REMINDER_STATUS_TRANSITION_GUARDS: Record<
  ReminderEventStatus,
  ReminderEventStatus[]
> = {
  PENDING: ["SENT", "MISSED"],
  SENT: ["ACKED", "SNOOZED", "SKIPPED", "MISSED"],
  ACKED: [],
  SNOOZED: ["SENT", "MISSED"],
  SKIPPED: [],
  MISSED: [],
};

export interface ReminderTimingPolicy {
  graceWindowMinutes: number;
  missWindowMinutes: number;
}

export interface ReminderTransitionResult {
  ok: boolean;
  nextStatus?: ReminderEventStatus;
  reason?: string;
}

export function canTransitionReminderStatus(
  currentStatus: ReminderEventStatus,
  nextStatus: ReminderEventStatus,
): boolean {
  return REMINDER_STATUS_TRANSITION_GUARDS[currentStatus].includes(nextStatus);
}

export function transitionReminderStatus(
  currentStatus: ReminderEventStatus,
  nextStatus: ReminderEventStatus,
): ReminderTransitionResult {
  if (canTransitionReminderStatus(currentStatus, nextStatus)) {
    return { ok: true, nextStatus };
  }

  return {
    ok: false,
    reason: `Invalid reminder status transition from ${currentStatus} to ${nextStatus}.`,
  };
}

export function confirmationActionToReminderStatus(
  action: ConfirmationAction,
): ReminderEventStatus {
  switch (action) {
    case "CONFIRM":
      return "ACKED";
    case "SNOOZE":
      return "SNOOZED";
    case "SKIP":
      return "SKIPPED";
  }
}

export function computeGraceWindowEndsAtUtc(
  dueAtUtc: string,
  policy: ReminderTimingPolicy,
): string {
  const dueAt = new Date(dueAtUtc).getTime();
  return new Date(dueAt + policy.graceWindowMinutes * 60_000).toISOString();
}

export function computeMissWindowEndsAtUtc(
  dueAtUtc: string,
  policy: ReminderTimingPolicy,
): string {
  const dueAt = new Date(dueAtUtc).getTime();
  return new Date(dueAt + policy.missWindowMinutes * 60_000).toISOString();
}

export function isPastMissWindow(
  dueAtUtc: string,
  policy: ReminderTimingPolicy,
  nowUtc: string,
): boolean {
  return new Date(nowUtc).getTime() >= new Date(computeMissWindowEndsAtUtc(dueAtUtc, policy)).getTime();
}

export function shouldMarkReminderMissed(
  reminderEvent: ReminderEvent,
  policy: ReminderTimingPolicy,
  nowUtc: string,
): boolean {
  if (["ACKED", "SKIPPED", "MISSED"].includes(reminderEvent.status)) {
    return false;
  }

  return isPastMissWindow(reminderEvent.dueAtUtc, policy, nowUtc);
}
