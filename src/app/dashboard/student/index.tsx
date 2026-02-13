import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { View, Text } from "react-native";
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
        <Tab.Navigator tabBarPosition="bottom" initialRouteName={initialRouteName}>
          <Tab.Screen name="Materials" component={StudentMaterialsScreen} />
          <Tab.Screen name="Assignments" component={StudentAssignmentsScreen} />
          <Tab.Screen name="Quizzes" component={StudentQuizzesScreen} />
          <Tab.Screen name="Progress" component={StudentProgressScreen} />
          <Tab.Screen name="Chat" component={StudentChatRoomsScreen} />
        </Tab.Navigator>
      </View>
    </View>
  );
}