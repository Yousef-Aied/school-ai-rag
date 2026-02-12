import { useNavigate } from "react-router-dom";
import "./Landing.css";

export default function Landing() {
  const nav = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-container">

        <div className="landing-left">
          <h1 className="landing-title">Welcome to School AI</h1>
          <p className="landing-subtitle">
            Smart dashboards & AI insights for students and teachers.
          </p>

          <div className="landing-buttons">
            <button className="landing-btn primary" onClick={() => nav("/home")}>
              Home (Grade / Subject)
            </button>

            <button className="landing-btn" onClick={() => nav("/chat")}>
              Chat
            </button>

            <button className="landing-btn" onClick={() => nav("/teacher-dashboard")}>
              Teacher Dashboard
            </button>

            <button className="landing-btn" onClick={() => nav("/student-dashboard")}>
              Student Dashboard
            </button>
          </div>
        </div>

        <div className="landing-right">
          <h3>Platform Overview</h3>
          <p>
            • Student performance clustering<br />
            • Teacher analytics dashboard<br />
            • At-risk detection<br />
            • AI-powered curriculum assistant
          </p>
        </div>

      </div>
    </div>
  );
}