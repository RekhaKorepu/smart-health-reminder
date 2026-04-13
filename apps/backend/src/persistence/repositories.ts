import { REMINDER_STATUS_TRANSITION_GUARDS } from "../domain";
import type { RepositoryBoundarySpec } from "./types";

export const REPOSITORY_BOUNDARIES: RepositoryBoundarySpec[] = [
  {
    name: "MedicationRepository",
    entity: "Medication",
    methods: [
      { name: "create", purpose: "Create a medication record." },
      { name: "getById", purpose: "Get one medication by identifier." },
      { name: "listActiveByUser", purpose: "Fetch active medications for a user." },
      { name: "updateStock", purpose: "Update current stock state and refill metadata." },
      { name: "softDelete", purpose: "Mark a medication inactive without deleting history." },
    ],
  },
  {
    name: "MedicationScheduleRepository",
    entity: "MedicationSchedule",
    methods: [
      { name: "create", purpose: "Create a medication schedule." },
      { name: "getById", purpose: "Get one schedule by identifier." },
      { name: "listActiveByUser", purpose: "Fetch active medication schedules for a user." },
      { name: "update", purpose: "Update schedule timing or lifecycle state." },
    ],
  },
  {
    name: "HydrationPlanRepository",
    entity: "HydrationPlan",
    methods: [
      { name: "create", purpose: "Create a hydration plan." },
      { name: "getById", purpose: "Get one hydration plan by identifier." },
      { name: "listActiveByUser", purpose: "Fetch active hydration plans for a user." },
      { name: "update", purpose: "Update hydration goals or active window." },
    ],
  },
  {
    name: "ReminderEventRepository",
    entity: "ReminderEvent",
    methods: [
      { name: "createIfAbsent", purpose: "Persist a reminder event idempotently." },
      { name: "getByEventId", purpose: "Fetch a reminder event by canonical event ID." },
      { name: "listDueByPath", purpose: "Fetch due events by path and time window." },
      { name: "updateStatus", purpose: "Apply a valid reminder status transition." },
    ],
  },
  {
    name: "ConfirmationEventRepository",
    entity: "ConfirmationEvent",
    methods: [
      { name: "createIfAbsent", purpose: "Persist a confirmation idempotently." },
      { name: "listByEventId", purpose: "Fetch confirmations for a reminder event." },
    ],
  },
];

export { REMINDER_STATUS_TRANSITION_GUARDS };
