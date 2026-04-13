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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Colors, Spacing, FontSize, FontWeight, Radius, TouchTarget } from "../theme";
import { medicationApi } from "../api/client";
import type { Medication } from "../api/client";
import { MedicationCard } from "../components/MedicationCard";

type RootStackParamList = {
  MedicationDetail: { medicationId: string };
  AddMedication: undefined;
};

export function MedicationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMedications = useCallback(async () => {
    try {
      const data = await medicationApi.list();
      setMedications(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMedications();
    }, [fetchMedications]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMedications();
  };

  const lowStock = medications.filter(
    (m) => m.stockCount !== undefined && m.refillThreshold !== undefined && m.stockCount <= m.refillThreshold,
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={medications}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        ListHeaderComponent={() => (
          <View>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>My Medications</Text>
                <Text style={styles.subtitle}>{medications.length} active medications</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate("AddMedication")}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Add new medication"
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {lowStock.length > 0 && (
              <View style={styles.alertBanner}>
                <Text style={styles.alertIcon}>⚠️</Text>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>Low Stock Alert</Text>
                  <Text style={styles.alertText}>
                    {lowStock.map((m) => m.name).join(", ")} {lowStock.length === 1 ? "is" : "are"} running low
                  </Text>
                </View>
              </View>
            )}

            {loading && (
              <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.xl }} />
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <MedicationCard
            medication={item}
            onPress={() => navigation.navigate("MedicationDetail", { medicationId: item.id })}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💊</Text>
              <Text style={styles.emptyTitle}>No medications yet</Text>
              <Text style={styles.emptySubtitle}>Add your first medication to get started</Text>
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => navigation.navigate("AddMedication")}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyAddButtonText}>+ Add Medication</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        contentContainerStyle={styles.list}
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
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  addButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    minHeight: TouchTarget,
    justifyContent: "center",
  },
  addButtonText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  alertBanner: {
    flexDirection: "row",
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.danger + "55",
    padding: Spacing.base,
    marginBottom: Spacing.base,
    gap: Spacing.sm,
    alignItems: "center",
  },
  alertIcon: {
    fontSize: 24,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    color: Colors.danger,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  alertText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
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
    marginBottom: Spacing.xl,
  },
  emptyAddButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    minHeight: TouchTarget,
    justifyContent: "center",
  },
  emptyAddButtonText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
});
