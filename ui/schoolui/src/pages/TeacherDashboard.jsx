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
import {
  generateTeacherPredictions,
  getTeacherDashboard,
  createTeacherQuizAssignment,
} from "../api";
import "./TeacherDashboard.css";

const CLUSTER_COLORS = ["#2563eb", "#06b6d4", "#a855f7", "#22c55e", "#f59e0b"];

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loadingPred, setLoadingPred] = useState(false);

  const [quizForm, setQuizForm] = useState({
    grade: 8,
    subject: "Math",
    topic: "",
    nQuestions: 10,
    studentIds: [],
  });

  const [quizLoading, setQuizLoading] = useState(false);
  const [quizMessage, setQuizMessage] = useState("");
  const [quizError, setQuizError] = useState("");

  useEffect(() => {
    getTeacherDashboard(1)
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, []);

  const clusterCounts = useMemo(() => data?.clusterCounts ?? [], [data]);
  const avgByCluster = useMemo(() => data?.avgExamByCluster ?? [], [data]);

  const countData = useMemo(() => {
    return clusterCounts.map((x, i) => ({
      name: x.cluster ?? `Cluster ${i + 1}`,
      value: Number(x.count ?? 0),
      color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
    }));
  }, [clusterCounts]);

  const totalStudentsInClusters = useMemo(() => {
    return countData.reduce((s, x) => s + (x.value || 0), 0);
  }, [countData]);

  const listData = useMemo(() => {
    const total = totalStudentsInClusters || 1;
    return countData
      .map((x) => ({
        ...x,
        pct: Math.round(((x.value || 0) / total) * 1000) / 10,
      }))
      .sort((a, b) => (b.value || 0) - (a.value || 0));
  }, [countData, totalStudentsInClusters]);

  const resultsData = useMemo(() => {
    return avgByCluster.map((x, i) => ({
      cluster: x.cluster ?? `Cluster ${i + 1}`,
      exam: Number(x.avgExam ?? 0),
      attendance: Number(x.avgAttendance ?? 0),
    }));
  }, [avgByCluster]);

  const avgExamOverall = useMemo(() => {
    if (!resultsData.length) return 0;
    return Math.round(
      resultsData.reduce((a, b) => a + (b.exam || 0), 0) / resultsData.length
    );
  }, [resultsData]);

  const avgAttendanceOverall = useMemo(() => {
    if (!resultsData.length) return 0;
    return Math.round(
      resultsData.reduce((a, b) => a + (b.attendance || 0), 0) / resultsData.length
    );
  }, [resultsData]);

  const bestClusterByExam = useMemo(() => {
    if (!resultsData.length) return null;
    return resultsData.reduce((best, cur) => (cur.exam > best.exam ? cur : best));
  }, [resultsData]);

  const bestClusterByAttendance = useMemo(() => {
    if (!resultsData.length) return null;
    return resultsData.reduce((best, cur) =>
      cur.attendance > best.attendance ? cur : best
    );
  }, [resultsData]);

  async function handleCreateQuizAssignment(e) {
    e.preventDefault();
    setQuizLoading(true);
    setQuizError("");
    setQuizMessage("");

    try {
      const payload = {
        grade: quizForm.grade,
        subject: quizForm.subject,
        topic: quizForm.topic.trim(),
        nQuestions: Number(quizForm.nQuestions),
        studentIds: [1, 2, 3]
        // studentIds:
        //   quizForm.studentIds.length > 0
        //     ? quizForm.studentIds
        //     : (data?.studentsOverview || []).map((s) => s.studentId),
      };

      if (!payload.topic) {
        throw new Error("Please enter a topic");
      }

      if (!payload.studentIds.length) {
        throw new Error("No students found to assign the quiz to");
      }

      const result = await createTeacherQuizAssignment(1, payload);

      setQuizMessage(
        `Quiz created successfully. Assignment ID: ${result.assignmentId}, assigned students: ${result.assignedStudents}`
      );

      setQuizForm((prev) => ({
        ...prev,
        topic: "",
        nQuestions: 10,
      }));
    } catch (e) {
      setQuizError(e.message || "Failed to create quiz assignment");
    } finally {
      setQuizLoading(false);
    }
  }

  if (err) {
    return (
      <div className="td-page">
        <div className="td-wrap">Error: {err}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="td-page">
        <div className="td-wrap">Loading...</div>
      </div>
    );
  }

  return (
    <div className="td-page">
      <div className="td-topbar">
        <div className="td-brand">
          <div className="td-logo">🎓</div>
          <div>
            <h1>School AI</h1>
            <p>Teacher Performance Dashboard</p>
          </div>
        </div>

        <div className="td-actions">
          <div className="td-pill">Teacher ID: {data.teacherId}</div>
          <button
            className="td-pill"
            onClick={async () => {
              setLoadingPred(true);
              try {
                await generateTeacherPredictions(1);
                const fresh = await getTeacherDashboard(1);
                setData(fresh);
              } finally {
                setLoadingPred(false);
              }
            }}
          >
            {loadingPred ? "Generating..." : "Generate Predictions"}
          </button>

          <div className="td-pill">Last updated: just now</div>
        </div>
      </div>

      <div className="td-wrap">
        <div className="td-grid">
          <div className="td-card td-filter">
            <div style={{ fontWeight: 800 }}>Filters</div>

            <select className="td-select" defaultValue="2025/2026">
              <option value="2025/2026">2025/2026</option>
              <option value="2024/2025">2024/2025</option>
            </select>

            <select className="td-select" defaultValue="All Grades">
              <option value="All Grades">All Grades</option>
              <option value="Grade 4">Grade 4</option>
              <option value="Grade 5">Grade 5</option>
              <option value="Grade 6">Grade 6</option>
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>
          </div>

          <div className="td-main">
            <div className="td-card">
              <div className="td-card-h">Create Quiz Assignment</div>
              <div className="td-card-b">
                <form onSubmit={handleCreateQuizAssignment} className="td-quizForm">
                  <div className="td-quizGrid">
                    <select
                      className="td-select"
                      value={quizForm.grade}
                      onChange={(e) =>
                        setQuizForm({ ...quizForm, grade: Number(e.target.value) })
                      }
                    >
                      <option value={4}>Grade 4</option>
                      <option value={5}>Grade 5</option>
                      <option value={6}>Grade 6</option>
                      <option value={7}>Grade 7</option>
                      <option value={8}>Grade 8</option>
                      <option value={9}>Grade 9</option>
                      <option value={10}>Grade 10</option>
                      <option value={11}>Grade 11</option>
                      <option value={12}>Grade 12</option>
                    </select>

                    <select
                      className="td-select"
                      value={quizForm.subject}
                      onChange={(e) =>
                        setQuizForm({ ...quizForm, subject: e.target.value })
                      }
                    >
                      <option value="Math">Math</option>
                      <option value="Science">Science</option>
                      <option value="English">English</option>
                      <option value="Arabic">Arabic</option>
                    </select>

                    <input
                      className="td-select"
                      type="text"
                      placeholder="Topic"
                      value={quizForm.topic}
                      onChange={(e) =>
                        setQuizForm({ ...quizForm, topic: e.target.value })
                      }
                    />

                    <input
                      className="td-select"
                      type="number"
                      min="1"
                      max="20"
                      value={quizForm.nQuestions}
                      onChange={(e) =>
                        setQuizForm({
                          ...quizForm,
                          nQuestions: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="td-quizActions">
                    <button type="submit" className="td-pill" id="QuizStudents" disabled={quizLoading}>
                      {quizLoading ? "Sending..." : "Send Quiz to Students"}
                    </button>

                    {quizMessage && (
                      <span className="td-quizSuccess">{quizMessage}</span>
                    )}
                    {quizError && <span className="td-quizError">{quizError}</span>}
                  </div>
                </form>
              </div>
            </div>

            <div className="td-card">
              <div className="td-kpis">
                <div className="td-kpi">
                  <div className="label">Student Count</div>
                  <div className="value">{data.studentCount}</div>
                </div>

                <div className="td-kpi">
                  <div className="label">At-risk Students</div>
                  <div className="value">{(data.atRiskStudents || []).length}</div>
                </div>

                <div className="td-kpi">
                  <div className="label">Clusters</div>
                  <div className="value">{clusterCounts.length}</div>
                </div>

                <div className="td-kpi td-kpiPurple">
                  <div className="label">Average Exam</div>
                  <div className="value">{avgExamOverall}%</div>
                </div>

                <div className="td-kpi td-kpiGreen">
                  <div className="label">Average Attendance</div>
                  <div className="value">{avgAttendanceOverall}%</div>
                </div>
              </div>
            </div>

            <div className="td-stack">
              <div className="td-card td-clusterCard">
                <div className="td-card-h td-card-hRow">
                  <div>Student Count</div>
                  <div className="td-chipRow">
                    <span className="td-chip">Cluster</span>
                    <span className="td-chip">Summary</span>
                  </div>
                </div>

                <div className="td-card-b">
                  <div className="td-clusterLayout">
                    <div className="td-donutBox">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={countData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={90}
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={countData.length > 1 ? 3 : 0}
                            cornerRadius={12}
                            stroke="#f4f6ff"
                            strokeWidth={6}
                          >
                            {countData.map((x, idx) => (
                              <Cell key={`${x.name}-${idx}`} fill={x.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="td-donutCenter">
                        <div className="td-donutPct">
                          {totalStudentsInClusters ? "100%" : "0%"}
                        </div>
                        <div className="td-donutSub">TOTAL</div>
                      </div>
                    </div>

                    <div className="td-clusterList">
                      {listData.length === 0 ? (
                        <div style={{ color: "#6b7280" }}>No cluster data</div>
                      ) : (
                        listData.map((x, idx) => (
                          <div className="td-clusterRow" key={`${x.name}-${idx}`}>
                            <div className="td-clusterLeft">
                              <span
                                className="td-dot"
                                style={{ background: x.color }}
                              />
                              <span className="td-clusterName">{x.name}</span>
                            </div>

                            <div className="td-clusterMid">
                              <div className="td-barBg">
                                <div
                                  className="td-barFill"
                                  style={{
                                    width: `${Math.min(100, Math.max(0, x.pct))}%`,
                                    background: x.color,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="td-clusterRight">
                              <div className="td-pct">{x.pct}%</div>
                              <div className="td-count">{x.value}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="td-card">
                <div className="td-card-h td-card-hRow">
                  <div>Examination Results</div>
                  <div className="td-chipRow">
                    <span className="td-chip">Exam</span>
                    <span className="td-chip">Attendance</span>
                  </div>
                </div>

                <div className="td-card-b">
                  <div className="td-chartBox td-chartWide">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={resultsData} barCategoryGap={24}>
                        <defs>
                          <linearGradient id="examGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6d28d9" />
                            <stop offset="100%" stopColor="#4f46e5" />
                          </linearGradient>

                          <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" />
                            <stop offset="100%" stopColor="#16a34a" />
                          </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="cluster" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />

                        <Bar
                          dataKey="exam"
                          name="Exam"
                          fill="url(#examGrad)"
                          radius={[10, 10, 0, 0]}
                        />
                        <Bar
                          dataKey="attendance"
                          name="Attendance"
                          fill="url(#attGrad)"
                          radius={[10, 10, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <div className="td-card">
              <div className="td-card-h">At-risk Students</div>
              <div className="td-card-b">
                <table className="td-table">
                  <thead>
                    <tr>
                      <th>StudentId</th>
                      <th>Cluster</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.atRiskStudents || []).length === 0 ? (
                      <tr>
                        <td colSpan={2}>No at-risk students</td>
                      </tr>
                    ) : (
                      data.atRiskStudents.map((s, i) => (
                        <tr key={i}>
                          <td>{s.studentId ?? s.StudentId}</td>
                          <td>{s.clusterLabel ?? s.cluster ?? s.ClusterLabel}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="td-card">
              <div className="td-card-h">All Students</div>
              <div className="td-card-b">
                <table className="td-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Grade</th>
                      <th>Exam</th>
                      <th>Attendance</th>
                      <th>StudyHours</th>
                      <th>Stress</th>
                      <th>Cluster</th>
                      <th>RecordedAt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.studentsOverview || []).length === 0 ? (
                      <tr>
                        <td colSpan={9}>No students data</td>
                      </tr>
                    ) : (
                      data.studentsOverview.map((s) => (
                        <tr key={s.studentId}>
                          <td>{s.studentId}</td>
                          <td>{s.fullName}</td>
                          <td>{s.gradeLevel}</td>
                          <td>{s.examScore ?? "—"}</td>
                          <td>{s.attendance ?? "—"}</td>
                          <td>{s.studyHours ?? "—"}</td>
                          <td>{s.stressLevel ?? "—"}</td>
                          <td>{s.clusterLabel ?? "No prediction"}</td>
                          <td>{s.recordedAt ? String(s.recordedAt).slice(0, 10) : "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="td-right">
            <div className="td-card">
              <div className="td-card-h">Highlights</div>

              <div className="td-mini">
                <div className="td-avatar td-avatarGreen" />
                <div>
                  <div className="name">Best Cluster (Attendance)</div>
                  <div className="sub">
                    {bestClusterByAttendance
                      ? `${bestClusterByAttendance.cluster} • ${Math.round(
                          bestClusterByAttendance.attendance ??
                            bestClusterByAttendance.avgAttendance ??
                            0
                        )}%`
                      : "—"}
                  </div>
                </div>
              </div>

              <div className="td-mini">
                <div className="td-avatar td-avatarPurple" />
                <div>
                  <div className="name">Best Cluster (Exam)</div>
                  <div className="sub">
                    {bestClusterByExam
                      ? `${bestClusterByExam.cluster} • ${Math.round(
                          bestClusterByExam.exam ?? bestClusterByExam.avgExam ?? 0
                        )}%`
                      : "—"}
                  </div>
                </div>
              </div>

              <div className="td-mini">
                <div className="td-avatar" />
                <div>
                  <div className="name">Most Improved</div>
                  <div className="sub">Plug from DB later (needs history)</div>
                </div>
              </div>
            </div>

            <div className="td-card">
              <div className="td-card-h">Notes</div>
              <div className="td-card-b" style={{ color: "#6b7280" }}>
                Later we’ll plug real highlights from the database: top students,
                improvements, and behavior recommendations.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






// import { useEffect, useMemo, useState } from "react";
// import {
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   Tooltip,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Legend,
// } from "recharts";
// import { generateTeacherPredictions, getTeacherDashboard } from "../api";
// import "./TeacherDashboard.css";

// const CLUSTER_COLORS = ["#2563eb", "#06b6d4", "#a855f7", "#22c55e", "#f59e0b"];



// export default function TeacherDashboard() {
//   const [data, setData] = useState(null);
//   const [err, setErr] = useState("");
//   const [loadingPred, setLoadingPred] = useState(false);

//   useEffect(() => {
//     getTeacherDashboard(1)
//       .then(setData)
//       .catch((e) => setErr(String(e)));
//   }, []);

//   const clusterCounts = useMemo(() => data?.clusterCounts ?? [], [data]);
//   const avgByCluster = useMemo(() => data?.avgExamByCluster ?? [], [data]);

//   // ---- Student Count card data (donut + list) ----
//   const countData = useMemo(() => {
//     return clusterCounts.map((x, i) => ({
//       name: x.cluster ?? `Cluster ${i + 1}`,
//       value: Number(x.count ?? 0),
//       color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
//     }));
//   }, [clusterCounts]);

//   const totalStudentsInClusters = useMemo(() => {
//     return countData.reduce((s, x) => s + (x.value || 0), 0);
//   }, [countData]);

//   const listData = useMemo(() => {
//     const total = totalStudentsInClusters || 1;
//     return countData
//       .map((x) => ({
//         ...x,
//         pct: Math.round(((x.value || 0) / total) * 1000) / 10, // 1 decimal
//       }))
//       .sort((a, b) => (b.value || 0) - (a.value || 0));
//   }, [countData, totalStudentsInClusters]);

//   // ---- Results card data (Exam vs Attendance bars) ----
//   const resultsData = useMemo(() => {
//     return avgByCluster.map((x, i) => ({
//       cluster: x.cluster ?? `Cluster ${i + 1}`,
//       exam: Number(x.avgExam ?? 0),
//       attendance: Number(x.avgAttendance ?? 0),
//     }));
//   }, [avgByCluster]);

//   const avgExamOverall = useMemo(() => {
//     if (!resultsData.length) return 0;
//     return Math.round(
//       resultsData.reduce((a, b) => a + (b.exam || 0), 0) / resultsData.length,
//     );
//   }, [resultsData]);

//   const avgAttendanceOverall = useMemo(() => {
//     if (!resultsData.length) return 0;
//     return Math.round(
//       resultsData.reduce((a, b) => a + (b.attendance || 0), 0) /
//         resultsData.length,
//     );
//   }, [resultsData]);

//   const bestClusterByExam = useMemo(() => {
//     if (!resultsData.length) return null;
//     return resultsData.reduce((best, cur) =>
//       cur.exam > best.exam ? cur : best,
//     );
//   }, [resultsData]);

//   const bestClusterByAttendance = useMemo(() => {
//     if (!resultsData.length) return null;
//     return resultsData.reduce((best, cur) =>
//       cur.attendance > best.attendance ? cur : best,
//     );
//   }, [resultsData]);

//   if (err) {
//     return (
//       <div className="td-page">
//         <div className="td-wrap">Error: {err}</div>
//       </div>
//     );
//   }

//   if (!data) {
//     return (
//       <div className="td-page">
//         <div className="td-wrap">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="td-page">
//       {/* Topbar */}
//       <div className="td-topbar">
//         <div className="td-brand">
//           <div className="td-logo">🎓</div>
//           <div>
//             <h1>School AI</h1>
//             <p>Teacher Performance Dashboard</p>
//           </div>
//         </div>

//         <div className="td-actions">
//           <div className="td-pill">Teacher ID: {data.teacherId}</div>
//           <button
//             className="td-pill"
//             onClick={async () => {
//               setLoadingPred(true);
//               try {
//                 await generateTeacherPredictions(1);
//                 const fresh = await getTeacherDashboard(1);
//                 setData(fresh);
//               } finally {
//                 setLoadingPred(false);
//               }
//             }}
//           >
//             {loadingPred ? "Generating..." : "Generate Predictions"}
//           </button>

//           <div className="td-pill">Last updated: just now</div>
//         </div>
//       </div>

//       <div className="td-wrap">
//         <div className="td-grid">
//           {/* Left Filters */}
//           <div className="td-card td-filter">
//             <div style={{ fontWeight: 800 }}>Filters</div>

//             <select className="td-select" defaultValue="2025/2026">
//               <option value="2025/2026">2025/2026</option>
//               <option value="2024/2025">2024/2025</option>
//             </select>

//             <select className="td-select" defaultValue="All Grades">
//               <option value="All Grades">All Grades</option>
//               <option value="Grade 4">Grade 4</option>
//               <option value="Grade 5">Grade 5</option>
//               <option value="Grade 6">Grade 6</option>
//               <option value="Grade 7">Grade 7</option>
//               <option value="Grade 8">Grade 8</option>
//               <option value="Grade 9">Grade 9</option>
//               <option value="Grade 10">Grade 10</option>
//               <option value="Grade 11">Grade 11</option>
//               <option value="Grade 12">Grade 12</option>
//             </select>
//           </div>

//           {/* Middle */}
//           <div className="td-main">
//             {/* KPI Row */}
//             <div className="td-card">
//               <div className="td-kpis">
//                 <div className="td-kpi">
//                   <div className="label">Student Count</div>
//                   <div className="value">{data.studentCount}</div>
//                 </div>

//                 <div className="td-kpi">
//                   <div className="label">At-risk Students</div>
//                   <div className="value">
//                     {(data.atRiskStudents || []).length}
//                   </div>
//                 </div>

//                 <div className="td-kpi">
//                   <div className="label">Clusters</div>
//                   <div className="value">{clusterCounts.length}</div>
//                 </div>

//                 <div className="td-kpi td-kpiPurple">
//                   <div className="label">Average Exam</div>
//                   <div className="value">{avgExamOverall}%</div>
//                 </div>

//                 <div className="td-kpi td-kpiGreen">
//                   <div className="label">Average Attendance</div>
//                   <div className="value">{avgAttendanceOverall}%</div>
//                 </div>
//               </div>
//             </div>

//             <div className="td-stack">
//               {/* Card 1: Student Count (Donut + List) */}
//               <div className="td-card td-clusterCard">
//                 <div className="td-card-h td-card-hRow">
//                   <div>Student Count</div>
//                   <div className="td-chipRow">
//                     <span className="td-chip">Cluster</span>
//                     <span className="td-chip">Summary</span>
//                   </div>
//                 </div>

//                 <div className="td-card-b">
//                   <div className="td-clusterLayout">
//                     {/* Donut */}
//                     <div className="td-donutBox">
//                       <ResponsiveContainer width="100%" height="100%">
//                         <PieChart>
//                           <Pie
//                             data={countData}
//                             dataKey="value"
//                             nameKey="name"
//                             innerRadius={60}
//                             outerRadius={90}
//                             startAngle={90}
//                             endAngle={-270}
//                             paddingAngle={countData.length > 1 ? 3 : 0}
//                             cornerRadius={12}
//                             stroke="#f4f6ff"
//                             strokeWidth={6}
//                           >
//                             {countData.map((x, idx) => (
//                               <Cell key={`${x.name}-${idx}`} fill={x.color} />
//                             ))}
//                           </Pie>
//                           <Tooltip />
//                         </PieChart>
//                       </ResponsiveContainer>

//                       <div className="td-donutCenter">
//                         <div className="td-donutPct">
//                           {totalStudentsInClusters ? "100%" : "0%"}
//                         </div>
//                         <div className="td-donutSub">TOTAL</div>
//                       </div>
//                     </div>

//                     {/* List */}
//                     <div className="td-clusterList">
//                       {listData.length === 0 ? (
//                         <div style={{ color: "#6b7280" }}>No cluster data</div>
//                       ) : (
//                         listData.map((x, idx) => (
//                           <div
//                             className="td-clusterRow"
//                             key={`${x.name}-${idx}`}
//                           >
//                             <div className="td-clusterLeft">
//                               <span
//                                 className="td-dot"
//                                 style={{ background: x.color }}
//                               />
//                               <span className="td-clusterName">{x.name}</span>
//                             </div>

//                             <div className="td-clusterMid">
//                               <div className="td-barBg">
//                                 <div
//                                   className="td-barFill"
//                                   style={{
//                                     width: `${Math.min(100, Math.max(0, x.pct))}%`,
//                                     background: x.color,
//                                   }}
//                                 />
//                               </div>
//                             </div>

//                             <div className="td-clusterRight">
//                               <div className="td-pct">{x.pct}%</div>
//                               <div className="td-count">{x.value}</div>
//                             </div>
//                           </div>
//                         ))
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Card 2: Examination Results (Exam vs Attendance by Cluster) */}
//               <div className="td-card">
//                 <div className="td-card-h td-card-hRow">
//                   <div>Examination Results</div>
//                   <div className="td-chipRow">
//                     <span className="td-chip">Exam</span>
//                     <span className="td-chip">Attendance</span>
//                   </div>
//                 </div>

//                 <div className="td-card-b">
//                   <div className="td-chartBox td-chartWide">
//                     <ResponsiveContainer width="100%" height="100%">
//                       <BarChart data={resultsData} barCategoryGap={24}>
//                         <defs>
//                           <linearGradient
//                             id="examGrad"
//                             x1="0"
//                             y1="0"
//                             x2="0"
//                             y2="1"
//                           >
//                             <stop offset="0%" stopColor="#6d28d9" />
//                             <stop offset="100%" stopColor="#4f46e5" />
//                           </linearGradient>

//                           <linearGradient
//                             id="attGrad"
//                             x1="0"
//                             y1="0"
//                             x2="0"
//                             y2="1"
//                           >
//                             <stop offset="0%" stopColor="#22c55e" />
//                             <stop offset="100%" stopColor="#16a34a" />
//                           </linearGradient>
//                         </defs>

//                         <CartesianGrid strokeDasharray="3 3" />
//                         <XAxis dataKey="cluster" />
//                         <YAxis domain={[0, 100]} />
//                         <Tooltip />
//                         <Legend />

//                         <Bar
//                           dataKey="exam"
//                           name="Exam"
//                           fill="url(#examGrad)"
//                           radius={[10, 10, 0, 0]}
//                         />
//                         <Bar
//                           dataKey="attendance"
//                           name="Attendance"
//                           fill="url(#attGrad)"
//                           radius={[10, 10, 0, 0]}
//                         />
//                       </BarChart>
//                     </ResponsiveContainer>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* At-risk table */}
//             <div className="td-card">
//               <div className="td-card-h">At-risk Students</div>
//               <div className="td-card-b">
//                 <table className="td-table">
//                   <thead>
//                     <tr>
//                       <th>StudentId</th>
//                       <th>Cluster</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {(data.atRiskStudents || []).length === 0 ? (
//                       <tr>
//                         <td colSpan={2}>No at-risk students</td>
//                       </tr>
//                     ) : (
//                       data.atRiskStudents.map((s, i) => (
//                         <tr key={i}>
//                           <td>{s.studentId ?? s.StudentId}</td>
//                           <td>
//                             {s.clusterLabel ?? s.cluster ?? s.ClusterLabel}
//                           </td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             <div className="td-card">
//               <div className="td-card-h">All Students</div>
//               <div className="td-card-b">
//                 <table className="td-table">
//                   <thead>
//                     <tr>
//                       <th>ID</th>
//                       <th>Name</th>
//                       <th>Grade</th>
//                       <th>Exam</th>
//                       <th>Attendance</th>
//                       <th>StudyHours</th>
//                       <th>Stress</th>
//                       <th>Cluster</th>
//                       <th>RecordedAt</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {(data.studentsOverview || []).length === 0 ? (
//                       <tr>
//                         <td colSpan={9}>No students data</td>
//                       </tr>
//                     ) : (
//                       data.studentsOverview.map((s) => (
//                         <tr key={s.studentId}>
//                           <td>{s.studentId}</td>
//                           <td>{s.fullName}</td>
//                           <td>{s.gradeLevel}</td>
//                           <td>{s.examScore ?? "—"}</td>
//                           <td>{s.attendance ?? "—"}</td>
//                           <td>{s.studyHours ?? "—"}</td>
//                           <td>{s.stressLevel ?? "—"}</td>
//                           <td>{s.clusterLabel ?? "No prediction"}</td>
//                           <td>
//                             {s.recordedAt
//                               ? String(s.recordedAt).slice(0, 10)
//                               : "—"}
//                           </td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>

//           {/* Right: Highlights */}
//           <div className="td-right">
//             <div className="td-card">
//               <div className="td-card-h">Highlights</div>

//               <div className="td-mini">
//                 <div className="td-avatar td-avatarGreen" />
//                 <div>
//                   <div className="name">Best Cluster (Attendance)</div>
//                   <div className="sub">
//                     {bestClusterByAttendance
//                       ? `${bestClusterByAttendance.cluster} • ${Math.round(
//                           bestClusterByAttendance.attendance ??
//                             bestClusterByAttendance.avgAttendance ??
//                             0,
//                         )}%`
//                       : "—"}
//                   </div>
//                 </div>
//               </div>

//               <div className="td-mini">
//                 <div className="td-avatar td-avatarPurple" />
//                 <div>
//                   <div className="name">Best Cluster (Exam)</div>
//                   <div className="sub">
//                     {bestClusterByExam
//                       ? `${bestClusterByExam.cluster} • ${Math.round(
//                           bestClusterByExam.exam ??
//                             bestClusterByExam.avgExam ??
//                             0,
//                         )}%`
//                       : "—"}
//                   </div>
//                 </div>
//               </div>

//               <div className="td-mini">
//                 <div className="td-avatar" />
//                 <div>
//                   <div className="name">Most Improved</div>
//                   <div className="sub">Plug from DB later (needs history)</div>
//                 </div>
//               </div>
//             </div>

//             <div className="td-card">
//               <div className="td-card-h">Notes</div>
//               <div className="td-card-b" style={{ color: "#6b7280" }}>
//                 Later we’ll plug real highlights from the database: top
//                 students, improvements, and behavior recommendations.
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
