// API client for Smart Health Reminder backend
// Base URL: localhost for iOS simulator; change to 10.0.2.2 for Android emulator

const BASE_URL = "http://localhost:3000";
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
    throw Object.assign(new Error(body.message ?? "Request failed"), {
      status: response.status,
      body,
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
