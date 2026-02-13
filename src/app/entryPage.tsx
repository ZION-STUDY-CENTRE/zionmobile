import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ImageBackground } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
export default function EntryPage() {
  const router = useRouter();

  return (
    <ImageBackground source={require("../../assets/images/building.jpg")} style={styles.container}>
        <StatusBar translucent={true} backgroundColor='transparent' style='light' />
      <View style={styles.overlay} pointerEvents="none"></View>
      <View style={styles.center}>
        <Image
          source={require("../../assets/images/app-icon-android-adaptive-foreground.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Zion Study Center</Text>
        <View style={styles.divider} />
        <Text style={styles.subtitle}>Excellence in Educational Development</Text>
      </View>

      <TouchableOpacity style={styles.loginBtn} onPress={() => router.push("/login")}>
        <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 24, justifyContent: "space-between", marginTop: -70, marginBottom: -25 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0, 0, 0, 0.5)" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  logo: { width: 96, height: 96, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff", textAlign: "center" },
  divider: { height: 4, width: 80, backgroundColor: "#fff", marginVertical: 12, borderRadius: 999 },
  subtitle: { fontSize: 16, color: "#e2e8f0", textAlign: "center" },
  loginBtn: { backgroundColor: "#2563eb", padding: 14, borderRadius: 10, alignItems: "center" },
  loginText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});