import { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { getStudentDashboard } from "../api";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  // UI filters temporarily
  const [year, setYear] = useState("2025/2026");
  const [term, setTerm] = useState("Term 2");

  useEffect(() => {
    getStudentDashboard(1) // temporarily studentId=1
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, []);

  const trend = useMemo(() => {
    const history = data?.history ?? [];

    if (!history.length) return { exam: 0, attendance: 0 };

    const first = history[0];
    const last = history[history.length - 1];

    return {
      exam: (last.examScore ?? 0) - (first.examScore ?? 0),
      attendance: (last.attendance ?? 0) - (first.attendance ?? 0),
    };
  }, [data]);

  if (err)
    return (
      <div className="sd-page">
        <div className="sd-wrap">Error: {err}</div>
      </div>
    );
  if (!data)
    return (
      <div className="sd-page">
        <div className="sd-wrap">Loading...</div>
      </div>
    );

  // مؤقتاً (بعدها من AI/DB)
  const recommendations = [
    "Increase study hours by 2–3 hours weekly.",
    "Keep attendance above 85% for better stability.",
    "If stress stays high, try spaced revision + short breaks.",
  ];

  return (
    <div className="sd-page">
      {/* Topbar */}
      <div className="sd-topbar">
        <div className="sd-brand">
          <div className="sd-logo">🎓</div>
          <div>
            <h1>School AI</h1>
            <p>Student Performance Dashboard</p>
          </div>
        </div>

        <div className="sd-actions">
          <div className="sd-pill">Student ID: {data.studentId}</div>
          <div className="sd-pill">Cluster: {data.cluster?.label}</div>
          <div className="sd-pill">Last updated: just now</div>
        </div>
      </div>

      <div className="sd-wrap">
        {/* Main 3-column grid */}
        <div className="sd-layout">
          {/* LEFT: Filters */}
          <div className="sd-card sd-filter">
            <div className="sd-card-h">Filters</div>
            <div className="sd-card-b">
              <label className="sd-label">Select Year</label>
              <select
                className="sd-select"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option>2025/2026</option>
                <option>2024/2025</option>
              </select>

              <label className="sd-label" style={{ marginTop: 10 }}>
                Select Term
              </label>
              <select
                className="sd-select"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              >
                <option>Term 1</option>
                <option>Term 2</option>
                <option>Term 3</option>
              </select>

              <div className="sd-hint">
                * Filters UI |Just for now. We'll link it to the next step later| API.
              </div>
            </div>
          </div>

          {/* MIDDLE: KPIs + charts */}
          <div className="sd-main">
            {/* KPI Row */}
            <div className="sd-card">
              <div className="sd-kpis">
                <Kpi title="Attendance" value={`${data.metrics.attendance}%`} />
                <Kpi title="Exam Score" value={data.metrics.examScore} />
                <Kpi title="Study Hours" value={data.metrics.studyHours} />
                <Kpi title="Stress Level" value={data.metrics.stressLevel} />
              </div>
            </div>

            {/* Trend strip */}
            <div className="sd-card">
              <div className="sd-strip">
                <StripItem label="Exam Trend" value={fmtTrend(trend.exam)} />
                <StripItem
                  label="Attendance Trend"
                  value={fmtTrend(trend.attendance)}
                />
                <StripItem label="Cluster" value={data.cluster?.label ?? "-"} />
              </div>
            </div>

            {/* Chart */}
            <div className="sd-card">
              <div className="sd-card-h">
                Progress Over Time (Exam + Attendance)
              </div>
              <div className="sd-card-b">
                <div className="sd-chartBox">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line dataKey="examScore" />
                      <Line dataKey="attendance" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Highlights + Recommendations */}
          <div className="sd-right">
            <div className="sd-card">
              <div className="sd-card-h">Highlights</div>
              <div className="sd-card-b">
                <Highlight
                  title="Cluster Summary"
                  subtitle={`You are in ${data.cluster?.label}`}
                />
                <Highlight
                  title="Goal"
                  subtitle="Reach +10 ExamScore next month"
                />
              </div>
            </div>

            <div className="sd-card">
              <div className="sd-card-h">Recommendations</div>
              <div className="sd-card-b">
                <div className="sd-rec">
                  {recommendations.map((x, i) => (
                    <div key={i} className="sd-recItem">
                      {x}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sd-card">
              <div className="sd-card-h">Quick Notes</div>
              <div className="sd-card-b sd-muted">
               Later, we'll have "Recommendations" and "Goals" come from your AI Service
                   (FastAPI) or directly from .NET.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* UI pieces */
function Kpi({ title, value }) {
  return (
    <div className="sd-kpi">
      <div className="label">{title}</div>
      <div className="value">{value}</div>
    </div>
  );
}

function StripItem({ label, value }) {
  return (
    <div className="sd-stripItem">
      <div className="sd-stripLabel">{label}</div>
      <div className="sd-stripValue">{value}</div>
    </div>
  );
}

function Highlight({ title, subtitle }) {
  return (
    <div className="sd-highlight">
      <div className="sd-avatar" />
      <div>
        <div className="sd-hTitle">{title}</div>
        <div className="sd-hSub">{subtitle}</div>
      </div>
    </div>
  );
}

function fmtTrend(x) {
  if (x === 0) return "0";
  return x > 0 ? `+${x}` : `${x}`;
}

// import { useEffect, useState } from "react";
// import {
//   LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
// } from "recharts";
// import { getStudentDashboard } from "../api";
// import "./StudentDashboard.css";

// export default function StudentDashboard() {
//   const [data, setData] = useState(null);
//   const [err, setErr] = useState("");

//   useEffect(() => {
//     getStudentDashboard(1) // temporarily studentId=1
//       .then(setData)
//       .catch(e => setErr(String(e)));
//   }, []);

//   if (err) {
//     return (
//       <div className="sd-page">
//         <div className="sd-wrap">Error: {err}</div>
//       </div>
//     );
//   }

//   if (!data) {
//     return (
//       <div className="sd-page">
//         <div className="sd-wrap">Loading...</div>
//       </div>
//     );
//   }

//   const history = data.history || [];

//   // temporarily recommendations (Then get it from AI أو DB)
//   const recommendations = [
//     "Increase study hours by 2–3 hours weekly.",
//     "Keep attendance above 85% for better performance stability.",
//     "If stress stays high, try spaced revision + short breaks."
//   ];

//   return (
//     <div className="sd-page">
//       {/* Topbar */}
//       <div className="sd-topbar">
//         <div className="sd-brand">
//           <div className="sd-logo">🎓</div>
//           <div>
//             <h1>School AI</h1>
//             <p>Student Performance Dashboard</p>
//           </div>
//         </div>

//         <div className="sd-actions">
//           <div className="sd-pill">Student ID: {data.studentId}</div>
//           <div className="sd-pill">Cluster: {data.cluster?.label}</div>
//         </div>
//       </div>

//       <div className="sd-wrap">
//         {/* KPI Row */}
//         <div className="sd-kpis">
//           <Kpi title="Attendance" value={`${data.metrics.attendance}%`} />
//           <Kpi title="Exam Score" value={data.metrics.examScore} />
//           <Kpi title="Study Hours" value={data.metrics.studyHours} />
//           <Kpi title="Stress Level" value={data.metrics.stressLevel} />
//         </div>

//         <div className="sd-grid">
//           {/* Left: Cluster + Recommendations */}
//           <div className="sd-card">
//             <div className="sd-card-h">Student Summary</div>
//             <div className="sd-card-b">
//               <div className="sd-badge">
//                 Cluster: {data.cluster?.label} (ID: {data.cluster?.id})
//               </div>

//               <div style={{ marginTop: 14, fontWeight: 800 }}>Recommendations</div>

//               <div className="sd-rec">
//                 {recommendations.map((x, i) => (
//                   <div key={i} className="sd-recItem">
//                     {x}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Right: Line chart */}
//           <div className="sd-card">
//             <div className="sd-card-h">Progress Over Time (ExamScore + Attendance)</div>
//             <div className="sd-card-b">
//               <div className="sd-chartBox">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart data={history}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="date" />
//                     <YAxis />
//                     <Tooltip />
//                     <Line dataKey="examScore" />
//                     <Line dataKey="attendance" />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// }

// function Kpi({ title, value }) {
//   return (
//     <div className="sd-kpi">
//       <div className="label">{title}</div>
//       <div className="value">{value}</div>
//     </div>
//   );
// }
