# FR-HYD-004: One-Tap Intake Logging

## 1. Requirement
User can log water they consumed using quick-tap presets or a custom amount, with each log updating the daily running total.

## 2. Acceptance Criteria
1. User can log intake with one of the presets: 100ml, 250ml, 350ml, 500ml.
2. User can enter a custom amount in ml.
3. Each log creates an entry in `hydration_events` collection.
4. The daily running total updates immediately after logging.
5. Logging is available both from the Home screen quick-action and from the Hydration detail screen.
6. Logged amount must be a positive integer between 1 and 5000ml.

## 3. Data Model

### Collection: `hydration_events`
| Field | Type | Constraints |
|:---|:---|:---|
| `id` | String (UUID) | Required, primary key |
| `user_id` | String | Required, indexed |
| `plan_id` | String | Reference to `hydration_plans.id` |
| `amount_ml` | Number | Required, 1–5000 |
| `logged_at_utc` | String | ISO datetime, auto-set |
| `source` | String | "MANUAL" or "REMINDER_ACTION" |
| `created_at_utc` | String | ISO datetime |

## 4. API Contracts

### POST /hydration/log
Logs a single intake event.

**Request Body:**
```json
{
  "amountMl": 250,
  "source": "MANUAL"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "amountMl": 250,
  "loggedAtUtc": "2026-04-13T07:15:00Z",
  "source": "MANUAL"
}
```

**Validation errors (400):**
- `amountMl` missing, not a positive integer, or out of range.

## 5. UI/UX

### Quick-Action Sheet (Home Screen)
- **Trigger**: "💧 Log Water" floating button.
- **Options**:
  - 🥛 100ml
  - 💧 250ml
  - 🫗 350ml
  - 🍶 500ml
  - ✏️ Custom (opens numeric input)
- **Behaviour**: Sheet dismisses after selection and shows a brief "Logged 250ml" toast confirmation.

### Accessibility
- All preset buttons must meet the minimum touch target of 48×48dp.
- Label button and amount together so screen readers announce "Log 250 milliliters".

## 6. Test Cases
| ID | Description | Expected |
|:---|:---|:---|
| TC-HYD-LOG-01 | Log 250ml via preset | 201, intake record created |
| TC-HYD-LOG-02 | Log 0ml | 400 validation error |
| TC-HYD-LOG-03 | Log 6000ml | 400 validation error |
| TC-HYD-LOG-04 | Log two entries (250ml + 500ml) | Daily total = 750ml |
| TC-HYD-LOG-05 | Log from reminder action | Source stored as "REMINDER_ACTION" |
