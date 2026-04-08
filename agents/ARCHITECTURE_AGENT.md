# Architecture Agent (Spec-Driven Development)

## 1. Mission
Create and maintain a reliable, elderly-friendly Smart Medication, Health, and Hydration Reminder System using a spec-driven workflow.

This agent does not provide medical advice. It supports adherence and communication only.

## 2. Working Mode
The agent works in phases and must stop for explicit human review after each phase before proceeding.

Review checkpoints are mandatory.

## 3. Product Scope
Primary capabilities:
1. Medication scheduling and intake tracking
2. Hydration reminders and consumption tracking
3. Multi-channel reminders (push, SMS, WhatsApp, voice)
4. Medication refill reminders
5. Adherence confirmation and reporting
6. Family dashboard and escalations

Future scope:
1. OCR prescription parsing
2. Pill identification by camera
3. Photo-based confirmation
4. Personalized voice content

## 4. Architecture Principles
1. Reliability first: reminders should be delivered with retries and fallback channels.
2. Simplicity first: UI and flows optimized for elderly users.
3. Auditability: all reminders, confirmations, and misses are traceable.
4. Privacy by design: minimum data collection and protected storage.
5. Channel abstraction: notification providers can be swapped without core logic changes.
6. Offline tolerance: mobile app can record actions and sync later.

## 5. Proposed High-Level Architecture

### Client Layer
- React Native (Expo) app
- Roles: user, caregiver/family
- Features: schedules, confirmations, hydration logs, dashboard, notifications

### API Layer
- Backend API (FastAPI recommended for scheduler + AI-friendly ecosystem; Node.js remains a viable alternative)
- Responsibilities: auth, profile, schedules, logs, reports, caregiver access, channel orchestration

### Job/Scheduler Layer
- Background scheduler service for dose times, hydration intervals, and refill alerts
- Retry and escalation orchestration

### Notification Layer
- Push: Firebase Cloud Messaging
- SMS/Voice: Twilio
- WhatsApp: WhatsApp Business API provider
- Unified provider adapter interface

### Data Layer
- MongoDB
- Collections for users, medicines, schedules, events, hydration, refill, notifications, caregivers

### Observability Layer
- Centralized logs, delivery metrics, missed-dose metrics, provider error rates

## 6. Core Domain Model (Initial)
1. User
2. CareProfile
3. CaregiverLink
4. Medication
5. MedicationSchedule
6. DoseEvent
7. HydrationPlan
8. HydrationEvent
9. RefillEvent
10. ReminderEvent
11. ConfirmationEvent
12. ChannelEndpoint
13. EscalationPolicy
14. WeeklyAdherenceReport

## 7. Critical Flows

### Medication Reminder Flow
1. Scheduler generates reminder at due time.
2. App push sent as primary channel.
3. If not acknowledged in grace window, send SMS/WhatsApp.
4. If still unacknowledged and policy requires, place voice call.
5. Log all attempts and final status.
6. Notify caregiver based on escalation policy.

### Hydration Flow
1. Hydration interval creates reminder events.
2. User confirms intake with one tap.
3. Daily goal progress updates in near real time.
4. Repeated misses trigger adaptive nudges and optional caregiver alerts.

### Refill Flow
1. Medication stock is initialized and tracked against dosage events.
2. Remaining stock is recalculated after confirmations/skips.
3. Refill reminder triggers at configured threshold or lead-time.
4. Optional caregiver low-stock escalation is applied for critical medications.

## 8. Data and Security Baseline
1. Encrypt in transit (TLS) and at rest where supported.
2. Role-based authorization (user vs caregiver).
3. PII minimization and masked logs.
4. Immutable event history for adherence records.
5. Configurable retention and deletion policies.

## 9. Spec-Driven Delivery Workflow

### Phase 0: Vision and Boundaries
Deliverables:
1. Problem statement
2. User personas (elderly user, caregiver)
3. Out-of-scope list

Exit criteria:
1. Stakeholder-approved scope statement

### Phase 1: Product Requirements Spec (PRS)
Deliverables:
1. Functional requirements by feature
2. Non-functional requirements (latency, reliability, usability)
3. Acceptance criteria per feature

Exit criteria:
1. Every requirement mapped to measurable acceptance criteria

### Phase 2: Architecture Spec (ARS)
Deliverables:
1. Context/container diagrams
2. Service boundaries
3. Data model and index strategy
4. Failure-handling strategy
5. Channel integration contracts

Exit criteria:
1. Key risks listed with mitigations
2. Architecture decisions captured in ADRs

### Phase 3: API and Event Contracts
Deliverables:
1. OpenAPI spec
2. Scheduler event schema
3. Notification adapter interface spec

Exit criteria:
1. Contract tests defined

### Phase 4: Implementation Plan
Deliverables:
1. Milestones and sprint slices
2. Test strategy (unit, integration, end-to-end)
3. Release readiness checklist

Exit criteria:
1. Traceability matrix from requirements to tests

## 10. Architecture Decision Records (ADR) Queue
Initial ADRs to create:
1. Backend runtime choice: FastAPI vs Node.js
2. Scheduler mechanism: queue + worker strategy
3. Notification failover policy and retry windows
4. Offline sync strategy in mobile app
5. Event sourcing level for adherence tracking

## 11. Quality Gates
1. No feature implementation starts without approved PRS section.
2. No API implementation starts before contract approval.
3. No release without reminder delivery reliability report.
4. No caregiver alert feature without privacy review.

## 12. Risks and Mitigations
1. Missed reminders due to provider outage
- Mitigation: multi-provider fallback and retry backoff.

2. Elderly usability friction
- Mitigation: large-touch UI, voice-first option, minimal action steps.

3. Notification fatigue
- Mitigation: adaptive reminder intensity and quiet-hour policies.

4. Data privacy concerns
- Mitigation: least-privilege access, audit trails, retention controls.

## 13. Definition of Done (Architecture Stage)
1. Approved PRS and ARS
2. Approved ADRs for core technology choices
3. API contracts and event schemas reviewed
4. Test strategy and release gates defined
5. Traceability matrix created

## 14. Next Step Suggested by Agent
Create `specs/ADR-001.md` to `specs/ADR-005.md` and then draft API/event contracts aligned to the approved PRS and ARS.

Human review required before this next step.
