import { randomUUID } from "node:crypto";
import type { Db } from "mongodb";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HydrationPlan {
  id: string;
  userId: string;
  dailyGoalMl: number;
  intervalMinutes: number;
  startTime24h: string;
  endTime24h: string;
  timezone: string;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface HydrationIntakeLog {
  id: string;
  userId: string;
  planId: string;
  amountMl: number;
  loggedAtUtc: string;
  source: "MANUAL" | "REMINDER_ACTION";
  createdAtUtc: string;
}

export interface HydrationSummary {
  totalAmountMl: number;
  goalMl: number;
  percentage: number;
  isGoalAchieved: boolean;
  recentLogs: Array<{ id: string; amountMl: number; time: string }>;
}

export interface HydrationAdherenceDay {
  date: string;
  totalAmountMl: number;
  goalMl: number;
  isSuccess: boolean;
}

export interface CreatePlanInput {
  userId: string;
  dailyGoalMl: number;
  intervalMinutes: number;
  startTime24h: string;
  endTime24h: string;
  timezone: string;
}

export interface LogIntakeInput {
  userId: string;
  amountMl: number;
  source?: "MANUAL" | "REMINDER_ACTION";
}

// ─── Validation helpers ───────────────────────────────────────────────────────

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function parseMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export interface ValidationIssue { field: string; message: string; }

export function validatePlanInput(body: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (typeof body !== "object" || body === null) {
    return [{ field: "root", message: "Request body must be an object." }];
  }
  const b = body as Record<string, unknown>;

  if (typeof b.dailyGoalMl !== "number" || !Number.isInteger(b.dailyGoalMl) || b.dailyGoalMl < 250 || b.dailyGoalMl > 10000) {
    issues.push({ field: "dailyGoalMl", message: "Must be an integer between 250 and 10000." });
  }
  if (typeof b.intervalMinutes !== "number" || !Number.isInteger(b.intervalMinutes) || b.intervalMinutes < 15 || b.intervalMinutes > 480) {
    issues.push({ field: "intervalMinutes", message: "Must be an integer between 15 and 480 minutes." });
  }
  if (typeof b.startTime24h !== "string" || !TIME_RE.test(b.startTime24h)) {
    issues.push({ field: "startTime24h", message: "Must be in HH:mm format." });
  }
  if (typeof b.endTime24h !== "string" || !TIME_RE.test(b.endTime24h)) {
    issues.push({ field: "endTime24h", message: "Must be in HH:mm format." });
  }
  // Cross-field: end must be after start
  if (!issues.find(i => i.field === "startTime24h") && !issues.find(i => i.field === "endTime24h")) {
    if (parseMinutes(b.endTime24h as string) <= parseMinutes(b.startTime24h as string)) {
      issues.push({ field: "endTime24h", message: "End time must be after start time." });
    }
  }
  if (typeof b.timezone !== "string" || b.timezone.length < 3 || b.timezone.length > 64) {
    issues.push({ field: "timezone", message: "Must be a valid timezone string." });
  }

  return issues;
}

export function validateLogInput(body: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (typeof body !== "object" || body === null) {
    return [{ field: "root", message: "Request body must be an object." }];
  }
  const b = body as Record<string, unknown>;
  if (typeof b.amountMl !== "number" || !Number.isInteger(b.amountMl) || b.amountMl < 1 || b.amountMl > 5000) {
    issues.push({ field: "amountMl", message: "Must be an integer between 1 and 5000." });
  }
  return issues;
}

// ─── DB mappers ───────────────────────────────────────────────────────────────

function toPlanDoc(p: HydrationPlan): Record<string, unknown> {
  return {
    id: p.id, user_id: p.userId, daily_goal_ml: p.dailyGoalMl,
    interval_minutes: p.intervalMinutes, start_time_24h: p.startTime24h,
    end_time_24h: p.endTime24h, timezone: p.timezone, is_active: p.isActive,
    created_at_utc: p.createdAtUtc, updated_at_utc: p.updatedAtUtc,
  };
}

function fromPlanDoc(d: Record<string, unknown>): HydrationPlan {
  return {
    id: String(d.id), userId: String(d.user_id),
    dailyGoalMl: Number(d.daily_goal_ml), intervalMinutes: Number(d.interval_minutes),
    startTime24h: String(d.start_time_24h), endTime24h: String(d.end_time_24h),
    timezone: String(d.timezone), isActive: Boolean(d.is_active),
    createdAtUtc: String(d.created_at_utc), updatedAtUtc: String(d.updated_at_utc),
  };
}

// ─── Plan CRUD (FR-HYD-001, FR-HYD-002) ──────────────────────────────────────

export async function createOrUpdatePlan(db: Db, input: CreatePlanInput): Promise<HydrationPlan> {
  const now = new Date().toISOString();
  const existing = await db.collection("hydration_plans").findOne({ user_id: input.userId, is_active: true });

  if (existing) {
    // Update in-place (FR-HYD-001 AC3: no duplicate)
    await db.collection("hydration_plans").updateOne(
      { id: String(existing.id) },
      {
        $set: {
          daily_goal_ml: input.dailyGoalMl, interval_minutes: input.intervalMinutes,
          start_time_24h: input.startTime24h, end_time_24h: input.endTime24h,
          timezone: input.timezone, updated_at_utc: now,
        },
      },
    );
    const updated = await db.collection("hydration_plans").findOne({ id: String(existing.id) });
    return fromPlanDoc(updated as Record<string, unknown>);
  }

  const plan: HydrationPlan = {
    id: randomUUID(), userId: input.userId, dailyGoalMl: input.dailyGoalMl,
    intervalMinutes: input.intervalMinutes, startTime24h: input.startTime24h,
    endTime24h: input.endTime24h, timezone: input.timezone, isActive: true,
    createdAtUtc: now, updatedAtUtc: now,
  };
  await db.collection("hydration_plans").insertOne(toPlanDoc(plan));
  return plan;
}

export async function getPlan(db: Db, userId: string): Promise<HydrationPlan | null> {
  const doc = await db.collection("hydration_plans").findOne({ user_id: userId, is_active: true });
  return doc ? fromPlanDoc(doc as Record<string, unknown>) : null;
}

// ─── Interval event generation (FR-HYD-003, FR-HYD-002) ──────────────────────

export async function generateTodayEvents(db: Db, userId: string): Promise<Array<Record<string, unknown>>> {
  const plan = await getPlan(db, userId);
  if (!plan) return [];

  const now = new Date();
  // Today's date in user's timezone (FR-HYD-002: window evaluated in user TZ)
  const todayLocal = formatInTimeZone(now, plan.timezone, "yyyy-MM-dd");

  const startMinutes = parseMinutes(plan.startTime24h);
  const endMinutes = parseMinutes(plan.endTime24h);

  const slots: Date[] = [];
  let cursor = startMinutes;
  while (cursor <= endMinutes) {
    const hh = Math.floor(cursor / 60);
    const mm = cursor % 60;
    // Construct local time string, convert to UTC (FR-HYD-003 step 3)
    const localStr = `${todayLocal} ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
    const utcDate = fromZonedTime(localStr, plan.timezone);
    slots.push(utcDate);
    cursor += plan.intervalMinutes;
  }

  const generated: Array<Record<string, unknown>> = [];
  for (const slotUtc of slots) {
    const hhLabel = String(slotUtc.getUTCHours()).padStart(2, "0") + String(slotUtc.getUTCMinutes()).padStart(2, "0");
    // Deterministic event ID (FR-HYD-003 idempotency)
    const eventId = `hydration-${plan.id}-${todayLocal}-${hhLabel}`;
    const nowISO = new Date().toISOString();

    const doc = {
      event_id: eventId, event_type: "HYDRATION_DUE", path: "HYDRATION",
      status: "PENDING", user_id: userId, due_at_utc: slotUtc.toISOString(),
      timezone: plan.timezone, policy_id: "default",
      payload: { hydration_plan_id: plan.id },
      created_at_utc: nowISO, updated_at_utc: nowISO,
    };

    try {
      await db.collection("reminder_events").insertOne(doc);
    } catch {
      // Duplicate key = already generated (idempotent)
    }

    const existing = await db.collection("reminder_events").findOne({ event_id: eventId });
    if (existing) generated.push(existing);
  }

  return generated;
}

export async function getTodayHydrationEvents(db: Db, userId: string): Promise<Array<Record<string, unknown>>> {
  await generateTodayEvents(db, userId);

  const plan = await getPlan(db, userId);
  const tz = plan?.timezone ?? "UTC";
  const now = new Date();
  const dateStr = formatInTimeZone(now, tz, "yyyy-MM-dd");
  const startOfDay = fromZonedTime(`${dateStr} 00:00:00`, tz).toISOString();
  const endOfDay = fromZonedTime(`${dateStr} 23:59:59`, tz).toISOString();

  const events = await db.collection("reminder_events")
    .find({ user_id: userId, path: "HYDRATION", due_at_utc: { $gte: startOfDay, $lte: endOfDay } })
    .sort({ due_at_utc: 1 })
    .toArray();

  return events.map(e => ({
    eventId: e.event_id,
    eventType: e.event_type,
    status: e.status,
    dueAtUtc: e.due_at_utc,
    timezone: e.timezone,
  }));
}

// ─── Intake logging (FR-HYD-004) ─────────────────────────────────────────────

export async function logIntake(db: Db, input: LogIntakeInput): Promise<HydrationIntakeLog> {
  const plan = await getPlan(db, input.userId);
  const now = new Date().toISOString();

  const log: HydrationIntakeLog = {
    id: randomUUID(), userId: input.userId, planId: plan?.id ?? "no-plan",
    amountMl: input.amountMl, loggedAtUtc: now,
    source: input.source ?? "MANUAL", createdAtUtc: now,
  };

  await db.collection("hydration_intake_logs").insertOne({
    id: log.id, user_id: log.userId, plan_id: log.planId,
    amount_ml: log.amountMl, logged_at_utc: log.loggedAtUtc,
    source: log.source, created_at_utc: log.createdAtUtc,
  });

  return log;
}

// ─── Daily summary (FR-HYD-005) ──────────────────────────────────────────────

export async function getTodaySummary(db: Db, userId: string): Promise<HydrationSummary> {
  const plan = await getPlan(db, userId);
  const goalMl = plan?.dailyGoalMl ?? 2000;
  const tz = plan?.timezone ?? "UTC";

  const now = new Date();
  const dateStr = formatInTimeZone(now, tz, "yyyy-MM-dd");
  const startOfDay = fromZonedTime(`${dateStr} 00:00:00`, tz).toISOString();
  const endOfDay = fromZonedTime(`${dateStr} 23:59:59`, tz).toISOString();

  const logs = await db.collection("hydration_intake_logs")
    .find({ user_id: userId, logged_at_utc: { $gte: startOfDay, $lte: endOfDay } })
    .sort({ logged_at_utc: -1 })
    .toArray();

  const totalAmountMl = logs.reduce((sum, l) => sum + Number(l.amount_ml), 0);
  const percentage = Math.min(Math.round((totalAmountMl / goalMl) * 100), 100);

  // Use local time for display (approximate)
  const recentLogs = logs.slice(0, 10).map((l) => ({
    id: String(l.id),
    amountMl: Number(l.amount_ml),
    time: new Date(String(l.logged_at_utc)).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
  }));

  return {
    totalAmountMl, goalMl,
    percentage, isGoalAchieved: totalAmountMl >= goalMl,
    recentLogs,
  };
}

// ─── Adherence history (FR-ADH-004) ──────────────────────────────────────────

export async function getAdherenceHistory(db: Db, userId: string, days = 7): Promise<HydrationAdherenceDay[]> {
  const plan = await getPlan(db, userId);
  const goalMl = plan?.dailyGoalMl ?? 2000;

  const result: HydrationAdherenceDay[] = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const dayDate = new Date(now);
    dayDate.setUTCDate(now.getUTCDate() - i);
    const dateISO = dayDate.toISOString().slice(0, 10);

    const logs = await db.collection("hydration_intake_logs")
      .find({
        user_id: userId,
        logged_at_utc: { $gte: `${dateISO}T00:00:00.000Z`, $lte: `${dateISO}T23:59:59.999Z` },
      })
      .toArray();

    const totalAmountMl = logs.reduce((sum, l) => sum + Number(l.amount_ml), 0);
    result.push({ date: dateISO, totalAmountMl, goalMl, isSuccess: totalAmountMl >= goalMl });
  }

  return result.reverse(); // oldest → newest
}
