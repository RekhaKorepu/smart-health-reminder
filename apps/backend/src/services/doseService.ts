import { randomUUID } from "node:crypto";
import type { Db } from "mongodb";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { MedicationSchedule, ReminderEvent } from "../domain/models";
import { validateMedicationSchedule } from "../domain/validation";
import { transitionReminderStatus, shouldMarkReminderMissed } from "../domain/lifecycle";

// ─── Schedule helpers ────────────────────────────────────────────────────────

function toScheduleDoc(s: MedicationSchedule): Record<string, unknown> {
  return {
    id: s.id,
    medication_id: s.medicationId,
    user_id: s.userId,
    schedule_type: s.scheduleType,
    time_slot: s.timeSlot,
    custom_time_24h: s.customTime24h,
    weekdays: s.weekdays,
    timezone: s.timezone,
    grace_window_minutes: s.graceWindowMinutes,
    miss_window_minutes: s.missWindowMinutes,
    is_active: s.isActive,
    created_at_utc: s.createdAtUtc,
    updated_at_utc: s.updatedAtUtc,
  };
}

function fromScheduleDoc(doc: Record<string, unknown>): MedicationSchedule {
  return {
    id: String(doc.id),
    medicationId: String(doc.medication_id),
    userId: String(doc.user_id),
    scheduleType: doc.schedule_type as "DAILY" | "WEEKLY",
    timeSlot: doc.time_slot as MedicationSchedule["timeSlot"],
    customTime24h: doc.custom_time_24h as string | undefined,
    weekdays: doc.weekdays as number[] | undefined,
    timezone: String(doc.timezone),
    graceWindowMinutes: Number(doc.grace_window_minutes),
    missWindowMinutes: Number(doc.miss_window_minutes),
    isActive: Boolean(doc.is_active),
    createdAtUtc: String(doc.created_at_utc),
    updatedAtUtc: String(doc.updated_at_utc),
  };
}

export interface CreateScheduleInput {
  medicationId: string;
  userId: string;
  scheduleType: "DAILY" | "WEEKLY";
  timeSlot: MedicationSchedule["timeSlot"];
  customTime24h?: string;
  weekdays?: number[];
  timezone: string;
  graceWindowMinutes?: number;
  missWindowMinutes?: number;
}

export async function createSchedule(db: Db, input: CreateScheduleInput): Promise<MedicationSchedule> {
  const now = new Date().toISOString();
  const raw: MedicationSchedule = {
    id: randomUUID(),
    medicationId: input.medicationId,
    userId: input.userId,
    scheduleType: input.scheduleType,
    timeSlot: input.timeSlot,
    customTime24h: input.customTime24h,
    weekdays: input.weekdays,
    timezone: input.timezone,
    graceWindowMinutes: input.graceWindowMinutes ?? 15,
    missWindowMinutes: input.missWindowMinutes ?? 60,
    isActive: true,
    createdAtUtc: now,
    updatedAtUtc: now,
  };

  const validation = validateMedicationSchedule(raw);
  if (!validation.ok) {
    throw Object.assign(new Error("Validation failed"), { code: "VALIDATION_ERROR", issues: validation.issues });
  }

  await db.collection("medication_schedules").insertOne(toScheduleDoc(raw));
  return raw;
}

export async function listSchedules(db: Db, medicationId: string, userId: string): Promise<MedicationSchedule[]> {
  const docs = await db
    .collection("medication_schedules")
    .find({ medication_id: medicationId, user_id: userId, is_active: true })
    .toArray();
  return docs.map((d) => fromScheduleDoc(d as Record<string, unknown>));
}

export async function deactivateSchedule(db: Db, scheduleId: string, userId: string): Promise<boolean> {
  const result = await db
    .collection("medication_schedules")
    .updateOne(
      { id: scheduleId, user_id: userId, is_active: true },
      { $set: { is_active: false, updated_at_utc: new Date().toISOString() } },
    );
  return result.modifiedCount === 1;
}

// ─── Dose Event generation ────────────────────────────────────────────────────

/**
 * Generates today's dose events for all active medication schedules of a user.
 * Uses idempotent insert (createIfAbsent via unique event_id).
 * This is a lightweight substitute for the scheduler service — Phase 4 will
 * replace this with a proper background job.
 */
export async function generateTodayDoseEvents(db: Db, userId: string): Promise<ReminderEvent[]> {
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10); // YYYY-MM-DD (UTC date, used for event naming)

  const schedules = await db
    .collection("medication_schedules")
    .find({ user_id: userId, is_active: true })
    .toArray();

  const timeSlotHours: Record<string, number> = {
    MORNING: 8,
    AFTERNOON: 13,
    EVENING: 18,
    NIGHT: 21,
  };

  const generated: ReminderEvent[] = [];

  for (const s of schedules) {
    const schedule = fromScheduleDoc(s as Record<string, unknown>);

    // Skip WEEKLY schedules for days not scheduled today
    if (schedule.scheduleType === "WEEKLY") {
      const todayDay = now.getDay(); // 0 = Sunday
      if (!schedule.weekdays?.includes(todayDay)) continue;
    }

    const hour =
      schedule.timeSlot === "CUSTOM" && schedule.customTime24h
        ? parseInt(schedule.customTime24h.split(":")[0], 10)
        : (timeSlotHours[schedule.timeSlot] ?? 8);

    const minute =
      schedule.timeSlot === "CUSTOM" && schedule.customTime24h
        ? parseInt(schedule.customTime24h.split(":")[1], 10)
        : 0;

    // 1. Get today's local date part in the user's specific timezone
    const datePart = formatInTimeZone(now, schedule.timezone, "yyyy-MM-dd");
    
    // 2. Construct the local time string ("YYYY-MM-DD HH:mm:ss")
    const localTimeStr = `${datePart} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
    
    // 3. Convert that local time in the specific timezone to a UTC Date object
    const dueDate = fromZonedTime(localTimeStr, schedule.timezone);

    // Deterministic event_id for today's dose (date + schedule)
    const eventId = `dose-${schedule.id}-${todayISO}`;
    const nowISO = new Date().toISOString();

    const doc = {
      event_id: eventId,
      event_type: "MEDICATION_DUE",
      path: "MEDICATION",
      status: "PENDING",
      user_id: userId,
      due_at_utc: dueDate.toISOString(),
      timezone: schedule.timezone,
      policy_id: "default",
      payload: {
        medication_id: schedule.medicationId,
        schedule_id: schedule.id,
      },
      created_at_utc: nowISO,
      updated_at_utc: nowISO,
    };

    try {
      await db.collection("reminder_events").insertOne(doc);
    } catch {
      // Duplicate key = already generated today — that's fine (idempotent)
    }

    const existing = await db.collection("reminder_events").findOne({ event_id: eventId });
    if (existing) {
      generated.push({
        eventId: String(existing.event_id),
        eventType: "MEDICATION_DUE",
        path: "MEDICATION",
        status: existing.status as ReminderEvent["status"],
        userId: String(existing.user_id),
        dueAtUtc: String(existing.due_at_utc),
        timezone: String(existing.timezone),
        policyId: String(existing.policy_id),
        payload: existing.payload as ReminderEvent["payload"],
        createdAtUtc: String(existing.created_at_utc),
        updatedAtUtc: String(existing.updated_at_utc),
      });
    }
  }

  return generated;
}

// ─── Dose actions ─────────────────────────────────────────────────────────────

type DoseAction = "CONFIRM" | "SNOOZE" | "SKIP";
const actionToStatus: Record<DoseAction, ReminderEvent["status"]> = {
  CONFIRM: "ACKED",
  SNOOZE: "SNOOZED",
  SKIP: "SKIPPED",
};

export async function applyDoseAction(
  db: Db,
  eventId: string,
  userId: string,
  action: DoseAction,
  source: "APP_SCREEN" | "LOCKSCREEN" | "VOICE_IVR" = "APP_SCREEN",
): Promise<{ ok: boolean; reason?: string }> {
  const existing = await db.collection("reminder_events").findOne({ event_id: eventId, user_id: userId });
  if (!existing) return { ok: false, reason: "Event not found." };

  const currentStatus = existing.status as ReminderEvent["status"];
  const nextStatus = actionToStatus[action];

  // Check if "SENT" — if still PENDING, auto-advance to SENT first
  let workingStatus = currentStatus;
  if (workingStatus === "PENDING") {
    const toSent = transitionReminderStatus("PENDING", "SENT");
    if (toSent.ok) {
      workingStatus = "SENT";
      await db.collection("reminder_events").updateOne(
        { event_id: eventId },
        { $set: { status: "SENT", updated_at_utc: new Date().toISOString() } },
      );
    }
  }

  const transition = transitionReminderStatus(workingStatus, nextStatus);
  if (!transition.ok) return { ok: false, reason: transition.reason };

  const nowISO = new Date().toISOString();

  // Update reminder event status
  await db.collection("reminder_events").updateOne(
    { event_id: eventId },
    { $set: { status: nextStatus, updated_at_utc: nowISO } },
  );

  // Record confirmation event
  await db.collection("confirmation_events").insertOne({
    id: randomUUID(),
    event_id: eventId,
    actor_user_id: userId,
    source,
    action,
    acted_at_utc: nowISO,
    created_at_utc: nowISO,
    updated_at_utc: nowISO,
  });

  // If confirmed, decrement stock count
  if (action === "CONFIRM" && existing.payload?.medication_id) {
    await db
      .collection("medications")
      .updateOne(
        { id: existing.payload.medication_id, stock_count: { $gt: 0 } },
        { $inc: { stock_count: -1 }, $set: { updated_at_utc: nowISO } },
      );
  }

  return { ok: true };
}

// ─── Adherence stats ──────────────────────────────────────────────────────────

export interface AdherenceStats {
  medicationId: string;
  medicationName: string;
  total: number;
  confirmed: number;
  skipped: number;
  missed: number;
  snoozed: number;
  rate: number; // 0-100
}

export async function getMedicationAdherence(
  db: Db,
  userId: string,
  days = 7,
): Promise<AdherenceStats[]> {
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  const events = await db
    .collection("reminder_events")
    .find({
      user_id: userId,
      path: "MEDICATION",
      due_at_utc: { $gte: since },
      status: { $in: ["ACKED", "SKIPPED", "MISSED", "SNOOZED"] },
    })
    .toArray();

  // Group by medication_id
  const grouped = new Map<string, typeof events>();
  for (const e of events) {
    const medId = String(e.payload?.medication_id ?? "unknown");
    if (!grouped.has(medId)) grouped.set(medId, []);
    grouped.get(medId)!.push(e);
  }

  const stats: AdherenceStats[] = [];
  for (const [medId, evts] of grouped) {
    const med = await db.collection("medications").findOne({ id: medId });
    const total = evts.length;
    const confirmed = evts.filter((e) => e.status === "ACKED").length;
    const skipped = evts.filter((e) => e.status === "SKIPPED").length;
    const missed = evts.filter((e) => e.status === "MISSED").length;
    const snoozed = evts.filter((e) => e.status === "SNOOZED").length;
    const rate = total > 0 ? Math.round((confirmed / total) * 100) : 0;

    stats.push({
      medicationId: medId,
      medicationName: med ? String(med.name) : medId,
      total,
      confirmed,
      skipped,
      missed,
      snoozed,
      rate,
    });
  }

  return stats;
}

export async function getTodayDoseEvents(db: Db, userId: string): Promise<Array<Record<string, unknown>>> {
  // 1. Find user's timezone from their first active schedule (default to UTC)
  const firstSchedule = await db.collection("medication_schedules").findOne({ user_id: userId, is_active: true });
  const tz = firstSchedule ? String(firstSchedule.timezone) : "UTC";

  // 2. Calculate local boundaries in UTC
  const now = new Date();
  const dateStr = formatInTimeZone(now, tz, "yyyy-MM-dd");
  const startOfDay = fromZonedTime(`${dateStr} 00:00:00`, tz).toISOString();
  const endOfDay = fromZonedTime(`${dateStr} 23:59:59`, tz).toISOString();

  const events = await db
    .collection("reminder_events")
    .find({
      user_id: userId,
      path: "MEDICATION",
      due_at_utc: { $gte: startOfDay, $lte: endOfDay },
    })
    .sort({ due_at_utc: 1 })
    .toArray();

  // Annotate with medication name
  const enriched = await Promise.all(
    events.map(async (e) => {
      const medId = e.payload?.medication_id;
      const med = medId ? await db.collection("medications").findOne({ id: medId }) : null;
      return {
        eventId: e.event_id,
        eventType: e.event_type,
        status: e.status,
        dueAtUtc: e.due_at_utc,
        timezone: e.timezone,
        medicationId: medId ?? null,
        medicationName: med ? String(med.name) : null,
        dosageText: med ? String(med.dosage_text) : null,
        scheduleId: e.payload?.schedule_id ?? null,
      };
    }),
  );

  return enriched;
}

// Auto-mark missed events for a user
export async function markMissedDoseEvents(db: Db, userId: string): Promise<number> {
  const now = new Date().toISOString();
  let marked = 0;

  const pending = await db
    .collection("reminder_events")
    .find({ user_id: userId, path: "MEDICATION", status: { $in: ["PENDING", "SENT"] } })
    .toArray();

  for (const e of pending) {
    const missWindowEnd = new Date(new Date(String(e.due_at_utc)).getTime() + 60 * 60_000).toISOString();
    if (now >= missWindowEnd) {
      await db.collection("reminder_events").updateOne(
        { event_id: e.event_id },
        { $set: { status: "MISSED", updated_at_utc: now } },
      );
      marked++;
    }
  }

  return marked;
}

export { shouldMarkReminderMissed };
