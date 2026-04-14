import Constants from "expo-constants";

// API client for Smart Health Reminder backend
// Dynamically resolve backend IP for development (Expo Go / Emulators)
const getBaseUrl = () => {
  if (__DEV__) {
    // Look for the hostUri (e.g. "192.168.1.5:8081")
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(":")[0];
      return `http://${ip}:3000`;
    }
    // Fallback for Android emulator
    return "http://10.0.2.2:3000";
  }
  // Production URL (Phase 6)
  return "https://api.smarthealthreminder.com";
};

const BASE_URL = getBaseUrl();
const USER_ID = "user-demo-001"; // Placeholder until auth is implemented (Phase 5)

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-user-id": USER_ID,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.message ?? "Request failed");
    throw Object.assign(error, {
      status: response.status,
      body,
      issues: body.issues as Array<{ field: string; message: string }> | undefined,
    });
  }

  if (response.status === 204) return undefined as unknown as T;
  return response.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosageText: string;
  instructions?: string;
  startDate: string;
  endDate?: string;
  timezone: string;
  stockCount?: number;
  refillThreshold?: number;
  refillLeadTimeDays?: number;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface MedicationSchedule {
  id: string;
  medicationId: string;
  userId: string;
  scheduleType: "DAILY" | "WEEKLY";
  timeSlot: "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT" | "CUSTOM";
  customTime24h?: string;
  weekdays?: number[];
  timezone: string;
  graceWindowMinutes: number;
  missWindowMinutes: number;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface DoseEvent {
  eventId: string;
  eventType: string;
  status: "PENDING" | "SENT" | "ACKED" | "SNOOZED" | "SKIPPED" | "MISSED";
  dueAtUtc: string;
  timezone: string;
  medicationId: string | null;
  medicationName: string | null;
  dosageText: string | null;
  scheduleId: string | null;
}

export interface AdherenceStats {
  medicationId: string;
  medicationName: string;
  total: number;
  confirmed: number;
  skipped: number;
  missed: number;
  snoozed: number;
  rate: number;
}

// ─── Medication API ───────────────────────────────────────────────────────────

export const medicationApi = {
  list: () => apiFetch<Medication[]>("/medications"),
  get: (id: string) => apiFetch<Medication>(`/medications/${id}`),
  create: (body: Partial<Medication>) =>
    apiFetch<Medication>("/medications", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Medication>) =>
    apiFetch<Medication>(`/medications/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) =>
    apiFetch<void>(`/medications/${id}`, { method: "DELETE" }),
};

// ─── Schedule API ─────────────────────────────────────────────────────────────

export const scheduleApi = {
  list: (medicationId: string) =>
    apiFetch<MedicationSchedule[]>(`/medications/${medicationId}/schedules`),
  create: (medicationId: string, body: Partial<MedicationSchedule>) =>
    apiFetch<MedicationSchedule>(`/medications/${medicationId}/schedules`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  delete: (medicationId: string, scheduleId: string) =>
    apiFetch<void>(`/medications/${medicationId}/schedules/${scheduleId}`, { method: "DELETE" }),
};

// ─── Dose API ─────────────────────────────────────────────────────────────────

export const doseApi = {
  today: () => apiFetch<DoseEvent[]>("/doses"),
  confirm: (eventId: string) =>
    apiFetch<{ ok: boolean }>(`/doses/${eventId}/confirm`, {
      method: "POST",
      body: JSON.stringify({ source: "APP_SCREEN" }),
    }),
  snooze: (eventId: string) =>
    apiFetch<{ ok: boolean }>(`/doses/${eventId}/snooze`, {
      method: "POST",
      body: JSON.stringify({ source: "APP_SCREEN" }),
    }),
  skip: (eventId: string) =>
    apiFetch<{ ok: boolean }>(`/doses/${eventId}/skip`, {
      method: "POST",
      body: JSON.stringify({ source: "APP_SCREEN" }),
    }),
};

// ─── Adherence API ────────────────────────────────────────────────────────────

export const adherenceApi = {
  medication: (days = 7) =>
    apiFetch<AdherenceStats[]>(`/adherence/medication?days=${days}`),
};

// ─── Hydration Types ──────────────────────────────────────────────────────────

export interface HydrationPlan {
  id: string;
  userId: string;
  dailyGoalMl: number;
  intervalMinutes: number;
  startTime24h: string;
  endTime24h: string;
  timezone: string;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface HydrationSummary {
  totalAmountMl: number;
  goalMl: number;
  percentage: number;
  isGoalAchieved: boolean;
  recentLogs: Array<{ id: string; amountMl: number; time: string }>;
}

export interface HydrationLog {
  id: string;
  amountMl: number;
  loggedAtUtc: string;
  source: "MANUAL" | "REMINDER_ACTION";
}

export interface HydrationAdherenceDay {
  date: string;
  totalAmountMl: number;
  goalMl: number;
  isSuccess: boolean;
}

export interface HydrationEvent {
  eventId: string;
  eventType: string;
  status: "PENDING" | "SENT" | "ACKED" | "SNOOZED" | "SKIPPED" | "MISSED";
  dueAtUtc: string;
  timezone: string;
}

// ─── Hydration API ────────────────────────────────────────────────────────────

export const hydrationApi = {
  getPlan: () => apiFetch<HydrationPlan>("/hydration/plan"),
  savePlan: (body: Omit<HydrationPlan, "id" | "userId" | "isActive" | "createdAtUtc" | "updatedAtUtc">) =>
    apiFetch<HydrationPlan>("/hydration/plan", { method: "POST", body: JSON.stringify(body) }),
  todaySummary: () => apiFetch<HydrationSummary>("/hydration/today"),
  todayEvents: () => apiFetch<HydrationEvent[]>("/hydration/events/today"),
  logIntake: (amountMl: number, source: "MANUAL" | "REMINDER_ACTION" = "MANUAL") =>
    apiFetch<HydrationLog>("/hydration/log", { method: "POST", body: JSON.stringify({ amountMl, source }) }),
  adherence: (days = 7) => apiFetch<HydrationAdherenceDay[]>(`/hydration/adherence?days=${days}`),
};
