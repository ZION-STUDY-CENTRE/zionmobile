import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import { getQuiz, submitQuiz } from "../../../api/student";

export default function TakeQuizScreen() {
  const { quizId } = useLocalSearchParams<{ quizId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (quizId && user?.token) {
      loadQuiz();
    }
  }, [quizId]);

  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimeUp(); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const data = await getQuiz(quizId, user!.token);
      setQuiz(data);
      setStartedAt(new Date().toISOString());

      if (data.duration) {
        setTimeLeft(data.duration * 60);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load quiz");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUp = () => {
    Alert.alert("Time's Up!", "Submitting your answers automatically.", [
      { text: "OK", onPress: handleSubmit }
    ]);
    handleSubmit();
  };

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    
    const formattedAnswers = Object.keys(answers).map(qId => ({
        questionId: qId,
        selectedOptionIndex: answers[qId]
    }));

    try {
      console.log("Submitting answers:", JSON.stringify(formattedAnswers)); // Debug log
      const result = await submitQuiz(quizId, {
            answers: formattedAnswers,
            startedAt: startedAt || new Date().toISOString()
        }, user!.token);

      console.log("Quiz Result:", JSON.stringify(result)); // Debug log

      // Try to find score in various possible locations in the response
      const score = result.score ?? result.grade ?? result.submission?.score ?? result.submission?.grade ?? 0;
      const total = result.totalMarks ?? result.totalScore ?? quiz.totalMarks ?? 100;

      Alert.alert(
        "Quiz Submitted!", 
        `You scored ${score} out of ${total}.`, 
        [{ 
            text: "OK", 
            onPress: () => router.back() 
        }]
      );
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to submit quiz");
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!quiz) return <View style={styles.container}><Text>Quiz not found</Text></View>;
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
         <TouchableOpacity onPress={() => Alert.alert("Quit?", "Progress will be lost", [{text: "Cancel"}, {text: "Quit", onPress: () => router.back()}])}>
           <Text style={styles.backText}>Cancel</Text>
         </TouchableOpacity>
         <Text style={styles.timerText}>⏱️ {formatTime(timeLeft)}</Text>
         <TouchableOpacity onPress={handleSubmit} disabled={submitting}>
           <Text style={styles.submitText}>{submitting ? "..." : "Submit"}</Text>
         </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.quizTitle}>{quiz.title}</Text>
        <Text style={styles.instructions}>Answer all questions before time runs out.</Text>

        {quiz.questions?.map((q: any, index: number) => (
          <View key={q._id} style={styles.questionCard}>
            <Text style={styles.questionText}>
              {index + 1}. {q.questionText} <Text style={{fontSize: 12, color: "#666"}}>({q.marks} marks)</Text>
            </Text>

            {/* Options Rendering */}
            {q.options && q.options.length > 0 ? (
                q.options.map((opt: any, optIndex: number) => {
                    const displayText = typeof opt === "string" ? opt : opt.text;
                    const isSelected = answers[q._id] === optIndex;

                    return (
                    <TouchableOpacity
                        key={optIndex}
                        style={[styles.optionButton, isSelected && styles.optionSelected]}
                        onPress={() => handleAnswer(q._id, optIndex)}
                    >
                        <View style={[styles.radio, isSelected && styles.radioSelected]} />
                        <Text style={[styles.optionText, isSelected && { fontWeight: "bold" }]}>
                        {displayText}
                        </Text>
                    </TouchableOpacity>
                );
                })
                ) : (
                // Note: backend doesn't grade free-text answers
                <TextInput
                    style={styles.input}
                    placeholder="Type your answer..."
                    value={String(answers[q._id] ?? "")}
                    onChangeText={() => {}}
                    editable={false}
                />
                )}
          </View>
        ))}

        <TouchableOpacity style={styles.bigSubmitButton} onPress={handleSubmit} disabled={submitting}>
           <Text style={styles.bigSubmitText}>{submitting ? "Submitting..." : "Submit Quiz"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { 
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", 
    padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#e2e8f0", paddingTop: 50 
  },
  backText: { color: "#64748b", fontSize: 16 },
  timerText: { fontSize: 18, fontWeight: "bold", color: "#dc2626" },
  submitText: { color: "#2563eb", fontWeight: "bold", fontSize: 16 },
  
  scrollContent: { padding: 16 },
  quizTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 8, color: "#0f172a" },
  instructions: { color: "#64748b", marginBottom: 20 },

  questionCard: {
    backgroundColor: "#fff", borderRadius: 8, padding: 16, marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
  },
  questionText: { fontSize: 16, fontWeight: "600", marginBottom: 12, color: "#1e293b" },
  
  optionButton: { 
    flexDirection: "row", alignItems: "center", 
    padding: 12, borderRadius: 6, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 8 
  },
  optionSelected: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#94a3b8", marginRight: 10 },
  radioSelected: { borderColor: "#2563eb", backgroundColor: "#2563eb" },
  optionText: { fontSize: 15, color: "#334155" },

  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 6, padding: 10, minHeight: 80, textAlignVertical: "top" },

  bigSubmitButton: { backgroundColor: "#2563eb", padding: 16, borderRadius: 8, alignItems: "center", marginTop: 20, marginBottom: 40 },
  bigSubmitText: { color: "#fff", fontWeight: "bold", fontSize: 18 }
});