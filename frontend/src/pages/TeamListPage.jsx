import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CreateTeamModal, JoinTeamModal } from "../components/TeamModals";
import AppNavbar from "../components/AppNavbar";
import API from "../api";
import { Users, Plus, LogIn, Target, Crown, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function TeamListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    setLoading(true);
    API.get("/teams/my")
      .then((res) => setTeams(res.data))
      .catch(() => toast.error("Failed to load teams"))
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (newTeam) => {
    setTeams((prev) => [newTeam, ...prev]);
  };

  const handleJoined = (joinedTeam) => {
    setTeams((prev) => {
      if (prev.find((t) => t._id === joinedTeam._id)) return prev;
      return [joinedTeam, ...prev];
    });
  };

  const getRoleInTeam = (t) => {
    return t.leader?._id === user?._id ? "leader" : "member";
  };

  const gradients = [
    "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
    "linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)",
    "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)",
    "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
    "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
    "linear-gradient(135deg, #10B981 0%, #059669 100%)",
  ];

  return (
    <div className="team-list-page">
      <AppNavbar />
      <div className="team-list-content">
        {/* Header */}
        <div className="team-list-header">
          <div className="team-list-header-left">
            <Users size={24} />
            <h1>My Teams</h1>
            <span className="team-panel-count">{teams.length}</span>
          </div>
          <div className="team-list-header-right">
            <button
              className="btn btn-primary"
              onClick={() => setShowCreate(true)}
            >
              <Plus size={16} /> Create Team
            </button>
            <button className="btn btn-ghost" onClick={() => setShowJoin(true)}>
              <LogIn size={16} /> Join Team
            </button>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="team-loading">
            <div className="team-spinner" />
            <p>Loading teams...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="team-empty">
            <div className="team-empty-icon">
              <Users size={48} />
            </div>
            <h3>No teams yet</h3>
            <p>Create a new team or join an existing one to get started.</p>
            <div className="team-empty-actions">
              <button
                className="btn btn-primary"
                onClick={() => setShowCreate(true)}
              >
                <Plus size={16} /> Create Team
              </button>
              <button
                className="btn btn-light"
                onClick={() => setShowJoin(true)}
              >
                <LogIn size={16} /> Join Team
              </button>
            </div>
          </div>
        ) : (
          <div className="team-cards-grid">
            {teams.map((t, i) => (
              <div
                key={t._id}
                className="team-card hover-lift"
                onClick={() => navigate(`/team/${t._id}`)}
              >
                <div
                  className="team-card-banner"
                  style={{ background: gradients[i % gradients.length] }}
                >
                  <div className="team-card-role-badge">
                    {getRoleInTeam(t) === "leader" ? (
                      <>
                        <Crown size={12} /> Leader
                      </>
                    ) : (
                      <>
                        <Users size={12} /> Member
                      </>
                    )}
                  </div>
                </div>
                <div className="team-card-body">
                  <h3 className="team-card-name">{t.teamName}</h3>
                  <p className="team-card-goal">
                    <Target size={13} /> {t.teamGoal}
                  </p>
                  <div className="team-card-footer">
                    <span className="team-card-members">
                      <Users size={13} /> {t.members?.length || 0} member
                      {(t.members?.length || 0) !== 1 ? "s" : ""}
                    </span>
                    <ArrowRight size={16} className="team-card-arrow" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTeamModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
      <JoinTeamModal
        open={showJoin}
        onClose={() => setShowJoin(false)}
        onJoined={handleJoined}
      />
    </div>
  );
}
