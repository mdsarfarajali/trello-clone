import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppNavbar from "../components/AppNavbar";
import TeamTaskBoard from "../components/TeamTaskBoard";
import TeamChatPanel from "../components/TeamChatPanel";
import API from "../api";
import { io } from "socket.io-client";
import {
  Users,
  Crown,
  ArrowLeft,
  Copy,
  Check,
  Shield,
  Trash2,
  UserMinus,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

export default function TeamWorkspacePage() {
  const { id: teamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [steps, setSteps] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isLeader = team?.leader?._id === user?._id;

  const fetchTeam = useCallback(async () => {
    try {
      const [teamRes, msgRes] = await Promise.all([
        API.get(`/teams/${teamId}`),
        API.get(`/teams/${teamId}/messages`),
      ]);
      setTeam(teamRes.data.team);
      setSteps(teamRes.data.steps);
      setMessages(msgRes.data);
    } catch {
      toast.error("Failed to load team");
      navigate("/team");
    } finally {
      setLoading(false);
    }
  }, [teamId, navigate]);

  useEffect(() => {
    setLoading(true);
    fetchTeam();
  }, [fetchTeam]);

  // Socket.IO
  useEffect(() => {
    if (!teamId) return;
    const s = io(SOCKET_URL);
    s.emit("joinTeamRoom", teamId);

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
        navigate("/team");
      }
    });
    s.on("teamDeleted", () => {
      toast.error("This team has been deleted");
      navigate("/team");
    });

    return () => {
      s.emit("leaveTeamRoom", teamId);
      s.disconnect();
    };
  }, [teamId, user?._id, fetchTeam, navigate]);

  // Handlers
  const handleSendMessage = async (content) => {
    const res = await API.post(`/teams/${teamId}/messages`, { content });
    setMessages((prev) => {
      if (prev.find((m) => m._id === res.data._id)) return prev;
      return [...prev, res.data];
    });
  };

  const handleAddStep = async (stepName) => {
    const res = await API.post(`/teams/${teamId}/steps`, { stepName });
    setSteps((prev) => [...prev, { ...res.data, tasks: [] }]);
  };

  const handleUpdateStep = async (stepId, data) => {
    await API.put(`/teams/${teamId}/steps/${stepId}`, data);
    setSteps((prev) =>
      prev.map((s) => (s._id === stepId ? { ...s, ...data } : s)),
    );
  };

  const handleDeleteStep = async (stepId) => {
    await API.delete(`/teams/${teamId}/steps/${stepId}`);
    setSteps((prev) => prev.filter((s) => s._id !== stepId));
    toast.success("Step deleted");
  };

  const handleAddTask = async (stepId, taskName) => {
    const res = await API.post(`/teams/${teamId}/steps/${stepId}/tasks`, {
      taskName,
    });
    setSteps((prev) =>
      prev.map((s) =>
        s._id === stepId ? { ...s, tasks: [...(s.tasks || []), res.data] } : s,
      ),
    );
  };

  const handleUpdateTask = async (taskId, data) => {
    await API.put(`/teams/${teamId}/tasks/${taskId}`, data);
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
    await API.delete(`/teams/${teamId}/tasks/${taskId}`);
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
      const res = await API.delete(`/teams/${teamId}/members/${userId}`);
      setTeam(res.data);
      toast.success("Member removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove member");
    }
  };

  const handleDeleteTeam = async () => {
    try {
      await API.delete(`/teams/${teamId}`);
      toast.success("Team deleted");
      navigate("/team");
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

  if (loading) {
    return (
      <div className="team-workspace-page">
        <AppNavbar />
        <div className="team-loading" style={{ marginTop: 80 }}>
          <div className="team-spinner" />
          <p>Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!team) return null;

  return (
    <div className="team-workspace-page">
      <AppNavbar />

      {/* Workspace Header */}
      <div className="workspace-header">
        <div className="workspace-header-left">
          <button className="workspace-back" onClick={() => navigate("/team")}>
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
        <div className="workspace-header-right">
          {isLeader && (
            <div className="workspace-credentials">
              <span className="workspace-cred" title="Team Code">
                <Shield size={13} /> {team.teamCode}
                <button
                  className="workspace-cred-copy"
                  onClick={() => copyText(team.teamCode, "code")}
                >
                  {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </span>
              <span className="workspace-cred" title="Pass Key">
                <Shield size={13} /> {team.passKey}
                <button
                  className="workspace-cred-copy"
                  onClick={() => copyText(team.passKey, "key")}
                >
                  {copiedKey ? <Check size={12} /> : <Copy size={12} />}
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
        </div>
      </div>

      {/* Workspace Body — Split Layout */}
      <div className="workspace-body">
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

      {/* Members Sidebar */}
      {showMembers && (
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
    </div>
  );
}
