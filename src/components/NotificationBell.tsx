import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  AppNotification,
  clearAllNotifications,
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  sendTestPush,
} from "../api/notifications";

type Props = {
  token?: string;
};

function formatRelativeTime(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function notificationIconName(type: AppNotification["type"]): keyof typeof MaterialCommunityIcons.glyphMap {
  switch (type) {
    case "message":
      return "chat-outline";
    case "assignment":
    case "quiz":
    case "material":
      return "book-outline";
    case "submission":
      return "upload-outline";
    case "grade":
      return "star-outline";
    case "comment":
      return "comment-outline";
    default:
      return "bullhorn-outline";
  }
}

export default function NotificationBell({ token }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const unreadInFlight = useRef(false);

  const loadUnreadCount = useCallback(async () => {
    if (!token || unreadInFlight.current) return;
    unreadInFlight.current = true;
    try {
      const data = await getUnreadCount(token);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      setUnreadCount(0);
    } finally {
      unreadInFlight.current = false;
    }
  }, [token]);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getNotifications(token);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    loadUnreadCount();

    const interval = setInterval(loadUnreadCount, 30000);
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        loadUnreadCount();
      }
    });

    return () => {
      clearInterval(interval);
      appStateSubscription.remove();
    };
  }, [token, loadUnreadCount]);

  const recentNotifications = useMemo(() => notifications.slice(0, 3), [notifications]);

  const openBell = async () => {
    setOpen(true);
    await Promise.all([loadNotifications(), loadUnreadCount()]);
  };

  const handleMarkOneRead = async (id: string) => {
    if (!token) return;
    try {
      await markAsRead(token, id);
      setNotifications((prev) => prev.map((item) => (item._id === id ? { ...item, isRead: true } : item)));
      await loadUnreadCount();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to mark as read");
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await markAllAsRead(token);
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to mark all as read");
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await deleteNotification(token, id);
      setNotifications((prev) => prev.filter((item) => item._id !== id));
      await loadUnreadCount();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to delete notification");
    }
  };

  const handleClearAll = () => {
    if (!token) return;
    Alert.alert("Clear All", "Clear all notifications?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          try {
            await clearAllNotifications(token);
            setNotifications([]);
            setUnreadCount(0);
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to clear notifications");
          }
        },
      },
    ]);
  };

  const handleTestPush = async () => {
    if (!token) return;
    try {
      const result = await sendTestPush(token, {
        title: "Push Test",
        body: "One-tap test from mobile app",
        data: { source: "mobile-dev-button" },
      });
      Alert.alert("Push test sent", result?.message || "Request accepted");
    } catch (e: any) {
      Alert.alert("Push test failed", e?.message || "Unable to send test push");
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.bellButton} onPress={openBell} activeOpacity={0.8}>
        <Feather name="bell" size={20} color="gray" />
        {unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.panel}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Notifications</Text>
              <View style={styles.headerActions}>
                {__DEV__ ? (
                  <TouchableOpacity style={styles.smallAction} onPress={handleTestPush}>
                    <Text style={styles.smallActionText}>Test push</Text>
                  </TouchableOpacity>
                ) : null}
                {unreadCount > 0 ? (
                  <TouchableOpacity style={styles.smallAction} onPress={handleMarkAllRead}>
                    <Text style={styles.smallActionText}>Mark all</Text>
                  </TouchableOpacity>
                ) : null}
                {notifications.length > 0 ? (
                  <TouchableOpacity style={[styles.smallAction, styles.clearAction]} onPress={handleClearAll}>
                    <Text style={[styles.smallActionText, styles.clearActionText]}>Clear</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={styles.closeButton} onPress={() => setOpen(false)}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {loading ? (
              <ActivityIndicator style={{ marginTop: 20 }} />
            ) : recentNotifications.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Feather name="bell-off" size={24} color="#94a3b8" />
                <Text style={styles.emptyText}>No notifications yet</Text>
              </View>
            ) : (
              <FlatList
                data={recentNotifications}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingBottom: 8 }}
                renderItem={({ item }) => (
                  <View style={[styles.itemCard, !item.isRead && styles.itemUnread]}>
                    <View style={styles.itemTopRow}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.itemTitleRow}>
                          <MaterialCommunityIcons
                            name={notificationIconName(item.type)}
                            size={16}
                            color="#0f172a"
                          />
                          <Text style={styles.itemTitle}>{item.title}</Text>
                        </View>
                        {item.message ? <Text style={styles.itemMessage}>{item.message}</Text> : null}
                        <Text style={styles.itemTime}>{formatRelativeTime(item.createdAt)}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDelete(item._id)}>
                        <Text style={styles.deleteText}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                    {!item.isRead ? (
                      <TouchableOpacity onPress={() => handleMarkOneRead(item._id)}>
                        <Text style={styles.markReadText}>Mark as read</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  bellIcon: {
    fontSize: 18,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-start",
    paddingTop: 90,
    paddingHorizontal: 14,
  },
  panel: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    maxHeight: 420,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  smallAction: {
    marginRight: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  smallActionText: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "700",
  },
  clearAction: {
    backgroundColor: "#fef2f2",
  },
  clearActionText: {
    color: "#dc2626",
  },
  closeButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  closeText: {
    color: "#64748b",
    fontWeight: "700",
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  emptyText: {
    color: "#64748b",
  },
  itemCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#f8fafc",
  },
  itemUnread: {
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  itemTopRow: {
    flexDirection: "row",
    gap: 8,
  },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  itemTitle: {
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  itemMessage: {
    color: "#334155",
    fontSize: 12,
    marginBottom: 3,
  },
  itemTime: {
    color: "#64748b",
    fontSize: 11,
  },
  deleteText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  markReadText: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },
});
