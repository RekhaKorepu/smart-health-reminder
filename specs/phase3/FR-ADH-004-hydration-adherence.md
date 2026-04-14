# FR-ADH-004: Hydration Adherence Reporting

## 1. Requirement
The system provides daily and weekly summaries of hydration adherence, tracking whether the user consistently meets their daily goal.

## 2. Acceptance Criteria
1. Weekly report shows "Goal Achieved" vs. "Goal Missed" for the last 7 days.
2. Adherence rate is calculated as: `(Days Goal Met / Total Days) * 100`.
3. Report data is split by day to show trends.
4. History is available for the user to review.
5. In Phase 5, this will be shared with caregivers. Phase 3 focuses on user-visibility.

## 3. Calculation Logic

### Daily Success
A day is "Success" if `total_ml_logged >= daily_goal_ml`.

### API: `GET /adherence/hydration?days=7`
Calculates daily totals for the past N days.

**Response Schema:**
```json
[
  {
    "date": "2026-04-13",
    "totalAmountMl": 2100,
    "goalMl": 2000,
    "isSuccess": true
  },
  {
    "date": "2026-04-12",
    "totalAmountMl": 1800,
    "goalMl": 2000,
    "isSuccess": false
  }
]
```

## 4. UI/UX
- **Screen**: "Adherence" tab (expanding existing medication adherence screen).
- **Chart**: A bar chart showing ml consumed each day vs. a constant line for the "Goal".
- **Color Coding**: Green bars for Success, Gray for Missed.
- **Micro-animation**: "Success" badge for days meeting the goal.

## 5. Test Cases
| ID | Description | Expected |
|:---|:---|:---|
| TC-HYD-ADH-01 | Goal met exactly (2000/2000) | Day marked as Success |
| TC-HYD-ADH-02 | Single day adherence rate | 1/1 = 100% |
| TC-HYD-ADH-03 | Retrieve 7-day history with 3 successful days | Rate = 42% (3/7) |
| TC-HYD-ADH-04 | User changes goal mid-week | History calculates success based on the goal that was active *on that day* (if snapshots exist) or current goal (simplification for Phase 3). |
