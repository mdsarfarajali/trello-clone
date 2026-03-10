import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useTeamPanel } from "../context/TeamPanelContext";
import { CreateTeamModal, JoinTeamModal } from "./TeamModals";
import TeamTaskBoard from "./TeamTaskBoard";
import TeamChatPanel from "./TeamChatPanel";
import API from "../api";
import { io } from "socket.io-client";
import {
  Users,
  Plus,
  LogIn,
  Target,
  Crown,
  ArrowLeft,
  Copy,
  Check,
  Shield,
  Trash2,
  UserMinus,
  X,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

export default function TeamPanel() {
  const { user } = useAuth();
  const { showPanel, activeTeamId, closePanel, openTeam, goBackToList } =
    useTeamPanel();

  // ─── Team List state ───
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  // ─── Team Workspace state ───
  const [team, setTeam] = useState(null);
  const [steps, setSteps] = useState([]);
  const [messages, setMessages] = useState([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isLeader = team?.leader?._id === user?._id;

  // ─── Fetch team list ───
  useEffect(() => {
    if (!showPanel) return;
    setTeamsLoading(true);
    API.get("/teams/my")
      .then((res) => setTeams(res.data))
      .catch(() => toast.error("Failed to load teams"))
      .finally(() => setTeamsLoading(false));
  }, [showPanel]);

  // ─── Fetch active team workspace ───
  const fetchTeam = useCallback(async () => {
    if (!activeTeamId) return;
    try {
      const [teamRes, msgRes] = await Promise.all([
        API.get(`/teams/${activeTeamId}`),
        API.get(`/teams/${activeTeamId}/messages`),
      ]);
      setTeam(teamRes.data.team);
      setSteps(teamRes.data.steps);
      setMessages(msgRes.data);
    } catch {
      toast.error("Failed to load team");
      goBackToList();
    } finally {
      setWorkspaceLoading(false);
    }
  }, [activeTeamId, goBackToList]);

  useEffect(() => {
    if (!activeTeamId) {
      setTeam(null);
      setSteps([]);
      setMessages([]);
      return;
    }
    setWorkspaceLoading(true);
    fetchTeam();
  }, [activeTeamId, fetchTeam]);

  // ─── Socket.IO for active team ───
  useEffect(() => {
    if (!activeTeamId) return;
    const s = io(SOCKET_URL);
    setSocket(s);
    s.emit("joinTeamRoom", activeTeamId);

    s.on("teamMessage", (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    s.on("teamStepCreated", () => fetchTeam());
    s.on("teamStepUpdated", () => fetchTeam());
    s.on("teamStepDeleted", () => fetchTeam());
    s.on("teamTaskCreated", () => fetchTeam());
    s.on("teamTaskUpdated", () => fetchTeam());
    s.on("teamTaskDeleted", () => fetchTeam());
    s.on("memberJoined", (t) => setTeam(t));
    s.on("memberRemoved", ({ team: t, removedUserId }) => {
      setTeam(t);
      if (removedUserId === user?._id) {
        toast.error("You have been removed from this team");
        goBackToList();
      }
    });
    s.on("teamDeleted", () => {
      toast.error("This team has been deleted");
      goBackToList();
    });

    return () => {
      s.emit("leaveTeamRoom", activeTeamId);
      s.disconnect();
    };
  }, [activeTeamId, user?._id, fetchTeam, goBackToList]);

  // ─── Workspace Handlers ───
  const handleSendMessage = async (content) => {
    const res = await API.post(`/teams/${activeTeamId}/messages`, { content });
    setMessages((prev) => {
      if (prev.find((m) => m._id === res.data._id)) return prev;
      return [...prev, res.data];
    });
  };

  const handleAddStep = async (stepName) => {
    const res = await API.post(`/teams/${activeTeamId}/steps`, { stepName });
    setSteps((prev) => [...prev, { ...res.data, tasks: [] }]);
  };

  const handleUpdateStep = async (stepId, data) => {
    await API.put(`/teams/${activeTeamId}/steps/${stepId}`, data);
    setSteps((prev) =>
      prev.map((s) => (s._id === stepId ? { ...s, ...data } : s)),
    );
  };

  const handleDeleteStep = async (stepId) => {
    await API.delete(`/teams/${activeTeamId}/steps/${stepId}`);
    setSteps((prev) => prev.filter((s) => s._id !== stepId));
    toast.success("Step deleted");
  };

  const handleAddTask = async (stepId, taskName) => {
    const res = await API.post(`/teams/${activeTeamId}/steps/${stepId}/tasks`, {
      taskName,
    });
    setSteps((prev) =>
      prev.map((s) =>
        s._id === stepId ? { ...s, tasks: [...(s.tasks || []), res.data] } : s,
      ),
    );
  };

  const handleUpdateTask = async (taskId, data) => {
    await API.put(`/teams/${activeTeamId}/tasks/${taskId}`, data);
    setSteps((prev) =>
      prev.map((s) => ({
        ...s,
        tasks: (s.tasks || []).map((t) =>
          t._id === taskId ? { ...t, ...data } : t,
        ),
      })),
    );
  };

  const handleDeleteTask = async (taskId) => {
    await API.delete(`/teams/${activeTeamId}/tasks/${taskId}`);
    setSteps((prev) =>
      prev.map((s) => ({
        ...s,
        tasks: (s.tasks || []).filter((t) => t._id !== taskId),
      })),
    );
    toast.success("Task deleted");
  };

  const handleRemoveMember = async (userId) => {
    try {
      const res = await API.delete(`/teams/${activeTeamId}/members/${userId}`);
      setTeam(res.data);
      toast.success("Member removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove member");
    }
  };

  const handleDeleteTeam = async () => {
    try {
      await API.delete(`/teams/${activeTeamId}`);
      toast.success("Team deleted");
      setTeams((prev) => prev.filter((t) => t._id !== activeTeamId));
      goBackToList();
      setShowDeleteConfirm(false);
    } catch {
      toast.error("Failed to delete team");
    }
  };

  const copyText = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
    toast.success("Copied!");
  };

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

  if (!showPanel) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div className="team-panel-overlay" onClick={closePanel} />

      {/* Slide-down panel */}
      <div className="team-panel anim-panel-slide-down">
        {/* ─── If no active team: show team list ─── */}
        {!activeTeamId ? (
          <>
            {/* Panel Header - List View */}
            <div className="team-panel-header">
              <div className="team-panel-header-left">
                <Users size={20} />
                <h2>My Teams</h2>
                <span className="team-panel-count">{teams.length}</span>
              </div>
              <div className="team-panel-header-right">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowCreate(true)}
                >
                  <Plus size={14} /> Create
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowJoin(true)}
                >
                  <LogIn size={14} /> Join
                </button>
                <button className="team-panel-close" onClick={closePanel}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Panel Body - Team Cards */}
            <div className="team-panel-body">
              {teamsLoading ? (
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
                  <p>
                    Create a new team or join an existing one to get started.
                  </p>
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
                      onClick={() => openTeam(t._id)}
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
          </>
        ) : (
          <>
            {/* ─── Active team workspace ─── */}
            {workspaceLoading ? (
              <>
                <div className="team-panel-header">
                  <div className="team-panel-header-left">
                    <button className="workspace-back" onClick={goBackToList}>
                      <ArrowLeft size={18} />
                    </button>
                    <h2>Loading...</h2>
                  </div>
                  <div className="team-panel-header-right">
                    <button className="team-panel-close" onClick={closePanel}>
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <div className="team-panel-body">
                  <div className="team-loading">
                    <div className="team-spinner" />
                    <p>Loading workspace...</p>
                  </div>
                </div>
              </>
            ) : team ? (
              <>
                {/* Workspace Header */}
                <div className="team-panel-header team-panel-header-workspace">
                  <div className="team-panel-header-left">
                    <button className="workspace-back" onClick={goBackToList}>
                      <ArrowLeft size={18} />
                    </button>
                    <div className="workspace-title-area">
                      <h2>{team.teamName}</h2>
                      <div className="workspace-meta">
                        <span className="workspace-badge workspace-badge-role">
                          {isLeader ? (
                            <>
                              <Crown size={11} /> Leader
                            </>
                          ) : (
                            <>
                              <Users size={11} /> Member
                            </>
                          )}
                        </span>
                        <span className="workspace-badge">
                          <Users size={11} /> {team.members?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="team-panel-header-right">
                    {isLeader && (
                      <div className="workspace-credentials">
                        <span className="workspace-cred" title="Team Code">
                          <Shield size={13} /> {team.teamCode}
                          <button
                            className="workspace-cred-copy"
                            onClick={() => copyText(team.teamCode, "code")}
                          >
                            {copiedCode ? (
                              <Check size={12} />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </span>
                        <span className="workspace-cred" title="Pass Key">
                          <Shield size={13} /> {team.passKey}
                          <button
                            className="workspace-cred-copy"
                            onClick={() => copyText(team.passKey, "key")}
                          >
                            {copiedKey ? (
                              <Check size={12} />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </span>
                      </div>
                    )}
                    <button
                      className="btn btn-ghost btn-sm workspace-members-btn"
                      onClick={() => setShowMembers(true)}
                    >
                      <Users size={15} /> Members
                    </button>
                    {isLeader && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <button className="team-panel-close" onClick={closePanel}>
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Workspace Body — Split Layout */}
                <div className="team-panel-body team-panel-workspace-body">
                  <div className="workspace-left">
                    <TeamTaskBoard
                      steps={steps}
                      isLeader={isLeader}
                      teamGoal={team.teamGoal}
                      onAddStep={handleAddStep}
                      onUpdateStep={handleUpdateStep}
                      onDeleteStep={handleDeleteStep}
                      onAddTask={handleAddTask}
                      onUpdateTask={handleUpdateTask}
                      onDeleteTask={handleDeleteTask}
                    />
                  </div>
                  <div className="workspace-right">
                    <TeamChatPanel
                      messages={messages}
                      onSendMessage={handleSendMessage}
                    />
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>

      {/* Members Sidebar */}
      {showMembers && team && (
        <div className="members-overlay" onClick={() => setShowMembers(false)}>
          <div
            className="members-sidebar anim-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="members-header">
              <h3>
                <Users size={18} /> Team Members
              </h3>
              <button
                className="members-close"
                onClick={() => setShowMembers(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="members-list">
              {(team.members || []).map((member) => (
                <div
                  key={member.user?._id || member._id}
                  className="member-item"
                >
                  <div
                    className="avatar"
                    style={{
                      background: member.user?.avatarColor || "#6366F1",
                    }}
                  >
                    {member.user?.initials || "?"}
                  </div>
                  <div className="member-info">
                    <div className="member-name">
                      {member.user?.name || "Unknown"}
                      {member.role === "leader" && (
                        <Crown
                          size={12}
                          style={{ color: "#F59E0B", marginLeft: 4 }}
                        />
                      )}
                    </div>
                    <div className="member-role">{member.role}</div>
                  </div>
                  {isLeader && member.role !== "leader" && (
                    <button
                      className="member-kick"
                      title="Remove member"
                      onClick={() => handleRemoveMember(member.user?._id)}
                    >
                      <UserMinus size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div
          className="team-modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="team-modal anim-pop-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 380 }}
          >
            <div className="team-modal-header">
              <div
                className="team-modal-icon"
                style={{
                  background: "linear-gradient(135deg, #EF4444, #DC2626)",
                }}
              >
                <Trash2 size={22} />
              </div>
              <div>
                <h2>Delete Team?</h2>
                <p>
                  This will permanently delete the team, all steps, tasks, and
                  chat messages. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="team-modal-actions">
              <button
                className="btn btn-light"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteTeam}>
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Join Modals */}
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
    </>
  );
}
