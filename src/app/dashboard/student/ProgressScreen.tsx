import React, { useEffect, useState } from "react";
import { useProgram } from "../../context/ProgramContext";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { 
  getStudentProgram, 
  getAssignments, 
  getQuizzes, 
  getFileResources,
  getMyAssignmentSubmission,
  getQuizSubmission
} from "../../../api/student";

export default function StudentProgressScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [studentPrograms, setStudentPrograms] = useState<any[]>([]);
  const { selectedProgram } = useProgram();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<{[key: string]: any}>({});
  const [quizSubmissions, setQuizSubmissions] = useState<{[key: string]: any}>({});
  const [avgGrade, setAvgGrade] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (!user?.token || !selectedProgram) return;
    (async () => {
      setLoading(true);
      try {
        const [assignsData, quizzesData, filesData] = await Promise.all([
          getAssignments(selectedProgram._id, user.token),
          getQuizzes(selectedProgram._id, user.token),
          getFileResources(selectedProgram._id, user.token)
        ]);
        const validAssigns = Array.isArray(assignsData) ? assignsData : [];
        const validQuizzes = Array.isArray(quizzesData) ? quizzesData : [];
        const validFiles = Array.isArray(filesData) ? filesData : [];
        setAssignments(validAssigns);
        setQuizzes(validQuizzes);
        setFiles(validFiles);
        const subsMap: {[key: string]: any} = {};
        const quizSubsMap: {[key: string]: any} = {};
        let totalScore = 0;
        let gradedCount = 0;
        // Assignment submissions
        await Promise.all(
          validAssigns.map(async (a) => {
            try {
              const sub = await getMyAssignmentSubmission(a._id, user.token);
              if (sub) {
                subsMap[a._id] = sub;
                if (sub.grade !== null && sub.grade !== undefined) {
                  totalScore += sub.grade;
                  gradedCount++;
                }
              }
            } catch { /* ignore */ }
          })
        );
        // Quiz submissions
        await Promise.all(
          validQuizzes.map(async (q) => {
            try {
              const sub = await getQuizSubmission(q._id, user.token);
              if (sub) quizSubsMap[q._id] = sub;
            } catch { /* ignore */ }
          })
        );
        setSubmissions(subsMap);
        setQuizSubmissions(quizSubsMap);
        const completed = Object.keys(subsMap).length + Object.keys(quizSubsMap).length;
        const total = validAssigns.length + validQuizzes.length;
        setCompletedCount(completed);
        setAvgGrade(gradedCount > 0 ? Math.round(totalScore / gradedCount) : 0);
      } catch (e) {
        console.log("Error loading progress:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.token, selectedProgram]);

  // Removed program switch handler (switching only on home page)

  if (loading) return <ActivityIndicator style={{ marginTop: 24 }} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Program Switcher removed (only on home page) */}
      <Text style={styles.pageTitle}>Your Progress</Text>

      <View style={styles.topStatsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{avgGrade}%</Text>
          <Text style={styles.statLabel}>Avg Grade</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {completedCount} / {assignments.length + quizzes.length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.sectionTitle}>Completion Rate</Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${(assignments.length + quizzes.length) ? (completedCount / (assignments.length + quizzes.length)) * 100 : 0}%` }
            ]}
          />
        </View>
        <Text style={{ textAlign: "right", marginTop: 4, color: "#64748b" }}>
          {(assignments.length + quizzes.length)
            ? Math.round((completedCount / (assignments.length + quizzes.length)) * 100)
            : 0}%
        </Text>
      </View>

      {/* --- 2. Summary Grid (Matching Web) --- */}
      <Text style={styles.sectionHeader}>Overview</Text>
        <View style={styles.summaryGrid}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryNumber}>{assignments.length}</Text>
          <Text style={styles.summaryLabel}>Assignments</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryNumber}>{Object.keys(submissions).length}</Text>
          <Text style={styles.summaryLabel}>Assignments Submitted</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryNumber}>{quizzes.length}</Text>
          <Text style={styles.summaryLabel}>Quizzes</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryNumber}>{Object.keys(quizSubmissions).length}</Text>
          <Text style={styles.summaryLabel}>Quizzes Taken</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryNumber}>{files.length}</Text>
          <Text style={styles.summaryLabel}>Resources</Text>
        </View>
        </View>

      {/* --- 3. Assignment Grades List --- */}
      <Text style={styles.sectionHeader}>Assignment Grades</Text>
      {assignments.length === 0 ? (
        <Text style={styles.emptyText}>No assignments yet.</Text>
      ) : (
        assignments.map((assignment) => {
          const sub = submissions[assignment._id];
          return (
            <View key={assignment._id} style={styles.listItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{assignment.title}</Text>
                <Text style={styles.itemSubtitle}>
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                {sub ? (
                  <>
                    {sub.grade !== null ? (
                      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                        <Text style={styles.gradeText}>{sub.grade}</Text>
                        <Text style={styles.gradeTotal}>/100</Text>
                      </View>
                    ) : (
                      <Text style={styles.pendingText}>Grading Pending</Text>
                    )}
                    <Text style={styles.dateText}>
                        Sub: {new Date(sub.submittedAt).toLocaleDateString()}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.notSubmittedText}>Not Submitted</Text>
                )}
              </View>
            </View>
          );
        })
      )}

      {/* --- 4. Quiz Scores List --- */}
      <Text style={styles.sectionHeader}>Quiz Scores</Text>
      {quizzes.length === 0 ? (
        <Text style={styles.emptyText}>No quizzes yet.</Text>
      ) : (
        quizzes.map((quiz) => {
          const sub = quizSubmissions[quiz._id];
          return (
            <View key={quiz._id} style={styles.listItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{quiz.title}</Text>
                <Text style={styles.itemSubtitle}>
                  {quiz.questions?.length || 0} Questions
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                {sub ? (
                  <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                    <Text style={styles.gradeText}>{sub.score}</Text>
                    <Text style={styles.gradeTotal}>/{sub.totalMarks}</Text>
                  </View>
                ) : (
                  <Text style={styles.notSubmittedText}>Not Taken</Text>
                )}
              </View>
            </View>
          );
        })
      )}

      <Text style={styles.footerNote}>
        Keep working on your assignments and quizzes to improve your progress!
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: "bold", color: "#1e293b", marginBottom: 20 },
  dateText: { fontSize: 10, color: "#94a3b8", marginTop: 2, textAlign: "right" },
  progressContainer: { marginBottom: 30 },
  progressBarBg: { height: 12, backgroundColor: "#e2e8f0", borderRadius: 6, overflow: "hidden", marginTop: 8 },
  progressBarFill: { height: "100%", backgroundColor: "#10b981" },
  
  // Top Stats Cards
  topStatsRow: { flexDirection: "row", gap: 16, marginBottom: 24 },
  statCard: { 
    flex: 1, backgroundColor: "#f8fafc", padding: 16, borderRadius: 12, alignItems: "center",
    borderWidth: 1, borderColor: "#e2e8f0"
  },
  statValue: { fontSize: 28, fontWeight: "bold", color: "#2563eb", marginBottom: 4 },
  statLabel: { color: "#64748b", fontSize: 13, fontWeight: "600" },

  // Summary Grid
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  summaryBox: { 
    width: '48%', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', 
    borderRadius: 8, padding: 16, alignItems: 'center' 
  },
  summaryNumber: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  summaryLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },

  // Section Headers
  sectionHeader: { fontSize: 18, fontWeight: "bold", color: "#0f172a", marginBottom: 12, marginTop: 8 },
  emptyText: { color: "#94a3b8", fontStyle: "italic", marginBottom: 16 },

  // List Items
  listItem: { 
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", 
    padding: 12, backgroundColor: "#f8fafc", borderRadius: 8, marginBottom: 8,
    borderWidth: 1, borderColor: "#f1f5f9"
  },
  itemTitle: { fontWeight: "600", color: "#334155", fontSize: 15 },
  itemSubtitle: { fontSize: 12, color: "#64748b", marginTop: 2 },
  
  // Assignment Status Styles
  gradeText: { fontSize: 20, fontWeight: "bold", color: "#2563eb" },
  gradeTotal: { fontSize: 12, color: "#64748b", marginLeft: 2 },
  pendingText: { fontSize: 13, color: "#d97706", fontWeight: "500" }, // Yellow/Orange
  notSubmittedText: { fontSize: 13, color: "#dc2626", fontWeight: "500" }, 

  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#0f172a", marginBottom: 12 },

  // Quiz Styles
  quizMarksText: { fontSize: 13, color: "#475569", fontWeight: "500" },

  footerNote: { 
    marginTop: 20, textAlign: "center", color: "#94a3b8", fontSize: 12, fontStyle: "italic",
    paddingTop: 16, borderTopWidth: 1, borderTopColor: "#f1f5f9"
  }
});