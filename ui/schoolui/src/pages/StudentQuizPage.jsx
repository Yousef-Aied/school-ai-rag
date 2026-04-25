import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getStudentQuizAssignmentDetails,
  submitStudentQuizAssignment,
} from "../api";

export default function StudentQuizPage() {
  const { studentQuizAssignmentId } = useParams();

  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getStudentQuizAssignmentDetails(studentQuizAssignmentId)
      .then(setData)
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, [studentQuizAssignmentId]);

  function chooseAnswer(questionId, selectedIndex) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedIndex,
    }));
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      setErr("");

      const payload = Object.entries(answers).map(([questionId, selectedIndex]) => ({
        questionId,
        selectedIndex,
      }));

      const res = await submitStudentQuizAssignment(studentQuizAssignmentId, payload);
      setResult(res);
    } catch (e) {
      setErr(String(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading quiz...</div>;
  if (err) return <div style={{ padding: 24, color: "crimson" }}>Error: {err}</div>;
  if (!data) return <div style={{ padding: 24 }}>No quiz found.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>{data.topic}</h1>
      <p>
        <strong>Subject:</strong> {data.subject} | <strong>Grade:</strong> {data.gradeLevel}
      </p>

      {data.isSubmitted && (
        <div style={{ marginBottom: 16, color: "#2563eb", fontWeight: 700 }}>
          This quiz has already been submitted.
        </div>
      )}

      {data.questions?.map((q, idx) => (
        <div
          key={q.question_id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            background: "#fff",
            color: "#000000",
          }}
        >
          <h3>
            Q{idx + 1}. {q.question_text}
          </h3>

          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {q.choices.map((choice, i) => (
              <label
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  padding: 10,
                  border: "1px solid #eee",
                  borderRadius: 8,
                  cursor: data.isSubmitted ? "not-allowed" : "pointer",
                  opacity: data.isSubmitted ? 0.7 : 1,
                }}
              >
                <input
                  type="radio"
                  name={q.question_id}
                  checked={answers[q.question_id] === i}
                  disabled={data.isSubmitted}
                  onChange={() => chooseAnswer(q.question_id, i)}
                />
                {choice}
              </label>
            ))}
          </div>
        </div>
      ))}

      {!data.isSubmitted && (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            background: "#f59e0b",
            color: "white",
            border: "none",
            padding: "12px 18px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {submitting ? "Submitting..." : "Submit Quiz"}
        </button>
      )}

      {result && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 12,
            background: "#ecfdf5",
            border: "1px solid #bbf7d0",
            color: "#000000",
          }}
        >
          <strong>Result:</strong> {result.score} / {result.maxScore}
        </div>
      )}
    </div>
  );
}