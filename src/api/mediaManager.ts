const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://zion-backend-og8z.onrender.com/api";

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export async function uploadImage(
  token: string,
  file: { uri: string; name: string; type: string },
  category: "blog" | "gallery" | "testimonial" | "general" = "general"
) {
  const formData = new FormData();
  // @ts-ignore
  formData.append("image", file);

  const res = await fetch(`${API_URL}/upload?category=${category}`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      // Do NOT set Content-Type; let RN set boundary
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to upload image");
  }
  return res.json(); // expects { imageUrl }
}

export async function getPrograms(token: string) {
  const res = await fetch(`${API_URL}/programs`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Failed to fetch programs");
  return res.json();
}

// Blog
export async function getBlogPosts(token: string) {
  const res = await fetch(`${API_URL}/content/blog`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Failed to fetch blog posts");
  return res.json();
}
export async function createBlogPost(token: string, data: any) {
  const res = await fetch(`${API_URL}/content/blog`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create blog post");
  return res.json();
}
export async function deleteBlogPost(token: string, id: string) {
  const res = await fetch(`${API_URL}/content/blog/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to delete blog post");
}

// Gallery
export async function getGalleryItems(token: string) {
  const res = await fetch(`${API_URL}/content/gallery`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Failed to fetch gallery items");
  return res.json();
}
export async function createGalleryItem(token: string, data: any) {
  const res = await fetch(`${API_URL}/content/gallery`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create gallery item");
  return res.json();
}
export async function deleteGalleryItem(token: string, id: string) {
  const res = await fetch(`${API_URL}/content/gallery/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to delete gallery item");
}

// Testimonials
export async function getTestimonials(token: string) {
  const res = await fetch(`${API_URL}/testimonials`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Failed to fetch testimonials");
  return res.json();
}
export async function createTestimonial(token: string, data: any) {
  const res = await fetch(`${API_URL}/testimonials`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create testimonial");
  return res.json();
}
export async function deleteTestimonial(token: string, id: string) {
  const res = await fetch(`${API_URL}/testimonials/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to delete testimonial");
}

// ======== CHAT (1-to-1) ========

export async function getConversations(token: string) {
  const res = await fetch(`${API_URL}/chat/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json();
}

export async function getMessages(token: string, conversationId: string) {
  const res = await fetch(`${API_URL}/chat/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

export async function sendMessage(token: string, conversationId: string, text: string) {
  const res = await fetch(`${API_URL}/chat/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ conversationId, text }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}

export async function getChatUsers(token: string) {
  const res = await fetch(`${API_URL}/chat/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function getOrCreateConversation(token: string, userId: string) {
  const res = await fetch(`${API_URL}/chat/or-create/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to get or create conversation");
  return res.json();
}