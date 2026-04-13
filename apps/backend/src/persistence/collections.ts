import type { CollectionSpec } from "./types";

export const COLLECTION_SPECS: CollectionSpec[] = [
  {
    name: "users",
    description: "Primary user and caregiver identities.",
    primaryUse: "Auth-bound profile and role access.",
    indexes: [{ name: "users_id_unique", key: { id: 1 }, unique: true }],
  },
  {
    name: "caregiver_links",
    description: "Links caregivers to dependent users.",
    primaryUse: "Authorization and escalation visibility.",
    indexes: [
      {
        name: "caregiver_links_pair_unique",
        key: { caregiver_user_id: 1, dependent_user_id: 1 },
        unique: true,
      },
    ],
  },
  {
    name: "medications",
    description: "Medication definitions and stock state.",
    primaryUse: "Medication catalog, active status, and refill tracking.",
    indexes: [
      { name: "medications_id_unique", key: { id: 1 }, unique: true },
      {
        name: "medications_user_active_refill_lookup",
        key: { user_id: 1, is_active: 1, next_refill_at_utc: 1 },
      },
    ],
  },
  {
    name: "medication_schedules",
    description: "Dose timing definitions per medication.",
    primaryUse: "Due-event schedule generation for medication reminders.",
    indexes: [
      { name: "medication_schedules_id_unique", key: { id: 1 }, unique: true },
      {
        name: "medication_schedules_user_active_lookup",
        key: { user_id: 1, is_active: 1, timezone: 1 },
      },
    ],
  },
  {
    name: "dose_events",
    description: "Materialized medication due events and outcomes.",
    primaryUse: "Dose event processing and history lookup.",
    indexes: [
      { name: "dose_events_event_id_unique", key: { event_id: 1 }, unique: true },
      {
        name: "dose_events_user_due_status_lookup",
        key: { user_id: 1, due_at_utc: 1, status: 1 },
      },
    ],
  },
  {
    name: "hydration_plans",
    description: "Hydration goals and interval windows.",
    primaryUse: "Hydration schedule generation.",
    indexes: [
      { name: "hydration_plans_id_unique", key: { id: 1 }, unique: true },
      {
        name: "hydration_plans_user_active_lookup",
        key: { user_id: 1, is_active: 1, timezone: 1 },
      },
    ],
  },
  {
    name: "hydration_events",
    description: "Materialized hydration reminders and outcomes.",
    primaryUse: "Hydration event processing and daily progress.",
    indexes: [
      { name: "hydration_events_event_id_unique", key: { event_id: 1 }, unique: true },
      {
        name: "hydration_events_user_due_status_lookup",
        key: { user_id: 1, due_at_utc: 1, status: 1 },
      },
    ],
  },
  {
    name: "refill_events",
    description: "Low-stock and run-out reminder events.",
    primaryUse: "Refill threshold and lead-time alerts.",
    indexes: [
      { name: "refill_events_id_unique", key: { id: 1 }, unique: true },
      {
        name: "refill_events_medication_status_lookup",
        key: { medication_id: 1, status: 1, expected_run_out_date: 1 },
      },
    ],
  },
  {
    name: "reminder_events",
    description: "Canonical reminder orchestration records.",
    primaryUse: "Provider dispatch and cross-channel tracking.",
    indexes: [
      { name: "reminder_events_event_id_unique", key: { event_id: 1 }, unique: true },
      {
        name: "reminder_events_path_due_status_lookup",
        key: { path: 1, due_at_utc: 1, status: 1 },
      },
    ],
  },
  {
    name: "confirmation_events",
    description: "User acknowledgements and snooze/skip actions.",
    primaryUse: "Adherence state transitions and auditability.",
    indexes: [
      { name: "confirmation_events_id_unique", key: { id: 1 }, unique: true },
      {
        name: "confirmation_events_event_actor_lookup",
        key: { event_id: 1, actor_user_id: 1, acted_at_utc: 1 },
      },
    ],
  },
  {
    name: "delivery_attempts",
    description: "Per-channel delivery attempts for reminder fan-out.",
    primaryUse: "Retry tracking and provider observability.",
    indexes: [
      {
        name: "delivery_attempts_event_attempt_unique",
        key: { reminder_event_id: 1, attempt_no: 1 },
        unique: true,
      },
    ],
  },
  {
    name: "escalation_policies",
    description: "Per-path fallback timing and channel order rules.",
    primaryUse: "Escalation resolution during reminder processing.",
    indexes: [{ name: "escalation_policies_id_unique", key: { id: 1 }, unique: true }],
  },
  {
    name: "audit_logs",
    description: "Append-only audit trail for sensitive access and critical changes.",
    primaryUse: "Compliance and incident review.",
    indexes: [
      {
        name: "audit_logs_entity_timestamp_lookup",
        key: { entity_type: 1, entity_id: 1, created_at_utc: -1 },
      },
    ],
  },
];

export function getCollectionSpec(name: CollectionSpec["name"]): CollectionSpec | undefined {
  return COLLECTION_SPECS.find((collection) => collection.name === name);
}
