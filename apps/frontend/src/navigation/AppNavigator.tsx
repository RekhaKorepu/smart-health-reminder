import React from "react";
import { View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Colors, FontSize, FontWeight } from "../theme";

import { HomeScreen } from "../screens/HomeScreen";
import { MedicationsScreen } from "../screens/MedicationsScreen";
import { MedicationDetailScreen } from "../screens/MedicationDetailScreen";
import { AddMedicationScreen } from "../screens/AddMedicationScreen";
import { AdherenceScreen } from "../screens/AdherenceScreen";
import { HydrationScreen } from "../screens/HydrationScreen";
import { HydrationSetupScreen } from "../screens/HydrationSetupScreen";

// ─── Stack param types ────────────────────────────────────────────────────────

export type MedicationStackParamList = {
  MedicationsList: undefined;
  MedicationDetail: { medicationId: string };
  AddMedication: undefined;
};

export type HydrationStackParamList = {
  HydrationMain: undefined;
  HydrationSetup: undefined;
};

const Tab = createBottomTabNavigator();
const MedStack = createNativeStackNavigator<MedicationStackParamList>();
const HydStack = createNativeStackNavigator<HydrationStackParamList>();

// ─── Tab icon component ───────────────────────────────────────────────────────

function TabIcon({ emoji }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: "center", gap: 2 }}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
    </View>
  );
}

// ─── Medication stack ─────────────────────────────────────────────────────────

function MedicationStack() {
  return (
    <MedStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: FontWeight.semibold, fontSize: FontSize.md },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <MedStack.Screen
        name="MedicationsList"
        component={MedicationsScreen}
        options={{ title: "Medications", headerShown: false }}
      />
      <MedStack.Screen
        name="MedicationDetail"
        component={MedicationDetailScreen}
        options={{ title: "Medication Details" }}
      />
      <MedStack.Screen
        name="AddMedication"
        component={AddMedicationScreen}
        options={{ title: "Add Medication", presentation: "modal" }}
      />
    </MedStack.Navigator>
  );
}

// ─── Hydration stack ──────────────────────────────────────────────────────────

function HydrationStack() {
  return (
    <HydStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: FontWeight.semibold, fontSize: FontSize.md },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <HydStack.Screen
        name="HydrationMain"
        component={HydrationScreen}
        options={{ headerShown: false }}
      />
      <HydStack.Screen
        name="HydrationSetup"
        component={HydrationSetupScreen}
        options={{ title: "Hydration Setup", presentation: "modal" }}
      />
    </HydStack.Navigator>
  );
}

// ─── Root navigator ───────────────────────────────────────────────────────────

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: Colors.bg },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: { fontWeight: FontWeight.bold, fontSize: FontSize.lg },
          headerShadowVisible: false,
          tabBarStyle: {
            backgroundColor: Colors.bgCard,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            height: 80,
            paddingBottom: 16,
            paddingTop: 8,
          },
          tabBarActiveTintColor: Colors.accent,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: {
            fontSize: FontSize.xs,
            fontWeight: FontWeight.medium,
            marginTop: 2,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: "Today",
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Medications"
          component={MedicationStack}
          options={{
            title: "Medications",
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon emoji="💊" label="Medications" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Hydration"
          component={HydrationStack}
          options={{
            title: "Hydration",
            headerShown: false,
            tabBarActiveTintColor: Colors.teal,
            tabBarIcon: ({ focused }) => <TabIcon emoji="💧" label="Hydration" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Adherence"
          component={AdherenceScreen}
          options={{
            title: "Adherence",
            tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Adherence" focused={focused} />,
            headerStyle: { backgroundColor: Colors.bg },
            headerShadowVisible: false,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
