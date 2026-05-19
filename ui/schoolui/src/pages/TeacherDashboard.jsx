import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

import { motion as Motion } from "framer-motion";

import {
  Brain,
  Users,
  AlertTriangle,
  Trophy,
  GraduationCap,
  Sparkles,
  ClipboardList,
  BookOpen,
  TrendingUp,
} from "lucide-react";

import {
  generateTeacherPredictions,
  getTeacherDashboard,
  createTeacherQuizAssignment,
} from "../api";

import "./TeacherDashboard.css";

const LEVEL_COLORS = {
  Weak: "#ef4444",
  Medium: "#f59e0b",
  Strong: "#22c55e",
  Unknown: "#9ca3af",
};

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loadingPred, setLoadingPred] = useState(false);

  const [quizForm, setQuizForm] = useState({
    grade: 8,
    subject: "Math",
    units: [],
    nQuestions: 10,
  });

  const [quizLoading, setQuizLoading] = useState(false);
  const [quizMessage, setQuizMessage] = useState("");
  const [quizError, setQuizError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const result = await getTeacherDashboard(1);
      setData(result);
    } catch (e) {
      setErr(String(e));
    }
  }

  const students = useMemo(() => data?.students || [], [data]);

  const strongCount = useMemo(() => {
    return students.filter((s) => s.level === "Strong").length;
  }, [students]);

  const mediumCount = useMemo(() => {
    return students.filter((s) => s.level === "Medium").length;
  }, [students]);

  const weakCount = useMemo(() => {
    return students.filter((s) => s.level === "Weak").length;
  }, [students]);

  const avgPrediction = useMemo(() => {
    if (!students.length) return 0;

    const total = students.reduce((sum, s) => sum + (s.predictedScore || 0), 0);

    return (total / students.length).toFixed(1);
  }, [students]);

  const avgAttendance = useMemo(() => {
    if (!students.length) return 0;

    const total = students.reduce((sum, s) => sum + (s.attendance || 0), 0);

    return (total / students.length).toFixed(1);
  }, [students]);

  const riskyStudents = useMemo(() => {
    return students.filter((s) => s.level === "Weak");
  }, [students]);

  const countData = useMemo(() => {
    return [
      {
        name: "Weak",
        value: weakCount,
        color: "#ef4444",
      },
      {
        name: "Medium",
        value: mediumCount,
        color: "#f59e0b",
      },
      {
        name: "Strong",
        value: strongCount,
        color: "#22c55e",
      },
    ];
  }, [weakCount, mediumCount, strongCount]);

  const chartData = useMemo(() => {
    return [
      {
        level: "Weak",
        attendance:
          students
            .filter((s) => s.level === "Weak")
            .reduce((a, b) => a + (b.attendance || 0), 0) / (weakCount || 1),
      },
      {
        level: "Medium",
        attendance:
          students
            .filter((s) => s.level === "Medium")
            .reduce((a, b) => a + (b.attendance || 0), 0) / (mediumCount || 1),
      },
      {
        level: "Strong",
        attendance:
          students
            .filter((s) => s.level === "Strong")
            .reduce((a, b) => a + (b.attendance || 0), 0) / (strongCount || 1),
      },
    ];
  }, [students, weakCount, mediumCount, strongCount]);

  const aiInsight = useMemo(() => {
    if (weakCount >= 5) {
      return "AI detected multiple students at risk due to low attendance and weak predictions.";
    }

    if (strongCount > weakCount) {
      return "Most students are progressing well this month.";
    }

    return "AI is analyzing classroom behavior and performance.";
  }, [weakCount, strongCount]);

  async function handleCreateQuizAssignment(e) {
    e.preventDefault();

    setQuizLoading(true);
    setQuizError("");
    setQuizMessage("");

    // ✅ Validation
    if (!quizForm.units.length) {
      setQuizError("Please select at least one unit");
      setQuizLoading(false);
      return;
    }

    try {
      const payload = {
        grade: quizForm.grade,
        subject: quizForm.subject,
        units: quizForm.units,
        nQuestions: Number(quizForm.nQuestions),
        studentIds: students.map((s) => s.studentId),
      };

      const result = await createTeacherQuizAssignment(1, payload);

      //`Quiz created and assigned to ${students.length} students`
      setQuizMessage(
        `Quiz assignment created successfully (#${result.assignmentId})`,
      );

      setQuizForm({
        ...quizForm,
        units: [],
      });
    } catch (e) {
      setQuizError(e.message);
    } finally {
      setQuizLoading(false);
    }
  }

  if (err) return <div>{err}</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div className="td-page">
      {/* NAVBAR */}
      <div className="td-navbar">
        <div className="td-navbar-left">
          <div className="td-logo">
            <GraduationCap size={22} />
          </div>

          <div>
            <h2>DerasaX</h2>
            <p>Teacher AI Dashboard</p>
          </div>
        </div>

        <div className="td-navbar-right">
          <div className="td-ai-pill">
            <Sparkles size={16} />
            AI Classroom Analytics
          </div>
        </div>
      </div>

      <div className="td-container">
        {/* HERO */}
        <div className="td-hero">
          <div>
            <h1>Welcome back, Teacher 👋</h1>

            <p>
              AI analyzed classroom performance and generated student insights.
            </p>

            <div className="td-hero-stats">
              <span>{students.length} Students</span>
              <span>{weakCount} At Risk</span>
              <span>{strongCount} Strong Students</span>
            </div>
          </div>

          <button
            className="td-generate-btn"
            onClick={async () => {
              setLoadingPred(true);
              await generateTeacherPredictions(1);
              await loadDashboard();
              setLoadingPred(false);
            }}
          >
            {loadingPred ? "Generating..." : "Generate AI Predictions"}
          </button>
        </div>

        {/* AI ALERT */}
        <div className="td-ai-alert">
          <Brain size={18} />
          {aiInsight}
        </div>

        {/* KPI */}
        <div className="td-kpi-grid">
          <KpiCard
            icon={<Users size={20} />}
            title="Students"
            value={students.length}
          />

          <KpiCard
            icon={<AlertTriangle size={20} />}
            title="At Risk"
            value={weakCount}
            danger
          />

          <KpiCard
            icon={<Trophy size={20} />}
            title="Strong Students"
            value={strongCount}
            success
          />

          <KpiCard
            icon={<TrendingUp size={20} />}
            title="Avg Prediction"
            value={`${avgPrediction}%`}
          />

          <KpiCard
            icon={<ClipboardList size={20} />}
            title="Avg Attendance"
            value={`${avgAttendance}%`}
          />
        </div>

        {/* CHARTS */}
        <div className="td-chart-grid">
          {/* PIE */}
          <div className="td-card">
            <div className="td-card-header">
              <h3>Students By Level</h3>
              <p>Weak / Medium / Strong distribution</p>
            </div>

            <div className="td-chart-box">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={countData}
                    dataKey="value"
                    innerRadius={70}
                    outerRadius={100}
                  >
                    {countData.map((x, i) => (
                      <Cell key={i} fill={x.color} />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BAR */}
          <div className="td-card">
            <div className="td-card-header">
              <h3>Attendance Analytics</h3>
              <p>Average attendance by level</p>
            </div>

            <div className="td-chart-box">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="level" />

                  <YAxis />

                  <Tooltip />

                  <Legend />

                  <Bar
                    dataKey="attendance"
                    fill="#0f9ba8"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="td-main-grid">
          {/* LEFT */}
          <div className="td-left">
            {/* RISK STUDENTS */}
            <div className="td-card">
              <div className="td-card-header">
                <h3>At Risk Students</h3>
                <p>Students requiring immediate attention</p>
              </div>

              <div className="td-risk-grid">
                {riskyStudents.slice(0, 6).map((s) => (
                  <div key={s.studentId} className="td-risk-card">
                    <div className="td-risk-top">
                      <div className="td-risk-avatar">
                        {s.fullName?.charAt(0)}
                      </div>

                      <span className="td-risk-badge">Weak</span>
                    </div>

                    <h4>{s.fullName}</h4>

                    <div className="td-risk-info">
                      <span>Attendance: {s.attendance ?? 0}%</span>

                      <span>Prediction: {s.predictedScore ?? 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TABLE */}
            <div className="td-card">
              <div className="td-card-header">
                <h3>Students Overview</h3>
                <p>AI-powered classroom monitoring</p>
              </div>

              <div className="td-table-wrap">
                <table className="td-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Attendance</th>
                      <th>Study Hours</th>
                      <th>Prediction</th>
                      <th>Level</th>
                    </tr>
                  </thead>

                  <tbody>
                    {students.map((s) => (
                      <tr key={s.studentId}>
                        <td>{s.fullName}</td>

                        <td>{s.attendance ?? 0}%</td>

                        <td>{s.studyHours ?? 0}</td>

                        <td>{s.predictedScore ?? 0}</td>

                        <td>
                          <span
                            className={`td-level ${s.level?.toLowerCase()}`}
                          >
                            {s.level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="td-right">
            {/* QUIZ CREATOR */}
            <div className="td-card">
              <div className="td-card-header">
                <h3>Create AI Quiz</h3>
                <p>Generate personalized classroom quiz</p>
              </div>
              
              <form className="td-form" onSubmit={handleCreateQuizAssignment}>
                {/* SUBJECT */}
                <select
                  value={quizForm.subject}
                  onChange={(e) =>
                    setQuizForm({
                      ...quizForm,
                      subject: e.target.value,
                    })
                  }
                >
                  <option>Math</option>
                  <option>Science</option>
                  <option>Physics</option>
                </select>

                {/* GRADE */}
                <select
                  value={quizForm.grade}
                  onChange={(e) =>
                    setQuizForm({
                      ...quizForm,
                      grade: Number(e.target.value),
                    })
                  }
                >
                  <option value={6}>Grade 6</option>
                  <option value={7}>Grade 7</option>
                  <option value={8}>Grade 8</option>
                  <option value={9}>Grade 9</option>
                  <option value={10}>Grade 10</option>
                  <option value={11}>Grade 11</option>
                  <option value={12}>Grade 12</option>
                </select>

                {/* UNITS */}
                <div className="td-units">
                  <label>Select Units</label>

                  <div className="td-units-grid">
                    {[1, 2, 3, 4, 5].map((u) => (
                      <label
                        key={u}
                        className={`td-unit-item ${
                          quizForm.units.includes(u) ? "active" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={quizForm.units.includes(u)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setQuizForm({
                                ...quizForm,
                                units: [...quizForm.units, u],
                              });
                            } else {
                              setQuizForm({
                                ...quizForm,
                                units: quizForm.units.filter((x) => x !== u),
                              });
                            }
                          }}
                        />

                        <span>Unit {u}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* QUESTIONS */}
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={quizForm.nQuestions}
                  onChange={(e) =>
                    setQuizForm({
                      ...quizForm,
                      nQuestions: e.target.value,
                    })
                  }
                />

                <button type="submit" disabled={quizLoading}>
                  {quizLoading ? "Creating..." : "Generate Quiz"}
                </button>

                {quizMessage && <div className="td-success">{quizMessage}</div>}

                {quizError && <div className="td-error">{quizError}</div>}
              </form>
            </div>

            {/* AI INSIGHTS */}
            <div className="td-card">
              <div className="td-card-header">
                <h3>AI Insights</h3>
                <p>Generated automatically</p>
              </div>

              <div className="td-insights">
                <Insight
                  title="Attendance Pattern"
                  text="Students with higher attendance show stronger predictions."
                />

                <Insight
                  title="Weak Topic Detected"
                  text="Grade 8 students struggle with mathematics integration."
                />

                <Insight
                  title="AI Recommendation"
                  text="Assign additional quizzes for weak students."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, title, value, danger, success }) {
  return (
    <Motion.div
      whileHover={{ y: -5 }}
      className={`td-kpi-card ${danger ? "danger" : success ? "success" : ""}`}
    >
      <div className="td-kpi-icon">{icon}</div>

      <div>
        <div className="td-kpi-title">{title}</div>
        <div className="td-kpi-value">{value}</div>
      </div>
    </Motion.div>
  );
}

function Insight({ title, text }) {
  return (
    <div className="td-insight-item">
      <div className="td-insight-dot" />

      <div>
        <h4>{title}</h4>
        <p>{text}</p>
      </div>
    </div>
  );
}
