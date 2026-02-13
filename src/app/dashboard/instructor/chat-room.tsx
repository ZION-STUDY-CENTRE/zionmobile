import React, { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { getMessages, sendMessage } from "../../../api/instructor";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { deleteConversation } from "../../../api/instructor";
import { Ionicons } from "@expo/vector-icons";


export default function ChatRoomScreen() {
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
      // Optionally show error
    } finally {
      setSending(false);
    }
  };

  let isSentByMe

  if (loading) return <ActivityIndicator />;
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#fff" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Back Button */}
      <View style={{ display: "flex", justifyContent: "space-between", flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: "#fff" }}>
      <TouchableOpacity  onPress={() => router.replace("/dashboard/instructor?tab=chat")}  style={{
        flexDirection: "row",
        alignItems: "center",}}>
        <View style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </View>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1e3a8a" }}>
          Back
        </Text>
      </TouchableOpacity>
        <Text style={{ fontWeight: "bold", fontSize: 18 }}>Chat</Text>
        <TouchableOpacity
            onPress={() => {
            Alert.alert(
                "Clear Conversation",
                "Are you sure? This action can't be undone.",
                [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                    try {
                        await deleteConversation(user?.token ? user.token : "", conversationId);
                        router.back();
                    } catch (e) {
                        Alert.alert("Error", "Failed to delete conversation");
                    }
                    }
                }
                ]
            );
            }}
            style={{ marginLeft: 12 }}
        >
            <Text style={{ color: "#dc2626", fontWeight: "bold", fontSize: 16 }}>clear chat</Text>
        </TouchableOpacity>
      </View>
      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
            
          <>
            {isSentByMe = String(item.sender?._id) === String(user?._id)}
            <View
            style={{
              alignSelf: isSentByMe ? "flex-end" : "flex-start",
              backgroundColor: isSentByMe ? "#2563eb" : "#e5e7eb",
              borderRadius: 10,
              padding: 10,
              marginBottom: 8,
              maxWidth: "80%",
            }}
          >
            <Text style={{ color: isSentByMe ? "#fff" : "#1e293b" }}>{item.text}</Text>
            <Text style={{ color: "#cfcdcd", fontSize: 10, marginTop: 2, textAlign: "right" }}>
              {item.sender?.name} • {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>  
        </>
        )}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      {/* Input */}
      <View style={{ flexDirection: "row", padding: 12, backgroundColor: "#fff" }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type a message"
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 8,
            padding: 10,
            marginRight: 8,
          }}
        />
        <TouchableOpacity
          style={{
            backgroundColor: "#2563eb",
            borderRadius: 8,
            paddingHorizontal: 16,
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={handleSend}
          disabled={sending}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>{sending ? "..." : "Send"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}