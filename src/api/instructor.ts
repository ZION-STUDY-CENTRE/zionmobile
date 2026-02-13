const API_URL = "https://zion-backend-og8z.onrender.com/api";

export async function changePassword(token: string, newPassword: string) {
  const res = await fetch(`${API_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ newPassword }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.msg || data?.message || "Failed to update password");
  }
  return data;
}

// Create assignment with file upload or URL
export async function createAssignment(
  programId: string,
  token: string,
  {
    title,
    description,
    scheduledDate,
    dueDate,
    attachmentUrl,
  }: {
    title: string;
    description: string;
    scheduledDate: string;
    dueDate: string;
    attachmentUrl?: string;
  }
) {
  const res = await fetch(`${API_URL}/assignments`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      description,
      scheduledDate,
      dueDate,
      program: programId,
      attachmentUrl,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to create assignment");
  }
  return await res.json();
}
// src/api/instructor.ts
// API utility for instructor dashboard (mobile)

export async function getInstructorPrograms(token: string) {
  const res = await fetch(`${API_URL}/programs/instructor`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch programs");
  return res.json();
}

export async function gradeSubmission(submissionId: string, token: string, grade: number, feedback: string) {
  const res = await fetch(`${API_URL}/assignment-submissions/${submissionId}/grade`, {
    method: "PUT", // <-- use PUT here
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ grade, feedback }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to grade submission");
  }
  return res.json();
}

export async function deleteAssignment(programId: string, assignmentId: string, token: string) {
  const candidates = [
    // 1. Try instructor-specific short route
    `${API_URL}/instructor/assignments/${assignmentId}`,
    // 2. Try generic route WITH program context (often needed for permission checks)
    `${API_URL}/assignments/${assignmentId}?programId=${programId}`,
    // 3. Fallback to simple generic route
    `${API_URL}/assignments/${assignmentId}`
  ];

  let lastMessage = "Failed to delete assignment";

  for (const url of candidates) {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // If successful (200-299)
    if (res.ok) {
      if (res.status === 204) return { success: true };
      return res.json().catch(() => ({ success: true }));
    }

    // If 404, just continue to next candidate
    if (res.status === 404) {
      continue;
    }

    // If 401/403 or 500, capture error but maybe continue (or break?)
    // Let's capture the message and try the next one just in case
    const raw = await res.text();
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.message) lastMessage = parsed.message;
    } catch {
      if (raw) lastMessage = raw;
    }
  }

  throw new Error(lastMessage);
}

export async function getAssignmentSubmissions(assignmentId: string, token: string) {
  const res = await fetch(`${API_URL}/assignments/${assignmentId}/submissions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to fetch submissions");
  }
  return res.json();
}

export async function getProgramStudents(programId: string, token: string) {
  const res = await fetch(`${API_URL}/users/program/${programId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch students");
  return res.json();
}

export async function getAssignments(programId: string, token: string) {
  const res = await fetch(`${API_URL}/assignments/program/${programId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch assignments");
  return res.json();
}

export async function getFileResources(programId: string, token: string) {
  const res = await fetch(`${API_URL}/files/program/${programId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch files");
  return res.json();
}

export async function getQuizzes(programId: string, token: string) {
  const res = await fetch(`${API_URL}/quizzes/program/${programId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch quizzes");
  return res.json();
}

// Get Single Quiz (Try standard route first)
export async function getQuiz(quizId: string, token: string) {
  // Try generic web route first (often /api/quizzes/:id)
  const res = await fetch(`${API_URL}/quizzes/${quizId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (res.ok) return res.json();
  
  // If that fails, try instructor specific route
  const res2 = await fetch(`${API_URL}/instructor/quizzes/${quizId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res2.ok) throw new Error("Failed to fetch quiz");
  return res2.json();
}

// Get Quiz Submissions
export async function getQuizSubmissions(quizId: string, token: string) {
  // Try instructor specific route first
  const res = await fetch(`${API_URL}/instructor/quizzes/${quizId}/submissions`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.ok) return res.json();

  // If failed, try generic route (some backends use /api/quizzes/:id/submissions)
  const res2 = await fetch(`${API_URL}/quizzes/${quizId}/submissions`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res2.ok) throw new Error("Failed to fetch submissions");
  return res2.json();
}

export async function createQuiz(programId: string, token: string, quiz: any) {
  const res = await fetch(`${API_URL}/quizzes`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...quiz, program: programId }),
  });
  if (!res.ok) throw new Error(await res.text() || "Failed to create quiz");
  return res.json();
}

export async function deleteQuiz(quizId: string, token: string) {
  const res = await fetch(`${API_URL}/quizzes/${quizId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text() || "Failed to delete quiz");
  return res.json();
}

export async function getMaterials(programId: string, token: string) {
  const res = await fetch(`${API_URL}/files/program/${programId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch materials");
  return res.json();
}

export async function uploadMaterial(programId: string, token: string, formData: FormData) {
  const res = await fetch(`${API_URL}/files`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      // no need for content type as fetch will still set it for FormData
    },
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text() || "Failed to upload material");
  return res.json();
}

export async function deleteMaterial(materialId: string, token: string) {
  const res = await fetch(`${API_URL}/files/${materialId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text() || "Failed to delete material");
  return res.json();
}
// Get all conversations for the user
export async function getConversations(token: string) {
  const res = await fetch(`${API_URL}/chat/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json();
}

// Get messages for a conversation
export async function getMessages(token: string, conversationId: string) {
  const res = await fetch(`${API_URL}/chat/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

// Send a message
export async function sendMessage(token: string, conversationId: string, text: string) {
  const res = await fetch(`${API_URL}/chat/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ conversationId, text }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}

// Get all users for starting a chat
export async function getChatUsers(token: string) {
  const res = await fetch(`${API_URL}/chat/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

// Create or get a 1-to-1 conversation
export async function getOrCreateConversation(token: string, userId: string) {
  const res = await fetch(`${API_URL}/chat/or-create/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to get or create conversation");
  return res.json();
}

export async function getInstructorStudents(token: string) {
  // 1. Get instructor's programs
  const programsRes = await fetch(`${API_URL}/programs/instructor`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await programsRes.text();
  if (!programsRes.ok) throw new Error("Failed to fetch instructor programs");
  const programs = JSON.parse(text);
  let students: any[] = [];
  // 2. For each program, get students
  for (const program of programs) {
    const url = `${API_URL}/users/program/${program._id}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const studentsText = await res.text();
    if (!res.ok) throw new Error(`Failed to fetch students for program ${program._id}`);
    const programStudents = JSON.parse(studentsText);
    students = students.concat(programStudents);
  }
  // 3. Deduplicate by _id
  const unique = Object.values(
    students.reduce((acc, s) => ({ ...acc, [s._id]: s }), {})
  );
  return unique;
}

export async function createGroupConversation(token: string, name: string, participantIds: string[]) {
  const res = await fetch(`${API_URL}/chat/group-conversation`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, participantIds }),
  });
  if (!res.ok) throw new Error("Failed to create group chat");
  return res.json();
}

export async function deleteConversation(token: string, conversationId: string) {
  const res = await fetch(`${API_URL}/chat/conversations/${conversationId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete conversation");
  return res.json();
}