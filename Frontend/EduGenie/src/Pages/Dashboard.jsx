import "./Dashboard.css";
import { useState, useEffect } from "react";

function Dashboard() {
  const [metrics, setMetrics] = useState({
    pdfs_uploaded: 0,
    questions_asked: 0,
    summaries_generated: 0,
    quizzes_created: 0,
  });
  useEffect(() => {
    
    let isMounted=true;

    fetch("http://localhost:8000/analytics/metrics")
      .then((res) => {
        if (!res.ok) throw new Error("Metrics offline");
        return res.json();
      })
      .then((data) => {
        if (isMounted && data && typeof data.pdfs_uploaded !== "undefined") {
          setMetrics(data);
        }
      })
      .catch((err) => console.error("Error reading dashboard telemetry:", err.message));
    return () => {
      isMounted = false;
    };
  }, []);

  const cardConfigs = [
    {
      label: "Uploaded Documents",
      value: metrics.pdfs_uploaded,
      icon: "📄"
    },
    {
      label: "Questions Asked",
      value: metrics.questions_asked,
      icon: "💬",
    },
    {
      label: "Summaries Generated",
      value: metrics.summaries_generated,
      icon: "✨",
    },
    {
      label: "Quizzes Created",
      value: metrics.quizzes_created,
      icon: "📝",
    }
  ];
  return (
    <>
      <div className="content-area">
        <div className="welcome-card">
          <div className="welcome-content"><div className="welcome-header">Welcome back to EduGenie 👋</div>
            <div className="welcome-description">Transform your study materials into an interactive learning experience. Upload PDFs, ask questions, generate summaries, and receive personalized assistance powered by AI.</div>
          </div>
          <div className="welcome-icon">📚</div>
        </div>
        <div className="stats-grid">
          {cardConfigs.map((card, index) => (
            <div className="stat-card" key={index}>
              <div className="stat-card-icon">{card.icon}</div>
              <div className="stat-card-detais">
                <span className="stat-card-label">{card.label}</span>
                <h2 className="stat-card-value">{card.value}</h2>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
export default Dashboard;