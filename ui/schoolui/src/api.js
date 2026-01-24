// API wrapper (connects to BackIndex)
// export async function sendMessage({ conversationId, message }) {
//   const res = await fetch("http://localhost:8000/api/chat", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ conversation_id: conversationId, message }),
//   });

//   if (!res.ok) {
//     const text = await res.text();
//     throw new Error(text || "Request failed");
//   }

//   return await res.json();// { answer }
// }

// Quiz API
// export async function generateQuiz({ studentId, conversationId, nQuestions = 10, topic }) {
//   const res = await fetch("http://localhost:8000/api/quiz/generate", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       student_id: studentId,
//       conversation_id: conversationId ?? null,
//       n_questions: nQuestions,
//       topic: topic ?? null,
//     }),
//   });

//   if (!res.ok) throw new Error(await res.text());
//   return await res.json(); // { quiz_id, questions[] }
// }

// API wrapper (connects to BackIndex)
export async function sendMessage({ conversationId, message, grade, subject }) {
  const res = await fetch("http://localhost:8000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: conversationId,
      message,
      grade,
      subject,
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

