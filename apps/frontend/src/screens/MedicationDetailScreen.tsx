import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from "../theme";
import { medicationApi, scheduleApi, doseApi } from "../api/client";
import type { Medication, MedicationSchedule, DoseEvent } from "../api/client";
import { DoseEventCard } from "../components/DoseEventCard";
import { DoseActionSheet } from "../components/DoseActionSheet";

const TIME_SLOT_LABELS: Record<string, string> = {
  MORNING: "Morning · 8:00 AM",
  AFTERNOON: "Afternoon · 1:00 PM",
  EVENING: "Evening · 6:00 PM",
  NIGHT: "Night · 9:00 PM",
  CUSTOM: "Custom time",
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function AdherenceRing({ rate }: { rate: number }) {
  const color = rate >= 80 ? Colors.success : rate >= 50 ? Colors.warning : Colors.danger;
  return (
    <View style={ring.container}>
      <View style={[ring.outer, { borderColor: color }]}>
        <Text style={[ring.value, { color }]}>{rate}%</Text>
        <Text style={ring.label}>adherence</Text>
      </View>
    </View>
  );
}

const ring = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  outer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bgElevated,
  },
  value: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  label: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
});

export function MedicationDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { medicationId } = route.params as { medicationId: string };

  const [medication, setMedication] = useState<Medication | null>(null);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [todayDoses, setTodayDoses] = useState<DoseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDose, setSelectedDose] = useState<DoseEvent | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [med, scheds, doses] = await Promise.all([
        medicationApi.get(medicationId),
        scheduleApi.list(medicationId),
        doseApi.today(),
      ]);
      setMedication(med);
      setSchedules(scheds);
      setTodayDoses(doses.filter((d) => d.medicationId === medicationId));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [medicationId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAll();
    }, [fetchAll]),
  );

  const handleDelete = () => {
    Alert.alert("Remove Medication", `Remove ${medication?.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await medicationApi.delete(medicationId);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleAction = async (action: () => Promise<unknown>) => {
    setActionLoading(true);
    try {
      await action();
      setSelectedDose(null);
      await fetchAll();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  if (!medication) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Medication not found.</Text>
      </View>
    );
  }

  const todayConfirmed = todayDoses.filter((d) => d.status === "ACKED").length;
  const adherenceRate = todayDoses.length > 0
    ? Math.round((todayConfirmed / todayDoses.length) * 100)
    : 100;

  const stockColor = (() => {
    if (!medication.stockCount) return Colors.textMuted;
    if (medication.refillThreshold && medication.stockCount <= medication.refillThreshold) return Colors.danger;
    if (medication.refillThreshold && medication.stockCount <= medication.refillThreshold * 2) return Colors.warning;
    return Colors.success;
  })();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={Colors.accent} />}
    >
      {/* Hero card */}
      <View style={styles.heroCard}>
        <View style={styles.heroLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {medication.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{medication.name}</Text>
            <Text style={styles.heroDosage}>{medication.dosageText}</Text>
            {medication.instructions && (
              <Text style={styles.heroInstructions}>{medication.instructions}</Text>
            )}
          </View>
        </View>
        <AdherenceRing rate={adherenceRate} />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: stockColor + "55" }]}>
          <Text style={[styles.statValue, { color: stockColor }]}>
            {medication.stockCount ?? "—"}
          </Text>
          <Text style={styles.statLabel}>Stock Left</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{medication.refillThreshold ?? "—"}</Text>
          <Text style={styles.statLabel}>Refill at</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.accent }]}>{schedules.length}</Text>
          <Text style={styles.statLabel}>Schedules</Text>
        </View>
      </View>

      {/* Schedules */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Schedules</Text>
        {schedules.length === 0 ? (
          <Text style={styles.emptyText}>No schedules yet.</Text>
        ) : (
          schedules.map((s) => (
            <View key={s.id} style={styles.scheduleCard}>
              <View style={styles.scheduleLeft}>
                <Text style={styles.scheduleSlot}>{TIME_SLOT_LABELS[s.timeSlot] ?? s.timeSlot}</Text>
                <Text style={styles.scheduleType}>
                  {s.scheduleType === "WEEKLY" && s.weekdays
                    ? `Weekly: ${s.weekdays.map((d) => WEEKDAY_LABELS[d]).join(", ")}`
                    : "Every Day"}
                </Text>
              </View>
              <View style={styles.graceTag}>
                <Text style={styles.graceText}>Grace: {s.graceWindowMinutes}m</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Today's doses */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏰ Today's Doses</Text>
        {todayDoses.length === 0 ? (
          <Text style={styles.emptyText}>No doses scheduled for today.</Text>
        ) : (
          todayDoses.map((d) => (
            <DoseEventCard
              key={d.eventId}
              dose={d}
              onAction={setSelectedDose}
            />
          ))
        )}
      </View>

      {/* Remove */}
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
        <Text style={styles.deleteBtnText}>🗑 Remove Medication</Text>
      </TouchableOpacity>

      <DoseActionSheet
        dose={selectedDose}
        visible={!!selectedDose}
        loading={actionLoading}
        onDismiss={() => setSelectedDose(null)}
        onConfirm={() => handleAction(() => doseApi.confirm(selectedDose!.eventId))}
        onSnooze={() => handleAction(() => doseApi.snooze(selectedDose!.eventId))}
        onSkip={() => handleAction(() => doseApi.skip(selectedDose!.eventId))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg },
  errorText: { color: Colors.textSecondary, fontSize: FontSize.base },

  heroCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.accentMid,
    padding: Spacing.base,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.base,
    ...Shadow.md,
  },
  heroLeft: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: Spacing.base },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentMid,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: Colors.accent, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  heroInfo: { flex: 1 },
  heroName: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: 4 },
  heroDosage: { color: Colors.textSecondary, fontSize: FontSize.sm },
  heroInstructions: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.sm,
    alignItems: "center",
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },

  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.sm },

  scheduleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  scheduleLeft: { flex: 1 },
  scheduleSlot: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: FontWeight.medium },
  scheduleType: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  graceTag: {
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  graceText: { color: Colors.textMuted, fontSize: FontSize.xs },

  deleteBtn: {
    borderWidth: 1,
    borderColor: Colors.danger + "55",
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
    backgroundColor: Colors.dangerLight,
    marginTop: Spacing.base,
  },
  deleteBtnText: {
    color: Colors.danger,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
});
