# Phase-1 Architect Plan (Core Domain and Data Layer)

## 1. Document Control
- Product: Smart Medication, Health & Hydration Reminder System
- Phase: 1 (Core Domain and Data Layer)
- Version: 0.1 (Draft)
- Status: Review Required
- Date: 2026-04-09

## 2. Phase-1 Goal
Design and establish the core domain model, persistence architecture, and event backbone needed for later feature implementation, while preserving strict medication/hydration path isolation.

## 3. Phase-1 Scope
In scope:
1. Canonical domain entities and relationships
2. MongoDB collection schemas and index design
3. Event/state model for reminders and confirmations
4. Idempotency strategy for writes and event processing
5. Baseline API contract shape for domain CRUD operations
6. Traceability mapping to `FR-*` and `NFR-*`

Out of scope:
1. Full notification provider integrations
2. End-user UI feature completion
3. Advanced AI/OCR capabilities
4. Production-level reporting dashboards

## 4. Requirements Coverage (Phase-1)
Primary requirement IDs:
1. `FR-MED-001`
2. `FR-HYD-001`
3. `FR-REF-001`
4. `FR-ADH-003`
5. `NFR-001`
6. `NFR-008`
7. `NFR-009`

## 5. Architecture Decisions to Lock in Phase-1
1. Domain-first data model with explicit event objects (`dose_events`, `hydration_events`, `reminder_events`).
2. Separate queue topics/workers for medication and hydration pipelines.
3. Idempotent write policy using request keys and unique event identifiers.
4. UTC storage for all timestamps plus explicit user timezone field.
5. Soft-delete and status-based lifecycle to preserve auditability.

## 6. Target Architecture Outputs

### 6.1 Domain Model Package
Deliverables:
1. Entity definitions for `Medication`, `MedicationSchedule`, `HydrationPlan`, `ReminderEvent`, `ConfirmationEvent`, `RefillEvent`.
2. Enum/state definitions for reminder lifecycle statuses.
3. Validation rules for required fields and value constraints.

### 6.2 Persistence Package
Deliverables:
1. Mongo collection specifications.
2. Migration/bootstrap scripts for indexes.
3. Repository interfaces with idempotent upsert behavior.

### 6.3 Event Backbone Package
Deliverables:
1. Canonical event schema (`event_id`, `event_type`, `due_at_utc`, `policy_id`, `payload`).
2. State transition rules:
`PENDING -> SENT -> ACKED | SNOOZED | SKIPPED | MISSED`.
3. Dead-letter and replay metadata fields.

### 6.4 Contract Seed Package
Deliverables:
1. API request/response DTO skeletons for core entities.
2. Contract-validation tests for domain payload shape.
3. Error contract format (`code`, `message`, `context`, `trace_id`).

## 7. Collection and Index Strategy (Phase-1 Baseline)
Collections:
1. `users`
2. `caregiver_links`
3. `medications`
4. `medication_schedules`
5. `dose_events`
6. `hydration_plans`
7. `hydration_events`
8. `refill_events`
9. `reminder_events`
10. `confirmation_events`
11. `delivery_attempts`
12. `escalation_policies`
13. `audit_logs`

Priority indexes:
1. `dose_events(user_id, due_at_utc, status)`
2. `hydration_events(user_id, due_at_utc, status)`
3. `reminder_events(event_id)` unique
4. `delivery_attempts(reminder_event_id, attempt_no)` unique
5. `medications(user_id, is_active, next_refill_at_utc)`
6. `caregiver_links(caregiver_user_id, dependent_user_id)` unique

## 8. Path Isolation Blueprint
1. Independent scheduler topics:
`medication_due`, `hydration_due`, `refill_due`.
2. Separate worker pools for medication and hydration.
3. Independent dead-letter queues per path.
4. Contract rule: medication-path outages cannot block hydration scheduling and vice versa.

## 9. Work Packages

### WP-1: Domain Schema Definition
Mapped IDs:
1. `FR-MED-001`
2. `FR-HYD-001`
3. `FR-REF-001`

Outputs:
1. Typed domain models
2. Schema validation tests

### WP-2: Event and State Lifecycle
Mapped IDs:
1. `FR-ADH-003`
2. `NFR-001`

Outputs:
1. Event contracts
2. Transition guard rules
3. Miss-detection state mechanics

### WP-3: Idempotency and Offline-Safe Persistence
Mapped IDs:
1. `NFR-008`

Outputs:
1. Request idempotency key strategy
2. Upsert conflict handling
3. Late-sync acceptance logic

### WP-4: Isolation and Reliability Controls
Mapped IDs:
1. `NFR-009`
2. `NFR-001`

Outputs:
1. Separate queue definitions
2. Path-failure isolation tests
3. Retry/replay metadata readiness

## 10. Test Strategy for Phase-1
1. Schema tests for all domain entities.
2. Index verification tests (startup/bootstrap checks).
3. Event transition unit tests for valid and invalid paths.
4. Idempotency tests (duplicate request/event replay safety).
5. Isolation tests (medication worker failure does not block hydration events).

Test IDs to seed:
1. `TC-DOM-SCHEMA-01`
2. `TC-EVT-LIFECYCLE-01`
3. `TC-IDEMP-01`
4. `TC-NFR-OFF-01`
5. `TC-NFR-ISO-01`

## 11. Milestones and Review Gates

### Milestone M1: Domain and Schema Baseline
Exit:
1. Domain models finalized
2. Validation tests passing

### Milestone M2: Collections and Indexes
Exit:
1. Index scripts validated in local environment
2. Repository interfaces implemented

### Milestone M3: Event Lifecycle and Idempotency
Exit:
1. Transition engine validated
2. Idempotency tests passing

### Milestone M4: Isolation Verification
Exit:
1. Path isolation tests passing
2. Phase-1 readiness report completed

Review gate after each milestone is mandatory.

## 12. Risks and Mitigations
1. Risk: Over-coupled data model between medication and hydration.
- Mitigation: independent event collections and queue topics.

2. Risk: Duplicate reminders due to race conditions.
- Mitigation: unique indexes + idempotency keys + guarded upserts.

3. Risk: Missing auditability for adherence disputes.
- Mitigation: append-only event history + immutable action logs.

4. Risk: Rework from unclear contracts.
- Mitigation: contract tests and schema-first DTO definitions in this phase.

## 13. Definition of Done (Phase-1)
1. All Phase-1 requirement IDs mapped to architecture artifacts.
2. Domain schemas and index strategy implemented and tested.
3. Event/state lifecycle model implemented with tests.
4. Idempotency and offline-safe persistence validated.
5. Medication/hydration isolation checks passing.
6. Review sign-off recorded before Phase-2 begins.

## 14. Next Step
Create `specs/PHASE_1_TASK_BREAKDOWN.md` with concrete engineering tasks, estimates, and owner placeholders for WP-1 to WP-4.

Human review required before proceeding.
