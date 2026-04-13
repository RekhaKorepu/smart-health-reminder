/**
 * Phase-1 Real-Time Database Integration Test
 *
 * Connects to the MongoDB Atlas cluster, bootstraps all 13 collections & indexes,
 * inserts real documents, and validates schema + uniqueness constraints.
 *
 * Run with:
 *   node --env-file=.env .tmp/integration-tests/tests/integration/db.integration.test.js
 */

import * as assert from "node:assert/strict";
import type { Db } from "mongodb";
import { MongoClient } from "mongodb";
import { applyBootstrap } from "../../src/db/applyBootstrap";

const TEST_DB = "smart_health_phase1_test";
const uri = process.env.MONGO_URI;

// Unique suffix per run — prevents collisions with data from previous runs
const RUN_ID = Date.now().toString(36);

// IDs scoped to this run
const MED_ID = `med-${RUN_ID}`;
const SCHED_ID = `sched-${RUN_ID}`;
const HYD_PLAN_ID = `hyd-${RUN_ID}`;
const EVT_ID = `evt-${RUN_ID}`;
const CONF_ID = `conf-${RUN_ID}`;
const REFILL_ID = `refill-${RUN_ID}`;
const CAREGIVER_ID = `cg-${RUN_ID}`;
const DEPENDENT_ID = `dep-${RUN_ID}`;

const COLLECTIONS_TO_CLEANUP = [
  "medications",
  "medication_schedules",
  "hydration_plans",
  "reminder_events",
  "confirmation_events",
  "refill_events",
  "caregiver_links",
  "delivery_attempts",
] as const;

if (!uri) {
  console.error("❌  MONGO_URI is not set. Check your .env file.");
  process.exit(1);
}

// ─────────────────────────────────────────────
// Minimal test runner
// ─────────────────────────────────────────────

type TestFn = (db: Db) => Promise<void>;
const tests: Array<{ name: string; fn: TestFn }> = [];

function it(name: string, fn: TestFn) {
  tests.push({ name, fn });
}

function now() {
  return new Date().toISOString();
}

// ─────────────────────────────────────────────
// 1. Bootstrap & Collection Verification
// ─────────────────────────────────────────────

it("all 13 Phase-1 collections exist after bootstrap", async (db) => {
  const collections = await db.listCollections().toArray();
  const names = collections.map((c) => c.name);

  const expected = [
    "users",
    "caregiver_links",
    "medications",
    "medication_schedules",
    "dose_events",
    "hydration_plans",
    "hydration_events",
    "refill_events",
    "reminder_events",
    "confirmation_events",
    "delivery_attempts",
    "escalation_policies",
    "audit_logs",
  ];

  for (const name of expected) {
    assert.ok(names.includes(name), `Missing collection: ${name}`);
  }
});

// ─────────────────────────────────────────────
// 2. Index Verification
// ─────────────────────────────────────────────

it("reminder_events has a unique index on event_id", async (db) => {
  const indexes = await db.collection("reminder_events").indexes();
  const uniqueIdx = indexes.find((i) => i.name === "reminder_events_event_id_unique");
  assert.ok(uniqueIdx, "reminder_events_event_id_unique index not found");
  assert.equal(uniqueIdx.unique, true, "Index should be unique");
});

it("caregiver_links has composite unique index on pair", async (db) => {
  const indexes = await db.collection("caregiver_links").indexes();
  const idx = indexes.find((i) => i.name === "caregiver_links_pair_unique");
  assert.ok(idx, "caregiver_links_pair_unique index not found");
  assert.equal(idx.unique, true);
});

it("delivery_attempts has composite unique index on (reminder_event_id, attempt_no)", async (db) => {
  const indexes = await db.collection("delivery_attempts").indexes();
  const idx = indexes.find((i) => i.name === "delivery_attempts_event_attempt_unique");
  assert.ok(idx, "delivery_attempts_event_attempt_unique index not found");
  assert.equal(idx.unique, true);
});

// ─────────────────────────────────────────────
// 3. Schema Insert & Read Tests
// ─────────────────────────────────────────────

it("can insert and read a valid Medication document", async (db) => {
  const col = db.collection("medications");
  await col.insertOne({
    id: MED_ID,
    user_id: DEPENDENT_ID,
    name: "Metformin 500mg",
    dosage_text: "1 tablet after meals",
    instructions: "Take with food",
    start_date: "2026-04-01",
    timezone: "Asia/Kolkata",
    stock_count: 60,
    refill_threshold: 10,
    refill_lead_time_days: 3,
    is_active: true,
    created_at_utc: now(),
    updated_at_utc: now(),
  });
  const found = await col.findOne({ id: MED_ID });
  assert.ok(found, "Should find the inserted medication");
  assert.equal(found?.name, "Metformin 500mg");
  assert.equal(found?.timezone, "Asia/Kolkata");
});

it("can insert and read a valid MedicationSchedule document", async (db) => {
  const col = db.collection("medication_schedules");
  await col.insertOne({
    id: SCHED_ID,
    medication_id: MED_ID,
    user_id: DEPENDENT_ID,
    schedule_type: "DAILY",
    time_slot: "MORNING",
    timezone: "Asia/Kolkata",
    grace_window_minutes: 15,
    miss_window_minutes: 60,
    is_active: true,
    created_at_utc: now(),
    updated_at_utc: now(),
  });
  const found = await col.findOne({ id: SCHED_ID });
  assert.equal(found?.schedule_type, "DAILY");
  assert.equal(found?.grace_window_minutes, 15);
});

it("can insert and read a valid HydrationPlan document", async (db) => {
  const col = db.collection("hydration_plans");
  await col.insertOne({
    id: HYD_PLAN_ID,
    user_id: DEPENDENT_ID,
    daily_goal_ml: 2500,
    interval_minutes: 90,
    active_window_start_24h: "08:00",
    active_window_end_24h: "21:00",
    timezone: "Asia/Kolkata",
    is_active: true,
    created_at_utc: now(),
    updated_at_utc: now(),
  });
  const found = await col.findOne({ id: HYD_PLAN_ID });
  assert.equal(found?.daily_goal_ml, 2500);
  assert.equal(found?.interval_minutes, 90);
});

it("can insert a valid ReminderEvent document", async (db) => {
  const col = db.collection("reminder_events");
  await col.insertOne({
    event_id: EVT_ID,
    event_type: "MEDICATION_DUE",
    path: "MEDICATION",
    status: "PENDING",
    user_id: DEPENDENT_ID,
    due_at_utc: "2026-04-13T04:30:00.000Z",
    timezone: "Asia/Kolkata",
    policy_id: "policy-default",
    payload: { medication_id: MED_ID, schedule_id: SCHED_ID },
    created_at_utc: now(),
    updated_at_utc: now(),
  });
  const found = await col.findOne({ event_id: EVT_ID });
  assert.ok(found, "Should find the inserted reminder event");
  assert.equal(found?.status, "PENDING");
});

// ─────────────────────────────────────────────
// 4. Idempotency (TC-IDEMP-01)
// ─────────────────────────────────────────────

it("TC-IDEMP-01: duplicate reminder event is rejected by unique index", async (db) => {
  const col = db.collection("reminder_events");
  await assert.rejects(
    () =>
      col.insertOne({
        event_id: EVT_ID, // same event_id — must be rejected
        event_type: "MEDICATION_DUE",
        path: "MEDICATION",
        status: "PENDING",
        user_id: DEPENDENT_ID,
        due_at_utc: "2026-04-13T04:30:00.000Z",
        timezone: "Asia/Kolkata",
        policy_id: "policy-default",
        payload: {},
        created_at_utc: now(),
        updated_at_utc: now(),
      }),
    (err: Error) => {
      assert.match(err.message, /duplicate key/i);
      return true;
    },
  );
});

it("can insert a valid ConfirmationEvent document", async (db) => {
  const col = db.collection("confirmation_events");
  await col.insertOne({
    id: CONF_ID,
    event_id: EVT_ID,
    actor_user_id: DEPENDENT_ID,
    source: "APP_SCREEN",
    action: "CONFIRM",
    acted_at_utc: now(),
    created_at_utc: now(),
    updated_at_utc: now(),
  });
  const found = await col.findOne({ id: CONF_ID });
  assert.equal(found?.action, "CONFIRM");
  assert.equal(found?.source, "APP_SCREEN");
});

it("can insert a valid RefillEvent document", async (db) => {
  const col = db.collection("refill_events");
  await col.insertOne({
    id: REFILL_ID,
    medication_id: MED_ID,
    user_id: DEPENDENT_ID,
    remaining_stock: 8,
    threshold: 10,
    expected_run_out_date: "2026-04-20",
    caregiver_notification_enabled: true,
    status: "PENDING",
    created_at_utc: now(),
    updated_at_utc: now(),
  });
  const found = await col.findOne({ id: REFILL_ID });
  assert.equal(found?.status, "PENDING");
  assert.equal(found?.remaining_stock, 8);
});

// ─────────────────────────────────────────────
// 5. Caregiver Link Uniqueness
// ─────────────────────────────────────────────

it("caregiver_links rejects duplicate caregiver-dependent pair", async (db) => {
  const col = db.collection("caregiver_links");
  await col.insertOne({
    caregiver_user_id: CAREGIVER_ID,
    dependent_user_id: DEPENDENT_ID,
    created_at_utc: now(),
  });
  await assert.rejects(
    () =>
      col.insertOne({
        caregiver_user_id: CAREGIVER_ID,
        dependent_user_id: DEPENDENT_ID,
        created_at_utc: now(),
      }),
    (err: Error) => {
      assert.match(err.message, /duplicate key/i);
      return true;
    },
  );
});

// ─────────────────────────────────────────────
// 6. Lifecycle Transition
// ─────────────────────────────────────────────

it("can transition a ReminderEvent from PENDING to SENT via updateOne", async (db) => {
  const col = db.collection("reminder_events");
  const updateResult = await col.updateOne(
    { event_id: EVT_ID, status: "PENDING" },
    { $set: { status: "SENT", updated_at_utc: now() } },
  );
  assert.equal(updateResult.matchedCount, 1, "Should match the PENDING event");
  assert.equal(updateResult.modifiedCount, 1, "Should update status to SENT");
  const updated = await col.findOne({ event_id: EVT_ID });
  assert.equal(updated?.status, "SENT");
});

// ─────────────────────────────────────────────
// 7. DeliveryAttempts Uniqueness
// ─────────────────────────────────────────────

it("delivery_attempts rejects duplicate (reminder_event_id, attempt_no)", async (db) => {
  const col = db.collection("delivery_attempts");
  await col.insertOne({
    reminder_event_id: EVT_ID,
    attempt_no: 1,
    channel: "PUSH",
    outcome: "DELIVERED",
    attempted_at_utc: now(),
  });
  await assert.rejects(
    () =>
      col.insertOne({
        reminder_event_id: EVT_ID,
        attempt_no: 1, // same attempt_no — must be rejected
        channel: "SMS",
        outcome: "PENDING",
        attempted_at_utc: now(),
      }),
    (err: Error) => {
      assert.match(err.message, /duplicate key/i);
      return true;
    },
  );
});

// ─────────────────────────────────────────────
// Main runner
// ─────────────────────────────────────────────

async function main() {
  console.log(`\n🔌  Connecting to Atlas → database: "${TEST_DB}"…`);
  console.log(`🔑  Run ID: ${RUN_ID} (all test documents are scoped to this ID)\n`);

  const client = new MongoClient(uri as string);
  await client.connect();
  const db = client.db(TEST_DB);
  console.log("✅  Connected.\n");

  // Bootstrap
  console.log("🏗️   Applying bootstrap plan (creating collections & indexes)…");
  const bootstrapResults = await applyBootstrap(db);
  let bootstrapOk = true;
  for (const r of bootstrapResults) {
    if (r.error) {
      console.error(`   ❌  ${r.collection}: ${r.error}`);
      bootstrapOk = false;
    } else {
      console.log(`   ✅  ${r.collection}: ${r.indexesCreated} index(es) ensured`);
    }
  }
  if (!bootstrapOk) {
    await client.close();
    process.exit(1);
  }
  console.log();

  // Run tests sequentially
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  console.log("🧪  Running tests…\n");
  for (const t of tests) {
    try {
      await t.fn(db);
      console.log(`   ✔  ${t.name}`);
      passed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`   ✖  ${t.name}\n      → ${msg}`);
      failures.push(t.name);
      failed++;
    }
  }

  // Cleanup: delete only the run-scoped documents; do NOT drop the DB
  console.log(`\n🧹  Cleaning up run-scoped documents (RUN_ID: ${RUN_ID})…`);
  for (const col of COLLECTIONS_TO_CLEANUP) {
    try {
      await db.collection(col).deleteMany({ $or: [
        { id: { $regex: RUN_ID } },
        { event_id: { $regex: RUN_ID } },
        { reminder_event_id: { $regex: RUN_ID } },
        { caregiver_user_id: { $regex: RUN_ID } },
        { dependent_user_id: { $regex: RUN_ID } },
        { medication_id: { $regex: RUN_ID } },
      ]});
    } catch {
      // cleanup errors don't fail the test run
    }
  }
  await client.close();
  console.log("✅  Cleanup done. Connection closed.\n");

  // Summary
  console.log("─".repeat(60));
  console.log(`📋  Results: ${passed} passed, ${failed} failed (${tests.length} total)`);
  if (failed > 0) {
    console.error("\n❌  Failed tests:");
    for (const f of failures) console.error(`    • ${f}`);
    process.exit(1);
  } else {
    console.log("✅  All tests passed! Database design is verified.");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("💥  Unexpected fatal error:", err);
  process.exit(1);
});
