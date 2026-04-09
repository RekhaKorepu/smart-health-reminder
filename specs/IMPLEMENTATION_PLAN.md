# Implementation Plan (Spec-Driven)

## 1. Document Control
- Product: Smart Medication, Health & Hydration Reminder System
- Version: 0.1 (Draft)
- Status: Review Required
- Date: 2026-04-09

## 2. Objective
Deliver production-ready implementation in increments, with each task traceable to approved requirement IDs (`FR-*`, `NFR-*`).

## 3. Assumptions
1. PRS and ARS are the source of truth for requirements and architecture.
2. Medication and hydration remain independent operational paths.
3. Phase reviews are mandatory before moving to the next phase.

## 4. Delivery Phases

### Phase 0: Project Foundation
Scope:
1. Baseline folder architecture for app/backend/services
2. Shared config, env handling, logging, linting, formatting
3. Test harness setup (unit + integration skeleton)

Mapped IDs:
1. NFR-004
2. NFR-005
3. NFR-006
4. NFR-007

Exit:
1. Build passes
2. Lint passes
3. Baseline test command passes

### Phase 1: Core Domain and Data Layer
Scope:
1. Domain models and validation schemas
2. Mongo collections and indexes
3. Event and status model (`PENDING`, `SENT`, `ACKED`, `SNOOZED`, `SKIPPED`, `MISSED`)
4. Idempotent persistence utilities

Mapped IDs:
1. FR-MED-001
2. FR-HYD-001
3. FR-REF-001
4. FR-ADH-003
5. NFR-001
6. NFR-008
7. NFR-009

Exit:
1. Schema validation tests pass
2. Index creation scripts verified

### Phase 2: Medication Stream (Independent Path A)
Scope:
1. Medication CRUD and scheduling APIs
2. Due event generation for medication schedule
3. Dose action APIs (confirm/snooze/skip)
4. Medication adherence counters

Mapped IDs:
1. FR-MED-001
2. FR-MED-002
3. FR-MED-003
4. FR-MED-004
5. FR-MED-005
6. FR-MED-006
7. FR-ADH-001
8. FR-ADH-002
9. FR-ADH-003

Exit:
1. Medication acceptance criteria test suite passes
2. Path isolation test for medication vs hydration passes

### Phase 3: Hydration Stream (Independent Path B)
Scope:
1. Hydration plan APIs and active window configuration
2. Interval due event generation for hydration
3. Intake logging and goal progress updates
4. Hydration adherence metrics

Mapped IDs:
1. FR-HYD-001
2. FR-HYD-002
3. FR-HYD-003
4. FR-HYD-004
5. FR-HYD-005
6. FR-HYD-006
7. FR-ADH-004

Exit:
1. Hydration acceptance criteria test suite passes
2. Path isolation test for hydration vs medication passes

### Phase 4: Refill and Reminder Orchestration
Scope:
1. Stock decrement/recalculation rules
2. Refill threshold and lead-time reminders
3. Escalation orchestration and channel sequencing
4. Delivery attempt storage and status tracking

Mapped IDs:
1. FR-REF-001
2. FR-REF-002
3. FR-REF-003
4. FR-REF-004
5. FR-REF-005
6. FR-REM-001
7. FR-REM-002
8. FR-REM-003
9. FR-REM-004
10. FR-REM-005
11. NFR-002
12. NFR-003

Exit:
1. Retry/fallback integration tests pass
2. Refill risk calculations verified

### Phase 5: Caregiver Dashboard and Reporting
Scope:
1. Caregiver authorization and linked-user views
2. Missed-event and emergency alerts
3. Daily/weekly split reports for medication and hydration
4. Delivery reliability report APIs

Mapped IDs:
1. FR-FAM-001
2. FR-FAM-002
3. FR-FAM-003
4. FR-FAM-004
5. FR-ADH-004
6. NFR-005
7. NFR-006

Exit:
1. Caregiver authz tests pass
2. Alert trigger rules verified
3. Reporting API tests pass

### Phase 6: Hardening and Release
Scope:
1. Observability dashboards and alerts
2. Performance tuning and p95 checks
3. Security checks and audit logging validation
4. End-to-end regression

Mapped IDs:
1. NFR-001
2. NFR-002
3. NFR-004
4. NFR-005
5. NFR-006
6. NFR-007
7. NFR-008
8. NFR-009

Exit:
1. SLO checks pass
2. Regression suite green
3. Release checklist approved

## 5. Requirement-to-Test Mapping Seeds
1. FR-MED-003 -> `TC-MED-SCH-01`, `TC-MED-SCH-02`
2. FR-MED-006 -> `TC-MED-ISO-01`
3. FR-HYD-003 -> `TC-HYD-REM-01`
4. FR-HYD-006 -> `TC-HYD-ISO-01`
5. FR-REF-003 -> `TC-REF-THR-01`
6. FR-REM-002 -> `TC-REM-ESC-01`
7. FR-REM-005 -> `TC-REM-POL-SEP-01`
8. FR-ADH-003 -> `TC-ADH-MISS-01`
9. FR-FAM-004 -> `TC-FAM-EMG-01`
10. NFR-001 -> `TC-NFR-REL-01`
11. NFR-002 -> `TC-NFR-TIME-01`
12. NFR-008 -> `TC-NFR-OFF-01`
13. NFR-009 -> `TC-NFR-ISO-01`

## 6. Branching and Commit Strategy
1. Use one branch per phase stream (for example, `feature/medication-path`).
2. Keep commits requirement-linked in commit messages (for example, `[FR-MED-003] add due-event generator`).
3. Open focused PRs with test evidence and requirement mapping.

## 7. Review Gates
1. Gate A: Approve Phase 0 and 1 setup before feature coding.
2. Gate B: Approve Medication stream before Hydration stream merge.
3. Gate C: Approve Refill + Reminder orchestration before Caregiver features.
4. Gate D: Approve final hardening metrics before release.

## 8. Risks and Mitigations
1. Risk: Channel provider instability
- Mitigation: Retry with fallback and provider abstraction.

2. Risk: Reminder drift under load
- Mitigation: Queue monitoring and worker autoscaling.

3. Risk: Coupling between medication and hydration paths
- Mitigation: Separate queues, workers, and integration tests.

4. Risk: Incomplete traceability
- Mitigation: Mandatory requirement/test mapping in PR template.

## 9. Next Step Suggested
Create `specs/PHASE_0_TASK_BREAKDOWN.md` with concrete tasks, owners, and estimates for Phase 0 and Phase 1.

Human review required before proceeding.
