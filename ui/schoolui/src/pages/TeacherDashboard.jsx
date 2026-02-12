import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { getTeacherDashboard } from "../api";
import "./TeacherDashboard.css";

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    getTeacherDashboard(1).then(setData).catch(e => setErr(String(e)));
  }, []);

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

  const pieData = (data.clusterCounts || []).map(x => ({
    name: x.cluster,
    value: x.count
  }));

  const barData = (data.avgExamByCluster || []).map(x => ({
    cluster: x.cluster,
    avgExam: x.avgExam,
    avgAttendance: x.avgAttendance
  }));

  return (
    <div className="td-page">
      {/* Topbar */}
      <div className="td-topbar">
        <div className="td-brand">
          <div className="td-logo">🍏</div>
          <div>
            <h1>School AI</h1>
            <p>Teacher Performance Dashboard</p>
          </div>
        </div>

        <div className="td-actions">
          <div className="td-pill">Teacher ID: {data.teacherId}</div>
          <div className="td-pill">Last updated: just now</div>
        </div>
      </div>

      <div className="td-wrap">
        <div className="td-grid">
          {/* Left Filters (UI only for now) */}
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

          {/* Middle: KPIs + Charts + Table */}
          <div className="td-main">
            {/* KPI Row */}
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
                  <div className="value">{(data.clusterCounts || []).length}</div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="td-two">
              <div className="td-card">
                <div className="td-card-h">Cluster Distribution</div>
                <div className="td-card-b">
                  <div className="td-chartBox">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={70}
                          outerRadius={105}
                        />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="td-card">
                <div className="td-card-h">Averages by Cluster</div>
                <div className="td-card-b">
                  <div className="td-chartBox">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="cluster" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="avgExam" />
                        <Bar dataKey="avgAttendance" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* At-risk table */}
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
                          {/* <td>{s.studentId}</td>
                          <td>{s.clusterLabel}</td> */}
                         <td>{s.studentId ?? s.StudentId}</td>
                         <td>{s.clusterLabel ?? s.cluster ?? s.ClusterLabel}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Highlights (UI only now) */}
          <div className="td-right">
            <div className="td-card">
              <div className="td-card-h">Highlights</div>

              <div className="td-mini">
                <div className="td-avatar" />
                <div>
                  <div className="name">Best Attendance</div>
                  <div className="sub">Plug from DB later</div>
                </div>
              </div>

              <div className="td-mini">
                <div className="td-avatar" />
                <div>
                  <div className="name">Best Exam Score</div>
                  <div className="sub">Plug from DB later</div>
                </div>
              </div>

              <div className="td-mini">
                <div className="td-avatar" />
                <div>
                  <div className="name">Most Improved</div>
                  <div className="sub">Plug from DB later</div>
                </div>
              </div>
            </div>

            <div className="td-card">
              <div className="td-card-h">Notes</div>
              <div className="td-card-b" style={{ color: "#6b7280" }}>
                Later we’ll plug real highlights from the database:
                top students, improvements, and behavior recommendations.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}