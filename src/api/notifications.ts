const API_URL = "https://zion-backend-og8z.onrender.com/api";

export type AppNotification = {
  _id: string;
  type: "message" | "assignment" | "quiz" | "material" | "submission" | "grade" | "comment" | "system";
  title: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
};

async function parseResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.msg || data?.message || "Request failed");
  }
  return data;
}

export async function getNotifications(token: string): Promise<AppNotification[]> {
  const res = await fetch(`${API_URL}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(res);
}

export async function getUnreadCount(token: string): Promise<{ unreadCount: number }> {
  const res = await fetch(`${API_URL}/notifications/unread/count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(res);
}

export async function markAsRead(token: string, notificationId: string) {
  const res = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return parseResponse(res);
}

export async function markAllAsRead(token: string) {
  const res = await fetch(`${API_URL}/notifications/all/read`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return parseResponse(res);
}

export async function deleteNotification(token: string, notificationId: string) {
  const res = await fetch(`${API_URL}/notifications/${notificationId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(res);
}

export async function clearAllNotifications(token: string) {
  const res = await fetch(`${API_URL}/notifications/all/clear`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(res);
}

export async function sendTestPush(
  token: string,
  payload?: { title?: string; body?: string; data?: Record<string, unknown> }
) {
  const res = await fetch(`${API_URL}/notifications/test/push`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload || {}),
  });
  return parseResponse(res);
}
