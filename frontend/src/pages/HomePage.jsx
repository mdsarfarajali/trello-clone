import React from "react";
import { useNavigate } from "react-router-dom";
import AppNavbar from "../components/AppNavbar";
import { Users, LayoutDashboard } from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <AppNavbar />
      <div className="workspace-selector-container">
        <div className="workspace-selector-heading">
          <h1>Welcome back</h1>
          <p>Choose your workspace to get started</p>
        </div>
        <div className="workspace-selector-cards">
          {/* Team Workspace Card */}
          <div
            className="workspace-card workspace-card-team"
            onClick={() => navigate("/team")}
          >
            <div className="workspace-card-icon">
              <Users size={40} />
            </div>
            <h2>Team Workspace</h2>
            <p>
              Collaborate with your team on goals, tasks, and real-time chat
            </p>
            <span className="workspace-card-action">Open Teams &rarr;</span>
          </div>

          {/* Personal Boards Card */}
          <div
            className="workspace-card workspace-card-personal"
            onClick={() => navigate("/boards")}
          >
            <div className="workspace-card-icon">
              <LayoutDashboard size={40} />
            </div>
            <h2>Personal Boards</h2>
            <p>Manage your personal boards, lists, and cards</p>
            <span className="workspace-card-action">Open Boards &rarr;</span>
          </div>
        </div>
      </div>
    </div>
  );
}
