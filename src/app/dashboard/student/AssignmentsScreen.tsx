import React, { useEffect, useState } from "react";
import { useProgram } from "../../context/ProgramContext";
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Linking, ScrollView 
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useAuth } from "../../../context/AuthContext";
import { 
  getStudentProgram, 
  getAssignments, 
  getMyAssignmentSubmission, 
  submitAssignment, 
  uploadFile 
} from "../../../api/student";

export default function StudentAssignmentsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentPrograms, setStudentPrograms] = useState<any[]>([]);
  const { selectedProgram } = useProgram();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<{[key: string]: any}>({});
  
  // File upload state
  const [pickedFiles, setPickedFiles] = useState<{[key: string]: any}>({});
  const [uploading, setUploading] = useState<{[key: string]: boolean}>({});
  const [submitting, setSubmitting] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (!user?.token || !selectedProgram) return;
    (async () => {
      setLoading(true);
      try {
        const assigns = await getAssignments(selectedProgram._id, user.token);
        setAssignments(Array.isArray(assigns) ? assigns : []);
        // Check submissions for each assignment
        const subsMap: any = {};
        for (const assign of assigns) {
          const sub = await getMyAssignmentSubmission(assign._id, user.token);
          if (sub) subsMap[assign._id] = sub;
        }
        setSubmissions(subsMap);
      } catch (e: any) {
        Alert.alert("Error", e.message || "Failed to load assignments");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.token, selectedProgram]);

  // Removed program switch handler (switching only on home page)

  const isOverdue = (dateStr: string) => {
    return new Date() > new Date(dateStr);
  };

  const pickDocument = async (assignmentId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // allow all types
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      
      const file = result.assets[0];
      setPickedFiles(prev => ({ ...prev, [assignmentId]: file }));
    } catch (e) {
      Alert.alert("Error", "Failed to pick file");
    }
  };

  const handleTurnIn = async (assignmentId: string) => {
    const file = pickedFiles[assignmentId];
    if (!file) {
      Alert.alert("Required", "Please select a file to upload before turning in.");
      return;
    }

    setSubmitting(prev => ({ ...prev, [assignmentId]: true }));
    try {
      // 1. Upload File
      setUploading(prev => ({ ...prev, [assignmentId]: true }));
      const uploadRes = await uploadFile(file, user!.token);
      setUploading(prev => ({ ...prev, [assignmentId]: false }));

      // 2. Submit Assignment
      await submitAssignment(assignmentId, {
        submissionText: "Submitted via mobile app",
        submissionFile: uploadRes.imageUrl, // Backend expects 'imageUrl' based on api.ts
        fileName: file.name
      }, user!.token);

      Alert.alert("Success", "Assignment submitted successfully!");
      
      // Refresh submissions
      const sub = await getMyAssignmentSubmission(assignmentId, user!.token);
      setSubmissions(prev => ({ ...prev, [assignmentId]: sub }));

    } catch (e: any) {
      Alert.alert("Error", e.message || "Submission failed");
    } finally {
      setSubmitting(prev => ({ ...prev, [assignmentId]: false }));
      setUploading(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  const renderAssignment = ({ item }: { item: any }) => {
    const overdue = isOverdue(item.dueDate);
    const submission = submissions[item._id];
    const pickedFile = pickedFiles[item._id];
    const isSubmitting = submitting[item._id];
    const isUploading = uploading[item._id];

    return (
      <View style={[styles.card, overdue && !submission ? styles.cardOverdue : {}]}>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={[styles.badge, overdue && !submission ? styles.badgeOverdue : styles.badgeActive]}>
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "bold" }}>
              {submission ? "Submitted" : overdue ? "Overdue" : "Active"}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>{item.description || "No description provided."}</Text>
        
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>📅 Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
          {item.attachments?.length > 0 && (
             <Text style={styles.metaText}>📎 {item.attachments.length} Attachments</Text>
          )}
        </View>

        {/* Attachments Links */}
        {item.attachments?.map((att: any, idx: number) => (
          <TouchableOpacity key={idx} onPress={() => Linking.openURL(att.fileUrl)}>
            <Text style={styles.linkText}>Download: {att.fileName}</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.divider} />

        {/* Submission Section */}
        {submission ? (
          <View>
            <View style={styles.submissionRow}>
              <Text style={{ color: "green", fontWeight: "bold" }}>✓ Submitted</Text>
              <Text style={{ fontSize: 12, color: "#666" }}>
                {new Date(submission.submittedAt).toLocaleDateString()}
              </Text>
            </View>
            
            {submission.grade !== null ? (
               <View style={styles.gradeBox}>
                 <Text style={styles.gradeText}>Grade: {submission.grade} / 100</Text>
                 {submission.feedback && <Text style={styles.feedbackText}>{submission.feedback}</Text>}
               </View>
            ) : (
               <Text style={styles.pendingText}>Grading Pending...</Text>
            )}
          </View>
        ) : (
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontWeight: "600", marginBottom: 8 }}>Upload Your Work:</Text>
            
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <TouchableOpacity style={styles.fileButton} onPress={() => pickDocument(item._id)}>
                <Text style={{ color: "#333" }}>{pickedFile ? "Change File" : "Choose File"}</Text>
              </TouchableOpacity>
              {pickedFile && (
                <Text style={{ marginLeft: 10, flex: 1, color: "green" }} numberOfLines={1}>
                  {pickedFile.name}
                </Text>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.turnInButton, (!pickedFile || isSubmitting) && { opacity: 0.6 }]}
              onPress={() => handleTurnIn(item._id)}
              disabled={!pickedFile || isSubmitting}
            >
              {isSubmitting ? (
                <Text style={styles.turnInText}>{isUploading ? "Uploading..." : "Submitting..."}</Text>
              ) : (
                <Text style={styles.turnInText}>Turn In Assignment</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 24 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>My Assignments</Text>
      <Text style={styles.sectionHeader2}>View and submit your tasks.</Text>
      {!selectedProgram ? (
        <Text style={styles.subtitle}>You are not enrolled in a program assignment.</Text>
      ) : (
        <FlatList
          data={assignments}
          keyExtractor={(item) => item._id}
          renderItem={renderAssignment}
          ListEmptyComponent={<Text style={styles.subtitle}>No assignments found.</Text>}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  sectionHeader2: { fontSize: 15, fontWeight: "400", color: "gray", marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: "bold", color: "#1e293b" }, // Add this
  subtitle: { color: "#475569", textAlign: "center", marginTop: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  cardOverdue: {
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2"
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b", flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeActive: { backgroundColor: "#64748b" },
  badgeOverdue: { backgroundColor: "#ef4444" },
  description: { color: "#475569", marginBottom: 12 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  metaText: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  linkText: { color: "#2563eb", textDecorationLine: "underline", marginBottom: 4 },
  divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 12 },
  
  // File Upload
  fileButton: { borderWidth: 1, borderColor: "#cbd5e1", padding: 8, borderRadius: 6, backgroundColor: "#f8fafc" },
  turnInButton: { backgroundColor: "#2563eb", padding: 12, borderRadius: 6, alignItems: "center" },
  turnInText: { color: "#fff", fontWeight: "bold" },
  
  // Submission
  submissionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  gradeBox: { backgroundColor: "#eff6ff", padding: 10, borderRadius: 6, borderColor: "#bfdbfe", borderWidth: 1 },
  gradeText: { fontWeight: "bold", color: "#1e40af" },
  feedbackText: { fontSize: 12, color: "#1e3a8a", marginTop: 4 },
  pendingText: { fontStyle: "italic", color: "#d97706" }
});