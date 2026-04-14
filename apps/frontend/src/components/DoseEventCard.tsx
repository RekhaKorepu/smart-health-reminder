import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, Spacing, Radius, FontSize, FontWeight } from "../theme";
import type { DoseEvent, HydrationEvent } from "../api/client";

const STATUS_CONFIG: Record<
  DoseEvent["status"],
  { label: string; color: string; bg: string; icon: string }
> = {
  PENDING: { label: "Due", color: Colors.info, bg: Colors.infoLight, icon: "⏰" },
  SENT: { label: "Sent", color: Colors.warning, bg: Colors.warningLight, icon: "📬" },
  ACKED: { label: "Taken", color: Colors.success, bg: Colors.successLight, icon: "✅" },
  SNOOZED: { label: "Snoozed", color: Colors.warning, bg: Colors.warningLight, icon: "💤" },
  SKIPPED: { label: "Skipped", color: Colors.textMuted, bg: Colors.bgElevated, icon: "⏭" },
  MISSED: { label: "Missed", color: Colors.danger, bg: Colors.dangerLight, icon: "❗" },
};

import { parseISO, format } from "date-fns";

function formatTime(utcString: string): string {
  try {
    if (!utcString) return "--:--";
    const d = parseISO(utcString);
    return format(d, "hh:mm aa");
  } catch {
    return "--:--";
  }
}

interface Props {
  event: DoseEvent | HydrationEvent;
  onAction?: (event: any) => void;
}

export function DoseEventCard({ event, onAction }: Props) {
  const isHydration = event.eventType === "HYDRATION_DUE";
  const cfg = STATUS_CONFIG[event.status];
  const isPending = event.status === "PENDING" || event.status === "SENT" || event.status === "SNOOZED";

  const medEvent = !isHydration ? (event as DoseEvent) : null;
  const accentColor = isHydration ? Colors.teal : Colors.accent;

  return (
    <TouchableOpacity
      onPress={() => isPending && onAction?.(event)}
      activeOpacity={isPending ? 0.75 : 1}
      style={[
        styles.card,
        isPending && (isHydration ? styles.cardActiveHydration : styles.cardActiveMedication)
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${isHydration ? "Water Intake" : (medEvent?.medicationName ?? "Medication")} due at ${formatTime(event.dueAtUtc)}, status ${cfg.label}`}
    >
      {/* Time column */}
      <View style={styles.timeCol}>
        <Text style={styles.time}>{formatTime(event.dueAtUtc)}</Text>
        <View style={[styles.dot, { backgroundColor: isHydration ? Colors.teal : cfg.color }]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.medName} numberOfLines={1}>
            {isHydration ? "💧 Water Intake" : (medEvent?.medicationName ?? "Medication")}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>
              {cfg.icon} {cfg.label}
            </Text>
          </View>
        </View>
        {!isHydration && medEvent?.dosageText ? (
          <Text style={styles.dosage}>{medEvent.dosageText}</Text>
        ) : null}
        {isHydration && (
          <Text style={styles.dosage}>Scheduled hydration goal reminder</Text>
        )}
        {isPending && (
          <Text style={[styles.tapHint, { color: accentColor }]}>
            {isHydration ? "Tap to log water" : "Tap to confirm or snooze"}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  cardActiveMedication: {
    borderColor: Colors.accentMid,
  },
  cardActiveHydration: {
    borderColor: Colors.teal + "66",
  },
  timeCol: {
    alignItems: "center",
    width: 60,
    marginRight: Spacing.md,
  },
  time: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  medName: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    flex: 1,
    marginRight: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  dosage: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: 4,
  },
  tapHint: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
});
