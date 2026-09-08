import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";

import Sidebar from "./components/Sidebar";
import "./App.css";

function Layout() {
  const [darkMode, setDarkMode] = useState(false);
  const [documents, setDocuments] = useState([]);
  const location = useLocation();
  const pageTitles = {
    "/": "Dashboard",
    "/dashboard": "Dashboard",
    "/documents": "Documents",
    "/chat": "AI Chat",
    "/summaries": "Summaries",
    "/notes": "Notes",
    "/quiz": "Quiz Generator",
    "/flashcards": "FlashCards",
  };
  const pageTitle = pageTitles[location.pathname] || "EduGenie";

  return (
    <div className={`layout ${darkMode ? "dark" : "light"}`}>
      <Sidebar />

      <main className="content">
        <div className="app-container">
          <div className="top-bar">
            <div className="top-bar-left">
              <div className="page-title">{pageTitle}</div>
              <div className="breadcrumb">
                EduGenie | Home
              </div>
            </div>

            <button
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? "🌙" : "☀️"}
            </button>
          </div>

          <Outlet context={{ documents, setDocuments }} />
        </div>
      </main>
    </div>
  );
}

export default Layout;