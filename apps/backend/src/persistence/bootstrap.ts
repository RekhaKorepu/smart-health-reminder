import { COLLECTION_SPECS } from "./collections";
import type { CollectionIndexSpec, CollectionName } from "./types";

export interface CollectionBootstrapPlan {
  collection: CollectionName;
  indexes: CollectionIndexSpec[];
}

export function buildBootstrapPlan(): CollectionBootstrapPlan[] {
  return COLLECTION_SPECS.map((collection) => ({
    collection: collection.name,
    indexes: collection.indexes,
  }));
}

export function getAllIndexNames(): string[] {
  return COLLECTION_SPECS.flatMap((collection) =>
    collection.indexes.map((index) => `${collection.name}:${index.name}`),
  );
}
