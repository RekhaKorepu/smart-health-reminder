import { randomUUID } from "node:crypto";
import type { Db } from "mongodb";
import { validateMedication } from "../domain/validation";
import type { Medication } from "../domain/models";

export interface CreateMedicationInput {
  userId: string;
  name: string;
  dosageText: string;
  instructions?: string;
  startDate: string;
  endDate?: string;
  timezone: string;
  stockCount?: number;
  refillThreshold?: number;
  refillLeadTimeDays?: number;
}

export interface UpdateMedicationInput {
  name?: string;
  dosageText?: string;
  instructions?: string;
  endDate?: string;
  stockCount?: number;
  refillThreshold?: number;
  refillLeadTimeDays?: number;
}

function toDoc(medication: Medication): Record<string, unknown> {
  return {
    id: medication.id,
    user_id: medication.userId,
    name: medication.name,
    dosage_text: medication.dosageText,
    instructions: medication.instructions,
    start_date: medication.startDate,
    end_date: medication.endDate,
    timezone: medication.timezone,
    stock_count: medication.stockCount,
    refill_threshold: medication.refillThreshold,
    refill_lead_time_days: medication.refillLeadTimeDays,
    is_active: medication.isActive,
    created_at_utc: medication.createdAtUtc,
    updated_at_utc: medication.updatedAtUtc,
  };
}

function fromDoc(doc: Record<string, unknown>): Medication {
  return {
    id: String(doc.id),
    userId: String(doc.user_id),
    name: String(doc.name),
    dosageText: String(doc.dosage_text),
    instructions: doc.instructions as string | undefined,
    startDate: String(doc.start_date),
    endDate: doc.end_date as string | undefined,
    timezone: String(doc.timezone),
    stockCount: doc.stock_count as number | undefined,
    refillThreshold: doc.refill_threshold as number | undefined,
    refillLeadTimeDays: doc.refill_lead_time_days as number | undefined,
    isActive: Boolean(doc.is_active),
    createdAtUtc: String(doc.created_at_utc),
    updatedAtUtc: String(doc.updated_at_utc),
  };
}

export async function createMedication(db: Db, input: CreateMedicationInput): Promise<Medication> {
  const now = new Date().toISOString();
  const raw: Medication = {
    id: randomUUID(),
    userId: input.userId,
    name: input.name,
    dosageText: input.dosageText,
    instructions: input.instructions,
    startDate: input.startDate,
    endDate: input.endDate,
    timezone: input.timezone,
    stockCount: input.stockCount,
    refillThreshold: input.refillThreshold,
    refillLeadTimeDays: input.refillLeadTimeDays,
    isActive: true,
    createdAtUtc: now,
    updatedAtUtc: now,
  };

  const validation = validateMedication(raw);
  if (!validation.ok) {
    throw Object.assign(new Error("Validation failed"), { code: "VALIDATION_ERROR", issues: validation.issues });
  }

  await db.collection("medications").insertOne(toDoc(raw));
  return raw;
}

export async function listMedications(db: Db, userId: string): Promise<Medication[]> {
  const docs = await db
    .collection("medications")
    .find({ user_id: userId, is_active: true })
    .sort({ created_at_utc: -1 })
    .toArray();
  return docs.map((d) => fromDoc(d as Record<string, unknown>));
}

export async function getMedication(db: Db, id: string, userId: string): Promise<Medication | null> {
  const doc = await db.collection("medications").findOne({ id, user_id: userId });
  if (!doc) return null;
  return fromDoc(doc as Record<string, unknown>);
}

export async function updateMedication(
  db: Db,
  id: string,
  userId: string,
  input: UpdateMedicationInput,
): Promise<Medication | null> {
  const now = new Date().toISOString();
  const update: Record<string, unknown> = { updated_at_utc: now };
  if (input.name !== undefined) update.name = input.name;
  if (input.dosageText !== undefined) update.dosage_text = input.dosageText;
  if (input.instructions !== undefined) update.instructions = input.instructions;
  if (input.endDate !== undefined) update.end_date = input.endDate;
  if (input.stockCount !== undefined) update.stock_count = input.stockCount;
  if (input.refillThreshold !== undefined) update.refill_threshold = input.refillThreshold;
  if (input.refillLeadTimeDays !== undefined) update.refill_lead_time_days = input.refillLeadTimeDays;

  const result = await db
    .collection("medications")
    .findOneAndUpdate({ id, user_id: userId, is_active: true }, { $set: update }, { returnDocument: "after" });

  if (!result) return null;
  return fromDoc(result as Record<string, unknown>);
}

export async function softDeleteMedication(db: Db, id: string, userId: string): Promise<boolean> {
  const result = await db
    .collection("medications")
    .updateOne({ id, user_id: userId, is_active: true }, { $set: { is_active: false, updated_at_utc: new Date().toISOString() } });
  return result.modifiedCount === 1;
}
