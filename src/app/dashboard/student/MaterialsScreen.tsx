import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Linking, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import { getStudentProgram, getFileResources, recordDownload } from "../../../api/student";

export default function StudentMaterialsScreen() {
  const router = useRouter(); 
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.token) return;
    (async () => {
      setLoading(true);
      try {
        const prog = await getStudentProgram(user.token);
        setProgram(prog);
        if (prog?._id) {
          const data = await getFileResources(prog._id, user.token);
          setFiles(Array.isArray(data) ? data : []);
        } else {
          setFiles([]);
        }
      } catch (e: any) {
        Alert.alert("Error", e.message || "Failed to load materials");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.token]);

  const handleOpenFile = async (file: any) => {
    try {
      if (file?.fileUrl) {
        await Linking.openURL(file.fileUrl);
        await recordDownload(file._id, user?.token || "");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to open file");
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 24 }} />;

  return (
    <View style={styles.container}>
      {/* Header Buttons */}
      <View style={styles.headerBar}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => router.push("/change-password")}
        >
          <Text style={styles.actionText}>Change Password</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.logoutButton]} 
          onPress={handleLogout}
        >
          <Text style={[styles.actionText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>

      
        <Text style={styles.sectionHeader}>Student Portal</Text>
        <Text style={styles.sectionHeader2}>Welcome back, {user?.name || "Student"}</Text>

      {!program ? (
        <View style={styles.centerContent}>
           <Text style={styles.subtitle}>You are not enrolled in a program yet.</Text>
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={() => (
            <View>
                <View style={styles.programCard}>
              <View style={styles.programHeaderRow}>
                <Text style={styles.programTitle}>{program.title}</Text>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              </View>
              
              <Text style={styles.programDesc}>
                {program.description || "No description available."}
              </Text>

              <View style={styles.programFooter}>
                <View style={styles.programMetaRow}>
                  <Text style={styles.metaLabel}>👤 Instructors: </Text>
                  <Text style={styles.metaValue}>
                    {program.instructors && program.instructors.length > 0
                      ? program.instructors.map((i: any) => i.name).join(", ")
                      : "TBA"}
                  </Text>
                </View>
                <View style={[styles.programMetaRow, { marginTop: 4 }]}>
                  <Text style={styles.metaLabel}>📅 Enrolled: </Text>
                  <Text style={styles.metaValue}>Active</Text>
                </View>
              </View>
            </View>
            <Text style={styles.studyMaterials}>Study Materials</Text>

            </View>
          )}
          
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.fileCard} onPress={() => handleOpenFile(item)}>
              <Text style={styles.fileTitle}>{item.title || item.fileName || "File"}</Text>
              <Text style={styles.fileDesc}>{item.description || "Tap to download/view"}</Text>
              <Text style={styles.downloadLink}>Download</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No materials uploaded yet.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8fafc" },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header Buttons
  headerBar: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 12, gap: 10 },
  actionButton: { backgroundColor: "#fff", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: "#e2e8f0" },
  logoutButton: { borderColor: "#fecaca", backgroundColor: "#fef2f2" },
  actionText: { color: "#334155", fontWeight: "600", fontSize: 14 },
  logoutText: { color: "#dc2626" },

  // Program Card (The Info Block)
  programCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb", // Primary blue
    elevation: 3, // Shadow for android
    shadowColor: "#000", // Shadow for ios
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  programHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  programTitle: { fontSize: 22, fontWeight: "bold", color: "#1e293b", flex: 1, marginRight: 8 },
  activeBadge: { backgroundColor: "#eff6ff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: "#bfdbfe" },
  activeBadgeText: { color: "#2563eb", fontSize: 12, fontWeight: "bold" },
  programDesc: { color: "#475569", fontSize: 14, lineHeight: 20, marginBottom: 16 },
  programFooter: { borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 12 },
  programMetaRow: { flexDirection: "row", alignItems: "center" },
  metaLabel: { fontSize: 13, color: "#64748b" },
  metaValue: { fontSize: 13, color: "#334155", fontWeight: "600" },

  sectionHeader: { fontSize: 20, fontWeight: "800", color: "#1e293b", marginTop: 24},
  sectionHeader2: { fontSize: 15, fontWeight: "400", color: "gray", marginBottom: 24 },
    studyMaterials: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginTop: 24, marginBottom: 10 },

  // Materials List Styles
  fileCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  fileTitle: { fontWeight: "600", fontSize: 16, color: "#0f172a" },
  fileDesc: { color: "#64748b", fontSize: 13, marginTop: 4, marginBottom: 8 },
  downloadLink: { backgroundColor: "#2563eb", color: "#fff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 14, fontWeight: "500", width: 90},
  
  subtitle: { color: "#475569", fontSize: 16 },
  emptyText: { textAlign: "center", color: "#94a3b8", marginTop: 20, fontStyle: "italic" }
});