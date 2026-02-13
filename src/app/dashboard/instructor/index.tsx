import React, { useEffect, useState, useCallback } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { View, Text, ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, Button, TextInput, Alert, Modal, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import { getInstructorPrograms, getProgramStudents, changePassword } from "../../../api/instructor";
import * as DocumentPicker from "expo-document-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import QuizzesScreen from "./QuizzesScreen";
import MaterialsScreen from "./MaterialsScreen";
import ChatRoomsScreen from "./ChatRoomsScreen";
import NotificationBell from "../../../components/NotificationBell";

const Tab = createMaterialTopTabNavigator();


const StudentsScreen = ({
  user,
  logout,
  router,
  programs,
  selectedProgram,
  setSelectedProgram
}: {
  user: any,
  logout: any,
  router: any,
  programs: any[],
  selectedProgram: any,
  setSelectedProgram: (p: any) => void
}): React.ReactElement | null => {
    const [students, setStudents] = useState<any[]>([]);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);


  useEffect(() => {
    if (!user?.token || !selectedProgram) return;
    setStudentsLoading(true);
    setError(null);
    (async () => {
      try {
        const studs = await getProgramStudents(selectedProgram._id, user.token);
        setStudents(studs);
      } catch (e: any) {
        setError(e.message || "Failed to load students");
      } finally {
        setStudentsLoading(false);
      }
    })();
  }, [user?.token, selectedProgram]);

  const handleChangePassword = async () => {
    if (!user?.token) return;
    if (!newPassword || !confirmPassword) {
      Alert.alert("Validation", "Please fill in both password fields.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Validation", "New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(user.token, newPassword);
      setChangePasswordVisible(false);
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Success", "Password updated successfully.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={styles.topActionsRow}>
        <NotificationBell token={user?.token} />
        <TouchableOpacity
          style={[styles.headerActionButton, styles.changePasswordButton]}
          onPress={() => setChangePasswordVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.headerActionText}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.headerActionButton, styles.logoutButton]}
          onPress={async () => { await logout(); router.replace("/"); }}
          activeOpacity={0.8}
        >
          <Text style={styles.headerActionText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.dashboardTitle}>Instructor Dashboard</Text>
      <Text style={styles.welcomeText}>Welcome back, {user?.name || "Instructor"}</Text>

      <View style={{ marginBottom: 16, borderColor: "lightgray", borderWidth: 1, borderRadius: 8, padding: 12 }}>
        <Text style={styles.sectionTitle}>My Programs</Text>
        <FlatList
          data={programs}
          horizontal
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.programButton,
                selectedProgram?._id === item._id && styles.programButtonActive,
              ]}
              onPress={() => setSelectedProgram(item)}
              activeOpacity={0.8}
            >
              <Text style={selectedProgram?._id === item._id ? styles.programButtonTextActive : styles.programButtonText}>{item.title}</Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', gap: 10 }}
        />
      </View>
      <Text style={styles.sectionTitle}>Students</Text>

      <Modal
        visible={changePasswordVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setChangePasswordVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.passwordModalCard}>
            <Text style={styles.passwordModalTitle}>Change Password</Text>
            <TextInput
              style={styles.passwordInput}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <View style={styles.passwordModalActions}>
              <TouchableOpacity
                style={[styles.passwordActionButton, styles.passwordCancelButton]}
                onPress={() => {
                  setChangePasswordVisible(false);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                disabled={changingPassword}
              >
                <Text style={styles.passwordCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.passwordActionButton, styles.passwordSaveButton]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                <Text style={styles.passwordSaveText}>{changingPassword ? "Saving..." : "Save"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {studentsLoading ? (
        <ActivityIndicator style={{ marginTop: 16 }} />
      ) : students.length === 0 ? (
        <Text style={{ fontStyle: 'italic', color: '#888', marginTop: 16 }}>No students enrolled in this program yet.</Text>
      ) : (
        <FlatList
          data={students}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View style={styles.studentCard}>
              <Text style={styles.studentName}>{item.name}</Text>
              <Text style={styles.studentEmail}>{item.email}</Text>
              <Text style={styles.studentDate}>Enrolled: {new Date(item.enrollmentDate).toLocaleDateString()}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e3a8a',
  },
  topActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  changePasswordButton: {
    backgroundColor: '#1e3a8a',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    color: '#fff',
  },
  headerActionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 12,
  },
  programButton: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  programButtonActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  programButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  programButtonText: {
    color: '#1e3a8a',
    fontWeight: 'bold',
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  studentEmail: {
    color: '#334155',
    marginBottom: 4,
  },
  studentDate: {
    color: '#64748b',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  passwordModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  passwordModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
  },
  passwordModalActions: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  passwordActionButton: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 8,
  },
  passwordCancelButton: {
    backgroundColor: '#e2e8f0',
  },
  passwordSaveButton: {
    backgroundColor: '#1e3a8a',
  },
  passwordCancelText: {
    color: '#1e293b',
    fontWeight: '600',
  },
  passwordSaveText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export const AssignmentsScreen = ({
  user,
  selectedProgram,
}: {
  user: any,
  selectedProgram: any,
}) => {

    // Combine date and time into ISO string
    function combineDateAndTime(date: Date | null, time: Date | null): string | null {
        if (!date || !time) return null;
        const combined = new Date(date);
        combined.setHours(time.getHours());
        combined.setMinutes(time.getMinutes());
        combined.setSeconds(0);
        combined.setMilliseconds(0);
        return combined.toISOString();
    }

  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    releaseDate: "",
    dueDate: "",
    attachmentUrl: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
    const [releaseDate, setReleaseDate] = useState<Date | null>(null);
    const [releaseTime, setReleaseTime] = useState<Date | null>(null);
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [dueTime, setDueTime] = useState<Date | null>(null);
    const [showReleaseDate, setShowReleaseDate] = useState(false);
    const [showReleaseTime, setShowReleaseTime] = useState(false);
    const [showDueDate, setShowDueDate] = useState(false);
    const [showDueTime, setShowDueTime] = useState(false);

  useEffect(() => {
    if (!user?.token || !selectedProgram?._id) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const data = await require("../../../api/instructor").getAssignments(selectedProgram._id, user.token);
        setAssignments(data);
      } catch (e: any) {
        setError("Failed to load assignments");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.token, selectedProgram?._id]);

  // Handle form input
  const handleInput = (key: string, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handlePickFile = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
        if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        setForm(f => ({ ...f, attachmentUrl: result.assets[0].uri }));
        }
    } catch (e) {
        // Optionally handle error
    }
    };

    const handleCreate = async () => {
    setFormError(null);
    const scheduledISO = combineDateAndTime(releaseDate, releaseTime);
    const dueISO = combineDateAndTime(dueDate, dueTime);

    console.log("Assignment payload:", {
        title: form.title,
        description: form.description,
        scheduledDate: scheduledISO,
        dueDate: dueISO,
        program: selectedProgram?._id,
        attachmentUrl: form.attachmentUrl,
    });

    if (!form.title || !form.description || !scheduledISO || !dueISO || !selectedProgram?._id) {
        setFormError("All fields except attachment are required.");
        return;
    }
    if (new Date(scheduledISO) > new Date(dueISO)) {
        setFormError("Release date/time must be before due date/time.");
        return;
    }
    setSubmitting(true);
    try {
        await require("../../../api/instructor").createAssignment(
        selectedProgram._id,
        user.token,
        {
            title: form.title,
            description: form.description,
            scheduledDate: scheduledISO,
            dueDate: dueISO,
            attachmentUrl: form.attachmentUrl,
        }
        );
        setModalVisible(false);
        setForm({
        title: "",
        description: "",
        releaseDate: "",
        dueDate: "",
        attachmentUrl: "",
        });
        setReleaseDate(null);
        setReleaseTime(null);
        setDueDate(null);
        setDueTime(null);
        // Refresh assignments
        const data = await require("../../../api/instructor").getAssignments(selectedProgram._id, user.token);
        setAssignments(data);
    } catch (e: any) {
        console.log("Assignment creation error:", e);
        setFormError(e.message || "Failed to create assignment");
    } finally {
        setSubmitting(false);
    }
    };

    const handleViewSubmissions = (assignmentId: string) => {
        router.push(`/dashboard/instructor/${assignmentId}`);
    };

    const handleDeleteAssignment = (assignmentId: string) => {
      if (!user?.token || !selectedProgram?._id) return;
        Alert.alert(
            "Delete Assignment",
            "Are you sure you want to delete this assignment?",
            [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                try {
                    // PASS 3 ARGUMENTS HERE:
                    await require("../../../api/instructor").deleteAssignment(
                      selectedProgram._id,
                      assignmentId,
                      user.token
                    );
                    
                    // Refresh assignments
                    const data = await require("../../../api/instructor").getAssignments(selectedProgram._id, user.token);
                    setAssignments(data);
                } catch (e: any) {
                    Alert.alert("Error", e.message || "Failed to delete assignment");
                }
                },
            },
            ]
        );
    };

  return (
    <View id="assignmentScreen" style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e3a8a' }}>Assignments</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={{
            backgroundColor: "#1e3a8a",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>+ New</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={{ color: 'red', margin: 16 }}>{error}</Text>
      ) : assignments.length === 0 ? (
        <Text style={{ fontStyle: 'italic', color: '#888', marginTop: 16 }}>No assignments yet.</Text>
      ) : (
        <FlatList
          data={assignments}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View style={assignmentStyles.assignmentCard}>
            <Text style={assignmentStyles.assignmentTitle}>{item.title}</Text>
            <Text style={assignmentStyles.assignmentDue}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
            <Text style={assignmentStyles.assignmentDesc}>{item.description}</Text>
            {item.attachmentUrl ? (
                <Text style={{ color: "#2563eb", marginTop: 4 }}>Attachment: {item.attachmentUrl}</Text>
            ) : null}
            <View style={{ flexDirection: "row", marginTop: 8 }}>
                <TouchableOpacity
                style={{
                    backgroundColor: "#2563eb",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    marginRight: 8,
                }}
                onPress={() => handleViewSubmissions(item._id)}
                >
                <Text style={{ color: "#fff" }}>View Submissions</Text>
                </TouchableOpacity>
                <TouchableOpacity
                style={{
                    backgroundColor: "#dc2626",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                }}
                onPress={() => handleDeleteAssignment(item._id)}
                >
                <Text style={{ color: "#fff" }}>Delete</Text>
                </TouchableOpacity>
            </View>
            </View>
          )}
        />
      )}

      {/* Create Assignment Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          setFormError(null);
        }}
      >
        <KeyboardAvoidingView
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
        >
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 16 }}>
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                width: "100%",
                maxWidth: 420,
                maxHeight: "85%", // key
                elevation: 5,
              }}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 20, paddingBottom: 28 }}
                showsVerticalScrollIndicator={false}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>Create Assignment</Text>
                <Text style={{ fontSize: 15, color: "gray", marginBottom: 12 }}>
                  Add a new assignment for students
                </Text>

                {formError ? (
                  <View style={{ backgroundColor: "#fee2e2", padding: 10, borderRadius: 8, marginBottom: 12 }}>
                    <Text style={{ color: "#ef4444", fontWeight: "bold" }}>{formError}</Text>
                  </View>
                ) : null}

                <Text style={{ marginBottom: 4 }}>Title</Text>
            <TextInput
              value={form.title}
              onChangeText={v => handleInput("title", v)}
              style={modalStyles.input}
              placeholder="Assignment title"
            />
            <Text style={{ marginBottom: 4, marginTop: 8 }}>Description</Text>
            <TextInput
              value={form.description}
              onChangeText={v => handleInput("description", v)}
              style={[modalStyles.input, { height: 60 }]}
              placeholder="Assignment description"
              multiline
            />
            <Text style={{ marginBottom: 4, marginTop: 8 }}>Release Date</Text>
            <TouchableOpacity
            style={modalStyles.input}
            onPress={() => setShowReleaseDate(true)}
            >
            <Text>
                {releaseDate ? releaseDate.toLocaleDateString() : "Pick release date"}
            </Text>
            </TouchableOpacity>
            {showReleaseDate && (
            <DateTimePicker
                value={releaseDate || new Date()}
                mode="date"
                display="default"
                onChange={(_, date) => {
                setShowReleaseDate(false);
                if (date) setReleaseDate(date);
                }}
            />
            )}

            <Text style={{ marginBottom: 4, marginTop: 8 }}>Release Time</Text>
            <TouchableOpacity
            style={modalStyles.input}
            onPress={() => setShowReleaseTime(true)}
            >
            <Text>
                {releaseTime ? releaseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Pick release time"}
            </Text>
            </TouchableOpacity>
            {showReleaseTime && (
            <DateTimePicker
                value={releaseTime || new Date()}
                mode="time"
                display="default"
                onChange={(_, date) => {
                setShowReleaseTime(false);
                if (date) setReleaseTime(date);
                }}
            />
            )}

            <Text style={{ marginBottom: 4, marginTop: 8 }}>Due Date</Text>
            <TouchableOpacity
            style={modalStyles.input}
            onPress={() => setShowDueDate(true)}
            >
            <Text>
                {dueDate ? dueDate.toLocaleDateString() : "Pick due date"}
            </Text>
            </TouchableOpacity>
            {showDueDate && (
            <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display="default"
                onChange={(_, date) => {
                    setShowDueDate(false);
                    if (date) setDueDate(date);
                    }}
                />
                )}

                <Text style={{ marginBottom: 4, marginTop: 8 }}>Due Time</Text>
                <TouchableOpacity
                style={modalStyles.input}
                onPress={() => setShowDueTime(true)}
                >
                <Text>
                    {dueTime ? dueTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Pick due time"}
                </Text>
                </TouchableOpacity>
                {showDueTime && (
                <DateTimePicker
                    value={dueTime || new Date()}
                    mode="time"
                    display="default"
                    onChange={(_, date) => {
                    setShowDueTime(false);
                    if (date) setDueTime(date);
                    }}
                />
                )}
            <Text style={{ marginBottom: 4, marginTop: 8 }}>Attachment</Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TextInput
                    value={form.attachmentUrl}
                    onChangeText={v => handleInput("attachmentUrl", v)}
                    style={[modalStyles.input, { flex: 1 }]}
                    placeholder="Paste URL or pick file"
                />
                <TouchableOpacity
                    style={{
                    marginLeft: 8,
                    backgroundColor: "#e5e7eb",
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 8,
                    }}
                    onPress={handlePickFile}
                >
                    <Text style={{ color: "#1e3a8a", fontWeight: "bold" }}>Pick File</Text>
                </TouchableOpacity>
                </View>
                {form.attachmentUrl ? (
                <Text style={{ color: "#2563eb", marginTop: 4, fontSize: 12 }}>
                    Selected: {form.attachmentUrl.length > 40 ? form.attachmentUrl.slice(0, 40) + "..." : form.attachmentUrl}
                </Text>
                ) : null}

                <View style={{ flexDirection: "row", marginTop: 16, justifyContent: "flex-end" }}>
                  <TouchableOpacity
                    style={[modalStyles.button, { backgroundColor: "#e5e7eb" }]}
                    onPress={() => {
                      setModalVisible(false);
                      setFormError(null);
                    }}
                   disabled={submitting}
                  >
                    <Text style={{ color: "#1e293b" }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[modalStyles.button, { backgroundColor: "#1e3a8a", marginLeft: 8 }]}
                    onPress={() => handleCreate()}
                    disabled={submitting}
                  >
                    <Text style={{ color: "#fff" }}>{submitting ? "Creating..." : "Create"}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const modalStyles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
    backgroundColor: "#f9fafb",
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
});

const assignmentStyles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e3a8a',
  },
  programButton: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  programButtonActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  programButtonText: {
    color: '#1e3a8a',
    fontWeight: 'bold',
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  studentEmail: {
    color: '#334155',
    marginBottom: 4,
  },
  studentDate: {
    color: '#64748b',
    fontSize: 12,
  },
  assignmentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  assignmentDue: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 4,
  },
  assignmentDesc: {
    color: '#334155',
  },
});


export default function InstructorDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch instructor programs
  useEffect(() => {
    if (!user?.token) return;
    setProgramsLoading(true);
    setError(null);
    (async () => {
      try {
        const progs = await getInstructorPrograms(user.token);
        setPrograms(progs);
        if (progs.length > 0) {
          setSelectedProgram(progs[0]);
        }
      } catch (e: any) {
        setError(e.message || "Failed to load programs");
      } finally {
        setProgramsLoading(false);
      }
    })();
  }, [user?.token]);

  if (programsLoading) {
    return <ActivityIndicator style={{ marginTop: 32 }} />;
  }
  if (error) {
    return <Text style={{ color: 'red', margin: 16 }}>{error}</Text>;
  }

  const params = useLocalSearchParams<{ tab?: string }>();

  const initialTabName = ((params.tab || "").toLowerCase() === "assignments") ? "Assignments" : ((params.tab || "").toLowerCase() === "quizzes") ? "Quizzes" : ((params.tab || "").toLowerCase() === "chat") ? "Chat" : "Students";

  return (
    <Tab.Navigator 
      key={initialTabName}
      tabBarPosition="bottom"
      initialRouteName={initialTabName}
    >
      <Tab.Screen name="Students">
        {() => (
          <StudentsScreen
            user={user}
            logout={logout}
            router={router}
            programs={programs}
            selectedProgram={selectedProgram}
            setSelectedProgram={setSelectedProgram}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Assignments">
        {() => (
            <AssignmentsScreen
            user={user}
            selectedProgram={selectedProgram}
            />
        )}
        </Tab.Screen>
      <Tab.Screen 
            name="Quizzes" 
            children={() =>
                <QuizzesScreen selectedProgram={selectedProgram} />
            } 
        />
      <Tab.Screen 
        name="Materials" 
        children={() => 
            <MaterialsScreen selectedProgram={selectedProgram} />
        } 
      />
      <Tab.Screen
        name="Chat"
        children={() => <ChatRoomsScreen />}
        />
    </Tab.Navigator>
  );
}