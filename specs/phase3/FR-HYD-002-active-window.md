# FR-HYD-002: Active Reminder Window Configuration

## 1. Requirement
User sets a daily start and end time to define when hydration reminders are allowed to fire.

## 2. Acceptance Criteria
1. User can configure a start time (e.g., 08:00) and end time (e.g., 21:00).
2. The system must NOT generate hydration reminder events outside this window.
3. Start time must be before end time.
4. Times must be in "HH:mm" 24-hour format.
5. The window is stored as part of the `hydration_plans` document (not a separate collection).

## 3. Business Rules
- If the due time of an interval slot falls outside the window, skip event generation for that slot.
- If no window is configured, assume a safe default of 08:00–21:00.
- The window is evaluated in the user's own timezone (from `hydration_plans.timezone`).

## 4. API Contracts
Active window is configured as part of the `POST /hydration/plan` endpoint (defined in FR-HYD-001).

**Validation rules for window fields:**
| Field | Rule |
|:---|:---|
| `startTime24h` | Must match `/^([01]\d|2[0-3]):([0-5]\d)$/` |
| `endTime24h` | Must match regex AND be after `startTime24h` |

**400 error examples:**
```json
{ "field": "endTime24h", "message": "End time must be after start time." }
{ "field": "startTime24h", "message": "Must be in HH:mm format." }
```

## 5. UI/UX
- **Control**: Two time pickers — "Wake up time" and "Bedtime".
- **Labels**: Use friendly language like "Start reminders at" and "Stop reminders at".
- **Validation**: Inline error shown if end is not after start.

## 6. Test Cases
| ID | Description | Expected |
|:---|:---|:---|
| TC-HYD-WIN-01 | Set window 08:00 to 21:00 | Stored and returned correctly |
| TC-HYD-WIN-02 | Set window 21:00 to 08:00 (end before start) | 400 validation error |
| TC-HYD-WIN-03 | Set window with bad format "8:0" | 400 validation error |
| TC-HYD-WIN-04 | Reminder at 22:00 when window is 08:00–21:00 | Event NOT generated |
| TC-HYD-WIN-05 | Reminder at 09:00 when window is 08:00–21:00 | Event generated |
