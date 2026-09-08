import {
  Home,
  FolderOpen,
  MessageCircle,
  FileText,
  StickyNote,
  ListChecks,
  Lightbulb,
  Settings,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";

import { NavLink } from "react-router-dom";

import "./Sidebar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <GraduationCap size={22} />
        </div>

        <div>
          <h2 className="logo-title">EduGenie</h2>
          <p className="logo-subtitle">
            AI Study Assistant
          </p>
        </div>
      </div>

      <div className="sidebar-content">
        <div className="sidebar-section">MAIN</div>

        <NavLink to="/dashboard" className={({ isActive }) =>isActive ? "nav-item active" : "nav-item"}>
          <Home size={20} />
          Dashboard
        </NavLink>

        <NavLink to="/documents" className={({isActive})=>isActive?"nav-item active":"nav-item"}>
          <FolderOpen size={20} />
          Documents
        </NavLink>

        <NavLink to="/chat" className={({isActive})=>isActive?"nav-item active":"nav-item"}>
          <MessageCircle size={20} />
          AI Chat
        </NavLink>

        <div className="sidebar-section">TOOLS</div>

        <NavLink to="/summaries" className={({isActive})=>isActive?"nav-item active":"nav-item"}>
          <FileText size={20} />
          Summaries
        </NavLink>

        <NavLink to="/flashcards" className={({isActive})=>isActive?"nav-item active":"nav-item"}>
          <StickyNote size={20} />
          Flash Cards
        </NavLink>

        <NavLink to="/quiz" className={({isActive})=>isActive?"nav-item active":"nav-item"}>
          <ListChecks size={20} />
          Quiz Generator
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;