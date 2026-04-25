// API wrapper (connects to BackIndex)
export async function sendMessage({conversationId, message, grade, subject, studentId = 1, studentName, behaviorLabel}) {
  const res = await fetch("http://localhost:8000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: conversationId,
      message,
      student_id: studentId, //send it so that it knows the backend and which profile to open
      student_name: studentName,
      behavior_label: behaviorLabel,
      grade,
      subject,
    }),
  });

  if (!res.ok) throw new Error(await res.text());
  return await res.json(); // { answer }
}

// Analysis API
export async function analyzeChat(studentId, conversationId, messages, grade, subject) {
  const res = await fetch("http://localhost:8000/api/analyze-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: studentId,
      conversation_id: conversationId,
      grade,
      subject,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        ts: m.ts,
      })),
    }),
  });

  if (!res.ok) throw new Error(await res.text());
  return await res.json(); // { answer }
}


// Quiz API
export async function generateQuiz({ studentId, conversationId, nQuestions = 10, topic, grade, subject }) {
  const res = await fetch("http://localhost:8000/api/quiz/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: studentId,
      conversation_id: conversationId,
      n_questions: nQuestions,
      topic,
      grade,
      subject,
    }),
  });

  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function submitQuiz({ quizId, studentId, answers }) {
  const res = await fetch("http://localhost:8000/api/quiz/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quiz_id: quizId,
      student_id: studentId,
      answers,
    }),
  });

  if (!res.ok) throw new Error(await res.text());
  return await res.json(); // { score, max_score, review[] }
}

// Add fetch if state is not available
export async function getQuiz(quizId) {
  const res = await fetch(`http://localhost:8000/api/quiz/${quizId}`);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}


// Behavior Prediction API
// Behavior (KMeans) API
export async function predictBehaviorCluster(payload) {
  const res = await fetch("http://localhost:8000/api/behavior/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(await res.text());
  return await res.json(); // { cluster, label }
}


// ===============================
// .NET API (Teacher Dashboard)
// ===============================
const DOTNET_BASE = "https://localhost:7265"; // .NET Swagger

// Teacher Dashboard API
export async function getTeacherDashboard(teacherId) {
  const res = await fetch(`${DOTNET_BASE}/api/teacher/dashboard?teacherId=${teacherId}`);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// Student Dashboard API
export async function getStudentDashboard(studentId) {
  const res = await fetch(`${DOTNET_BASE}/api/student/dashboard?studentId=${studentId}`);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function generateTeacherPredictions(teacherId) {
  const res = await fetch(`${DOTNET_BASE}/api/teacher/${teacherId}/predictions/generate`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json(); // { processed, skippedNoMetrics, aiFailed }
}


// ===============================
// createTeacherQuizAssignment API
export async function createTeacherQuizAssignment(teacherId, payload) {
  const res = await fetch(`${DOTNET_BASE}/api/teacher/${teacherId}/quiz-assignments/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: payload.topic,
      gradeLevel: payload.grade,
      subject: payload.subject,
      numberOfQuestions: payload.nQuestions,
      studentIds: payload.studentIds,
    }),
  });

  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function getTeacherQuizResults(teacherId, assignmentId) {
  const res = await fetch(
    `${DOTNET_BASE}/api/teacher/${teacherId}/quiz-assignments/${assignmentId}/results`
  );

  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function getStudentQuizAssignments(studentId) {
  const res = await fetch(`${DOTNET_BASE}/api/student/${studentId}/quiz-assignments`);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}


export async function getStudentQuizAssignmentDetails(studentQuizAssignmentId) {
  const res = await fetch(
    `${DOTNET_BASE}/api/student/quiz-assignments/${studentQuizAssignmentId}`
  );
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function submitStudentQuizAssignment(studentQuizAssignmentId, answers) {
  const res = await fetch(
    `${DOTNET_BASE}/api/student/quiz-assignments/${studentQuizAssignmentId}/submit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    }
  );

  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}