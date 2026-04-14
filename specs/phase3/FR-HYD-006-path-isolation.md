# FR-HYD-006: Path Isolation

## 1. Requirement
The hydration reminder and logging pipeline must operate independently of the medication reminder pipeline. A failure in one subsystem must not block the other.

## 2. Acceptance Criteria
1. Database collections for hydration (`hydration_plans`, `hydration_events`) are distinct from medication collections.
2. Backend service logic for hydration (`hydrationService.ts`) has no direct dependencies on `medicationService.ts`.
3. Frontend state management for hydration (e.g., separate hydration reducer/hook) is decoupled from medication state.
4. API errors in `/medications` endpoints do not impact `/hydration` endpoints.
5. Reminder generation for hydration can be triggered separately from medication.

## 3. Technical Implementation Strategy

### 3.1 Backend
- **Services**: Maintain strict separation of `hydrationService.ts` and `medicationService.ts`.
- **Routes**: Separate route files — `routes/hydration.ts`.
- **Error Handling**: Use independent try-catch blocks in the main controller to ensure a failure in `generateMedicationReminders()` does not skip `generateHydrationReminders()`.

### 3.2 Resilience
- **Database**: If the `hydration_events` collection is locked or slow, the `reminder_events` for medications (Path A) should still load successfully.
- **Failover**: Phase 4 will introduce separate workers, but Phase 3 should ensure code-level isolation.

## 4. Test Cases
| ID | Description | Expected |
|:---|:---|:---|
| TC-HYD-ISO-01 | Mock medication database error | Hydration data still loads successfully |
| TC-HYD-ISO-02 | Verify separate API routes | `/hydration` endpoints work even if `/medications` endpoints are deliberately disabled |
| TC-HYD-ISO-03 | Independent generation | Hydration reminders generated for a user who has no medications configured |
