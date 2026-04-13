import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow, TouchTarget } from "../theme";
import { medicationApi, scheduleApi } from "../api/client";

type Step = 1 | 2 | 3;

const TIME_SLOTS = [
  { id: "MORNING", label: "Morning", sub: "Around 8:00 AM", icon: "🌅" },
  { id: "AFTERNOON", label: "Afternoon", sub: "Around 1:00 PM", icon: "☀️" },
  { id: "EVENING", label: "Evening", sub: "Around 6:00 PM", icon: "🌆" },
  { id: "NIGHT", label: "Night", sub: "Around 9:00 PM", icon: "🌙" },
] as const;

const SCHEDULE_TYPES = [
  { id: "DAILY", label: "Every Day", icon: "📅" },
  { id: "WEEKLY", label: "Weekly", icon: "🗓" },
] as const;

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function StepIndicator({ current, total }: { current: Step; total: number }) {
  return (
    <View style={ind.container}>
      {Array.from({ length: total }, (_, i) => {
        const step = (i + 1) as Step;
        const done = step < current;
        const active = step === current;
        return (
          <React.Fragment key={i}>
            <View style={[ind.dot, done && ind.dotDone, active && ind.dotActive]}>
              {done ? (
                <Text style={ind.dotText}>✓</Text>
              ) : (
                <Text style={[ind.dotText, !active && { color: Colors.textMuted }]}>{step}</Text>
              )}
            </View>
            {i < total - 1 && <View style={[ind.line, done && ind.lineDone]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const ind = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dotActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  dotDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  dotText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
  },
  lineDone: {
    backgroundColor: Colors.success,
  },
});

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  optional,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  multiline?: boolean;
  optional?: boolean;
}) {
  return (
    <View style={field.container}>
      <Text style={field.label}>
        {label} {optional && <Text style={field.optional}>(optional)</Text>}
      </Text>
      <TextInput
        style={[field.input, multiline && field.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        autoCorrect={false}
      />
    </View>
  );
}

const field = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optional: {
    color: Colors.textMuted,
    fontWeight: FontWeight.regular,
    textTransform: "lowercase",
  },
  input: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    minHeight: TouchTarget,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
});

export function AddMedicationScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Medication details
  const [name, setName] = useState("");
  const [dosageText, setDosageText] = useState("");
  const [instructions, setInstructions] = useState("");
  const [stockCount, setStockCount] = useState("");
  const [refillThreshold, setRefillThreshold] = useState("");

  // Step 2: Schedule
  const [scheduleType, setScheduleType] = useState<"DAILY" | "WEEKLY">("DAILY");
  const [timeSlot, setTimeSlot] = useState<"MORNING" | "AFTERNOON" | "EVENING" | "NIGHT">("MORNING");
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);

  const toggleWeekday = (day: number) =>
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const handleSave = async () => {
    if (!canStep1) {
      Alert.alert("Missing Information", "Please enter the medication name and dosage.");
      setStep(1);
      return;
    }

    setSaving(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      
      const med = await medicationApi.create({
        name: name.trim(),
        dosageText: dosageText.trim(),
        instructions: instructions.trim() || undefined,
        startDate: new Date().toISOString().slice(0, 10),
        timezone: tz,
        stockCount: stockCount ? parseInt(stockCount, 10) : undefined,
        refillThreshold: refillThreshold ? parseInt(refillThreshold, 10) : undefined,
      });

      await scheduleApi.create(med.id, {
        scheduleType,
        timeSlot,
        weekdays: scheduleType === "WEEKLY" ? weekdays : undefined,
        timezone: tz,
      });

      Alert.alert("✅ Medication Added", `${name} has been added to your schedule.`, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      console.error("Save failed:", err);
      
      let errorMsg = "Failed to save medication. Please try again.";
      if (err.issues && Array.isArray(err.issues)) {
        errorMsg = err.issues.map((i: any) => `${i.field}: ${i.message}`).join("\n");
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      Alert.alert("Saving Failed", errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const canStep1 = name.trim().length > 0 && dosageText.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <StepIndicator current={step} total={3} />

        {/* Step 1: Medication details */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Medication Details</Text>
            <Text style={styles.stepSubtitle}>Enter the basic information about your medication</Text>

            <InputField label="Medication name" value={name} onChangeText={setName} placeholder="e.g., Metformin 500mg" />
            <InputField label="Dosage" value={dosageText} onChangeText={setDosageText} placeholder="e.g., 1 tablet after meals" />
            <InputField label="Instructions" value={instructions} onChangeText={setInstructions} placeholder="e.g., Take with food" multiline optional />
            <InputField label="Stock Count" value={stockCount} onChangeText={setStockCount} placeholder="e.g., 60" keyboardType="numeric" optional />
            <InputField label="Refill when below" value={refillThreshold} onChangeText={setRefillThreshold} placeholder="e.g., 10" keyboardType="numeric" optional />

            <TouchableOpacity
              style={[styles.primaryBtn, !canStep1 && styles.primaryBtnDisabled]}
              onPress={() => setStep(2)}
              disabled={!canStep1}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Next: Set Schedule →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Set Reminder Schedule</Text>
            <Text style={styles.stepSubtitle}>When should we remind you to take {name}?</Text>

            <Text style={field.label}>Frequency</Text>
            <View style={styles.optionRow}>
              {SCHEDULE_TYPES.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.optionCard, scheduleType === s.id && styles.optionCardActive]}
                  onPress={() => setScheduleType(s.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.optionIcon}>{s.icon}</Text>
                  <Text style={[styles.optionLabel, scheduleType === s.id && styles.optionLabelActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {scheduleType === "WEEKLY" && (
              <View style={styles.weekdayRow}>
                {WEEKDAY_LABELS.map((label, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.dayBtn, weekdays.includes(i) && styles.dayBtnActive]}
                    onPress={() => toggleWeekday(i)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dayLabel, weekdays.includes(i) && styles.dayLabelActive]}>
                      {label[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[field.label, { marginTop: Spacing.base }]}>Time of Day</Text>
            {TIME_SLOTS.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[styles.timeSlotCard, timeSlot === slot.id && styles.timeSlotActive]}
                onPress={() => setTimeSlot(slot.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.timeSlotIcon}>{slot.icon}</Text>
                <View style={styles.timeSlotContent}>
                  <Text style={[styles.timeSlotLabel, timeSlot === slot.id && { color: Colors.accent }]}>
                    {slot.label}
                  </Text>
                  <Text style={styles.timeSlotSub}>{slot.sub}</Text>
                </View>
                <View style={[styles.radioOuter, timeSlot === slot.id && styles.radioOuterActive]}>
                  {timeSlot === slot.id && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)} activeOpacity={0.8}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={() => setStep(3)} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Review →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: Review & confirm */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Review & Confirm</Text>
            <Text style={styles.stepSubtitle}>Check everything looks right before saving</Text>

            <View style={styles.reviewCard}>
              <ReviewRow label="Name" value={name} />
              <ReviewRow label="Dosage" value={dosageText} />
              {instructions ? <ReviewRow label="Instructions" value={instructions} /> : null}
              {stockCount ? <ReviewRow label="Stock Count" value={`${stockCount} units`} /> : null}
              {refillThreshold ? <ReviewRow label="Refill Alert" value={`When below ${refillThreshold}`} /> : null}
              <View style={styles.reviewDivider} />
              <ReviewRow label="Frequency" value={scheduleType === "DAILY" ? "Every Day" : `Weekly: ${weekdays.map((d) => WEEKDAY_LABELS[d]).join(", ")}`} />
              <ReviewRow label="Time" value={TIME_SLOTS.find((s) => s.id === timeSlot)?.label ?? timeSlot} />
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)} activeOpacity={0.8}>
                <Text style={styles.backBtnText}>← Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1 }, saving && styles.primaryBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>✅ Save Medication</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={rev.row}>
      <Text style={rev.label}>{label}</Text>
      <Text style={rev.value}>{value}</Text>
    </View>
  );
}

const rev = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: Spacing.sm,
  },
  label: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    flex: 1,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    flex: 2,
    textAlign: "right",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  stepTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    minHeight: TouchTarget,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.base,
    ...Shadow.sm,
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  backBtn: {
    paddingHorizontal: Spacing.base,
    minHeight: TouchTarget,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.base,
    marginRight: Spacing.sm,
  },
  backBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  optionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  optionCard: {
    flex: 1,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.base,
    alignItems: "center",
    gap: Spacing.xs,
  },
  optionCardActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  optionIcon: {
    fontSize: 22,
  },
  optionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  optionLabelActive: {
    color: Colors.accent,
  },
  weekdayRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.base,
    justifyContent: "space-between",
  },
  dayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  dayLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  dayLabelActive: {
    color: Colors.white,
  },
  timeSlotCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  timeSlotActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  timeSlotIcon: {
    fontSize: 24,
  },
  timeSlotContent: {
    flex: 1,
  },
  timeSlotLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
  },
  timeSlotSub: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: Colors.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  reviewCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: Spacing.sm,
  },
});
