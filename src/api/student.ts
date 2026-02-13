const API_URL = "https://zion-backend-og8z.onrender.com/api";

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

// ============ PROGRAMS & MATERIALS ============

export async function getStudentProgram(token: string) {
  const res = await fetch(`${API_URL}/programs/student/my-program`, {
    headers: authHeaders(token),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.msg || "Failed to fetch program");
  }
  return res.json();
}

export async function getFileResources(programId: string, token: string) {
  const res = await fetch(`${API_URL}/files/program/${programId}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch files");
  }
  return res.json();
}

export async function recordDownload(fileId: string, token: string) {
  const res = await fetch(`${API_URL}/files/${fileId}/download`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to record download");
  }
  return res.json();
}

// ============ ASSIGNMENTS ============

export async function getAssignments(programId: string, token: string) {
  const res = await fetch(`${API_URL}/assignments/program/${programId}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch assignments");
  }
  return res.json();
}

export async function getMyAssignmentSubmission(assignmentId: string, token: string) {
  const res = await fetch(`${API_URL}/assignment-submissions/${assignmentId}/my-submission`, {
    headers: authHeaders(token),
  });
  // If 404, it means no submission exists yet
  if (res.status === 404) return null;
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to check submission status");
  }
  return res.json();
}

export async function submitAssignment(assignmentId: string, data: any, token: string) {
  const res = await fetch(`${API_URL}/assignment-submissions/${assignmentId}/submit`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to submit assignment");
  }
  return res.json();
}

// ============ UPLOAD HELPERS ============

export async function uploadFile(file: any, token: string) {
  const formData = new FormData();
  formData.append("image", {
    uri: file.uri,
    name: file.name || "upload.jpg",
    type: file.mimeType || "image/jpeg",
  } as any);

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Upload failed");
  }
  // Adjust based on your backend response structure
  return res.json(); 
}

// ============ QUIZZES ============

export async function getQuizzes(programId: string, token: string) {
  const res = await fetch(`${API_URL}/quizzes/program/${programId}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch quizzes");
  }
  return res.json();
}

export async function getQuiz(quizId: string, token: string) {
  const res = await fetch(`${API_URL}/quizzes/${quizId}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch quiz details");
  }
  return res.json();
}

export async function getQuizSubmission(quizId: string, token: string) {
  // Try to fetch previous submission
  try {
    const res = await fetch(`${API_URL}/quizzes/${quizId}/submission`, {
      headers: authHeaders(token),
    });
    if (res.status === 404) return null; // Not taken yet
    if (!res.ok) {
       // Silent fail or throw depending on how you want to handle it
       return null;
    }
    return res.json();
  } catch (e) {
    return null;
  }
}

export async function submitQuiz(quizId: string, submissionData: any, token: string) {
  const res = await fetch(`${API_URL}/quizzes/${quizId}/submit`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(submissionData),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to submit quiz");
  }
  return res.json();
}

export async function getStudentProgress(programId: string, token: string) {
  // We use the same endpoint as getting the program, or a dedicated stats endpoint if you have one.
  // Based on your web dashboard, it often calculates progress from assignments/quizzes on the client 
  // or via a specific endpoint. Let's use a specific one if available, or aggregate.
  
  // Assuming a tailored endpoint exists or we fetch both assignments and quizzes to calculate
  // For now, let's fetch 'all-stats' if it exists, otherwise we'll fetch assignments & quizzes here.
  
  try {
    const [assignments, quizzes] = await Promise.all([
      getAssignments(programId, token),
      getQuizzes(programId, token)
    ]);

    // We also need submissions to calculate grades
    // This part might be heavy on mobile if we don't have a summary endpoint.
    // Let's assume we iterate and fetch submissions or the list includes "mySubmission" field (ideal backend design).
    // If your backend lists don't include "mySubmission", we have to fetch them one by one or use a summary endpoint.

    return { assignments, quizzes };
  } catch (e) {
    throw e;
  }
}