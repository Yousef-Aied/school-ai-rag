import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { submitQuiz, getQuiz  } from "../api";

export default function Quiz() {
  const { quizId } = useParams();
  const { state } = useLocation(); // There are questions coming up

  const navigate = useNavigate();

  // const questions = state?.questions ?? [];
  // const studentId = state?.studentId ?? 1;
  const [questions, setQuestions] = useState(state?.questions ?? []);
  const [studentId, setStudentId] = useState(state?.studentId ?? 1);
  // const [loading, setLoading] = useState(false);


  const [selected, setSelected] = useState({}); // question_id -> selected_index
  const [result, setResult] = useState(null);
  const [submitErr, setSubmitErr] = useState("");

    
  useEffect(() => {
    async function load() {
      if (questions.length === 0) {
        const q = await getQuiz(quizId);
        setQuestions(q.questions);
        setStudentId(q.student_id);
      }
    }
    load();
  }, [quizId, questions.length]);


  const pageErr = useMemo(() => {
    if (!state || questions.length === 0) {
      return "No quiz data found. Please generate quiz from chat first.";
    }
    return "";
  }, [state, questions.length]);

  const answersPayload = useMemo(() => {
    return Object.entries(selected).map(([question_id, selected_index]) => ({
      question_id,
      selected_index,
    }));
  }, [selected]);

  async function onSubmit() {
    try {
      setSubmitErr("");
      const data = await submitQuiz({
        quizId,
        studentId,
        answers: answersPayload,
      });
      setResult(data);
    } catch (e) {
      setSubmitErr(e?.message || "Submit failed");
    }
  }

  if (pageErr) {
    return (
      <div style={{ padding: 24, color: "#eee" }}>
        <h2>Quiz</h2>
        <p>{pageErr}</p>
        <button onClick={() => navigate("/chat")}>Back to Chat</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, color: "#eee", background: "#0f0f10", minHeight: "100vh" }}>
      <h2>Quiz</h2>
      <p>Answer 10 questions then submit.</p>

      {questions.map((q, idx) => (
        <div
          key={q.question_id}
          style={{ margin: "18px 0", padding: 14, border: "1px solid #222", borderRadius: 12 }}
        >
          <div style={{ marginBottom: 10 }}>
            <b>{idx + 1}.</b> {q.question_text}
          </div>

          {q.choices.map((c, ci) => (
            <label key={ci} style={{ display: "block", margin: "8px 0" }}>
              <input
                type="radio"
                name={String(q.question_id)}
                checked={selected[q.question_id] === ci}
                onChange={() => setSelected((prev) => ({ ...prev, [q.question_id]: ci }))}
              />{" "}
              {c}
            </label>
          ))}
        </div>
      ))}

      <button onClick={onSubmit} style={{ padding: "10px 18px", borderRadius: 10 }}>
        Submit
      </button>

      {submitErr ? <p style={{ color: "#ff8080" }}>{submitErr}</p> : null}

      {result ? (
        <div style={{ marginTop: 20, padding: 14, border: "1px solid #222", borderRadius: 12 }}>
          <h3>Result</h3>
          <p>
            Score: <b>{result.score}</b> / {result.max_score} (Completion:{" "}
            {(result.completion_rate * 100).toFixed(0)}%)
          </p>
          <button onClick={() => navigate("/chat")} style={{ padding: "8px 14px", borderRadius: 10 }}>
            Back to Chat
          </button>
        </div>
      ) : null}
    </div>
  );
}
