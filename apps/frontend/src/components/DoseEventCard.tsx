import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, Spacing, Radius, FontSize, FontWeight } from "../theme";
import type { DoseEvent } from "../api/client";

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

function formatTime(utcString: string): string {
  const d = new Date(utcString);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

interface Props {
  dose: DoseEvent;
  onAction?: (dose: DoseEvent) => void;
}

export function DoseEventCard({ dose, onAction }: Props) {
  const cfg = STATUS_CONFIG[dose.status];
  const isPending = dose.status === "PENDING" || dose.status === "SENT" || dose.status === "SNOOZED";

  return (
    <TouchableOpacity
      onPress={() => isPending && onAction?.(dose)}
      activeOpacity={isPending ? 0.75 : 1}
      style={[styles.card, isPending && styles.cardActive]}
      accessibilityRole="button"
      accessibilityLabel={`${dose.medicationName ?? "Medication"} due at ${formatTime(dose.dueAtUtc)}, status ${cfg.label}`}
    >
      {/* Time column */}
      <View style={styles.timeCol}>
        <Text style={styles.time}>{formatTime(dose.dueAtUtc)}</Text>
        <View style={[styles.dot, { backgroundColor: cfg.color }]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.medName} numberOfLines={1}>
            {dose.medicationName ?? "Medication"}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>
              {cfg.icon} {cfg.label}
            </Text>
          </View>
        </View>
        {dose.dosageText ? (
          <Text style={styles.dosage}>{dose.dosageText}</Text>
        ) : null}
        {isPending && (
          <Text style={styles.tapHint}>Tap to confirm or snooze</Text>
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
  cardActive: {
    borderColor: Colors.accentMid,
  },
  timeCol: {
    alignItems: "center",
    width: 52,
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
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
});
