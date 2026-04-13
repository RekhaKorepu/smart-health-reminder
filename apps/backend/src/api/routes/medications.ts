import { Router, Request } from "express";
import { getDb } from "../../db/client";
import {
  createMedication,
  listMedications,
  getMedication,
  updateMedication,
  softDeleteMedication,
} from "../../services/medicationService";

export const medicationRouter = Router();

function uid(req: Request): string {
  return (req.headers["x-user-id"] as string) ?? "anonymous";
}

// POST /medications
medicationRouter.post("/", async (req, res) => {
  try {
    const db = await getDb();
    const medication = await createMedication(db, { ...req.body, userId: uid(req) });
    res.status(201).json(medication);
  } catch (err: unknown) {
    const e = err as { code?: string; issues?: unknown; message?: string };
    if (e.code === "VALIDATION_ERROR") {
      res.status(400).json({ error: "VALIDATION_ERROR", issues: e.issues });
    } else {
      res.status(500).json({ error: "INTERNAL_ERROR", message: e.message });
    }
  }
});

// GET /medications
medicationRouter.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const medications = await listMedications(db, uid(req));
    res.json(medications);
  } catch (err: unknown) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: (err as Error).message });
  }
});

// GET /medications/:id
medicationRouter.get("/:id", async (req, res) => {
  try {
    const db = await getDb();
    const medication = await getMedication(db, req.params.id, uid(req));
    if (!medication) {
      res.status(404).json({ error: "NOT_FOUND", message: "Medication not found." });
      return;
    }
    res.json(medication);
  } catch (err: unknown) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: (err as Error).message });
  }
});

// PATCH /medications/:id
medicationRouter.patch("/:id", async (req, res) => {
  try {
    const db = await getDb();
    const updated = await updateMedication(db, req.params.id, uid(req), req.body);
    if (!updated) {
      res.status(404).json({ error: "NOT_FOUND", message: "Medication not found." });
      return;
    }
    res.json(updated);
  } catch (err: unknown) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: (err as Error).message });
  }
});

// DELETE /medications/:id
medicationRouter.delete("/:id", async (req, res) => {
  try {
    const db = await getDb();
    const deleted = await softDeleteMedication(db, req.params.id, uid(req));
    if (!deleted) {
      res.status(404).json({ error: "NOT_FOUND", message: "Medication not found." });
      return;
    }
    res.status(204).send();
  } catch (err: unknown) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: (err as Error).message });
  }
});
