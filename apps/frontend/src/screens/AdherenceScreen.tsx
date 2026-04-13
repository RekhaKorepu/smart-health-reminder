import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Spacing, FontSize, FontWeight, Radius } from "../theme";
import { adherenceApi } from "../api/client";
import type { AdherenceStats } from "../api/client";

const DAYS_OPTIONS = [7, 14, 30];

function AdherenceBar({ rate }: { rate: number }) {
  const color = rate >= 80 ? Colors.success : rate >= 50 ? Colors.warning : Colors.danger;
  return (
    <View style={bar.track}>
      <View style={[bar.fill, { width: `${rate}%` as `${number}%`, backgroundColor: color }]} />
    </View>
  );
}

const bar = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: Colors.bgElevated,
    borderRadius: 4,
    overflow: "hidden",
    flex: 1,
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
});

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={[pill.container, { backgroundColor: color + "15", borderColor: color + "40" }]}>
      <Text style={[pill.value, { color }]}>{value}</Text>
      <Text style={[pill.label, { color: color + "CC" }]}>{label}</Text>
    </View>
  );
}

const pill = StyleSheet.create({
  container: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    alignItems: "center",
    flex: 1,
  },
  value: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  label: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
});

function AdherenceCard({ stats }: { stats: AdherenceStats }) {
  const rateColor = stats.rate >= 80 ? Colors.success : stats.rate >= 50 ? Colors.warning : Colors.danger;
  const initials = stats.medicationName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={card.container}>
      {/* Header */}
      <View style={card.header}>
        <View style={card.avatar}>
          <Text style={card.avatarText}>{initials}</Text>
        </View>
        <View style={card.headerContent}>
          <Text style={card.name} numberOfLines={1}>{stats.medicationName}</Text>
          <Text style={card.total}>{stats.total} doses tracked</Text>
        </View>
        <View style={[card.rateBadge, { backgroundColor: rateColor + "20", borderColor: rateColor + "55" }]}>
          <Text style={[card.rateText, { color: rateColor }]}>{stats.rate}%</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={card.barRow}>
        <AdherenceBar rate={stats.rate} />
      </View>

      {/* Stat pills */}
      <View style={card.pillRow}>
        <StatPill label="Taken" value={stats.confirmed} color={Colors.success} />
        <StatPill label="Missed" value={stats.missed} color={Colors.danger} />
        <StatPill label="Snoozed" value={stats.snoozed} color={Colors.warning} />
        <StatPill label="Skipped" value={stats.skipped} color={Colors.textSecondary} />
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentMid,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  headerContent: {
    flex: 1,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  total: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  rateBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  rateText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  pillRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
});

export function AdherenceScreen() {
  const [stats, setStats] = useState<AdherenceStats[]>([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(
    async (d: number) => {
      try {
        const data = await adherenceApi.medication(d);
        setStats(data);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchStats(days);
    }, [days, fetchStats]),
  );

  const overallRate =
    stats.length > 0 ? Math.round(stats.reduce((sum, s) => sum + s.rate, 0) / stats.length) : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchStats(days);
          }}
          tintColor={Colors.accent}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Adherence Report</Text>
        <Text style={styles.subtitle}>Your medication-taking history</Text>
      </View>

      {/* Period selector */}
      <View style={styles.periodRow}>
        {DAYS_OPTIONS.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.periodBtn, days === d && styles.periodBtnActive]}
            onPress={() => {
              setDays(d);
              setLoading(true);
              fetchStats(d);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.periodText, days === d && styles.periodTextActive]}>
              {d === 7 ? "7 days" : d === 14 ? "2 weeks" : "30 days"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Overall rate */}
      {overallRate !== null && (
        <View style={styles.overallCard}>
          <Text style={styles.overallLabel}>Overall Adherence</Text>
          <Text
            style={[
              styles.overallRate,
              {
                color:
                  overallRate >= 80
                    ? Colors.success
                    : overallRate >= 50
                      ? Colors.warning
                      : Colors.danger,
              },
            ]}
          >
            {overallRate}%
          </Text>
          <AdherenceBar rate={overallRate} />
          <Text style={styles.overallSub}>
            {overallRate >= 80
              ? "🏆 Excellent! Keep it up!"
              : overallRate >= 50
                ? "📈 Good, try to improve"
                : "⚠️ Please don't miss doses"}
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.xl }} />
      ) : stats.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptySubtitle}>
            Start confirming doses to see your adherence report here.
          </Text>
        </View>
      ) : (
        <View>
          <Text style={styles.sectionTitle}>Per Medication</Text>
          {stats.map((s) => (
            <AdherenceCard key={s.medicationId} stats={s} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  header: { paddingTop: Spacing.xl, paddingBottom: Spacing.base },
  title: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: 4 },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.sm },
  periodRow: {
    flexDirection: "row",
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: "center",
  },
  periodBtnActive: {
    backgroundColor: Colors.accent,
  },
  periodText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  periodTextActive: {
    color: Colors.white,
    fontWeight: FontWeight.semibold,
  },
  overallCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    alignItems: "center",
  },
  overallLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  overallRate: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    marginBottom: Spacing.sm,
  },
  overallSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  empty: { alignItems: "center", paddingVertical: Spacing.xxxl },
  emptyIcon: { fontSize: 52, marginBottom: Spacing.md },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.semibold, marginBottom: Spacing.sm },
  emptySubtitle: { color: Colors.textSecondary, fontSize: FontSize.base, textAlign: "center" },
});
