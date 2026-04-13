import type {
  ConfirmationEvent,
  HydrationPlan,
  Medication,
  MedicationSchedule,
  RefillEvent,
  ReminderEvent,
  ReminderEventStatus,
  ReminderEventType,
  ScheduleType,
  TimeOfDaySlot,
} from "./models";

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  issues: ValidationIssue[];
}

const REMINDER_EVENT_TYPES: ReminderEventType[] = [
  "MEDICATION_DUE",
  "HYDRATION_DUE",
  "REFILL_DUE",
];
const REMINDER_STATUSES: ReminderEventStatus[] = [
  "PENDING",
  "SENT",
  "ACKED",
  "SNOOZED",
  "SKIPPED",
  "MISSED",
];
const SCHEDULE_TYPES: ScheduleType[] = ["DAILY", "WEEKLY"];
const TIME_OF_DAY_SLOTS: TimeOfDaySlot[] = [
  "MORNING",
  "AFTERNOON",
  "EVENING",
  "NIGHT",
  "CUSTOM",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isIsoDateString(value: unknown): value is string {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

function isTime24h(value: unknown): value is string {
  return isNonEmptyString(value) && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function isTimezone(value: unknown): value is string {
  // Allow common single-word zones like UTC, GMT, or standard IANA 'Region/City'
  return (
    isNonEmptyString(value) &&
    value.length >= 3 &&
    value.length <= 64
  );
}

function collectAuditIssues(value: Record<string, unknown>, issues: ValidationIssue[]) {
  if (!isIsoDateString(value.createdAtUtc)) {
    issues.push({ field: "createdAtUtc", message: "Must be a valid UTC ISO datetime string." });
  }

  if (!isIsoDateString(value.updatedAtUtc)) {
    issues.push({ field: "updatedAtUtc", message: "Must be a valid UTC ISO datetime string." });
  }
}

function finishValidation<T>(issues: ValidationIssue[], value?: T): ValidationResult<T> {
  return {
    ok: issues.length === 0,
    value: issues.length === 0 ? value : undefined,
    issues,
  };
}

export function validateMedication(value: unknown): ValidationResult<Medication> {
  const issues: ValidationIssue[] = [];

  if (!isRecord(value)) {
    return finishValidation(issues.concat({ field: "root", message: "Medication must be an object." }));
  }

  collectAuditIssues(value, issues);

  if (!isNonEmptyString(value.id)) issues.push({ field: "id", message: "Required." });
  if (!isNonEmptyString(value.userId)) issues.push({ field: "userId", message: "Required." });
  if (!isNonEmptyString(value.name)) issues.push({ field: "name", message: "Required." });
  if (!isNonEmptyString(value.dosageText)) issues.push({ field: "dosageText", message: "Required." });
  if (!isIsoDateString(value.startDate)) {
    issues.push({ field: "startDate", message: "Must be a valid ISO date string." });
  }
  if (value.endDate !== undefined && !isIsoDateString(value.endDate)) {
    issues.push({ field: "endDate", message: "Must be a valid ISO date string when provided." });
  }
  if (!isTimezone(value.timezone)) {
    issues.push({ field: "timezone", message: "Must be a valid IANA timezone-like string." });
  }
  if (value.stockCount !== undefined && !isNonNegativeInteger(value.stockCount)) {
    issues.push({ field: "stockCount", message: "Must be a non-negative integer." });
  }
  if (value.refillThreshold !== undefined && !isNonNegativeInteger(value.refillThreshold)) {
    issues.push({ field: "refillThreshold", message: "Must be a non-negative integer." });
  }
  if (value.refillLeadTimeDays !== undefined && !isNonNegativeInteger(value.refillLeadTimeDays)) {
    issues.push({ field: "refillLeadTimeDays", message: "Must be a non-negative integer." });
  }
  if (typeof value.isActive !== "boolean") {
    issues.push({ field: "isActive", message: "Must be a boolean." });
  }

  return finishValidation(issues, value as unknown as Medication);
}

export function validateMedicationSchedule(value: unknown): ValidationResult<MedicationSchedule> {
  const issues: ValidationIssue[] = [];

  if (!isRecord(value)) {
    return finishValidation(
      issues.concat({ field: "root", message: "MedicationSchedule must be an object." }),
    );
  }

  collectAuditIssues(value, issues);

  if (!isNonEmptyString(value.id)) issues.push({ field: "id", message: "Required." });
  if (!isNonEmptyString(value.medicationId)) issues.push({ field: "medicationId", message: "Required." });
  if (!isNonEmptyString(value.userId)) issues.push({ field: "userId", message: "Required." });
  if (!SCHEDULE_TYPES.includes(value.scheduleType as ScheduleType)) {
    issues.push({ field: "scheduleType", message: "Must be DAILY or WEEKLY." });
  }
  if (!TIME_OF_DAY_SLOTS.includes(value.timeSlot as TimeOfDaySlot)) {
    issues.push({ field: "timeSlot", message: "Must be a supported time slot." });
  }
  if (!isTimezone(value.timezone)) {
    issues.push({ field: "timezone", message: "Must be a valid IANA timezone-like string." });
  }
  if (!isPositiveInteger(value.graceWindowMinutes)) {
    issues.push({ field: "graceWindowMinutes", message: "Must be a positive integer." });
  }
  if (!isPositiveInteger(value.missWindowMinutes)) {
    issues.push({ field: "missWindowMinutes", message: "Must be a positive integer." });
  }
  if (typeof value.isActive !== "boolean") {
    issues.push({ field: "isActive", message: "Must be a boolean." });
  }

  if (value.timeSlot === "CUSTOM" && !isTime24h(value.customTime24h)) {
    issues.push({ field: "customTime24h", message: "Required when timeSlot is CUSTOM." });
  }

  if (value.scheduleType === "WEEKLY") {
    if (!Array.isArray(value.weekdays) || value.weekdays.length === 0) {
      issues.push({ field: "weekdays", message: "Required for WEEKLY schedules." });
    } else if (
      value.weekdays.some(
        (day) => !Number.isInteger(day) || (day as number) < 0 || (day as number) > 6,
      )
    ) {
      issues.push({ field: "weekdays", message: "Weekdays must contain values from 0 to 6." });
    }
  }

  return finishValidation(issues, value as unknown as MedicationSchedule);
}

export function validateHydrationPlan(value: unknown): ValidationResult<HydrationPlan> {
  const issues: ValidationIssue[] = [];

  if (!isRecord(value)) {
    return finishValidation(issues.concat({ field: "root", message: "HydrationPlan must be an object." }));
  }

  collectAuditIssues(value, issues);

  if (!isNonEmptyString(value.id)) issues.push({ field: "id", message: "Required." });
  if (!isNonEmptyString(value.userId)) issues.push({ field: "userId", message: "Required." });
  if (!isPositiveInteger(value.dailyGoalMl)) {
    issues.push({ field: "dailyGoalMl", message: "Must be a positive integer." });
  }
  if (!isPositiveInteger(value.intervalMinutes)) {
    issues.push({ field: "intervalMinutes", message: "Must be a positive integer." });
  }
  if (!isTime24h(value.activeWindowStart24h)) {
    issues.push({ field: "activeWindowStart24h", message: "Must be HH:MM format." });
  }
  if (!isTime24h(value.activeWindowEnd24h)) {
    issues.push({ field: "activeWindowEnd24h", message: "Must be HH:MM format." });
  }
  if (!isTimezone(value.timezone)) {
    issues.push({ field: "timezone", message: "Must be a valid IANA timezone-like string." });
  }
  if (typeof value.isActive !== "boolean") {
    issues.push({ field: "isActive", message: "Must be a boolean." });
  }

  return finishValidation(issues, value as unknown as HydrationPlan);
}

export function validateReminderEvent(value: unknown): ValidationResult<ReminderEvent> {
  const issues: ValidationIssue[] = [];

  if (!isRecord(value)) {
    return finishValidation(issues.concat({ field: "root", message: "ReminderEvent must be an object." }));
  }

  collectAuditIssues(value, issues);

  if (!isNonEmptyString(value.eventId)) issues.push({ field: "eventId", message: "Required." });
  if (!REMINDER_EVENT_TYPES.includes(value.eventType as ReminderEventType)) {
    issues.push({ field: "eventType", message: "Must be a supported reminder event type." });
  }
  if (!isNonEmptyString(value.path)) issues.push({ field: "path", message: "Required." });
  if (!REMINDER_STATUSES.includes(value.status as ReminderEventStatus)) {
    issues.push({ field: "status", message: "Must be a supported reminder status." });
  }
  if (!isNonEmptyString(value.userId)) issues.push({ field: "userId", message: "Required." });
  if (!isIsoDateString(value.dueAtUtc)) {
    issues.push({ field: "dueAtUtc", message: "Must be a valid UTC ISO datetime string." });
  }
  if (!isTimezone(value.timezone)) {
    issues.push({ field: "timezone", message: "Must be a valid IANA timezone-like string." });
  }
  if (!isNonEmptyString(value.policyId)) issues.push({ field: "policyId", message: "Required." });
  if (!isRecord(value.payload)) issues.push({ field: "payload", message: "Payload must be an object." });

  return finishValidation(issues, value as unknown as ReminderEvent);
}

export function validateConfirmationEvent(value: unknown): ValidationResult<ConfirmationEvent> {
  const issues: ValidationIssue[] = [];

  if (!isRecord(value)) {
    return finishValidation(
      issues.concat({ field: "root", message: "ConfirmationEvent must be an object." }),
    );
  }

  collectAuditIssues(value, issues);

  if (!isNonEmptyString(value.id)) issues.push({ field: "id", message: "Required." });
  if (!isNonEmptyString(value.eventId)) issues.push({ field: "eventId", message: "Required." });
  if (!isNonEmptyString(value.actorUserId)) issues.push({ field: "actorUserId", message: "Required." });
  if (!isNonEmptyString(value.source)) issues.push({ field: "source", message: "Required." });
  if (!isNonEmptyString(value.action)) issues.push({ field: "action", message: "Required." });
  if (!isIsoDateString(value.actedAtUtc)) {
    issues.push({ field: "actedAtUtc", message: "Must be a valid UTC ISO datetime string." });
  }

  return finishValidation(issues, value as unknown as ConfirmationEvent);
}

export function validateRefillEvent(value: unknown): ValidationResult<RefillEvent> {
  const issues: ValidationIssue[] = [];

  if (!isRecord(value)) {
    return finishValidation(issues.concat({ field: "root", message: "RefillEvent must be an object." }));
  }

  collectAuditIssues(value, issues);

  if (!isNonEmptyString(value.id)) issues.push({ field: "id", message: "Required." });
  if (!isNonEmptyString(value.medicationId)) issues.push({ field: "medicationId", message: "Required." });
  if (!isNonEmptyString(value.userId)) issues.push({ field: "userId", message: "Required." });
  if (!isNonNegativeInteger(value.remainingStock)) {
    issues.push({ field: "remainingStock", message: "Must be a non-negative integer." });
  }
  if (!isNonNegativeInteger(value.threshold)) {
    issues.push({ field: "threshold", message: "Must be a non-negative integer." });
  }
  if (!isIsoDateString(value.expectedRunOutDate)) {
    issues.push({ field: "expectedRunOutDate", message: "Must be a valid ISO date string." });
  }
  if (typeof value.caregiverNotificationEnabled !== "boolean") {
    issues.push({ field: "caregiverNotificationEnabled", message: "Must be a boolean." });
  }
  if (!["PENDING", "NOTIFIED", "RESOLVED"].includes(String(value.status))) {
    issues.push({ field: "status", message: "Must be PENDING, NOTIFIED, or RESOLVED." });
  }

  return finishValidation(issues, value as unknown as RefillEvent);
}
