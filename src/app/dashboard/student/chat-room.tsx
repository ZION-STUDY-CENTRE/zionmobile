import React, { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../context/AuthContext";
import { getMessages, sendMessage, deleteConversation } from "../../../api/instructor"; // Reusing instructor API as per current pattern

export default function StudentChatRoomScreen() {
  const router = useRouter();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!user?.token || !conversationId) return;
    setLoading(true);
    (async () => {
      try {
        const data = await getMessages(user.token, conversationId);
        setMessages(Array.isArray(data) ? data : []);
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.token, conversationId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    try {
      const msg = await sendMessage(user?.token ? user.token : "", conversationId, input.trim());
      setMessages(prev => [...prev, msg]);
      setInput("");
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = () => {
    Alert.alert(
      "Clear Conversation",
      "Are you sure? This action can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteConversation(user?.token || "", conversationId);
              router.replace("/dashboard/student?tab=Chat");
            } catch (e) {
              Alert.alert("Error", "Failed to delete conversation");
            }
          },
        },
      ]
    );
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#fff" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
        <TouchableOpacity 
            onPress={() => router.replace("/dashboard/student?tab=Chat")}  style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", padding: 4 }}
          >
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1e293b" }}>Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#0f172a" }}>Chat</Text>

        <TouchableOpacity onPress={handleClearChat}>
          <Text style={{ color: "#dc2626", fontWeight: "bold", fontSize: 16 }}>Clear Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item._id}
        renderItem={({ item }) => {
          const isSentByMe = String(item.sender?._id) === String(user?._id);
          return (
            <View
              style={{
                alignSelf: isSentByMe ? "flex-end" : "flex-start",
                backgroundColor: isSentByMe ? "#2563eb" : "#f1f5f9",
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                maxWidth: "80%",
                borderBottomRightRadius: isSentByMe ? 2 : 12,
                borderBottomLeftRadius: isSentByMe ? 12 : 2,
              }}
            >
              <Text style={{ color: isSentByMe ? "#fff" : "#1e293b", fontSize: 15 }}>{item.text}</Text>
              <Text style={{ color: isSentByMe ? "rgba(255,255,255,0.7)" : "#94a3b8", fontSize: 10, marginTop: 4, textAlign: "right" }}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#94a3b8', marginTop: 20 }}>No messages yet.</Text>}
      />

      {/* Input */}
      <View style={{ flexDirection: "row", padding: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f1f5f9" }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          style={{
            flex: 1,
            backgroundColor: "#f8fafc",
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            marginRight: 8,
            fontSize: 16,
            maxHeight: 100,
          }}
          multiline
        />
        <TouchableOpacity
          style={{
            backgroundColor: "#2563eb",
            borderRadius: 20,
            width: 44,
            height: 44,
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={handleSend}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
