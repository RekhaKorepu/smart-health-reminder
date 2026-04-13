# Phase-1 Task Breakdown

## 1. Document Control
- Product: Smart Medication, Health & Hydration Reminder System
- Phase: 1 (Core Domain and Data Layer)
- Version: 0.1 (Draft)
- Status: Review Required
- Date: 2026-04-09
- Source: `agents/ARCHITECTURE_AGENT.md`, `specs/PHASE_1_ARCHITECT_PLAN.md`

## 2. Phase Objective
Turn the Phase-1 architecture plan into executable engineering tasks that establish domain schemas, persistence contracts, event lifecycle rules, and reliability foundations for later feature work.

## 3. Delivery Rules
1. Medication and hydration paths must remain isolated at the data and job-contract level.
2. Every implementation task must map to at least one approved requirement ID.
3. Every completed work package must include tests before review.
4. No Phase-2 feature coding begins before Phase-1 review sign-off.

## 4. Team Placeholders
1. Architect Owner: `TBD`
2. Developer Owner: `TBD`
3. Reviewer: `TBD`

## 5. Work Package Breakdown

### WP-1: Domain Schema Definition
Goal:
Define canonical domain models and validation rules for Phase-1 entities.

Mapped IDs:
1. `FR-MED-001`
2. `FR-HYD-001`
3. `FR-REF-001`

Tasks:
1. Create TypeScript domain types/interfaces for `Medication`, `MedicationSchedule`, `HydrationPlan`, `ReminderEvent`, `ConfirmationEvent`, and `RefillEvent`.
2. Define enums for lifecycle states and event types.
3. Define validation rules for required fields, ranges, and timezone fields.
4. Add schema test cases for valid payloads.
5. Add schema test cases for invalid payloads.

Dependencies:
1. None

Estimated Effort:
1. 1.5 to 2 days

Exit Deliverables:
1. Typed domain model package
2. Validation rule set
3. Schema validation tests

Review Gate:
1. Approve canonical entity shapes before moving to WP-2.

### WP-2: Persistence Model and Index Design
Goal:
Define storage collections, repository boundaries, and high-value indexes.

Mapped IDs:
1. `FR-MED-001`
2. `FR-HYD-001`
3. `FR-REF-001`
4. `NFR-001`
5. `NFR-009`

Tasks:
1. Create collection specs for all Phase-1 entities.
2. Define unique constraints and index strategy for due-event lookups and idempotency.
3. Create repository interface contracts for create, update, get-by-id, and status transition operations.
4. Add startup/bootstrap logic spec for index creation.
5. Add index verification tests.

Dependencies:
1. WP-1

Estimated Effort:
1. 1.5 to 2 days

Exit Deliverables:
1. Persistence contract definitions
2. Index creation plan
3. Repository boundary document
4. Index verification tests

Review Gate:
1. Approve collection and index model before moving to WP-3.

### WP-3: Event Lifecycle and Miss Detection
Goal:
Define reminder event state progression and missed-event handling.

Mapped IDs:
1. `FR-ADH-003`
2. `NFR-001`

Tasks:
1. Define canonical state transitions for reminders and confirmations.
2. Define rules for `CONFIRM`, `SNOOZE`, `SKIP`, and `MISSED`.
3. Define grace-window and miss-window processing hooks.
4. Add lifecycle transition guard tests.
5. Add invalid transition tests.

Dependencies:
1. WP-1
2. WP-2

Estimated Effort:
1. 1 to 1.5 days

Exit Deliverables:
1. State transition model
2. Miss-detection rules
3. Lifecycle unit tests

Review Gate:
1. Approve lifecycle rules before moving to WP-4.

### WP-4: Idempotency and Offline-Safe Persistence
Goal:
Ensure duplicate events and late-sync confirmation flows are safe.

Mapped IDs:
1. `NFR-008`
2. `NFR-001`

Tasks:
1. Define request idempotency key format and storage strategy.
2. Define duplicate event replay behavior.
3. Define late-sync acceptance rules for offline confirmation flows.
4. Add tests for duplicate write suppression.
5. Add tests for offline replay ordering.

Dependencies:
1. WP-2
2. WP-3

Estimated Effort:
1. 1 to 1.5 days

Exit Deliverables:
1. Idempotency strategy spec
2. Conflict-handling rules
3. Offline-safe persistence tests

Review Gate:
1. Approve idempotency policy before moving to WP-5.

### WP-5: Path Isolation and Reliability Controls
Goal:
Lock in the non-blocking behavior between medication and hydration paths.

Mapped IDs:
1. `FR-MED-006`
2. `FR-HYD-006`
3. `NFR-009`
4. `NFR-001`

Tasks:
1. Define queue/topic names for medication, hydration, and refill events.
2. Define separate worker pool boundaries and dead-letter contracts.
3. Define failure isolation rule set between medication and hydration paths.
4. Add isolation tests for worker/path failures.
5. Add replay-readiness metadata definition.

Dependencies:
1. WP-2
2. WP-3
3. WP-4

Estimated Effort:
1. 1 to 1.5 days

Exit Deliverables:
1. Queue/topic contract definitions
2. Isolation policy rules
3. Path isolation test suite

Review Gate:
1. Approve isolation verification before Phase-1 closure.

## 6. Milestone Sequence
1. Milestone M1: `WP-1` complete and reviewed
2. Milestone M2: `WP-2` complete and reviewed
3. Milestone M3: `WP-3` and `WP-4` complete and reviewed
4. Milestone M4: `WP-5` complete and reviewed

## 7. Proposed Execution Order
1. Start `WP-1`
2. Move to `WP-2`
3. Execute `WP-3`
4. Execute `WP-4`
5. Finish with `WP-5`

Reasoning:
1. Schema clarity must come before persistence and lifecycle logic.
2. Persistence must exist before idempotency rules can be finalized.
3. Isolation tests depend on event and persistence contracts already being stable.

## 8. Test Matrix Seed
1. `TC-DOM-SCHEMA-01`: valid entity creation
2. `TC-DOM-SCHEMA-02`: invalid payload rejection
3. `TC-IDX-01`: critical indexes created successfully
4. `TC-EVT-LIFECYCLE-01`: valid lifecycle transitions
5. `TC-EVT-LIFECYCLE-02`: invalid lifecycle transitions blocked
6. `TC-IDEMP-01`: duplicate request suppressed
7. `TC-NFR-OFF-01`: offline confirmation replay accepted safely
8. `TC-NFR-ISO-01`: medication failure does not block hydration path
9. `TC-NFR-ISO-02`: hydration failure does not block medication path

## 9. Artifacts Expected at End of Phase-1
1. Domain model source files
2. Validation schemas
3. Repository contracts
4. Index specification and bootstrap plan
5. Event lifecycle and idempotency rules
6. Path isolation verification tests
7. Phase-1 readiness summary

## 10. Risks to Watch During Execution
1. Over-designing repository abstractions before contracts stabilize
2. Mixing domain logic with infrastructure logic too early
3. Missing timezone rules in base entities
4. Weak uniqueness guarantees causing duplicate reminder events

## 11. Definition of Done
1. All five work packages are completed and reviewed.
2. Each task has requirement mapping and test coverage.
3. Phase-1 architectural artifacts are stable enough for Developer Agent execution.
4. Review sign-off is recorded before Phase-2 or feature implementation.

## 12. Next Step
Begin `WP-1` execution or create `specs/PHASE_1_EXECUTION_CHECKLIST.md` if you want an even more operational handoff for the Developer Agent.

Human review required before proceeding.
