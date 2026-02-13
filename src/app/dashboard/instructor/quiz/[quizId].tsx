import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../../context/AuthContext";
// You might need to add getQuiz and getQuizSubmissions to your API file if missing
import { getQuiz, getQuizSubmissions } from "../../../../api/instructor";

export default function QuizSubmissionsScreen() {
  const { quizId } = useLocalSearchParams<{ quizId: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [quiz, setQuiz] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.token || !quizId) return;
    loadData();
  }, [user?.token, quizId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch quiz details
      const q = await getQuiz(quizId, user?.token || "");
      setQuiz(q);

      // Fetch submissions (Ensure this API exists)
      const subs = await getQuizSubmissions(quizId, user?.token || "");
      setSubmissions(subs || []);
    } catch (e: any) {
      console.log(e);
      // Alert.alert("Error", "Could not load quiz details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0"
      }}>
        <TouchableOpacity onPress={() => router.replace("/dashboard/instructor?tab=Quizzes")} style={{ marginRight: 12 }}>
                  <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1e3a8a", flex: 1 }}>
          {quiz?.title || "Quiz Submissions"}
        </Text>
      </View>

      <View style={{ padding: 16 }}>
        {submissions.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#64748b", marginTop: 24 }}>
            No submissions yet.
          </Text>
        ) : (
          <FlatList
            data={submissions}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={{
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "#e2e8f0"
              }}>
                <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                  {item.student?.name || "Unknown Student"}
                </Text>
                <Text style={{ color: "#64748b", fontSize: 14, marginBottom: 8 }}>
                  Submitted: {new Date(item.submittedAt).toLocaleString()}
                </Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontWeight: "bold", color: "#2563eb" }}>
                    Score: {item.score} / {quiz?.totalMarks || 0}
                  </Text>
                  <Text style={{ 
                    color: item.score >= (quiz?.passingScore || 0) ? "#16a34a" : "#dc2626",
                    fontWeight: "bold",
                    fontSize: 12
                  }}>
                    {item.score >= (quiz?.passingScore || 0) ? "PASSED" : "FAILED"}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}