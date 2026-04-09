# Product Requirements Spec (PRS)

## 1. Document Control
- Product: Smart Medication, Health & Hydration Reminder System
- Version: 0.2 (Draft)
- Status: Review Required
- Date: 2026-04-08
- Owner: Product + Architecture

## 2. Purpose
Define functional and non-functional requirements for an elderly-friendly mobile system that improves medication adherence, hydration habits, and caregiver visibility.

This product is assistive and not a medical authority.

## 3. Problem Statement
Many users, especially elderly people, miss medicines and under-hydrate due to complex routines and limited caregiver visibility. The system must provide reliable reminders, simple confirmations, refill alerts, and escalation workflows to reduce preventable misses.

## 4. Personas
1. Elderly User
- Needs simple interactions, large touch targets, and optional voice-first confirmations.
- May have intermittent connectivity and low comfort with technology.

2. Caregiver / Family Member
- Needs timely alerts when adherence risk increases.
- Wants weekly summaries and near-real-time status.

3. Admin / Support (future)
- Needs observability, audit logs, and provider delivery diagnostics.

## 5. Scope
In scope (MVP):
1. Medication scheduling and dose reminders
2. Medication stock tracking and refill reminders
3. Hydration reminders and tracking
4. Multi-channel reminder fallback (push, SMS, WhatsApp, voice)
5. Confirmation and adherence tracking
6. Family dashboard and escalation alerts

Out of scope (MVP):
1. OCR prescription extraction
2. Pill identification by camera
3. Photo proof confirmation
4. Clinical decision support

## 6. Functional Requirements

### 6.1 Medication Reminder Path (Independent Path A)
FR-MED-001: User can create a medication with name, dosage text, instructions, start date, and optional end date.  
FR-MED-002: User can schedule medication doses daily or weekly with time-of-day slots (morning, afternoon, evening, night) and custom times.  
FR-MED-003: System generates medication reminder events at scheduled times in user timezone.  
FR-MED-004: User can confirm, snooze, or skip a medication dose.  
FR-MED-005: System records complete medication dose history (due time, action time, action type, channel attempts).  
FR-MED-006: Medication reminder pipeline operates independently of hydration reminder pipeline.

Acceptance Criteria:
1. New medication schedule appears in user plan within 2 seconds after save.
2. Due medication reminders are created for all active schedules with no duplicate event IDs.
3. Confirmed medication doses are visible in history immediately after action.
4. Medication reminders continue on schedule even if hydration reminder subsystem is unavailable.

### 6.2 Hydration Reminder Path (Independent Path B)
FR-HYD-001: User sets daily hydration goal (ml or glasses).  
FR-HYD-002: User sets reminder interval and active reminder window (for example, 8:00 to 21:00).  
FR-HYD-003: System sends hydration reminders at configured intervals.  
FR-HYD-004: User logs consumed quantity with one-tap presets.  
FR-HYD-005: Dashboard shows daily hydration progress and completion status.  
FR-HYD-006: Hydration reminder pipeline operates independently of medication reminder pipeline.

Acceptance Criteria:
1. Hydration reminder schedule respects active window boundaries.
2. Logged water updates daily progress in less than 2 seconds.
3. Goal completion state changes automatically once target is met.
4. Hydration reminders continue on schedule even if medication reminder subsystem is unavailable.

### 6.3 Medication Stock and Refill Reminders
FR-REF-001: User can store medicine stock count (for example number of tablets/sachets).  
FR-REF-002: System estimates remaining stock based on dosage plan and confirmed/skipped doses.  
FR-REF-003: System sends refill reminders when remaining stock reaches configured threshold.  
FR-REF-004: User can configure lead-time reminders (for example, 3 days before expected run-out).  
FR-REF-005: Optional caregiver alert can be sent for low-stock critical medications.

Acceptance Criteria:
1. Refill alert is triggered when remaining dose count is less than or equal to configured threshold.
2. Estimated run-out date recalculates within 2 seconds after dose confirmation or schedule change.
3. Duplicate refill alerts for the same threshold state are prevented.
4. Caregiver low-stock alert is sent only when caregiver linkage and permissions are valid.

### 6.4 Multi-Channel Reminder System
FR-REM-001: Primary channel is push notification.  
FR-REM-002: If no confirmation within grace period, system attempts backup channels based on policy.  
FR-REM-003: Supported backup channels: SMS, WhatsApp, voice call.  
FR-REM-004: All delivery attempts and outcomes are persisted.  
FR-REM-005: Medication and hydration reminders can use different escalation policies.

Acceptance Criteria:
1. Reminder escalation starts only after grace period expires.
2. Channel attempts follow configured priority order.
3. Delivery outcome is visible in reminder event log for each channel attempt.
4. Medication escalation policy updates do not change hydration policy values unless explicitly edited.

### 6.5 Confirmation and Adherence Tracking
FR-ADH-001: User receives prompt asking for completion confirmation.  
FR-ADH-002: One-tap confirmation is supported from notification and in-app screen.  
FR-ADH-003: System marks missed events after configured miss window.  
FR-ADH-004: Daily and weekly adherence summaries are generated separately for medication and hydration.

Acceptance Criteria:
1. Confirm action requires at most 2 interactions from lock-screen notification path.
2. Missed status is assigned automatically when no confirm/skip exists by miss window end.
3. Weekly report includes total due, confirmed, skipped, and missed counts split by medication and hydration.

### 6.6 Family Dashboard
FR-FAM-001: Authorized caregivers can view dependent medication adherence and hydration status.  
FR-FAM-002: Caregiver receives alerts for missed medication events based on escalation policy.  
FR-FAM-003: Caregiver receives weekly summary for linked users.  
FR-FAM-004: Emergency alert triggers on repeated missed critical medication events.

Acceptance Criteria:
1. Status updates are reflected for caregiver within 60 seconds of user action.
2. Miss alerts are sent only to linked and authorized caregivers.
3. Emergency alert triggers after threshold (default: 2 consecutive critical misses) and logs reason.

## 7. Non-Functional Requirements
NFR-001 Reliability: Reminder event generation success rate >= 99.5% monthly.  
NFR-002 Timing Accuracy: Reminder dispatch starts within +/-60 seconds of scheduled due time under normal load.  
NFR-003 Delivery Resilience: If one channel provider fails, fallback attempt begins within configured retry delay (default 2 minutes).  
NFR-004 Performance: Core dashboard APIs p95 < 500 ms at target MVP load.  
NFR-005 Security: All APIs require authenticated access; role-based authorization enforced for caregiver data.  
NFR-006 Privacy: Sensitive fields are masked in logs; access to health history is audit logged.  
NFR-007 Accessibility: Large text mode and high-contrast mode supported; touch targets minimum 44x44 points.  
NFR-008 Offline Tolerance: User confirmation actions taken offline are queued and synced when connectivity resumes, preserving event order.  
NFR-009 Path Isolation: Medication and hydration scheduling pipelines are isolated; failure in one path must not block the other.

## 8. Independent Operational Paths

### 8.1 Medication Path
1. Dose schedule becomes due.
2. Medication reminder is sent (push first).
3. User confirms/snoozes/skips medication.
4. Adherence status is updated for medication metrics.
5. Stock count is recalculated and refill warning may be triggered.
6. If missed, escalation policy for medication is applied and caregiver alert may trigger.

### 8.2 Hydration Path
1. Hydration interval becomes due within active window.
2. Hydration reminder is sent.
3. User logs water intake quantity.
4. Daily hydration progress is updated.
5. If repeatedly missed, hydration-specific escalation policy is applied.

## 9. Reporting Requirements
1. Daily medication adherence report per user.
2. Daily hydration completion report per user.
3. Weekly adherence summary for user and caregivers (medication and hydration split).
4. Reminder delivery report (channel success/failure, retries, lag).
5. Refill risk report (medications near stock depletion).

## 10. Compliance and Safety Notice
1. Show in-app notice: system is assistive, not a medical authority.
2. Require explicit user acknowledgment on first setup.

## 11. Traceability Seed (Requirement to Test)
1. FR-MED-003 -> TC-MED-SCH-01, TC-MED-SCH-02
2. FR-MED-006 -> TC-MED-ISO-01
3. FR-HYD-003 -> TC-HYD-REM-01
4. FR-HYD-006 -> TC-HYD-ISO-01
5. FR-REF-003 -> TC-REF-THR-01
6. FR-REF-004 -> TC-REF-LEAD-01
7. FR-REM-002 -> TC-REM-ESC-01, TC-REM-ESC-02
8. FR-REM-005 -> TC-REM-POL-SEP-01
9. FR-ADH-003 -> TC-ADH-MISS-01
10. FR-FAM-004 -> TC-FAM-EMG-01
11. NFR-001 -> TC-NFR-REL-01
12. NFR-002 -> TC-NFR-TIME-01
13. NFR-008 -> TC-NFR-OFF-01
14. NFR-009 -> TC-NFR-ISO-01

## 12. Open Decisions (For ADR Phase)
1. FastAPI vs Node.js for backend runtime.
2. Scheduler implementation approach and queue technology.
3. Exact escalation timings for medication vs hydration paths.
4. Critical vs non-critical medication tagging policy.
5. Caregiver onboarding and consent workflow details.

## 13. Review Checkpoint
Approval required before creating:
1. `specs/ARCHITECTURE_SPEC.md`
2. `specs/ADR-001.md` to `specs/ADR-005.md`
3. API contract draft in `specs/`
