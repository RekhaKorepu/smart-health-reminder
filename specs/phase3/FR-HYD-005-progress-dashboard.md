# FR-HYD-005: Daily Progress Dashboard

## 1. Requirement
The system provides a visual representation of the user's daily hydration progress against their configured goal.

## 2. Acceptance Criteria
1. The dashboard displays a progress indicator (ring or bar) showing the percentage of the daily goal achieved.
2. Display current total milliliters (ml) consumed vs. target goal (e.g., "1500 / 2000 ml").
3. Display a list of today's intake logs (Reverse chronological).
4. Progress must update within 2 seconds of a new log entry (FR-HYD-004).
5. Visual states for:
    - Goal not yet achieved.
    - Goal achieved (100%+).
    - No data yet for today.

## 3. Data Aggregation Logic

### `GET /hydration/today`
Calculates the aggregate sum of `hydration_events` for the current user where `logged_at_utc` falls within the current local day.

**Response Schema:**
```json
{
  "totalAmountMl": 1500,
  "goalMl": 2000,
  "percentage": 75,
  "isGoalAchieved": false,
  "recentLogs": [
    { "id": "uuid", "amountMl": 250, "time": "14:30" },
    { "id": "uuid", "amountMl": 500, "time": "11:00" }
  ]
}
```

## 4. UI/UX
- **Component**: HydrationSummaryCard.
- **Visuals**: Use a "Water Blue" color palette (#2196F3).
- **Animations**: Subtle "fill up" animation when a new log is added.
- **Accessibility**: Ensure high contrast for text values. Screen readers should announce: "Hydration progress: 75 percent. 1500 of 2000 milliliters consumed."

## 5. Test Cases
| ID | Description | Expected |
|:---|:---|:---|
| TC-HYD-DASH-01 | View dashboard with 0 ml consumed | Progress at 0%, "0 / 2000 ml" |
| TC-HYD-DASH-02 | Log 500ml and refresh dashboard | Progress updates to 25%, total 500ml |
| TC-HYD-DASH-03 | Consume 2100ml (goal 2000ml) | Progress 100%+, Goal Achieved state active |
| TC-HYD-DASH-04 | Logic respects local "day" boundaries | Logs from 11:59 PM yesterday don't count for today |
