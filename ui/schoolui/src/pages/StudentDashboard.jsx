import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { getStudentDashboard, getStudentQuizAssignments } from "../api";
import "./StudentDashboard.css";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const [quizAssignments, setQuizAssignments] = useState([]);

  useEffect(() => {
    getStudentDashboard(1)
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, []);

  useEffect(() => {
    getStudentQuizAssignments(1)
      .then(setQuizAssignments)
      .catch((e) => console.log(e));
  }, []);

  // hooks must remain above without early return
  const history = useMemo(() => data?.history ?? [], [data?.history]);

  const trend = useMemo(() => {
    if (history.length < 2) return 0;
    const first = history[0]?.examScore ?? 0;
    const last = history[history.length - 1]?.examScore ?? 0;
    return last - first; // Exam improvement/decline
  }, [history]);

  const latest = useMemo(() => {
    // Last value (if in history) otherwise from metrics
    const last = history[history.length - 1];
    return {
      attendance: last?.attendance ?? data?.metrics?.attendance ?? 0,
      examScore: last?.examScore ?? data?.metrics?.examScore ?? 0,
      studyHours: data?.metrics?.studyHours ?? 0,
      stressLevel: data?.metrics?.stressLevel ?? 0,
    };
  }, [data, history]);

  const bars = useMemo(() => {
    // only display the last 4 months
    return history.slice(-4).map((x) => ({
      date: x.date,
      examScore: x.examScore ?? 0,
    }));
  }, [history]);

  if (err) {
    return (
      <div className="sd-page">
        <div className="sd-wrap">Error: {err}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="sd-page">
        <div className="sd-wrap">Loading...</div>
      </div>
    );
  }

  // Circuit data
  const attendancePct = clamp(latest.attendance, 0, 100);
  const examPct = clamp(latest.examScore, 0, 100);

  // “Progress” as a percentage: If trend +10, it means approximately 10% (but display friendly)
  const progressPct = clamp(50 + trend, 0, 100);
  return (
    <div className="sd-page">
      {/* Topbar */}
      <div className="sd-topbar">
        <div className="sd-brand">
          <div className="sd-logo">🎓</div>
          <div>
            <h1>School AI</h1>
            <p>Student Dashboard</p>
          </div>
        </div>

        <div className="sd-actions">
          <div className="sd-pill">Student ID: {data.studentId}</div>
          <div className="sd-pill">Cluster: {data.cluster?.label}</div>
        </div>
      </div>

      {quizAssignments.length > 0 && (
        <div className="sd-alert">
          🔔 You have {quizAssignments.length} quiz
          {quizAssignments.length > 1 ? "es" : ""} to complete
          <button
            onClick={() => {
              navigate(
                `/student-quiz/${quizAssignments[0].studentQuizAssignmentId}`,
              );
            }}
          >
            Start Quiz
          </button>
        </div>
      )}

      <div className="sd-wrap">
        {/* KPIs */}
        <div className="sd-kpis">
          <Kpi title="Attendance" value={`${attendancePct}%`} />
          <Kpi title="Exam Score" value={latest.examScore} />
          <Kpi title="Study Hours" value={latest.studyHours} />
          <Kpi title="Stress" value={latest.stressLevel} />
        </div>

        {/* 2 columns */}
        <div className="sd-grid2">
          {/* Left big */}
          <div className="sd-main">
            <div className="sd-card">
              <div className="sd-card-h">Your Performance</div>
              <div className="sd-card-b">
                <div className="sd-radials">
                  <Radial
                    title="Attendance"
                    value={attendancePct}
                    color="#10b981"
                    track="#e7f7ef"
                  />
                  <Radial
                    title="Exam"
                    value={examPct}
                    color="#4f46e5"
                    track="#e9eafc"
                  />
                  <Radial
                    title="Progress"
                    value={progressPct}
                    sub={trend >= 0 ? `+${trend}` : `${trend}`}
                    color="#f59e0b"
                    track="#fff3db"
                  />
                </div>
              </div>
            </div>

            <div className="sd-card">
              <div className="sd-card-h">Exam in Last Months</div>
              <div className="sd-card-b">
                <div className="sd-chartBox">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bars}>
                      <defs>
                        <linearGradient
                          id="examGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#6d28d9" />
                          <stop offset="100%" stopColor="#4f46e5" />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar
                        dataKey="examScore"
                        fill="url(#examGrad)"
                        radius={[10, 10, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="sd-side">
            <div className="sd-card">
              <div className="sd-card-h">Quick Summary</div>
              <div className="sd-card-b">
                <div className="sd-badge">
                  Cluster: {data.cluster?.label} (ID: {data.cluster?.id})
                </div>

                <div className="sd-tip">
                  <div className="sd-tipTitle">Tip</div>
                  <div className="sd-tipText">
                    {attendancePct < 85
                      ? "Try to raise your attendance above 85%."
                      : "Great! Keep your attendance above 85%."}
                  </div>
                </div>

                <div className="sd-tip">
                  <div className="sd-tipTitle">Next Goal</div>
                  <div className="sd-tipText">
                    Increase Exam Score by +5 next month.
                  </div>
                </div>
              </div>
            </div>

            <div className="sd-card">
              <div className="sd-card-h">Recommendations</div>
              <div className="sd-card-b">
                <ul className="sd-list">
                  <li>Study 30–45 minutes daily.</li>
                  <li>Review weak topics twice a week.</li>
                  <li>Take short breaks to reduce stress.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ title, value }) {
  return (
    <div className="sd-kpi">
      <div className="label">{title}</div>
      <div className="value">{value}</div>
    </div>
  );
}

function Radial({ title, value, sub, color = "#6d28d9", track = "#e9eaf6" }) {
  const data = [{ name: title, value }];

  return (
    <div className="sd-radialCard">
      <div className="sd-rTitle">{title}</div>

      <div className="sd-rChart">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="72%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />

            {/* Background/Empty area */}
            <RadialBar
              dataKey="value"
              fill={track}
              background={{ fill: track }}
            />

            {/* colored part */}
            <RadialBar
              dataKey="value"
              fill={color}
              cornerRadius={999}
              background={{ fill: track }}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        <div className="sd-rCenter">
          <div className="sd-rValue">{value}%</div>
          {sub ? <div className="sd-rSub">{sub}</div> : null}
        </div>
      </div>
    </div>
  );
}

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, Number(x) || 0));
}
