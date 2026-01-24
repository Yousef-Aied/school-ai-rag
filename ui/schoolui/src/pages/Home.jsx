import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const GRADES = [
  { label: "Grade 4", value: 4 },
  { label: "Grade 5", value: 5 },
  { label: "Grade 6", value: 6 },
  { label: "Grade 7", value: 7 },
  { label: "Grade 8", value: 8 },
  { label: "Grade 9", value: 9 },
  { label: "Grade 10", value: 10 },
  { label: "Grade 11", value: 11 },
  { label: "Grade 12", value: 12 },
];

const SUBJECTS = [
  { label: "Auto (recommended)", value: "auto" },
  { label: "Math", value: "math" },
  { label: "Physics", value: "physics" },
  { label: "Science", value: "science" },
  { label: "English", value: "english" },
];

export default function Home() {
  const navigate = useNavigate();

  const [grade, setGrade] = useState(() => Number(localStorage.getItem("student_grade") || 5));
  const [subject, setSubject] = useState(() => localStorage.getItem("student_subject") || "auto");

  useEffect(() => {
    localStorage.setItem("student_grade", String(grade));
    localStorage.setItem("student_subject", subject);
  }, [grade, subject]);

  function goChat() {
    navigate("/chat");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0f0f10",
        color: "#eaeaea",
      }}
    >
      <div
        style={{
          width: "min(520px, 92vw)",
          padding: 28,
          border: "1px solid #222",
          borderRadius: 18,
          background: "#121214",
          textAlign: "center",
        }}
      >
        {/* ===== Welcome Section ===== */}
        <h1 style={{ margin: 0, fontSize: 30 }}>Welcome to School AI</h1>
        <p style={{ opacity: 0.8, marginTop: 6 }}>
          Your smart study assistant
        </p>

        {/* ===== Settings Section ===== */}
        <div style={{ display: "grid", gap: 14, marginTop: 24, textAlign: "left" }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ opacity: 0.8 }}>Grade</span>
            <select
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              style={selectStyle}
            >
              {GRADES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ opacity: 0.8 }}>Subject</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={selectStyle}
            >
              {SUBJECTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          {/* ===== Action ===== */}
          <button onClick={goChat} style={btnStyle}>
            Start Chat
          </button>
        </div>
      </div>
    </div>
  );
}

const selectStyle = {
  padding: "12px 10px",
  borderRadius: 12,
  border: "1px solid #2a2a2e",
  background: "#0f0f10",
  color: "#eaeaea",
};

const btnStyle = {
  marginTop: 10,
  padding: "14px",
  borderRadius: 14,
  border: "1px solid #2a2a2e",
  background: "#1b1b1e",
  color: "#fff",
  cursor: "pointer",
  fontSize: 16,
};




// import { useNavigate } from "react-router-dom";

// export default function Home() {
//   const navigate = useNavigate();

//   return (
//     <div className="containerHome">
//       <h1>Welcome to School AI</h1>
//       <p>Your smart study assistant</p>

//       <button className="buttonChat" onClick={() => navigate("/chat")}>
//         Start Chat
//       </button>
//     </div>
//   );
// }
