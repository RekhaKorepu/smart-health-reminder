# Feature Specification: Phase 2 - Medication Stream

## 1. Objective
Implement a robust, independent medication management path providing CRUD for medicines, flexible scheduling, and an actionable dose tracking system.

## 2. Functional Requirements

### 2.1 Medication Management
| ID | Requirement | Status |
|:---|:---|:---|
| **FR-MED-001** | User can create/edit medications with name, dosage, instructions, and stock count. | IMPLEMENTED |
| **FR-REF-001** | Support for tracking remaining stock and refill thresholds. | IMPLEMENTED |

**API Contracts:**
- `GET /medications` - List all active medications.
- `POST /medications` - Create medication.
- `GET /medications/:id` - Fetch details.
- `PATCH /medications/:id` - Update details.
- `DELETE /medications/:id` - Logical deactivate.

### 2.2 Flexible Scheduling
| ID | Requirement | Status |
|:---|:---|:---|
| **FR-MED-002** | Support for DAILY and WEEKLY (selected days) schedules. | IMPLEMENTED |
| **FR-MED-002b** | Support for standard time slots (Morning, Afternoon, Evening, Night) and Custom (HH:mm) times. | IMPLEMENTED |

**API Contracts:**
- `POST /medications/:id/schedules` - Create a schedule for a med.
- `GET /medications/:id/schedules` - List schedules for a med.
- `DELETE /medications/:id/schedules/:sid` - Deactivate a schedule.

### 2.3 Dose Event Workflow
| ID | Requirement | Status |
|:---|:---|:---|
| **FR-MED-003** | Auto-generate dose reminders based on active schedules. | IMPLEMENTED |
| **FR-MED-004** | Actions: Confirm (ACKED), Snooze (SNOOZED), Skip (SKIPPED). | IMPLEMENTED |
| **FR-ADH-003** | Auto-mark PENDING events as MISSED after the "Miss Window" expires. | IMPLEMENTED |

**Logic Rules (Independency & Idempotency):**
- Event IDs are deterministic: `dose-{scheduleId}-{YYYY-MM-DD}`.
- Transitions must pass domain guards (e.g., cannot skip a dose that is already taken).
- "Snoozed" doses remain actionable until a terminal outcome is reached.

**API Contracts:**
- `GET /doses` - Generator + List for today.
- `POST /doses/:id/confirm` - Marks as Taken (+ decrements stock).
- `POST /doses/:id/snooze` - Updates status to SNOOZED.
- `POST /doses/:id/skip` - Updates status to SKIPPED.

### 2.4 Adherence Analytics
| ID | Requirement | Status |
|:---|:---|:---|
| **FR-ADH-004** | Calculate adherence rates (0-100%) based on ACKED vs (total - SNOOZED). | IMPLEMENTED |

---

## 3. Data Model (MongoDB)

### 3.1 `medications`
- `name`: string
- `dosage_text`: string
- `stock_count`: number (decrements on ACKED)
- `refill_threshold`: number (for future Phase 4 alerts)

### 3.2 `medication_schedules`
- `schedule_type`: "DAILY" | "WEEKLY"
- `time_slot`: "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT" | "CUSTOM"
- `custom_time_24h`: "HH:mm" (optional)
- `timezone`: IANA string

### 3.3 `reminder_events`
- `event_id`: Unique string
- `due_at_utc`: ISO string
- `status`: "PENDING" | "SENT" | "ACKED" | "SNOOZED" | "SKIPPED" | "MISSED"

## 4. UI/UX Definitions
1. **Home Screen**: Consolidated "Due Today" list using `DoseEventCard`.
2. **Medication List**: Filterable inventory showing stock levels.
3. **Add Medication Wizard**: 3-step form (Details -> Schedule -> Review).
4. **Action Sheet**: Accessible pop-up with large touch targets (TouchTarget: 48).

---
**Status**: FINALIZED (Phase 2 Implementation Complete)
