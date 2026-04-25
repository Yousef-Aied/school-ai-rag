import { useEffect, useMemo, useState } from "react";
import { sendMessage, generateQuiz, analyzeChat, getStudentDashboard } from "../api";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { useNavigate } from "react-router-dom";
import "../Chat.css";

const studentId = 1;
// It has a chat room
// App (Manages conversations + storage)
// function uid() {
//   return crypto.randomUUID();
// }
function uid() {
  return (
    crypto?.randomUUID?.() ??
    String(Date.now()) + "-" + Math.random().toString(16).slice(2)
  );
}

function loadConversations() {
  try {
    const raw = localStorage.getItem("conversations");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(conversations) {
  localStorage.setItem("conversations", JSON.stringify(conversations));
}

function makeNewConversation() {
  return {
    id: uid(),
    title: "New chat",
    createdAt: Date.now(),
    messages: [],
  };
}

// chat
export default function Chat() {
  const [studentName, setStudentName] = useState("");
  const [behaviorLabel, setBehaviorLabel] = useState("");

  const [conversations, setConversations] = useState(() => {
    const existing = loadConversations();
    return existing.length ? existing : [makeNewConversation()];
  });

  const [activeId, setActiveId] = useState(() => {
    const existing = loadConversations();
    return existing.length ? existing[0].id : null;
  });

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) || conversations[0],
    [conversations, activeId],
  );

  const navigate = useNavigate();

  const grade = Number(localStorage.getItem("student_grade") || 5);
  const subject = localStorage.getItem("student_subject") || "auto";


  useEffect(() => {
    getStudentDashboard(studentId)
      .then((data) => {
        if (data.studentName) {
          setStudentName(data.studentName);
        }
        if (data.cluster && data.cluster.label) {
          setBehaviorLabel(data.cluster.label);
        }
      })
      .catch((err) => console.error("Failed to load dashboard data from .NET", err));
  }, []);

  // Because Chat page specific styles to (scrollbar)
  useEffect(() => {
    document.body.classList.add("chat-page");
    return () => document.body.classList.remove("chat-page");
  }, []);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  function newChat() {
    const c = makeNewConversation();
    setConversations((prev) => [c, ...prev]);
    setActiveId(c.id);
  }

  function deleteChat(id) {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (!next.length) return [makeNewConversation()];
      return next;
    });
    if (activeId === id) {
      setActiveId((prev) => {
        const remaining = conversations.filter((c) => c.id !== prev);
        return remaining[0]?.id || null;
      });
    }
  }

  async function onSend(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg = {
      id: uid(),
      role: "user",
      content: trimmed,
      ts: Date.now(),
    };
    const tempAssistant = {
      id: uid(),
      role: "assistant",
      content: "…",
      ts: Date.now(),
      pending: true,
    };

    // optimistic UI
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              title: c.messages.length === 0 ? trimmed.slice(0, 30) : c.title,
              messages: [...c.messages, userMsg, tempAssistant],
            }
          : c,
      ),
    );

    try {
      // const data = await sendMessage({ conversationId: activeConversation.id, message: trimmed });
      const data = await sendMessage({
        conversationId: activeConversation.id,
        message: trimmed,
        studentId,
        studentName,
        behaviorLabel,
        grade,
        subject,
      });
      const answer = data.answer ?? "";

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === tempAssistant.id
                    ? { ...m, content: answer, pending: false }
                    : m,
                ),
              }
            : c,
        ),
      );
      try {
        // const lastMessages = [...activeConversation.messages, userMsg, { role: "assistant", content: answer }];
        // await analyzeChat(studentId, activeConversation.id, lastMessages);
        const now = Date.now();
        const cleanOld = (activeConversation.messages || []).filter(
          (m) => !(m.role === "assistant" && m.pending) && m.content !== "…",
        );

        const base = [
          ...cleanOld,
          userMsg,
          { role: "assistant", content: answer, ts: now },
        ];

        const lastMessages = base
          .map((m) => ({
            role: m.role,
            content: m.content,
            ts: m.ts ?? now,
          }))
          .slice(-20);

        if (activeConversation?.id) {
          await analyzeChat(
            studentId,
            activeConversation.id,
            lastMessages,
            grade,
            subject,
          );
        }
      } catch (err) {
        // ignore analysis errors
        console.error("Analysis background task failed:", err);
      }
    } catch (e) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === tempAssistant.id
                    ? {
                        ...m,
                        content: `Error: ${String(e.message || e)}`,
                        pending: false,
                      }
                    : m,
                ),
              }
            : c,
        ),
      );
    }
  }

  async function onGenerateQuiz() {
    try {
      // const studentId = 1; // Later from auth
      const conversationId = activeConversation?.id ?? null;

      // As a starting point, we'll make it smart later
      const topic =
        activeConversation?.messages
          ?.filter((m) => m.role === "user")
          ?.slice(-1)[0]?.content || "General topic";

      const quiz = await generateQuiz({
        studentId,
        conversationId,
        nQuestions: 10,
        topic,
        grade,
        subject,
      });

      navigate(`/quiz/${quiz.quiz_id}`, {
        state: {
          questions: quiz.questions,
          studentId,
          conversationId,
        },
      });
    } catch (e) {
      alert(e.message || "Failed to generate quiz");
    }
  }

  return (
    <div className="appShell">
      <Sidebar
        conversations={conversations}
        activeId={activeConversation.id}
        onNewChat={newChat}
        onSelect={(id) => setActiveId(id)}
        onDelete={deleteChat}
      />

      <ChatWindow
        conversation={activeConversation}
        onSend={onSend}
        onGenerateQuiz={onGenerateQuiz}
      />
    </div>
  );
}
