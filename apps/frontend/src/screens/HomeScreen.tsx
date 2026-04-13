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
import { Colors, Spacing, FontSize, FontWeight, Radius } from "../theme";
import { doseApi } from "../api/client";
import type { DoseEvent } from "../api/client";
import { DoseEventCard } from "../components/DoseEventCard";
import { DoseActionSheet } from "../components/DoseActionSheet";

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
  const [doses, setDoses] = useState<DoseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDose, setSelectedDose] = useState<DoseEvent | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDoses = useCallback(async () => {
    try {
      const data = await doseApi.today();
      setDoses(data);
    } catch (_) {
      // Network error — keep existing state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchDoses();
    }, [fetchDoses]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoses();
  };

  const handleAction = async (action: () => Promise<unknown>) => {
    setActionLoading(true);
    try {
      await action();
      setSelectedDose(null);
      await fetchDoses();
    } finally {
      setActionLoading(false);
    }
  };

  const pending = doses.filter((d) => ["PENDING", "SENT", "SNOOZED"].includes(d.status));
  const completed = doses.filter((d) => !["PENDING", "SENT", "SNOOZED"].includes(d.status));
  const adherenceRate =
    doses.length > 0 ? Math.round((doses.filter((d) => d.status === "ACKED").length / doses.length) * 100) : null;

  return (
    <View style={styles.container}>
      <FlatList
        data={[...pending, ...completed]}
        keyExtractor={(item) => item.eventId}
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
                  <Text style={styles.statValue}>{doses.length}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={[styles.statItem, styles.statDivider]}>
                  <Text style={[styles.statValue, { color: Colors.success }]}>
                    {doses.filter((d) => d.status === "ACKED").length}
                  </Text>
                  <Text style={styles.statLabel}>Taken</Text>
                </View>
                <View style={[styles.statItem, styles.statDivider]}>
                  <Text style={[styles.statValue, { color: Colors.danger }]}>
                    {doses.filter((d) => d.status === "MISSED").length}
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
              <Text style={styles.sectionTitle}>⏰ Pending ({pending.length})</Text>
            )}
          </View>
        )}
        ListFooterComponent={() =>
          !loading && completed.length > 0 ? (
            <View>
              <Text style={styles.sectionTitle}>✅ Completed</Text>
              {completed.map((d) => (
                <DoseEventCard key={d.eventId} dose={d} />
              ))}
            </View>
          ) : null
        }
        renderItem={({ item }) =>
          ["PENDING", "SENT", "SNOOZED"].includes(item.status) ? (
            <DoseEventCard dose={item} onAction={setSelectedDose} />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyTitle}>All clear for today!</Text>
              <Text style={styles.emptySubtitle}>
                No medications scheduled. Add one from the Medications tab.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.list}
      />

      <DoseActionSheet
        dose={selectedDose}
        visible={!!selectedDose}
        loading={actionLoading}
        onDismiss={() => setSelectedDose(null)}
        onConfirm={() => handleAction(() => doseApi.confirm(selectedDose!.eventId))}
        onSnooze={() => handleAction(() => doseApi.snooze(selectedDose!.eventId))}
        onSkip={() => handleAction(() => doseApi.skip(selectedDose!.eventId))}
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
});
