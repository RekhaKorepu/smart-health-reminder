import { Router, Request } from "express";
import { getDb } from "../../db/client";
import {
  createOrUpdatePlan,
  getPlan,
  getTodayHydrationEvents,
  getTodaySummary,
  logIntake,
  getAdherenceHistory,
  validatePlanInput,
  validateLogInput,
} from "../../services/hydrationService";

export const hydrationRouter = Router();

function uid(req: Request): string {
  return (req.headers["x-user-id"] as string) ?? "anonymous";
}

// GET /hydration/plan — FR-HYD-001
hydrationRouter.get("/plan", async (req, res) => {
  try {
    const db = await getDb();
    const plan = await getPlan(db, uid(req));
    if (!plan) {
      res.status(404).json({ error: "NOT_FOUND", message: "No hydration plan configured." });
      return;
    }
    res.json(plan);
  } catch (err: unknown) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: (err as Error).message });
  }
});

// POST /hydration/plan — FR-HYD-001, FR-HYD-002
hydrationRouter.post("/plan", async (req, res) => {
  try {
    const issues = validatePlanInput(req.body);
    if (issues.length > 0) {
      res.status(400).json({ error: "VALIDATION_ERROR", issues });
      return;
    }
    const db = await getDb();
    const plan = await createOrUpdatePlan(db, { ...req.body, userId: uid(req) });
    res.status(201).json(plan);
  } catch (err: unknown) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: (err as Error).message });
  }
});

// GET /hydration/events/today — FR-HYD-003
hydrationRouter.get("/events/today", async (req, res) => {
  try {
    const db = await getDb();
    const events = await getTodayHydrationEvents(db, uid(req));
    res.json(events);
  } catch (err: unknown) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: (err as Error).message });
  }
});

// GET /hydration/today — FR-HYD-005
hydrationRouter.get("/today", async (req, res) => {
  try {
    const db = await getDb();
    const summary = await getTodaySummary(db, uid(req));
    res.json(summary);
  } catch (err: unknown) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: (err as Error).message });
  }
});

// POST /hydration/log — FR-HYD-004
hydrationRouter.post("/log", async (req, res) => {
  try {
    const issues = validateLogInput(req.body);
    if (issues.length > 0) {
      res.status(400).json({ error: "VALIDATION_ERROR", issues });
      return;
    }
    const db = await getDb();
    const log = await logIntake(db, {
      userId: uid(req),
      amountMl: req.body.amountMl,
      source: req.body.source ?? "MANUAL",
    });
    res.status(201).json(log);
  } catch (err: unknown) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: (err as Error).message });
  }
});

// GET /hydration/adherence — FR-ADH-004
hydrationRouter.get("/adherence", async (req, res) => {
  try {
    const db = await getDb();
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
    const history = await getAdherenceHistory(db, uid(req), days);
    res.json(history);
  } catch (err: unknown) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: (err as Error).message });
  }
});
