import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Linking, Modal, TextInput, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import { getAssignmentSubmissions, gradeSubmission } from "../../../api/instructor";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

type Submission = {
  _id: string;
  student: { name: string; email: string; _id: string };
  submittedAt: string;
  submissionFile?: string;
  submissionText?: string;
  grade?: number;
  status?: string;
  feedback?: string;
};

function getCloudinaryDownloadUrl(url: string) {
  // Only replace the first occurrence of /upload/
  return url.replace("/upload/", "/upload/fl_attachment/");
}

export default function AssignmentSubmissionsScreen() {
  const params = useLocalSearchParams();
  const assignmentId = Array.isArray(params.assignmentId) ? params.assignmentId[0] : params.assignmentId;
  const { user } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Grading modal state
  const [gradingModalVisible, setGradingModalVisible] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedbackValue, setFeedbackValue] = useState("");
  const [gradingLoading, setGradingLoading] = useState(false);

  const total = submissions.length;
  const graded = submissions.filter(s => s.grade !== undefined && s.grade !== null).length;
  const avgGrade =
    graded > 0
      ? (
          submissions
            .filter(s => s.grade !== undefined && s.grade !== null)
            .reduce((sum, s) => sum + (s.grade ?? 0), 0) / graded
        ).toFixed(1)
      : null;

  useEffect(() => {
    if (!user?.token || !assignmentId) return;
    setLoading(true);
    (async () => {
      try {
        const data = await getAssignmentSubmissions(assignmentId, user.token);
        setSubmissions(data);
      } catch (e: any) {
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [assignmentId, user?.token]);

  const openGradingModal = (submission: Submission) => {
    setGradingSubmission(submission);
    setGradeValue(submission.grade !== undefined ? String(submission.grade) : "");
    setFeedbackValue(submission.feedback || "");
    setGradingModalVisible(true);
  };

  const handleGradeSubmit = async () => {
    if (!gradingSubmission || !user?.token) return;
    const gradeNum = Number(gradeValue);
    if (isNaN(gradeNum) || gradeNum < 0) {
      Alert.alert("Invalid grade", "Please enter a valid grade.");
      return;
    }
    setGradingLoading(true);
    try {
      await gradeSubmission(gradingSubmission._id, user.token, gradeNum, feedbackValue);
      setGradingModalVisible(false);
      setGradingSubmission(null);
      setGradeValue("");
      setFeedbackValue("");
      // Refresh submissions
      const data = await getAssignmentSubmissions(assignmentId, user.token);
      setSubmissions(data);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to grade submission");
    } finally {
      setGradingLoading(false);
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const downloadUrl = getCloudinaryDownloadUrl(url);
      const fileName = downloadUrl.split("/").pop() || "file";
      const fileUri = (FileSystem as any).cacheDirectory + fileName;

      // Use the legacy downloadAsync API
      const { uri } = await FileSystem.downloadAsync(downloadUrl, fileUri);
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert("Download failed", "Could not download file.");
      console.log(e);
    }
  };

  if (loading) return <ActivityIndicator />;
  return (
    <View style={{ flex: 1, padding: 0, backgroundColor: "#f8fafc" }}>
      {/* Header with back button */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingTop: 36,
        paddingBottom: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb"
      }}>
        <TouchableOpacity onPress={() => router.replace("/dashboard/instructor?tab=Assignments")} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={{ fontWeight: "bold", fontSize: 20, color: "#1e293b" }}>Assignment Submissions</Text>
      </View>
      <View style={{ flex: 1, padding: 16 }}>

        <View style={{
          backgroundColor: "#fff",
          borderRadius: 10,
          padding: 14,
          marginBottom: 18,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.04,
          shadowRadius: 2,
          elevation: 1
        }}>
          <View>
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>Submissions: {total}</Text>
              <Text style={{ color: "#2563eb", fontWeight: "bold" }}>Graded: {graded}</Text>
            </View>
            <View>
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                Avg Grade:{" "}
                <Text style={{ color: "#16a34a" }}>
                  {avgGrade !== null ? avgGrade : "--"}
                </Text>
              </Text>
            </View>
          </View>

        {submissions.length === 0 ? (
          <Text style={{ color: "#888", marginTop: 16 }}>No submissions yet.</Text>
        ) : (
          <FlatList
            data={submissions}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <View style={{
                marginBottom: 16,
                padding: 16,
                backgroundColor: "#fff",
                borderRadius: 12,
                shadowColor: "#000",
                shadowOpacity: 0.04,
                shadowRadius: 2,
                elevation: 1
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <Ionicons name="person-circle" size={28} color="#2563eb" style={{ marginRight: 8 }} />
                  <View>
                    <Text style={{ fontWeight: "bold", fontSize: 16 }}>{item.student?.name}</Text>
                    <Text style={{ color: "#64748b", fontSize: 13 }}>{item.student?.email}</Text>
                  </View>
                </View>
                <Text style={{ color: "#555", marginBottom: 4 }}>
                  Submitted: {new Date(item.submittedAt).toLocaleString()}
                </Text>
                {item.submissionText ? (
                  <Text style={{ marginTop: 4, fontStyle: "italic", color: "#334155" }}>{item.submissionText}</Text>
                ) : null}
                {item.submissionFile ? (
                  <TouchableOpacity
                    style={{
                      marginTop: 10,
                      backgroundColor: "#2563eb",
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 6,
                      alignSelf: "flex-start"
                    }}
                    onPress={() => handleDownload(item.submissionFile!)}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>Download File</Text>
                  </TouchableOpacity>
                ) : null}
                <View style={{ flexDirection: "row", marginTop: 12, alignItems: "center" }}>
                  <Text style={{
                    color: item.grade !== undefined ? "#16a34a" : "#f59e42",
                    fontWeight: "bold",
                    marginRight: 16
                  }}>
                    Grade: {item.grade !== undefined ? item.grade : "Not graded"}
                  </Text>
                  <Text style={{
                    color: item.status === "graded" ? "#16a34a" : "#f59e42",
                    fontWeight: "bold",
                    marginRight: 16
                  }}>
                    Status: {item.status}
                  </Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#2563eb",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      marginLeft: 8
                    }}
                    onPress={() => openGradingModal(item)}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      {item.status === "graded" ? "Edit Grade" : "Grade"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {item.feedback ? (
                  <Text style={{ marginTop: 8, color: "#334155" }}>
                    Feedback: {item.feedback}
                  </Text>
                ) : null}
              </View>
            )}
          />
        )}
      </View>
      {/* Grading Modal */}
      <Modal
        visible={gradingModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setGradingModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.2)",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <View style={{
            backgroundColor: "#fff",
            borderRadius: 14,
            padding: 24,
            width: "90%",
            maxWidth: 400,
            elevation: 5
          }}>
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 12 }}>
              Grade Submission
            </Text>
            <Text style={{ marginBottom: 6 }}>
              Student: {gradingSubmission?.student?.name}
            </Text>
            <TextInput
              value={gradeValue}
              onChangeText={setGradeValue}
              placeholder="Grade"
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 8,
                padding: 8,
                marginBottom: 12,
                backgroundColor: "#f9fafb"
              }}
            />
            <TextInput
              value={feedbackValue}
              onChangeText={setFeedbackValue}
              placeholder="Feedback (optional)"
              multiline
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 8,
                padding: 8,
                minHeight: 60,
                backgroundColor: "#f9fafb"
              }}
            />
            <View style={{ flexDirection: "row", marginTop: 18, justifyContent: "flex-end" }}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#e5e7eb",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  minWidth: 80,
                  alignItems: "center"
                }}
                onPress={() => setGradingModalVisible(false)}
                disabled={gradingLoading}
              >
                <Text style={{ color: "#1e293b" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: "#2563eb",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  minWidth: 80,
                  alignItems: "center",
                  marginLeft: 8
                }}
                onPress={handleGradeSubmit}
                disabled={gradingLoading}
              >
                <Text style={{ color: "#fff" }}>
                  {gradingLoading ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}