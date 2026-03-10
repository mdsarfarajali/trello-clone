import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api";
import { Plus, LogIn, Check, Shield, Copy } from "lucide-react";
import toast from "react-hot-toast";

/* ───── Create Team Modal ───── */
export function CreateTeamModal({ open, onClose, onCreated }) {
  const { user } = useAuth();
  const [teamName, setTeamName] = useState("");
  const [teamGoal, setTeamGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!open) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!teamName.trim() || !teamGoal.trim()) return;
    setLoading(true);
    try {
      const res = await API.post("/teams", {
        teamName: teamName.trim(),
        teamGoal: teamGoal.trim(),
      });
      setCreated(res.data);
      onCreated(res.data);
      toast.success("Team created!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create team");
    } finally {
      setLoading(false);
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

  const handleClose = () => {
    setTeamName("");
    setTeamGoal("");
    setCreated(null);
    setCopiedCode(false);
    setCopiedKey(false);
    onClose();
  };

  return (
    <div className="team-modal-overlay" onClick={handleClose}>
      <div
        className="team-modal anim-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        {!created ? (
          <>
            <div className="team-modal-header">
              <div
                className="team-modal-icon"
                style={{
                  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                }}
              >
                <Plus size={22} />
              </div>
              <div>
                <h2>Create a Team</h2>
                <p>Set up a private workspace for your team</p>
              </div>
            </div>
            <form onSubmit={handleCreate} className="team-modal-form">
              <div className="team-field">
                <label>Team Name</label>
                <input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Alpha Squad"
                  maxLength={100}
                  autoFocus
                />
              </div>
              <div className="team-field">
                <label>Team Goal</label>
                <textarea
                  value={teamGoal}
                  onChange={(e) => setTeamGoal(e.target.value)}
                  placeholder="What does your team aim to achieve?"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="team-field">
                <label>Leader</label>
                <input
                  value={user?.name || ""}
                  disabled
                  className="team-field-disabled"
                />
              </div>
              <div className="team-modal-actions">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !teamName.trim() || !teamGoal.trim()}
                >
                  {loading ? "Creating..." : "Create Team"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="team-modal-header">
              <div
                className="team-modal-icon"
                style={{
                  background: "linear-gradient(135deg, #10B981, #059669)",
                }}
              >
                <Check size={22} />
              </div>
              <div>
                <h2>Team Created!</h2>
                <p>Share these credentials with your team members</p>
              </div>
            </div>
            <div className="team-credentials">
              <div className="team-credential-row">
                <div className="team-credential-label">
                  <Shield size={14} /> Team Code
                </div>
                <div className="team-credential-value">
                  <code>{created.teamCode}</code>
                  <button
                    className="team-copy-btn"
                    onClick={() => copyText(created.teamCode, "code")}
                  >
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <div className="team-credential-row">
                <div className="team-credential-label">
                  <Shield size={14} /> Pass Key
                </div>
                <div className="team-credential-value">
                  <code>{created.passKey}</code>
                  <button
                    className="team-copy-btn"
                    onClick={() => copyText(created.passKey, "key")}
                  >
                    {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="team-modal-actions">
              <button
                className="btn btn-primary"
                onClick={handleClose}
                style={{ width: "100%" }}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ───── Join Team Modal ───── */
export function JoinTeamModal({ open, onClose, onJoined }) {
  const [teamCode, setTeamCode] = useState("");
  const [passKey, setPassKey] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!teamCode.trim() || !passKey.trim()) return;
    setLoading(true);
    try {
      const res = await API.post("/teams/join", {
        teamCode: teamCode.trim(),
        passKey: passKey.trim(),
      });
      onJoined(res.data);
      toast.success("Joined team!");
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join team");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTeamCode("");
    setPassKey("");
    onClose();
  };

  return (
    <div className="team-modal-overlay" onClick={handleClose}>
      <div
        className="team-modal anim-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="team-modal-header">
          <div
            className="team-modal-icon"
            style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
          >
            <LogIn size={22} />
          </div>
          <div>
            <h2>Join a Team</h2>
            <p>Enter the team code and passkey shared by your leader</p>
          </div>
        </div>
        <form onSubmit={handleJoin} className="team-modal-form">
          <div className="team-field">
            <label>Team Code</label>
            <input
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
              placeholder="e.g. A1B2C3D4"
              maxLength={8}
              autoFocus
              style={{ fontFamily: "monospace", letterSpacing: "2px" }}
            />
          </div>
          <div className="team-field">
            <label>Pass Key</label>
            <input
              value={passKey}
              onChange={(e) => setPassKey(e.target.value)}
              placeholder="e.g. 123456"
              maxLength={6}
              type="password"
              style={{ fontFamily: "monospace", letterSpacing: "3px" }}
            />
          </div>
          <div className="team-modal-actions">
            <button
              type="button"
              className="btn btn-light"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !teamCode.trim() || !passKey.trim()}
            >
              {loading ? "Joining..." : "Join Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
