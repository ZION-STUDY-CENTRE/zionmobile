import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import {
  getConversations,
  getMessages,
  sendMessage,
  getChatUsers,
  getOrCreateConversation,
} from "../../../api/mediaManager";

export default function ChatTab() {
  const { user } = useAuth();
  const token = user?.token;

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageText, setMessageText] = useState("");

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadConversations = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getConversations(token);
      setConversations(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to fetch conversations");
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [token]);

  const openNewChatModal = async () => {
    if (!token) return;
    setIsNewChatOpen(true);
    setUsersLoading(true);
    try {
      const data = await getChatUsers(token);
      const filtered = (Array.isArray(data) ? data : []).filter((u) => u?._id !== user?._id);
      setUsers(filtered);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to fetch users");
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const startChat = async (userId: string) => {
    if (!token) return;
    try {
      const convo = await getOrCreateConversation(token, userId);
      setIsNewChatOpen(false);
      setSearch("");
      await openConversation(convo);
      loadConversations();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to start conversation");
    }
  };

  const openConversation = async (conversation: any) => {
    if (!token) return;
    setSelectedConversation(conversation);
    setMessagesLoading(true);
    try {
      const data = await getMessages(token, conversation._id);
      setMessages(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to fetch messages");
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSend = async () => {
    if (!token || !selectedConversation || !messageText.trim()) return;
    try {
      const msg = await sendMessage(token, selectedConversation._id, messageText.trim());
      setMessages((prev) => [...prev, msg]);
      setMessageText("");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to send message");
    }
  };

  const filteredUsers = users.filter((u) =>
    (u?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!token || loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  // ===== Conversation View =====
  if (selectedConversation) {
    const other = selectedConversation.participants?.find((p: any) => p._id !== user?._id);
    return (
      <View style={{ flex: 1, flexDirection: "column", justifyContent: "space-between", minHeight: "97%", }}>
        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <TouchableOpacity onPress={() => setSelectedConversation(null)}>
              <Text style={{ color: "#2563eb", fontWeight: "bold" }}>← Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                Alert.alert("Clear Chat", "This will clear messages from this view only.", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Clear", style: "destructive", onPress: () => setMessages([]) },
                ])
              }
            >
              <Text style={{ color: "#ef4444", fontWeight: "bold" }}>Clear Chat</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
            {other?.name || "Conversation"}
          </Text>

        {messagesLoading ? (
          <ActivityIndicator />
        ) : (
          <ScrollView style={{ flex: 1, marginBottom: 12 }}>
            {messages.map((m) => (
              <View
                key={m._id}
                style={{
                  alignSelf: m.sender?._id === user?._id ? "flex-end" : "flex-start",
                  backgroundColor: m.sender?._id === user?._id ? "#2563eb" : "#e2e8f0",
                  padding: 8,
                  borderRadius: 8,
                  marginBottom: 6,
                  maxWidth: "80%",
                }}
              >
                <Text style={{ color: m.sender?._id === user?._id ? "#fff" : "#1e293b" }}>
                  {m.text}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#e2e8f0",
              borderRadius: 8,
              padding: 10,
            }}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={{
              backgroundColor: "#2563eb",
              paddingHorizontal: 16,
              borderRadius: 8,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ===== Conversation List =====
  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 16 }}>
        <TouchableOpacity
          style={{
            backgroundColor: "#2563eb",
            padding: 12,
            borderRadius: 8,
          }}
          onPress={openNewChatModal}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>+ Start New Chat</Text>
        </TouchableOpacity>
      </View>

      {conversations.length === 0 ? (
        <Text style={{ color: "#888", textAlign: "center", marginTop: 32 }}>
          No conversations found.
        </Text>
      ) : (
        conversations.map((c) => {
          const other = c.participants?.find((p: any) => p._id !== user?._id);
          return (
            <TouchableOpacity
              key={c._id}
              style={{
                backgroundColor: "#f1f5f9",
                borderRadius: 10,
                padding: 14,
                marginBottom: 10,
              }}
              onPress={() => openConversation(c)}
            >
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                {other?.name || "Conversation"}
              </Text>
              <Text style={{ color: "#555" }}>
                {c.lastMessage?.text ? c.lastMessage.text : "No messages yet"}
              </Text>
            </TouchableOpacity>
          );
        })
      )}

      {/* New Chat Modal (no group) */}
      <Modal visible={isNewChatOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center" }}>
          <View style={{ backgroundColor: "#fff", margin: 20, borderRadius: 12, padding: 16, maxHeight: "80%" }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>Start New Chat</Text>

            <TextInput
              placeholder="Search user..."
              value={search}
              onChangeText={setSearch}
              style={{
                borderWidth: 1,
                borderColor: "#e2e8f0",
                borderRadius: 8,
                padding: 10,
                marginBottom: 12
              }}
            />

            {usersLoading ? (
              <ActivityIndicator />
            ) : (
              <ScrollView>
                {filteredUsers.map((u) => (
                  <TouchableOpacity
                    key={u._id}
                    style={{
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: "#f1f5f9"
                    }}
                    onPress={() => startChat(u._id)}
                  >
                    <Text style={{ fontSize: 16 }}>{u.name}</Text>
                  </TouchableOpacity>
                ))}
                {filteredUsers.length === 0 && (
                  <Text style={{ color: "#888", textAlign: "center", marginTop: 12 }}>
                    No users found.
                  </Text>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              onPress={() => { setIsNewChatOpen(false); setSearch(""); }}
              style={{
                marginTop: 12,
                backgroundColor: "#e2e8f0",
                padding: 10,
                borderRadius: 8,
                alignItems: "center"
              }}
            >
              <Text style={{ fontWeight: "bold" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}