import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  TextInput,
  Image,
  StyleSheet,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import {
  getConversations,
  getInstructorStudents,
  getOrCreateConversation,
  createGroupConversation
} from "../../../api/instructor";
import { useAuth } from "../../../context/AuthContext";

// --- Components ---

const Avatar = ({ name, image, size = 50 }: { name: string; image?: string; size?: number }) => {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  
  // Deterministic color based on name
  const getColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  };

  const backgroundColor = useMemo(() => getColor(name || "User"), [name]);

  if (image) {
    return (
      <Image
        source={{ uri: image }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#e2e8f0" }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#fff", fontSize: size * 0.4, fontWeight: "bold" }}>{initial}</Text>
    </View>
  );
};

const ConversationItem = ({ item, onPress, currentUserId }: { item: any; onPress: () => void; currentUserId: any }) => {
  const otherParticipant = item.isGroup
    ? { name: item.name, _id: "group", image: null } 
    : item.participants.find((p: any) => p._id !== currentUserId) || { name: "Unknown", _id: "unknown" };
  
  const name = item.isGroup ? item.name : otherParticipant.name;
  const lastMessageText = item.lastMessage?.text || "No messages yet";
  const time = item.lastMessage?.createdAt
    ? formatDistanceToNow(new Date(item.lastMessage.createdAt), { addSuffix: true })
    : "";

  return (
    <TouchableOpacity style={styles.chatItem} onPress={onPress}>
      <Avatar name={name} image={otherParticipant.image} size={50} />
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName} numberOfLines={1}>
            {name}
          </Text>
          {time ? <Text style={styles.chatTime}>{time}</Text> : null}
        </View>
        <Text style={styles.chatMessage} numberOfLines={1}>
          {item.lastMessage?.sender === currentUserId ? "You: " : ""}
          {lastMessageText}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// --- Main Screen ---

export default function ChatRoomsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [newChatModalVisible, setNewChatModalVisible] = useState(false);
  const [groupModalVisible, setGroupModalVisible] = useState(false);

  // Data for modals
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // Group creation state
  const [groupName, setGroupName] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [groupSubmitting, setGroupSubmitting] = useState(false);

  const fetchConversations = async () => {
    if (!user?.token) return;
    try {
      const data = await getConversations(user.token);
      setConversations(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.log("Error fetching conversations", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user?.token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const fetchStudents = async () => {
    if (!user?.token) return;
    setStudentsLoading(true);
    try {
      const data = await getInstructorStudents(user.token);
      setStudents(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to fetch students");
    } finally {
      setStudentsLoading(false);
    }
  };

  // Actions
  const handleOpenNewChat = () => {
    setShowActionSheet(false);
    setNewChatModalVisible(true);
    fetchStudents();
  };

  const handleOpenGroupChat = () => {
    setShowActionSheet(false);
    setGroupModalVisible(true);
    fetchStudents();
  };

  const handleStartChat = async (userId: string) => {
    setNewChatModalVisible(false);
    try {
      const convo = await getOrCreateConversation(user?.token || "", userId);
      router.push({
        pathname: "/dashboard/instructor/chat-room",
        params: { conversationId: convo._id }, 
      });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to start chat");
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedStudents.length === 0) {
      Alert.alert("Error", "Please enter a group name and select at least one student.");
      return;
    }
    setGroupSubmitting(true);
    try {
      const convo = await createGroupConversation(user?.token || "", groupName.trim(), selectedStudents);
      setGroupModalVisible(false);
      setGroupName("");
      setSelectedStudents([]);
      router.push({
        pathname: "/dashboard/instructor/chat-room",
        params: { conversationId: convo._id },
      });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create group");
    } finally {
      setGroupSubmitting(false);
    }
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    return conversations.filter((c) => {
      const other = c.isGroup
        ? { name: c.name }
        : c.participants.find((p: any) => p._id !== user?._id);
      const name = other?.name || "Unknown";
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [conversations, searchQuery, user?._id]);

  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery) return students;
    return students.filter((s) => 
      (s.name || s.email).toLowerCase().includes(studentSearchQuery.toLowerCase())
    );
  }, [students, studentSearchQuery]);

  const toggleStudentSelection = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ConversationItem
            item={item}
            currentUserId={user?._id}
            onPress={() =>
              router.push({
                pathname: "/dashboard/instructor/chat-room",
                params: { conversationId: item._id },
              })
            }
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubText}>Start a new chat to connect with students.</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowActionSheet(true)}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Action Sheet Modal (Simple) */}
      <Modal visible={showActionSheet} transparent animationType="fade" onRequestClose={() => setShowActionSheet(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowActionSheet(false)} activeOpacity={1}>
          <View style={styles.actionSheet}>
            <TouchableOpacity style={styles.actionItem} onPress={handleOpenNewChat}>
              <Ionicons name="person-add-outline" size={24} color="#334155" />
              <Text style={styles.actionText}>New Chat</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.actionItem} onPress={handleOpenGroupChat}>
              <Ionicons name="people-outline" size={24} color="#334155" />
              <Text style={styles.actionText}>New Group</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* New Chat Modal */}
      <Modal visible={newChatModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setNewChatModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setNewChatModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Message</Text>
            <View style={{ width: 50 }} /> 
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students..."
              value={studentSearchQuery}
              onChangeText={setStudentSearchQuery}
            />
          </View>

          {studentsLoading ? (
            <ActivityIndicator style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={filteredStudents}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.studentItem} onPress={() => handleStartChat(item._id)}>
                  <Avatar name={item.name || item.email} size={40} />
                  <Text style={styles.studentName}>{item.name || item.email}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No students found</Text>}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Group Chat Modal */}
      <Modal visible={groupModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setGroupModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setGroupModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Group</Text>
            <TouchableOpacity onPress={handleCreateGroup} disabled={groupSubmitting}>
              <Text style={[styles.createActionText, groupSubmitting && { opacity: 0.5 }]}>Create</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.groupInputContainer}>
            <Text style={styles.label}>Group Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter group name"
              value={groupName}
              onChangeText={setGroupName}
            />
          </View>

          <Text style={[styles.label, { marginLeft: 16, marginTop: 16 }]}>Select Participants</Text>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students..."
              value={studentSearchQuery}
              onChangeText={setStudentSearchQuery}
            />
          </View>
          
          {studentsLoading ? (
            <ActivityIndicator style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={filteredStudents}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                const isSelected = selectedStudents.includes(item._id);
                return (
                  <TouchableOpacity style={styles.studentItem} onPress={() => toggleStudentSelection(item._id)}>
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                      <Avatar name={item.name || item.email} size={40} />
                      <Text style={styles.studentName}>{item.name || item.email}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color="#2563eb" />}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0f172a",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#0f172a",
  },
  // Item Styles
  chatItem: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  chatContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 8,
  },
  chatMessage: {
    fontSize: 14,
    color: "#64748b",
  },
  // Empty State
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  // Action Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  actionText: {
    fontSize: 16,
    marginLeft: 16,
    color: "#334155",
    fontWeight: "500",
  },
  separator: {
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  // Full Screen Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cancelText: {
    fontSize: 16,
    color: "#64748b",
  },
  createActionText: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "600",
  },
  studentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  studentName: {
    marginLeft: 12,
    fontSize: 16,
    color: "#0f172a",
  },
  // Group create specific
  groupInputContainer: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#0f172a",
  }
});
