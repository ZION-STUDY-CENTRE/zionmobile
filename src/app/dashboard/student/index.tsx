import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../context/AuthContext";
import NotificationBell from "../../../components/NotificationBell";
import { useLocalSearchParams } from "expo-router";

import StudentMaterialsScreen from "./MaterialsScreen";
import StudentAssignmentsScreen from "./AssignmentsScreen";
import StudentQuizzesScreen from "./QuizzesScreen";
import StudentProgressScreen from "./ProgressScreen";
import StudentChatRoomsScreen from "./ChatRoomsScreen";

const Tab = createMaterialTopTabNavigator();

export default function StudentDashboard() {
  const { user } = useAuth();
  const { tab } = useLocalSearchParams<{ tab: string }>();
  const initialRouteName = tab && ["Materials", "Assignments", "Quizzes", "Progress", "Chat"].includes(tab) ? tab : "Materials";

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 8,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#0f172a" }}>Student Portal</Text>
          <Text style={{ fontSize: 14, color: "#64748b", marginTop: 2 }}>Welcome back, {user?.name || "Student"}</Text>
        </View>
        <NotificationBell token={user?.token} />
      </View>

      <View style={{ flex: 1 }}>
        <Tab.Navigator
          tabBarPosition="bottom"
          initialRouteName={initialRouteName}
          screenOptions={{
            tabBarShowIcon: true,
            tabBarShowLabel: false,
            tabBarIndicatorStyle: { backgroundColor: "#2563eb", top: 0 },
            tabBarStyle: { borderTopWidth: 1, borderColor: "#e2e8f0" },
            tabBarActiveTintColor: "#2563eb",
            tabBarInactiveTintColor: "#64748b",
          }}
        >
          <Tab.Screen
            name="Materials"
            component={StudentMaterialsScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <Ionicons name="home-outline" size={24} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Assignments"
            component={StudentAssignmentsScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <Ionicons name="document-text-outline" size={24} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Quizzes"
            component={StudentQuizzesScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <Ionicons name="pencil-outline" size={24} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Progress"
            component={StudentProgressScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <Ionicons name="stats-chart-outline" size={24} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Chat"
            component={StudentChatRoomsScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <Ionicons name="chatbubbles-outline" size={24} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </View>
    </View>
  );
}