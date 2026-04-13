import { Router } from "express";
import { getDb } from "../../db/client";
import { createSchedule, listSchedules, deactivateSchedule } from "../../services/doseService";

export const scheduleRouter = Router();

// POST /medications/:medicationId/schedules
scheduleRouter.post("/:medicationId/schedules", async (req, res) => {
  try {
    const db = await getDb();
    const userId = (req.headers["x-user-id"] as string) ?? "anonymous";
    const schedule = await createSchedule(db, {
      ...req.body,
      medicationId: req.params.medicationId,
      userId,
    });
    res.status(201).json(schedule);
  } catch (err: unknown) {
    const e = err as { code?: string; issues?: unknown; message?: string };
    if (e.code === "VALIDATION_ERROR") {
      res.status(400).json({ error: "VALIDATION_ERROR", issues: e.issues });
    } else {
      res.status(500).json({ error: "INTERNAL_ERROR", message: e.message });
    }
  }
});

// GET /medications/:medicationId/schedules
scheduleRouter.get("/:medicationId/schedules", async (req, res) => {
  try {
    const db = await getDb();
    const userId = (req.headers["x-user-id"] as string) ?? "anonymous";
    const schedules = await listSchedules(db, req.params.medicationId, userId);
    res.json(schedules);
  } catch (err: unknown) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: (err as Error).message });
  }
});

// DELETE /medications/:medicationId/schedules/:scheduleId
scheduleRouter.delete("/:medicationId/schedules/:scheduleId", async (req, res) => {
  try {
    const db = await getDb();
    const userId = (req.headers["x-user-id"] as string) ?? "anonymous";
    const deleted = await deactivateSchedule(db, req.params.scheduleId, userId);
    if (!deleted) {
      res.status(404).json({ error: "NOT_FOUND", message: "Schedule not found." });
      return;
    }
    res.status(204).send();
  } catch (err: unknown) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: (err as Error).message });
  }
});
