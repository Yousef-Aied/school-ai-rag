import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { motion as Motion } from "framer-motion";
import {
  BookOpen,
  Brain,
  CalendarDays,
  GraduationCap,
  Sparkles,
  Trophy,
  Clock3,
  CircleCheckBig,
} from "lucide-react";

import { getStudentDashboard, getStudentQuizAssignments } from "../api";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";

import "./StudentDashboard.css";
export default function StudentDashboard() {
  const [params] = useSearchParams();
  const studentId = Number(params.get("studentId")) || 1;

  const [data, setData] = useState(null);
  const [quizAssignments, setQuizAssignments] = useState([]);
  const [err, setErr] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    getStudentDashboard(studentId)
      .then(setData)
      .catch((e) => setErr(String(e)));

    getStudentQuizAssignments(studentId)
      .then(setQuizAssignments)
      .catch((e) => console.log(e));
  }, [studentId]);

  const history = useMemo(() => data?.history ?? [], [data]);

  const latest = useMemo(() => {
    const last = history[history.length - 1];

    return {
      attendance: last?.attendance ?? data?.metrics?.attendancePercentage ?? 0,
      examScore: last?.examScore ?? data?.metrics?.examScore ?? 0,
      studyHours: data?.metrics?.studyHours ?? 0,
    };
  }, [data, history]);

  const performanceData = useMemo(() => {
    return history.map((x) => ({
      month: x.date,
      score: x.examScore,
    }));
  }, [history]);

  if (err) {
    return <div className="sd-page">{err}</div>;
  }

  if (!data) {
    return <div className="sd-loading">Loading Dashboard...</div>;
  }

  return (
    <div className="sd-page">
      {/* Navbar */}
      <div className="sd-navbar">
        <div className="sd-navbar-left">
          <div className="sd-logo">
            <GraduationCap size={22} />
          </div>

          <div>
            <h2>DerasaX</h2>
            <p>AI Learning Platform</p>
          </div>
        </div>

        <div className="sd-navbar-right">
          <div className="sd-level">
            <Sparkles size={16} />
            {data.prediction?.level}
          </div>
        </div>
      </div>

      <div className="sd-container">
        {/* Hero */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sd-hero"
        >
          <div>
            <h1>Welcome back, {data.studentName}</h1>
            <p>Here’s your personalized AI-powered learning journey today.</p>
          </div>

          <div className="sd-ai-badge">
            <Brain size={18} />
            AI Personalized Learning
          </div>
        </Motion.div>

        {/* AI Recommendation */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sd-ai-card"
        >
          <div className="sd-ai-content">
            <div>
              <div className="sd-ai-title">
                <Sparkles size={18} />
                AI Recommended For You
              </div>

              <h2>Introduction to Calculus</h2>

              <p>
                Based on your recent performance and quiz analysis, AI detected
                that you need more practice in calculus fundamentals.
              </p>

              <div className="sd-ai-progress-wrap">
                <div className="sd-progress-label">
                  <span>Progress</span>
                  <span>55%</span>
                </div>

                <div className="sd-progress-bar">
                  <div className="sd-progress-fill" />
                </div>
              </div>
            </div>

            <button className="sd-primary-btn">Continue Learning</button>
          </div>
        </Motion.div>

        {/* Stats */}
        <div className="sd-stats-grid">
          <StatCard
            icon={<CircleCheckBig size={18} />}
            title="Attendance"
            value={`${latest.attendance}%`}
          />

          <StatCard
            icon={<Trophy size={18} />}
            title="Exam Score"
            value={latest.examScore}
          />

          <StatCard
            icon={<Clock3 size={18} />}
            title="Study Hours"
            value={latest.studyHours}
          />

          <StatCard
            icon={<Brain size={18} />}
            title="AI Prediction"
            value={data.prediction?.predictedScore}
          />
        </div>

        {/* Main Layout */}
        <div className="sd-main-grid">
          {/* Left */}
          <div className="sd-left">
            {/* Analytics */}
            <div className="sd-card">
              <div className="sd-card-header">
                <div>
                  <h3>Performance Analytics</h3>
                  <p>Your exam performance in recent months</p>
                </div>
              </div>

              <div className="sd-chart-wrap">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient
                        id="colorScore"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#0f9ba8"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#0f9ba8"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} />

                    <XAxis dataKey="month" />

                    <Tooltip />

                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#0f9ba8"
                      fillOpacity={1}
                      fill="url(#colorScore)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Assigned Quizzes */}
            <div className="sd-card">
              <div className="sd-card-header">
                <div>
                  <h3>Assigned Quizzes</h3>
                  <p>Complete your pending quizzes</p>
                </div>
              </div>

              <div className="sd-quiz-grid">
                {quizAssignments.map((quiz) => (
                  <div
                    key={quiz.studentQuizAssignmentId}
                    className="sd-quiz-card"
                  >
                    <div className="sd-quiz-top">
                      <div className="sd-quiz-icon">
                        <BookOpen size={18} />
                      </div>

                      <span className="sd-quiz-status">Pending</span>
                    </div>

                    <h4>{quiz.topic || "AI Quiz"}</h4>

                    <p>
                      Personalized quiz generated based on your recent learning
                      behavior.
                    </p>

                    <div className="sd-quiz-footer">
                      <div>
                        <CalendarDays size={14} />
                        20 Questions
                      </div>
                      <button
                        onClick={() =>
                          navigate(
                            `/student-quiz/${quiz.studentQuizAssignmentId}?studentId=${studentId}`,
                          )
                        }
                      >
                        Start Quiz
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="sd-right">
            {/* AI Insights */}
            <div className="sd-card">
              <div className="sd-card-header">
                <div>
                  <h3>AI Insights</h3>
                  <p>Generated from your behavior analysis</p>
                </div>
              </div>

              <div className="sd-insights-list">
                {data?.prediction?.insights?.map((i, idx) => (
                  <Insight key={idx} title={i.title} text={i.text} />
                ))}
              </div>
            </div>

            {/* Learning Streak */}
            <div className="sd-card">
              <div className="sd-card-header">
                <div>
                  <h3>Learning Progress</h3>
                  <p>Your weekly learning activity</p>
                </div>
              </div>

              <div className="sd-streak-box">
                <div className="sd-streak-number">5</div>
                <div className="sd-streak-text">Days in a row</div>

                <div className="sd-week-row">
                  <div className="active">S</div>
                  <div className="active">M</div>
                  <div className="active">T</div>
                  <div className="active">W</div>
                  <div>T</div>
                  <div>F</div>
                  <div>S</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <Motion.div whileHover={{ y: -4 }} className="sd-stat-card">
      <div className="sd-stat-icon">{icon}</div>

      <div>
        <div className="sd-stat-title">{title}</div>
        <div className="sd-stat-value">{value}</div>
      </div>
    </Motion.div>
  );
}

function Insight({ title, text }) {
  return (
    <div className="sd-insight-item">
      <div className="sd-insight-dot" />

      <div>
        <h4>{title}</h4>
        <p>{text}</p>
      </div>
    </div>
  );
}
