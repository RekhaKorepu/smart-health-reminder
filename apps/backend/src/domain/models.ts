export type ReminderPath = "MEDICATION" | "HYDRATION" | "REFILL";

export type ReminderEventStatus =
  | "PENDING"
  | "SENT"
  | "ACKED"
  | "SNOOZED"
  | "SKIPPED"
  | "MISSED";

export type ReminderEventType = "MEDICATION_DUE" | "HYDRATION_DUE" | "REFILL_DUE";

export type ConfirmationAction = "CONFIRM" | "SNOOZE" | "SKIP";

export type TimeOfDaySlot = "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT" | "CUSTOM";

export type ScheduleType = "DAILY" | "WEEKLY";

export interface AuditFields {
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface Medication extends AuditFields {
  id: string;
  userId: string;
  name: string;
  dosageText: string;
  instructions?: string;
  startDate: string;
  endDate?: string;
  timezone: string;
  stockCount?: number;
  refillThreshold?: number;
  refillLeadTimeDays?: number;
  isActive: boolean;
}

export interface MedicationSchedule extends AuditFields {
  id: string;
  medicationId: string;
  userId: string;
  scheduleType: ScheduleType;
  timeSlot: TimeOfDaySlot;
  customTime24h?: string;
  weekdays?: number[];
  timezone: string;
  graceWindowMinutes: number;
  missWindowMinutes: number;
  isActive: boolean;
}

export interface HydrationPlan extends AuditFields {
  id: string;
  userId: string;
  dailyGoalMl: number;
  intervalMinutes: number;
  activeWindowStart24h: string;
  activeWindowEnd24h: string;
  timezone: string;
  isActive: boolean;
}

export interface ReminderEvent extends AuditFields {
  eventId: string;
  eventType: ReminderEventType;
  path: ReminderPath;
  status: ReminderEventStatus;
  userId: string;
  dueAtUtc: string;
  timezone: string;
  policyId: string;
  payload: {
    medicationId?: string;
    scheduleId?: string;
    hydrationPlanId?: string;
    remainingStock?: number;
  };
}

export interface ConfirmationEvent extends AuditFields {
  id: string;
  eventId: string;
  actorUserId: string;
  source: "LOCKSCREEN" | "APP_SCREEN" | "VOICE_IVR";
  action: ConfirmationAction;
  actedAtUtc: string;
}

export interface RefillEvent extends AuditFields {
  id: string;
  medicationId: string;
  userId: string;
  remainingStock: number;
  threshold: number;
  expectedRunOutDate: string;
  caregiverNotificationEnabled: boolean;
  status: "PENDING" | "NOTIFIED" | "RESOLVED";
}
