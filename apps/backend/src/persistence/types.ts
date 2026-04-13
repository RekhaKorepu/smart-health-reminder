export type CollectionName =
  | "users"
  | "caregiver_links"
  | "medications"
  | "medication_schedules"
  | "dose_events"
  | "hydration_plans"
  | "hydration_events"
  | "refill_events"
  | "reminder_events"
  | "confirmation_events"
  | "delivery_attempts"
  | "escalation_policies"
  | "audit_logs";

export type IndexDirection = 1 | -1;

export interface CollectionIndexSpec {
  name: string;
  key: Record<string, IndexDirection>;
  unique?: boolean;
  sparse?: boolean;
}

export interface CollectionSpec {
  name: CollectionName;
  description: string;
  primaryUse: string;
  indexes: CollectionIndexSpec[];
}

export interface RepositoryMethodSpec {
  name: string;
  purpose: string;
}

export interface RepositoryBoundarySpec {
  name: string;
  entity: string;
  methods: RepositoryMethodSpec[];
}
