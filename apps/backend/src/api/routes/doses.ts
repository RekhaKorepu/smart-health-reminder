import { Router, Request } from "express";
import { getDb } from "../../db/client";
import {
  generateTodayDoseEvents,
  getTodayDoseEvents,
  applyDoseAction,
  markMissedDoseEvents,
} from "../../services/doseService";

export const doseRouter = Router();

function uid(req: Request): string {
  return String(req.headers["x-user-id"] ?? "anonymous");
}

// GET /doses — list today's dose events for user (auto-generates if needed)
doseRouter.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const userId = uid(req);

    // Auto-mark missed events
    await markMissedDoseEvents(db, userId);

    // Generate today's events (idempotent)
    await generateTodayDoseEvents(db, userId);

    const events = await getTodayDoseEvents(db, userId);
    res.json(events);
  } catch (err: unknown) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: (err as Error).message });
  }
});

// POST /doses/:eventId/confirm
doseRouter.post("/:eventId/confirm", async (req, res) => {
  try {
    const db = await getDb();
    const result = await applyDoseAction(db, req.params.eventId, uid(req), "CONFIRM", req.body.source);
    if (!result.ok) {
      res.status(409).json({ error: "TRANSITION_ERROR", message: result.reason });
      return;
    }
    res.json({ ok: true });
  } catch (err: unknown) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: (err as Error).message });
  }
});

// POST /doses/:eventId/snooze
doseRouter.post("/:eventId/snooze", async (req, res) => {
  try {
    const db = await getDb();
    const result = await applyDoseAction(db, req.params.eventId, uid(req), "SNOOZE", req.body.source);
    if (!result.ok) {
      res.status(409).json({ error: "TRANSITION_ERROR", message: result.reason });
      return;
    }
    res.json({ ok: true });
  } catch (err: unknown) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: (err as Error).message });
  }
});

// POST /doses/:eventId/skip
doseRouter.post("/:eventId/skip", async (req, res) => {
  try {
    const db = await getDb();
    const result = await applyDoseAction(db, req.params.eventId, uid(req), "SKIP", req.body.source);
    if (!result.ok) {
      res.status(409).json({ error: "TRANSITION_ERROR", message: result.reason });
      return;
    }
    res.json({ ok: true });
  } catch (err: unknown) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: (err as Error).message });
  }
});
