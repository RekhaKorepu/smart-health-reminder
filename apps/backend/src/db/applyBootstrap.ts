import type { Db } from "mongodb";
import { buildBootstrapPlan } from "../persistence/bootstrap";

export interface BootstrapResult {
  collection: string;
  indexesCreated: number;
  error?: string;
}

export async function applyBootstrap(db: Db): Promise<BootstrapResult[]> {
  const plan = buildBootstrapPlan();
  const results: BootstrapResult[] = [];

  for (const item of plan) {
    try {
      const collection = db.collection(item.collection);
      const indexSpecs = item.indexes.map((idx) => ({
        key: idx.key,
        name: idx.name,
        unique: idx.unique ?? false,
        sparse: idx.sparse ?? false,
      }));

      await collection.createIndexes(indexSpecs);
      results.push({ collection: item.collection, indexesCreated: indexSpecs.length });
    } catch (err) {
      results.push({
        collection: item.collection,
        indexesCreated: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}
