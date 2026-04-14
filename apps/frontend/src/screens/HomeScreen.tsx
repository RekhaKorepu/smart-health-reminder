import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from "../theme";
import { parseISO, compareAsc } from "date-fns";
import { doseApi, hydrationApi } from "../api/client";
import type { DoseEvent, HydrationEvent } from "../api/client";
import { DoseEventCard } from "../components/DoseEventCard";
import { DoseActionSheet } from "../components/DoseActionSheet";
import { WaterLogSheet } from "../components/WaterLogSheet";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function todayDateString() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function HomeScreen() {
  const [reminders, setReminders] = useState<(DoseEvent | HydrationEvent)[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDose, setSelectedDose] = useState<DoseEvent | null>(null);
  const [logSheetVisible, setLogSheetVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReminders = useCallback(async () => {
    try {
      const [doseData, hydrationData] = await Promise.all([
        doseApi.today().catch(() => []),
        hydrationApi.todayEvents().catch(() => []),
      ]);
      
      // De-duplicate by eventId and sort by dueAtUtc
      const all = [...doseData, ...hydrationData];
      const deDuped = Array.from(new Map(all.map(r => [r.eventId, r])).values());
      
      deDuped.sort((a, b) => compareAsc(parseISO(a.dueAtUtc), parseISO(b.dueAtUtc)));
      setReminders(deDuped);
    } catch (_) {
      // Keep existing state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchReminders();
    }, [fetchReminders]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReminders();
  };

  const handleAction = async (action: () => Promise<unknown>) => {
    setActionLoading(true);
    try {
      await action();
      setSelectedDose(null);
      await fetchReminders();
    } finally {
      setActionLoading(false);
    }
  };

  const handleHydrationLog = async (amount: number) => {
    setActionLoading(true);
    try {
      await hydrationApi.logIntake(amount, "REMINDER_ACTION");
      setLogSheetVisible(false);
      await fetchReminders();
    } finally {
      setActionLoading(false);
    }
  };

  const pending = reminders.filter((r) => ["PENDING", "SENT", "SNOOZED"].includes(r.status));
  const completed = reminders.filter((r) => !["PENDING", "SENT", "SNOOZED"].includes(r.status));
  
  // Construct a single list with headers
  const listData: any[] = [...pending];
  if (completed.length > 0) {
    listData.push({ type: "SECTION_HEADER", title: "✅ Completed" });
    listData.push(...completed);
  }

  const medReminders = reminders.filter(r => r.eventType === "MEDICATION_DUE") as DoseEvent[];
  const adherenceRate =
    medReminders.length > 0 
      ? Math.round((medReminders.filter((d) => d.status === "ACKED").length / medReminders.length) * 100) 
      : null;

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        keyExtractor={(item, index) => item.eventId || `header-${index}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        ListHeaderComponent={() => (
          <View>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>{getGreeting()} 👋</Text>
                <Text style={styles.date}>{todayDateString()}</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillText}>Today</Text>
              </View>
            </View>

            {/* Stats strip */}
            {adherenceRate !== null && (
              <View style={styles.statsStrip}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{medReminders.length}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={[styles.statItem, styles.statDivider]}>
                  <Text style={[styles.statValue, { color: Colors.success }]}>
                    {medReminders.filter((d) => d.status === "ACKED").length}
                  </Text>
                  <Text style={styles.statLabel}>Taken</Text>
                </View>
                <View style={[styles.statItem, styles.statDivider]}>
                  <Text style={[styles.statValue, { color: Colors.danger }]}>
                    {medReminders.filter((d) => d.status === "MISSED").length}
                  </Text>
                  <Text style={styles.statLabel}>Missed</Text>
                </View>
                <View style={[styles.statItem, styles.statDivider]}>
                  <Text style={[styles.statValue, { color: Colors.accent }]}>{adherenceRate}%</Text>
                  <Text style={styles.statLabel}>Rate</Text>
                </View>
              </View>
            )}

            {loading && (
              <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.xl }} />
            )}

            {!loading && pending.length > 0 && (
              <Text style={styles.sectionTitle}>⏰ Due Soon ({pending.length})</Text>
            )}
          </View>
        )}
        renderItem={({ item }) => {
          if (item.type === "SECTION_HEADER") {
            return <Text style={styles.sectionTitle}>{item.title}</Text>;
          }
          return (
            <DoseEventCard 
              event={item} 
              onAction={(e) => e.eventType === "HYDRATION_DUE" ? setLogSheetVisible(true) : setSelectedDose(e)} 
            />
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyTitle}>All clear for today!</Text>
              <Text style={styles.emptySubtitle}>
                No medications or hydration reminders scheduled.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setLogSheetVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>💧</Text>
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

      <WaterLogSheet
        visible={logSheetVisible}
        onDismiss={() => setLogSheetVisible(false)}
        onLog={handleHydrationLog}
        loading={actionLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  list: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.base,
  },
  greeting: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  date: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  pill: {
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentMid,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  pillText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  statsStrip: {
    flexDirection: "row",
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.borderSubtle,
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
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
    marginTop: Spacing.base,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  empty: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    textAlign: "center",
    lineHeight: 22,
  },
  fab: {
    position: "absolute",
    right: Spacing.xl,
    bottom: Spacing.xl,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.teal,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.lg,
  },
  fabIcon: {
    fontSize: 28,
  },
});
