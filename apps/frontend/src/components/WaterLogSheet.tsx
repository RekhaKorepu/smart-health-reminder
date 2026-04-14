import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow, TouchTarget } from "../theme";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onLog: (amountMl: number, source: "MANUAL" | "REMINDER_ACTION") => Promise<void>;
  loading?: boolean;
}

const PRESETS = [
  { label: "100ml", icon: "🥛", value: 100 },
  { label: "250ml", icon: "💧", value: 250 },
  { label: "350ml", icon: "🫗", value: 350 },
  { label: "500ml", icon: "🍶", value: 500 },
];

export function WaterLogSheet({ visible, onDismiss, onLog, loading }: Props) {
  const translateY = useRef(new Animated.Value(400)).current;
  const [customMode, setCustomMode] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [customError, setCustomError] = useState("");

  useEffect(() => {
    if (visible) {
      setCustomMode(false);
      setCustomAmount("");
      setCustomError("");
      Animated.spring(translateY, {
        toValue: 0, useNativeDriver: true, tension: 80, friction: 10,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 400, duration: 200, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handlePreset = async (value: number) => {
    await onLog(value, "MANUAL");
  };

  const handleCustomSubmit = async () => {
    const parsed = parseInt(customAmount, 10);
    if (!parsed || parsed < 1 || parsed > 5000) {
      setCustomError("Enter a value between 1 and 5000 ml");
      return;
    }
    setCustomError("");
    await onLog(parsed, "MANUAL");
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>💧 Log Water Intake</Text>
            <Text style={styles.subtitle}>Quick-tap your amount or enter a custom value</Text>
          </View>

          {loading ? (
            <ActivityIndicator color={Colors.teal} style={{ marginVertical: Spacing.xl }} />
          ) : (
            <View style={styles.body}>
              {/* Preset grid — FR-HYD-004 AC1 */}
              <View style={styles.presetGrid}>
                {PRESETS.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={styles.presetBtn}
                    onPress={() => handlePreset(p.value)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Log ${p.value} milliliters`}
                  >
                    <Text style={styles.presetIcon}>{p.icon}</Text>
                    <Text style={styles.presetLabel}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom input — FR-HYD-004 AC2 */}
              {customMode ? (
                <View style={styles.customRow}>
                  <TextInput
                    style={styles.customInput}
                    value={customAmount}
                    onChangeText={setCustomAmount}
                    keyboardType="numeric"
                    placeholder="Enter ml"
                    placeholderTextColor={Colors.textMuted}
                    autoFocus
                    maxLength={4}
                  />
                  <TouchableOpacity
                    style={styles.customSubmit}
                    onPress={handleCustomSubmit}
                    activeOpacity={0.85}
                    accessibilityLabel="Submit custom water amount"
                  >
                    <Text style={styles.customSubmitText}>Log ✓</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.customTrigger}
                  onPress={() => setCustomMode(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.customTriggerText}>✏️ Custom amount</Text>
                </TouchableOpacity>
              )}

              {customError !== "" && (
                <Text style={styles.error}>{customError}</Text>
              )}

              {/* Cancel */}
              <TouchableOpacity style={styles.cancelBtn} onPress={onDismiss} activeOpacity={0.7}>
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
    width: 40, height: 4,
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
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  body: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  presetGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  presetBtn: {
    flex: 1,
    minWidth: 70,
    minHeight: TouchTarget,
    backgroundColor: Colors.tealLight,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.teal + "44",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  presetIcon: { fontSize: 24 },
  presetLabel: {
    color: Colors.teal,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  customRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  customInput: {
    flex: 1,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.teal + "66",
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    minHeight: TouchTarget,
  },
  customSubmit: {
    backgroundColor: Colors.teal,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    minHeight: TouchTarget,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.sm,
  },
  customSubmitText: {
    color: Colors.bg,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.base,
  },
  customTrigger: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderStyle: "dashed",
    minHeight: TouchTarget,
    justifyContent: "center",
  },
  customTriggerText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  error: {
    color: Colors.danger,
    fontSize: FontSize.xs,
    textAlign: "center",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
  },
});
