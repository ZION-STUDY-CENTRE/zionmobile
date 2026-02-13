import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import { getStudentProgram, getQuizzes, getQuizSubmission } from "../../../api/student";

export default function StudentQuizzesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<{[key: string]: any}>({});
  const [refreshing, setRefreshing] = useState(false);

  // Use useFocusEffect so it refreshes when you come back from taking a quiz
  useFocusEffect(
    useCallback(() => {
      if (user?.token) loadData();
    }, [user?.token])
  );

  const loadData = async () => {
    // Don't set loading true on refresh/focus to avoid flicker if already loaded
    if (!quizzes.length) setLoading(true);
    
    try {
      const prog = await getStudentProgram(user!.token);
      setProgram(prog);
      if (prog?._id) {
        const data = await getQuizzes(prog._id, user!.token);
        const quizList = Array.isArray(data) ? data : [];
        setQuizzes(quizList);

        // Check submissions for each quiz
        const subsMap: any = {};
        for (const q of quizList) {
          const sub = await getQuizSubmission(q._id, user!.token);
          if (sub) subsMap[q._id] = sub;
        }
        setSubmissions(subsMap);
      }
    } catch (e: any) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const isOverdue = (dateStr: string) => new Date() > new Date(dateStr);

  const handleTakeQuiz = (quizId: string) => {
    router.push({
      pathname: "/dashboard/student/take-quiz",
      params: { quizId }
    });
  };

  const handleRecalculateProgress = () => {
    // This is optional if you want to force updates elsewhere
    loadData();
  };

  if (loading && !refreshing) return <ActivityIndicator style={{ marginTop: 24 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Quizzes</Text>
      {!program ? (
        <Text style={styles.subtitle}>You are not enrolled in a program yet.</Text>
      ) : (
        <FlatList
          data={quizzes}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={<Text style={styles.subtitle}>No quizzes available yet.</Text>}
          renderItem={({ item }) => {
            const overdue = isOverdue(item.dueDate);
            const submission = submissions[item._id];
            
            return (
              <View style={[styles.card, overdue && !submission ? styles.cardOverdue : {}]}>
                <View style={styles.headerRow}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={[
                    styles.badge, 
                    submission ? styles.badgeSubmitted : (overdue ? styles.badgeOverdue : styles.badgeActive)
                  ]}>
                    <Text style={{ color: "#fff", fontSize: 10, fontWeight: "bold" }}>
                      {submission ? "Completed" : overdue ? "Closed" : "Active"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.description}>{item.description || "No description."}</Text>

                <View style={styles.metaRow}>
                   <Text style={styles.metaText}>📝 {item.questions?.length || 0} Qs</Text>
                   <Text style={styles.metaText}>🎯 {item.totalMarks} Marks</Text>
                </View>

                {submission ? (
                   <View style={styles.resultBox}>
                      <Text style={styles.scoreText}>Your Score: {submission.score} / {submission.totalMarks}</Text>
                      <Text style={styles.dateText}>Taken: {new Date( submission.completedAt || submission.submittedAt || submission.createdAt).toLocaleDateString()}</Text>
                   </View>
                ) : (
                   <TouchableOpacity 
                    style={[styles.takeButton, overdue && { opacity: 0.5 }]}
                    disabled={overdue}
                    onPress={() => handleTakeQuiz(item._id)}
                   >
                    <Text style={styles.takeButtonText}>{overdue ? "Closed" : "Take Quiz"}</Text>
                   </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  pageTitle: { fontSize: 24, fontWeight: "bold", color: "#1e293b", marginBottom: 16 },
  subtitle: { color: "#475569", textAlign: "center", marginTop: 20 },
  card: {
    backgroundColor: "#fff", borderRadius: 8, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: "#e2e8f0", elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }
  },
  cardOverdue: { borderColor: "#fecaca", backgroundColor: "#fef2f2" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b", flex: 1, marginRight: 8 },
  
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeActive: { backgroundColor: "#10b981" },
  badgeOverdue: { backgroundColor: "#ef4444" },
  badgeSubmitted: { backgroundColor: "#3b82f6" },

  description: { color: "#475569", marginBottom: 12 },
  metaRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  metaText: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  
  takeButton: { marginTop: 12, backgroundColor: "#2563eb", padding: 12, borderRadius: 6, alignItems: "center" },
  takeButtonText: { color: "#fff", fontWeight: "bold" },

  resultBox: { marginTop: 12, padding: 10, backgroundColor: "#eff6ff", borderRadius: 6, alignItems: "center" },
  scoreText: { fontSize: 16, fontWeight: "bold", color: "#1e40af" },
  dateText: { fontSize: 11, color: "#64748b", marginTop: 2 }
});