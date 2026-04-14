# FR-HYD-001: Daily Hydration Goal Setting

## 1. Requirement
User can set and update a daily hydration target (in milliliters).

## 2. Acceptance Criteria
1. User can enter a daily goal in ml (e.g., 2000ml).
2. System persists the goal in a `hydration_plans` document for the user.
3. If a plan already exists, the user can update the goal without creating a duplicate.
4. Default goal is 2000ml if no plan is configured.
5. Goal must be a positive integer between 250ml and 10000ml.

## 3. Data Model

### Collection: `hydration_plans`
| Field | Type | Constraints |
|:---|:---|:---|
| `id` | String (UUID) | Required, primary key |
| `user_id` | String | Required, indexed |
| `daily_goal_ml` | Number | Required, 250–10000 |
| `interval_minutes` | Number | Required (set via FR-HYD-002) |
| `start_time_24h` | String | Required, "HH:mm" |
| `end_time_24h` | String | Required, "HH:mm" |
| `timezone` | String | Required, IANA format |
| `is_active` | Boolean | Required |
| `created_at_utc` | String | ISO datetime |
| `updated_at_utc` | String | ISO datetime |

## 4. API Contracts

### GET /hydration/plan
Returns the current user's active hydration plan.

**Response 200:**
```json
{
  "id": "uuid",
  "dailyGoalMl": 2000,
  "intervalMinutes": 120,
  "startTime24h": "08:00",
  "endTime24h": "21:00",
  "timezone": "Asia/Kolkata",
  "isActive": true
}
```

**Response 404:** If no plan exists.

### POST /hydration/plan
Creates or replaces the user's hydration plan.

**Request Body:**
```json
{
  "dailyGoalMl": 2000,
  "intervalMinutes": 120,
  "startTime24h": "08:00",
  "endTime24h": "21:00",
  "timezone": "Asia/Kolkata"
}
```

**Response 201:** Returns full plan object.

**Validation errors (400):**
- `dailyGoalMl` missing or not between 250–10000.
- `timezone` not a valid IANA-like string.

## 5. UI/UX
- **Screen**: "Setup Hydration" form (separate from medications).
- **Input**: Numeric slider or text field with ml unit label.
- **Presets**: Quick-select buttons — 1500ml, 2000ml, 2500ml, 3000ml.
- **Feedback**: Success toast after save.

## 6. Dependency
- Must be created before FR-HYD-003 (Interval Reminders) can generate events.

## 7. Test Cases
| ID | Description | Expected |
|:---|:---|:---|
| TC-HYD-GOAL-01 | Create plan with 2000ml | 201 response, plan stored correctly |
| TC-HYD-GOAL-02 | Create plan with 50ml | 400 validation error |
| TC-HYD-GOAL-03 | Update existing plan with 2500ml | 201, existing replaced |
| TC-HYD-GOAL-04 | Fetch plan with no setup | 404 returned |
