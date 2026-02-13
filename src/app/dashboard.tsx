import { View, Text, Button, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user?.email}</Text>
      <Text style={styles.role}>Role: {user?.role}</Text>
      <Text style={styles.role2}>category for the {user?.role} login is coming soon...</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#1e3a8a",
  },
  role: {
    fontSize: 18,
    marginBottom: 32,
    color: "#475569",
  },
  role2: {
    fontSize: 12,
    marginBottom: 32,
    color: "#1e3a8a",
  },
});
