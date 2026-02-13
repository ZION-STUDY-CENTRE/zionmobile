import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { getQuizzes, createQuiz, deleteQuiz } from "../../../api/instructor";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function QuizzesScreen({ selectedProgram }: { selectedProgram: any }) {
  const { user } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: "",
    totalMarks: "",
    passingScore: "",
    releaseDate: "",
    releaseTime: "",
    dueDate: "",
    dueTime: "",
  });
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    if (!user?.token || !selectedProgram?._id) return;
    setLoading(true);
    (async () => {
      try {
        const data = await getQuizzes(selectedProgram._id, user.token);
        setQuizzes(data);
      } catch {
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedProgram?._id, user?.token]);
  
    if (!user) return <ActivityIndicator />; 

  const handleCreate = async () => {
    if (
      !form.title ||
      !form.description ||
      !form.duration ||
      !form.totalMarks ||
      !form.passingScore ||
      !form.releaseDate ||
      !form.releaseTime ||
      !form.dueDate ||
      !form.dueTime
    ) {
      Alert.alert("All fields are required.");
      return;
    }

      const releaseDateTime = new Date(`${form.releaseDate}T${form.releaseTime}:00`);
        const dueDateTime = new Date(`${form.dueDate}T${form.dueTime}:00`);


    setSubmitting(true);
    try {
      await createQuiz(selectedProgram._id, user.token, {
        title: form.title,
        description: form.description,
        duration: Number(form.duration),
        totalMarks: Number(form.totalMarks),
        passingScore: Number(form.passingScore),
        releaseDate: releaseDateTime.toISOString(),
        dueDate: dueDateTime.toISOString(),
        program: selectedProgram._id,
      });
      setModalVisible(false);
      setForm({
        title: "",
        description: "",
        duration: "",
        totalMarks: "",
        passingScore: "",
        releaseDate: "",
        releaseTime: "",
        dueDate: "",
        dueTime: "",
      });
      // Refresh
      const data = await getQuizzes(selectedProgram._id, user.token);
      setQuizzes(data);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (quizId: string) => {
    Alert.alert("Delete Quiz", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            await deleteQuiz(quizId, user.token);
            const data = await getQuizzes(selectedProgram._id, user.token);
            setQuizzes(data);
          } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to delete quiz");
          }
        }
      }
    ]);
  };

  const handleViewSubmissions = (quizId: string) => {
    router.push(`/dashboard/instructor/quiz/${quizId}`);
  };

  if (loading) return <ActivityIndicator />;
  return (
    quizzes.length > 0 ? 
        <View style={{ flex: 1, padding: 16 }}>
          <View style={{ marginBottom: 12, display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1e3a8a' }}>Quizzes</Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#2563eb",
                      padding: 12,
                      borderRadius: 8,
                      alignSelf: "flex-end"
                    }}
                    onPress={() =>  router.push({
                        pathname: "/dashboard/instructor/create-quiz",
                        params: { selectedProgramId: selectedProgram._id }
                    })}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>+ Create Quiz</Text>
                  </TouchableOpacity>
                </View>
        <FlatList
        data={quizzes}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
            <View style={{
            backgroundColor: "#fff",
            borderRadius: 10,
            padding: 14,
            marginBottom: 14,
            shadowColor: "#000",
            shadowOpacity: 0.04,
            shadowRadius: 2,
            elevation: 1
            }}>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>{item.title}</Text>
            <Text style={{ color: "#555", marginBottom: 4 }}>{item.description}</Text>
            <Text style={{ color: "#555", marginBottom: 8 }}>
                Due: {item.dueDate ? new Date(item.dueDate).toLocaleString() : "N/A"}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
                <Text style={{ marginRight: 16, color: "#2563eb" }}>
                Questions: {item.numQuestions ?? item.questions?.length ?? "--"}
                </Text>
                <Text style={{ marginRight: 16, color: "#2563eb" }}>
                Total Marks: {item.totalMarks ?? item.totalPoints ?? "--"}
                </Text>
                <Text style={{ marginRight: 16, color: "#2563eb" }}>
                Duration: {item.duration ? `${item.duration} min` : "--"}
                </Text>
                <Text style={{ color: "#2563eb" }}>
                Passing: {item.passingScore ?? item.passingMarks ?? "--"}
                </Text>
            </View>
            <View style={{ flexDirection: "row", marginTop: 10 }}>
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
                onPress={() => handleDelete(item._id)}
                >
                <Text style={{ color: "#fff" }}>Delete</Text>
                </TouchableOpacity>
            </View>
            </View>
        )}
        />
      {/* Create Quiz Modal */}
         <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={{
          flex: 1, backgroundColor: "rgba(0,0,0,0.2)", justifyContent: "center", alignItems: "center"
        }}>
          <View style={{
            backgroundColor: "#fff", borderRadius: 14, padding: 24, width: "90%", maxWidth: 400, elevation: 5
          }}>
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 12 }}>Create Quiz</Text>
            <TextInput
              value={form.title}
              onChangeText={v => setForm(f => ({ ...f, title: v }))}
              placeholder="Title"
              style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, marginBottom: 12 }}
            />
            <TextInput
              value={form.description}
              onChangeText={v => setForm(f => ({ ...f, description: v }))}
              placeholder="Description"
              style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, marginBottom: 12 }}
            />
            <TextInput
              value={form.duration}
              onChangeText={v => setForm(f => ({ ...f, duration: v }))}
              placeholder="Duration (minutes)"
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, marginBottom: 12 }}
            />
             <TextInput
              value={form.totalMarks}
              onChangeText={v => setForm(f => ({ ...f, totalMarks: v }))}
              placeholder="Total Marks"
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, marginBottom: 12 }}
            />
            <TextInput
              value={form.passingScore}
              onChangeText={v => setForm(f => ({ ...f, passingScore: v }))}
              placeholder="Passing Score"
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, marginBottom: 12 }}
            />
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>Release Date & Time</Text>
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              <TextInput
                value={form.releaseDate}
                onChangeText={v => setForm(f => ({ ...f, releaseDate: v }))}
                placeholder="YYYY-MM-DD"
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 8,
                  padding: 8,
                  marginRight: 4
                }}
                />
              <TextInput
                value={form.releaseTime}
                onChangeText={v => setForm(f => ({ ...f, releaseTime: v }))}
                placeholder="HH:mm"
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 8,
                  padding: 8,
                  marginLeft: 4
                }}
              />
            </View>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>Due Date & Time</Text>
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              <TextInput
                value={form.dueDate}
                onChangeText={v => setForm(f => ({ ...f, dueDate: v }))}
                placeholder="YYYY-MM-DD"
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 8,
                  padding: 8,
                  marginRight: 4
                }}
            />
              <TextInput
                value={form.dueTime}
                onChangeText={v => setForm(f => ({ ...f, dueTime: v }))}
                placeholder="HH:mm"
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 8,
                  padding: 8,
                  marginLeft: 4
                }}
              />
            </View>
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
                onPress={() => setModalVisible(false)}
                disabled={submitting}
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
                onPress={handleCreate}
                disabled={submitting}
              >
                <Text style={{ color: "#fff" }}>
                  {submitting ? "Creating..." : "Create"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
     : 
    <View style={{ flex: 1, padding: 16 }}>
        <TouchableOpacity
        style={{
          backgroundColor: "#2563eb",
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          alignSelf: "flex-end"
        }}
        onPress={() =>  router.push({
            pathname: "/dashboard/instructor/create-quiz",
            params: { selectedProgramId: selectedProgram._id }
        })}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>+ Create Quiz</Text>
      </TouchableOpacity>
        <Text style={{ textAlign: "center", marginTop: 20, color: "#6b7280" }}>No quizzes available.</Text>
    </View>
  );
}