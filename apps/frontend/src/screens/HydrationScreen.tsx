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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow, TouchTarget } from "../theme";
import { hydrationApi } from "../api/client";
import type { HydrationSummary, HydrationAdherenceDay } from "../api/client";
import { HydrationProgressRing } from "../components/HydrationProgressRing";
import { WaterLogSheet } from "../components/WaterLogSheet";

export function HydrationScreen() {
  const navigation = useNavigation();
  const [summary, setSummary] = useState<HydrationSummary | null>(null);
  const [history, setHistory] = useState<HydrationAdherenceDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logSheetVisible, setLogSheetVisible] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [noPlan, setNoPlan] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      // — path-isolated fetch (FR-HYD-006) —
      const [sum, hist] = await Promise.all([
        hydrationApi.todaySummary().catch(() => null),
        hydrationApi.adherence(7).catch(() => []),
      ]);
      if (!sum) { setNoPlan(true); return; }
      setNoPlan(false);
      setSummary(sum);
      setHistory(hist as HydrationAdherenceDay[]);
    } catch {
      // keep existing state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAll();
    }, [fetchAll]),
  );

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const handleLog = async (amountMl: number, source: "MANUAL" | "REMINDER_ACTION") => {
    setLogLoading(true);
    try {
      await hydrationApi.logIntake(amountMl, source);
      setLogSheetVisible(false);
      Alert.alert("💧 Logged!", `${amountMl}ml added to today's total.`, [
        { text: "OK", onPress: fetchAll },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to log intake.");
    } finally {
      setLogLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={Colors.teal} size="large" />
      </View>
    );
  }

  if (noPlan) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyIcon}>💧</Text>
        <Text style={styles.emptyTitle}>No Hydration Plan Yet</Text>
        <Text style={styles.emptySubtitle}>Set your daily goal and we'll remind you to stay hydrated.</Text>
        <TouchableOpacity
          style={styles.setupBtn}
          onPress={() => (navigation as any).navigate("HydrationSetup")}
          activeOpacity={0.85}
        >
          <Text style={styles.setupBtnText}>Set Up Now →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pct = summary?.percentage ?? 0;
  const totalMl = summary?.totalAmountMl ?? 0;
  const goalMl = summary?.goalMl ?? 2000;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.teal} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Hydration</Text>
            <Text style={styles.pageDate}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => (navigation as any).navigate("HydrationSetup")}
            activeOpacity={0.8}
          >
            <Text style={styles.settingsBtnText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Ring — FR-HYD-005 */}
        <View style={styles.ringCard}>
          <HydrationProgressRing
            percentage={pct}
            totalMl={totalMl}
            goalMl={goalMl}
            size={180}
          />
          <View style={styles.ringMeta}>
            <Text style={styles.ringMetaTitle}>
              {summary?.isGoalAchieved ? "🎉 Goal Achieved!" : "Keep going!"}
            </Text>
            <Text style={styles.ringMetaSub}>
              {goalMl - totalMl > 0
                ? `${goalMl - totalMl} ml more to reach your goal`
                : "You've exceeded your daily goal"}
            </Text>
          </View>
        </View>

        {/* Quick-log button — FR-HYD-004 */}
        <TouchableOpacity
          style={styles.logBtn}
          onPress={() => setLogSheetVisible(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Log water intake"
        >
          <Text style={styles.logBtnIcon}>💧</Text>
          <Text style={styles.logBtnText}>Log Water</Text>
        </TouchableOpacity>

        {/* Recent Logs — FR-HYD-005 AC3 */}
        {summary && summary.recentLogs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💧 Today's Logs</Text>
            {summary.recentLogs.map((log) => (
              <View key={log.id} style={styles.logRow}>
                <Text style={styles.logAmount}>+{log.amountMl} ml</Text>
                <Text style={styles.logTime}>{log.time}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 7-Day History — FR-ADH-004 */}
        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Last 7 Days</Text>
            <View style={styles.historyRow}>
              {history.map((day) => (
                <View key={day.date} style={styles.historyDay}>
                  <View
                    style={[
                      styles.historyBar,
                      { backgroundColor: day.isSuccess ? Colors.success : Colors.bgElevated }
                    ]}
                  />
                  <Text style={styles.historyLabel}>
                    {new Date(day.date + "T12:00:00Z").toLocaleDateString("en-IN", { weekday: "short" })[0]}
                  </Text>
                  <Text style={[styles.historyStatus, { color: day.isSuccess ? Colors.success : Colors.textMuted }]}>
                    {day.isSuccess ? "✓" : "–"}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.historyRate}>
              {history.filter(d => d.isSuccess).length} / {history.length} days goal met
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Water Log Sheet — FR-HYD-004 */}
      <WaterLogSheet
        visible={logSheetVisible}
        onDismiss={() => setLogSheetVisible(false)}
        onLog={handleLog}
        loading={logLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { alignItems: "center", justifyContent: "center" },
  scroll: { padding: Spacing.base, paddingBottom: 100 },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", paddingTop: Spacing.xl, paddingBottom: Spacing.base,
  },
  pageTitle: {
    color: Colors.textPrimary, fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold, marginBottom: 4,
  },
  pageDate: { color: Colors.textSecondary, fontSize: FontSize.sm },
  settingsBtn: {
    width: TouchTarget, height: TouchTarget,
    borderRadius: Radius.full, backgroundColor: Colors.bgElevated,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  settingsBtnText: { fontSize: 20 },
  ringCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.teal + "33",
    padding: Spacing.xl, marginBottom: Spacing.base,
    alignItems: "center", gap: Spacing.lg, ...Shadow.md,
  },
  ringMeta: { alignItems: "center" },
  ringMetaTitle: {
    color: Colors.textPrimary, fontSize: FontSize.lg,
    fontWeight: FontWeight.bold, marginBottom: 4,
  },
  ringMetaSub: {
    color: Colors.textSecondary, fontSize: FontSize.sm,
    textAlign: "center", lineHeight: 20,
  },
  logBtn: {
    backgroundColor: Colors.teal, borderRadius: Radius.lg,
    minHeight: TouchTarget, flexDirection: "row",
    alignItems: "center", justifyContent: "center",
    gap: Spacing.sm, marginBottom: Spacing.base, ...Shadow.sm,
  },
  logBtnIcon: { fontSize: 22 },
  logBtnText: { color: Colors.bg, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  section: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.borderSubtle,
    padding: Spacing.base, marginBottom: Spacing.base,
  },
  sectionTitle: {
    color: Colors.textSecondary, fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold, marginBottom: Spacing.md,
    textTransform: "uppercase", letterSpacing: 0.8,
  },
  logRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  logAmount: { color: Colors.teal, fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  logTime: { color: Colors.textMuted, fontSize: FontSize.sm },
  historyRow: { flexDirection: "row", gap: Spacing.sm, justifyContent: "space-between" },
  historyDay: { flex: 1, alignItems: "center", gap: 4 },
  historyBar: {
    width: 8, height: 40, borderRadius: 4,
  },
  historyLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  historyStatus: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  historyRate: {
    color: Colors.textMuted, fontSize: FontSize.xs,
    textAlign: "center", marginTop: Spacing.sm,
  },
  emptyIcon: { fontSize: 52, marginBottom: Spacing.md },
  emptyTitle: {
    color: Colors.textPrimary, fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold, marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    color: Colors.textSecondary, fontSize: FontSize.base,
    textAlign: "center", lineHeight: 22, marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  setupBtn: {
    backgroundColor: Colors.teal, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl, minHeight: TouchTarget,
    alignItems: "center", justifyContent: "center", ...Shadow.sm,
  },
  setupBtnText: { color: Colors.bg, fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
