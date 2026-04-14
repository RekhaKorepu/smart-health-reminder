import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow, TouchTarget } from "../theme";
import type { DoseEvent } from "../api/client";
import { parseISO, format } from "date-fns";

interface Props {
  dose: DoseEvent | null;
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => Promise<void>;
  onSnooze: () => Promise<void>;
  onSkip: () => Promise<void>;
  loading?: boolean;
}

export function DoseActionSheet({
  dose,
  visible,
  onDismiss,
  onConfirm,
  onSnooze,
  onSkip,
  loading,
}: Props) {
  const translateY = React.useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!dose) return null;

  function formatTime(utcString: string): string {
    try {
      if (!utcString) return "--:--";
      return format(parseISO(utcString), "hh:mm aa");
    } catch {
      return "--:--";
    }
  }

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }] }]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.medicationInfo}>
              <Text style={styles.title}>{dose.medicationName ?? "Medication"}</Text>
              <Text style={styles.subtitle}>
                {dose.dosageText} · Due at {formatTime(dose.dueAtUtc)}
              </Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.xl }} />
          ) : (
            <View style={styles.actions}>
              {/* Confirm */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.confirmBtn]}
                onPress={onConfirm}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Confirm dose taken"
              >
                <Text style={styles.confirmIcon}>✅</Text>
                <View>
                  <Text style={styles.confirmLabel}>Taken</Text>
                  <Text style={styles.actionSubtext}>Mark dose as confirmed</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.row}>
                {/* Snooze */}
                <TouchableOpacity
                  style={[styles.actionBtn, styles.halfBtn, styles.snoozeBtn]}
                  onPress={onSnooze}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Snooze reminder"
                >
                  <Text style={styles.halfIcon}>💤</Text>
                  <Text style={styles.snoozeLabel}>Snooze</Text>
                  <Text style={[styles.actionSubtext, { textAlign: "center" }]}>Remind me later</Text>
                </TouchableOpacity>

                {/* Skip */}
                <TouchableOpacity
                  style={[styles.actionBtn, styles.halfBtn, styles.skipBtn]}
                  onPress={onSkip}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Skip this dose"
                >
                  <Text style={styles.halfIcon}>⏭</Text>
                  <Text style={styles.skipLabel}>Skip</Text>
                  <Text style={[styles.actionSubtext, { textAlign: "center" }]}>Skip this dose</Text>
                </TouchableOpacity>
              </View>

              {/* Cancel */}
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onDismiss}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomWidth: 0,
    paddingBottom: Spacing.xxxl,
    ...Shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: Spacing.md,
    marginBottom: Spacing.base,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    marginBottom: Spacing.base,
  },
  medicationInfo: {},
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
  },
  actions: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  actionBtn: {
    minHeight: TouchTarget,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  confirmBtn: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success + "55",
  },
  confirmIcon: {
    fontSize: 28,
  },
  confirmLabel: {
    color: Colors.success,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  halfBtn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: Spacing.xs,
  },
  halfIcon: {
    fontSize: 24,
  },
  snoozeBtn: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning + "55",
  },
  snoozeLabel: {
    color: Colors.warning,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  skipBtn: {
    backgroundColor: Colors.bgElevated,
    borderColor: Colors.border,
  },
  skipLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  actionSubtext: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
  },
});
