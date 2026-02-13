import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import {jwtDecode} from "jwt-decode";

const API_URL = "https://zion-backend-og8z.onrender.com/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      console.log("Login response:", data);
      if (!res.ok) throw new Error(data.msg || "Login failed");
      // Use the JWT from backend if provided, or fallback to accessToken in cookies
      let userId = data.user?._id;
      if (!userId && data.token) {
        const decoded: any = jwtDecode(data.token);
        userId = decoded?.user?._id || decoded?._id;
      }
      
      await login({
        _id: userId,
        name: data.user.name,
        email: data.user.email,
        token: data.token,
        role: data.user.role,
      });
      if (!data.token) throw new Error("No token received from server");
      if (data.user.role === "instructor") {
        router.replace("/dashboard/instructor");
      } else if (data.user.role === "student") {
        router.replace("/dashboard/student");
      } else if (data.user.role === "media-manager") {
        router.replace("/dashboard/mediaManager");
      } else {
        router.replace("/dashboard");
      }
      
    } catch (e: any) {
      Alert.alert("Login Failed", e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}

    >
    
      <Text style={styles.title}>Zion Mobile</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title={loading ? "Logging in..." : "Login"} onPress={handleLogin} disabled={loading} />
      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
    </KeyboardAvoidingView>
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
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
    color: "#1e3a8a",
  },
  input: {
    width: "100%",
    maxWidth: 350,
    height: 48,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
});
