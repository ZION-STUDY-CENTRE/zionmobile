import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../../../context/AuthContext";
import { createQuiz } from "../../../api/instructor";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function CreateQuizScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedProgramId = Array.isArray(params.selectedProgramId) ? params.selectedProgramId[0] : params.selectedProgramId;

  // Quiz form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: "",
    totalMarks: "",
    passingScore: "",
  });

  // Date/time picker state (assignment-style)
  const [releaseDate, setReleaseDate] = useState<Date | null>(null);
  const [releaseTime, setReleaseTime] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [dueTime, setDueTime] = useState<Date | null>(null);
  const [showReleaseDate, setShowReleaseDate] = useState(false);
  const [showReleaseTime, setShowReleaseTime] = useState(false);
  const [showDueDate, setShowDueDate] = useState(false);
  const [showDueTime, setShowDueTime] = useState(false);

  // Questions state (same as before)
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);

  if (!user) return <ActivityIndicator />;

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

  const handleAddQuestion = () => {
    if (!questionText || options.some(opt => !opt) || correctIndex === null) {
      Alert.alert("Fill all question fields and select the correct answer.");
      return;
    }
    setQuestions([
        ...questions,
    {
        questionText: questionText,
        options: options.map(opt => ({ text: opt })),
        correctIndex,
    },
    ]);
    setQuestionText("");
    setOptions(["", "", "", ""]);
    setCorrectIndex(null);
  };

  const handleSaveQuiz = async () => {
    const releaseISO = combineDateAndTime(releaseDate, releaseTime);
    const dueISO = combineDateAndTime(dueDate, dueTime);

    if (
      !form.title ||
      !form.description ||
      !form.duration ||
      !form.totalMarks ||
      !form.passingScore ||
      !releaseISO ||
      !dueISO ||
      questions.length === 0
    ) {
      Alert.alert("All fields and at least one question are required.");
      return;
    }
    if (new Date(releaseISO) > new Date(dueISO)) {
      Alert.alert("Release date/time must be before due date/time.");
      return;
    }
    try {
        await createQuiz(
            selectedProgramId,
            user.token,
            {
                title: form.title,
                description: form.description,
                duration: Number(form.duration),
                totalMarks: Number(form.totalMarks),
                passingScore: Number(form.passingScore),
                scheduledDate: releaseISO,
                dueDate: dueISO,
                questions,
                program: selectedProgramId,
            }
        );
      Alert.alert("Quiz created!");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create quiz");
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: "#f8fafc" }}>
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
              <TouchableOpacity onPress={() => router.replace("/dashboard/instructor/QuizzesScreen")} style={{ marginRight: 12 }}>
                <Ionicons name="arrow-back" size={24} color="#1e293b" />
              </TouchableOpacity>
              <Text style={{ fontWeight: "bold", fontSize: 20 }}>Create Quiz</Text>
      
            </View>
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

      {/* Release Date/Time */}
      <Text style={{ marginBottom: 4, marginTop: 8 }}>Release Date</Text>
      <TouchableOpacity style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, marginBottom: 4, backgroundColor: "#f9fafb" }} onPress={() => setShowReleaseDate(true)}>
        <Text>{releaseDate ? releaseDate.toLocaleDateString() : "Pick release date"}</Text>
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
      <TouchableOpacity style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, marginBottom: 4, backgroundColor: "#f9fafb" }} onPress={() => setShowReleaseTime(true)}>
        <Text>{releaseTime ? releaseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Pick release time"}</Text>
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

      {/* Due Date/Time */}
      <Text style={{ marginBottom: 4, marginTop: 8 }}>Due Date</Text>
      <TouchableOpacity style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, marginBottom: 4, backgroundColor: "#f9fafb" }} onPress={() => setShowDueDate(true)}>
        <Text>{dueDate ? dueDate.toLocaleDateString() : "Pick due date"}</Text>
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
      <TouchableOpacity style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, marginBottom: 4, backgroundColor: "#f9fafb" }} onPress={() => setShowDueTime(true)}>
        <Text>{dueTime ? dueTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Pick due time"}</Text>
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

      {/* Add Question Section (same as before) */}
      <View style={{ marginTop: 24, marginBottom: 16 }}>
        <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>Add Question</Text>
        <TextInput
          value={questionText}
          onChangeText={setQuestionText}
          placeholder="Question"
          style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, marginBottom: 8 }}
        />
        {options.map((opt, idx) => (
          <View key={idx} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
            <TouchableOpacity
              onPress={() => setCorrectIndex(idx)}
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: "#2563eb",
                backgroundColor: correctIndex === idx ? "#2563eb" : "#fff",
                marginRight: 8,
              }}
            />
            <TextInput
              value={opt}
              onChangeText={v => setOptions(arr => arr.map((o, i) => (i === idx ? v : o)))}
              placeholder={`Option ${idx + 1}`}
              style={{ flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8 }}
            />
          </View>
        ))}
        <TouchableOpacity
          style={{
            backgroundColor: "#2563eb",
            padding: 10,
            borderRadius: 8,
            alignItems: "center",
            marginTop: 8,
          }}
          onPress={handleAddQuestion}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Add Question</Text>
        </TouchableOpacity>
      </View>
      {/* List of added questions */}
      {questions.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: "bold", marginBottom: 6 }}>Questions:</Text>
          {questions.map((q, idx) => (
            <View key={idx} style={{ backgroundColor: "#f1f5f9", borderRadius: 8, padding: 8, marginBottom: 6 }}>
              <Text style={{ fontWeight: "bold", color: "black" }}>{idx + 1}. {q.questionText}</Text>
              {q.options.map((opt: any, i: number) => (
                    <Text key={i} style={{ color: q.correctIndex === i ? "#16a34a" : "#334155" }}>
                        {String.fromCharCode(65 + i)}. {opt.text} {q.correctIndex === i ? "(Correct)" : ""}
                    </Text>
                ))}
            </View>
          ))}
        </View>
      )}
      <TouchableOpacity
        style={{
          backgroundColor: "#16a34a",
          padding: 14,
          borderRadius: 8,
          alignItems: "center",
          marginBottom: 32,
        }}
        onPress={handleSaveQuiz}
      >
        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Save Quiz</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}