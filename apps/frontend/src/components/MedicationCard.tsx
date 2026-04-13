import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from "../theme";
import type { Medication } from "../api/client";

interface Props {
  medication: Medication;
  onPress: () => void;
}

function getStockColor(count?: number, threshold?: number) {
  if (count === undefined) return Colors.textMuted;
  if (threshold !== undefined && count <= threshold) return Colors.danger;
  if (threshold !== undefined && count <= threshold * 2) return Colors.warning;
  return Colors.success;
}

function StockIndicator({ count, threshold }: { count?: number; threshold?: number }) {
  if (count === undefined) return null;
  const color = getStockColor(count, threshold);
  const label = threshold !== undefined && count <= threshold ? "Low Stock" : `${count} left`;
  return (
    <View style={[styles.stockBadge, { backgroundColor: color + "22", borderColor: color + "55" }]}>
      <View style={[styles.stockDot, { backgroundColor: color }]} />
      <Text style={[styles.stockText, { color }]}>{label}</Text>
    </View>
  );
}

export function MedicationCard({ medication, onPress }: Props) {
  const initials = medication.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${medication.name}, ${medication.dosageText}`}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{medication.name}</Text>
        <Text style={styles.dosage} numberOfLines={1}>{medication.dosageText}</Text>
        {medication.instructions ? (
          <Text style={styles.instructions} numberOfLines={1}>{medication.instructions}</Text>
        ) : null}
      </View>

      <View style={styles.right}>
        <StockIndicator count={medication.stockCount} threshold={medication.refillThreshold} />
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentMid,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  content: {
    flex: 1,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  dosage: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: 2,
  },
  instructions: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  right: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 4,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  chevron: {
    color: Colors.textMuted,
    fontSize: 20,
    marginTop: 2,
  },
});
