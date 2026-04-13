import { Router } from "express";
import { getDb } from "../../db/client";
import { getMedicationAdherence } from "../../services/doseService";

export const adherenceRouter = Router();

// GET /adherence/medication?days=7
adherenceRouter.get("/medication", async (req, res) => {
  try {
    const db = await getDb();
    const userId = (req.headers["x-user-id"] as string) ?? "anonymous";
    const days = parseInt(String(req.query.days ?? "7"), 10);
    const stats = await getMedicationAdherence(db, userId, days);
    res.json(stats);
  } catch (err: unknown) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: (err as Error).message });
  }
});
