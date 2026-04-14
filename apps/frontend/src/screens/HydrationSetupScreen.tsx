import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow, TouchTarget } from "../theme";
import { hydrationApi } from "../api/client";

const GOAL_PRESETS = [
  { label: "1500 ml", value: 1500 },
  { label: "2000 ml", value: 2000 },
  { label: "2500 ml", value: 2500 },
  { label: "3000 ml", value: 3000 },
];

const INTERVAL_PRESETS = [
  { label: "30 min", value: 30 },
  { label: "60 min", value: 60 },
  { label: "90 min", value: 90 },
  { label: "2 hours", value: 120 },
];

export function HydrationSetupScreen() {
  const navigation = useNavigation();
  const [saving, setSaving] = useState(false);

  const [dailyGoalMl, setDailyGoalMl] = useState(2000);
  const [intervalMinutes, setIntervalMinutes] = useState(120);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("21:00");
  const [startError, setStartError] = useState("");
  const [endError, setEndError] = useState("");

  const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

  const parseMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };

  const validate = () => {
    let valid = true;
    if (!TIME_RE.test(startTime)) { setStartError("Must be HH:MM format"); valid = false; }
    else setStartError("");
    if (!TIME_RE.test(endTime)) { setEndError("Must be HH:MM format"); valid = false; }
    else if (parseMinutes(endTime) <= parseMinutes(startTime)) { setEndError("End time must be after start time"); valid = false; }
    else setEndError("");
    return valid;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      await hydrationApi.savePlan({
        dailyGoalMl, intervalMinutes,
        startTime24h: startTime, endTime24h: endTime, timezone: tz,
      });
      Alert.alert("💧 Hydration Plan Saved", "Your reminders are set up and ready!", [
        { text: "Great!", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const msg = err.issues?.map((i: any) => `${i.field}: ${i.message}`).join("\n") ?? err.message ?? "Failed to save";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.iconHero}>💧</Text>
          <Text style={styles.pageTitle}>Set Up Hydration</Text>
          <Text style={styles.pageSubtitle}>Configure your daily water goal and reminder schedule</Text>
        </View>

        {/* Daily goal — FR-HYD-001 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DAILY GOAL</Text>
          <View style={styles.presetRow}>
            {GOAL_PRESETS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.presetBtn, dailyGoalMl === g.value && styles.presetBtnActive]}
                onPress={() => setDailyGoalMl(g.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.presetLabel, dailyGoalMl === g.value && styles.presetLabelActive]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.selectedDisplay}>
            Selected: <Text style={{ color: Colors.teal, fontWeight: FontWeight.bold }}>{dailyGoalMl} ml</Text>
          </Text>
        </View>

        {/* Interval — FR-HYD-003 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>REMINDER FREQUENCY</Text>
          <View style={styles.presetRow}>
            {INTERVAL_PRESETS.map((i) => (
              <TouchableOpacity
                key={i.value}
                style={[styles.presetBtn, intervalMinutes === i.value && styles.presetBtnActive]}
                onPress={() => setIntervalMinutes(i.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.presetLabel, intervalMinutes === i.value && styles.presetLabelActive]}>
                  {i.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Active window — FR-HYD-002 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACTIVE REMINDER WINDOW</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>Start reminders at</Text>
              <TextInput
                style={[styles.timeInput, startError ? styles.timeInputError : null]}
                value={startTime}
                onChangeText={(v) => { setStartTime(v); setStartError(""); }}
                placeholder="08:00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
              {startError !== "" && <Text style={styles.fieldError}>{startError}</Text>}
            </View>
            <View style={styles.timeSep}>
              <Text style={styles.timeSepText}>→</Text>
            </View>
            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>Stop reminders at</Text>
              <TextInput
                style={[styles.timeInput, endError ? styles.timeInputError : null]}
                value={endTime}
                onChangeText={(v) => { setEndTime(v); setEndError(""); }}
                placeholder="21:00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
              {endError !== "" && <Text style={styles.fieldError}>{endError}</Text>}
            </View>
          </View>
          <Text style={styles.helperText}>Reminders will only fire between these times in your local timezone.</Text>
        </View>

        {/* Summary preview */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📋 Summary</Text>
          <Text style={styles.summaryLine}>Goal: {dailyGoalMl} ml per day</Text>
          <Text style={styles.summaryLine}>Remind every: {intervalMinutes} minutes</Text>
          <Text style={styles.summaryLine}>Active: {startTime} → {endTime}</Text>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={Colors.bg} />
          ) : (
            <Text style={styles.saveBtnText}>💧 Save Hydration Plan</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  headerBlock: { alignItems: "center", paddingVertical: Spacing.xl },
  iconHero: { fontSize: 48, marginBottom: Spacing.sm },
  pageTitle: {
    color: Colors.textPrimary, fontSize: FontSize.xl,
    fontWeight: FontWeight.bold, marginBottom: Spacing.xs,
  },
  pageSubtitle: {
    color: Colors.textSecondary, fontSize: FontSize.base,
    textAlign: "center", lineHeight: 22,
  },
  section: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.borderSubtle,
    padding: Spacing.base, marginBottom: Spacing.base,
  },
  sectionLabel: {
    color: Colors.textMuted, fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold, letterSpacing: 0.8,
    textTransform: "uppercase", marginBottom: Spacing.md,
  },
  presetRow: { flexDirection: "row", gap: Spacing.sm, flexWrap: "wrap" },
  presetBtn: {
    flex: 1, minWidth: 70, minHeight: TouchTarget,
    borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.bgElevated,
    alignItems: "center", justifyContent: "center",
  },
  presetBtnActive: { borderColor: Colors.teal, backgroundColor: Colors.tealLight },
  presetLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  presetLabelActive: { color: Colors.teal, fontWeight: FontWeight.bold },
  selectedDisplay: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: Spacing.sm },
  timeRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm },
  timeField: { flex: 1 },
  timeLabel: { color: Colors.textMuted, fontSize: FontSize.xs, marginBottom: Spacing.xs },
  timeInput: {
    backgroundColor: Colors.bgElevated, borderWidth: 1,
    borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    color: Colors.textPrimary, fontSize: FontSize.lg,
    fontWeight: FontWeight.bold, textAlign: "center",
    minHeight: TouchTarget,
  },
  timeInputError: { borderColor: Colors.danger },
  fieldError: { color: Colors.danger, fontSize: FontSize.xs, marginTop: 4 },
  timeSep: { paddingTop: 28, alignItems: "center" },
  timeSepText: { color: Colors.textMuted, fontSize: FontSize.lg },
  helperText: {
    color: Colors.textMuted, fontSize: FontSize.xs,
    marginTop: Spacing.sm, lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: Colors.tealLight, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.teal + "44",
    padding: Spacing.base, marginBottom: Spacing.xl, gap: Spacing.xs,
  },
  summaryTitle: {
    color: Colors.teal, fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold, marginBottom: Spacing.xs,
  },
  summaryLine: { color: Colors.textSecondary, fontSize: FontSize.sm },
  saveBtn: {
    backgroundColor: Colors.teal, borderRadius: Radius.md,
    minHeight: TouchTarget, alignItems: "center", justifyContent: "center",
    ...Shadow.sm,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: Colors.bg, fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
