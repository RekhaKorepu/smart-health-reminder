import * as assert from "node:assert/strict";
import { test } from "node:test";

import { getCollectionSpec } from "../../src/persistence/collections";
import { buildBootstrapPlan, getAllIndexNames } from "../../src/persistence/bootstrap";
import {
  REMINDER_STATUS_TRANSITION_GUARDS,
  REPOSITORY_BOUNDARIES,
} from "../../src/persistence/repositories";

test("all critical Phase-1 collections are defined", () => {
  const criticalCollections = [
    "medications",
    "medication_schedules",
    "dose_events",
    "hydration_plans",
    "hydration_events",
    "reminder_events",
    "confirmation_events",
    "delivery_attempts",
  ] as const;

  for (const collectionName of criticalCollections) {
    assert.ok(getCollectionSpec(collectionName), `${collectionName} should be defined`);
  }
});

test("critical indexes exist for event lookups and idempotency", () => {
  const doseEvents = getCollectionSpec("dose_events");
  const hydrationEvents = getCollectionSpec("hydration_events");
  const reminderEvents = getCollectionSpec("reminder_events");
  const caregiverLinks = getCollectionSpec("caregiver_links");

  assert.ok(doseEvents?.indexes.some((index) => index.name === "dose_events_user_due_status_lookup"));
  assert.ok(
    hydrationEvents?.indexes.some(
      (index) => index.name === "hydration_events_user_due_status_lookup",
    ),
  );
  assert.ok(
    reminderEvents?.indexes.some(
      (index) => index.name === "reminder_events_event_id_unique" && index.unique === true,
    ),
  );
  assert.ok(
    caregiverLinks?.indexes.some(
      (index) => index.name === "caregiver_links_pair_unique" && index.unique === true,
    ),
  );
});

test("repository boundaries expose the expected contract surface", () => {
  const reminderRepository = REPOSITORY_BOUNDARIES.find(
    (repository) => repository.name === "ReminderEventRepository",
  );
  const methodNames = reminderRepository?.methods.map((method) => method.name) ?? [];

  assert.deepEqual(methodNames, [
    "createIfAbsent",
    "getByEventId",
    "listDueByPath",
    "updateStatus",
  ]);
});

test("bootstrap plan produces unique namespaced index names", () => {
  const bootstrapPlan = buildBootstrapPlan();
  const indexNames = getAllIndexNames();
  const uniqueNames = new Set(indexNames);

  assert.ok(bootstrapPlan.length > 0);
  assert.equal(indexNames.length, uniqueNames.size);
});

test("reminder lifecycle guards keep terminal states closed", () => {
  assert.deepEqual(REMINDER_STATUS_TRANSITION_GUARDS.ACKED, []);
  assert.deepEqual(REMINDER_STATUS_TRANSITION_GUARDS.SKIPPED, []);
  assert.deepEqual(REMINDER_STATUS_TRANSITION_GUARDS.MISSED, []);
  assert.deepEqual(REMINDER_STATUS_TRANSITION_GUARDS.PENDING, ["SENT", "MISSED"]);
});
