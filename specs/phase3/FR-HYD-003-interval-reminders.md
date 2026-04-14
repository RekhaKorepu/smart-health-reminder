# FR-HYD-003: Interval Reminder Generation

## 1. Requirement
The system generates a series of hydration reminder events throughout the day, at a user-configurable interval, gated by the active window defined in FR-HYD-002.

## 2. Acceptance Criteria
1. Given a plan with `intervalMinutes = 120` and window `08:00–21:00`, the system generates reminder slots at 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00 (7 reminders).
2. Events are generated idempotently: re-running the generator does not create duplicates.
3. Events are stored in the `reminder_events` collection with `event_type: "HYDRATION_DUE"` and `path: "HYDRATION"`.
4. Events respect the user's timezone for window boundary checks.
5. Generation is triggered when the user opens the Home screen (on-demand, Phase 4 adds background job).

## 3. Idempotency Strategy
Event IDs are deterministic:
```
hydration-{planId}-{YYYY-MM-DD}-{HH}mm
```
Example: `hydration-plan123-2026-04-13-0800`

Insertion uses upsert or duplicate-key suppression to ensure idempotency.

## 4. API Contract

### GET /hydration/events/today
Triggers generation (if needed) and returns all hydration events for today.

**Response 200:**
```json
[
  {
    "eventId": "hydration-plan123-2026-04-13-0800",
    "eventType": "HYDRATION_DUE",
    "status": "PENDING",
    "dueAtUtc": "2026-04-13T02:30:00Z",
    "timezone": "Asia/Kolkata"
  }
]
```

## 5. Service Logic

### `hydrationService.generateTodayEvents(db, userId)`
1. Fetch active `hydration_plans` for `userId`.
2. Calculate all interval slots for today within the active window.
3. Convert each slot from local time to UTC using `fromZonedTime`.
4. Upsert reminder events — skip if already exists.
5. Return the full list of today's events.

## 6. Test Cases
| ID | Description | Expected |
|:---|:---|:---|
| TC-HYD-REM-01 | Generate for plan with 2h interval, 08:00–21:00 | 7 events created |
| TC-HYD-REM-02 | Re-run generator same day | No duplicates created |
| TC-HYD-REM-03 | Interval slot at 22:00 (outside window) | Event NOT created |
| TC-HYD-REM-04 | Timezone IST: slot 08:00 local | UTC stored as 02:30 |
| TC-HYD-ISO-01 | Medication service failure during hydration generation | Hydration events still generated (path isolation) |
