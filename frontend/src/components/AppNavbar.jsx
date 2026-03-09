import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api";
import {
  LayoutGrid,
  Search,
  Bell,
  HelpCircle,
  LogOut,
  CheckSquare,
  Plus,
  Mail,
  Globe,
  Briefcase,
  User as UserIcon,
} from "lucide-react";

export default function AppNavbar({ onCreateClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef(null);

  const handleCreate = () => {
    setShowCreateMenu(false);
    if (onCreateClick) onCreateClick();
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    setSearching(true);
    setShowSearch(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await API.get(
          `/boards/search/cards?q=${encodeURIComponent(searchQuery.trim())}`,
        );
        setSearchResults(res.data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  return (
    <nav
      style={{
        background: "rgba(30, 30, 36, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        height: 52,
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: 6,
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        position: "sticky",
        top: 0,
        zIndex: 300,
        flexShrink: 0,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* ── Left: Grid icon + Trello logo ── */}
      <button style={iconBtn} className="hover-lift" title="All apps">
        <LayoutGrid size={18} color="#B6C2CF" />
      </button>
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          textDecoration: "none",
          color: "#fff",
          fontWeight: 700,
          fontSize: 16,
          padding: "4px 8px",
          borderRadius: 4,
          transition: "background var(--transition)",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div
          style={{
            background:
              "linear-gradient(135deg, var(--blue-light), var(--blue))",
            padding: 4,
            borderRadius: 4,
            display: "flex",
          }}
        >
          <CheckSquare size={16} color="white" />
        </div>
        Trello
      </Link>

      {/* ── Center: Search ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          padding: "0 20px",
        }}
      >
        <div style={{ position: "relative", width: "100%", maxWidth: 580 }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#8C96A6",
              pointerEvents: "none",
              display: "flex",
            }}
          >
            <Search size={15} />
          </span>
          <input
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "var(--radius)",
              padding: "7px 12px 7px 34px",
              color: "#e0e0e0",
              fontSize: 14,
              outline: "none",
              transition: "all var(--transition)",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--blue-light)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.boxShadow =
                "0 0 0 2px rgba(76, 154, 255, 0.2)";
              if (searchQuery.trim()) setShowSearch(true);
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.boxShadow =
                "inset 0 1px 2px rgba(0,0,0,0.1)";
              setTimeout(() => setShowSearch(false), 200);
            }}
          />
          {/* Search results dropdown */}
          {showSearch && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                background: "#282E33",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
                border: "1px solid rgba(255,255,255,0.08)",
                zIndex: 500,
                maxHeight: 360,
                overflowY: "auto",
              }}
            >
              {searching && (
                <div
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    color: "#8C96A6",
                    fontSize: 13,
                  }}
                >
                  Searching...
                </div>
              )}
              {!searching &&
                searchResults.length === 0 &&
                searchQuery.trim() && (
                  <div
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      color: "#8C96A6",
                      fontSize: 13,
                    }}
                  >
                    No cards found
                  </div>
                )}
              {!searching &&
                searchResults.map((card) => (
                  <div
                    key={card._id}
                    onMouseDown={() => {
                      navigate(`/board/${card.boardId}`);
                      setSearchQuery("");
                      setShowSearch(false);
                    }}
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.06)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <div
                      style={{
                        fontSize: 14,
                        color: "#e0e0e0",
                        fontWeight: 500,
                      }}
                    >
                      {card.title}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#8C96A6", marginTop: 2 }}
                    >
                      in {card.boardTitle}
                      {card.dueDate && (
                        <span>
                          {" "}
                          &middot; Due{" "}
                          {new Date(card.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Create, bell, ?, profile ── */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowCreateMenu((v) => !v)}
          style={{
            background: "var(--blue)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius)",
            padding: "6px 14px",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "var(--shadow-sm)",
            transition: "all var(--transition)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--blue-light)";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "var(--shadow)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--blue)";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "var(--shadow-sm)";
          }}
        >
          <Plus size={16} /> Create
        </button>

        {showCreateMenu && (
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 399 }}
              onClick={() => setShowCreateMenu(false)}
            />
            <div
              className="anim-pop-in"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                background: "#282E33",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
                border: "1px solid rgba(255,255,255,0.08)",
                zIndex: 400,
                minWidth: 220,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 11,
                  color: "#8C96A6",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".5px",
                }}
              >
                Create
              </div>
              <div style={{ padding: 4 }}>
                <button
                  onClick={handleCreate}
                  style={{
                    width: "100%",
                    padding: "10px 10px",
                    textAlign: "left",
                    background: "transparent",
                    color: "#C7D1DB",
                    borderRadius: "var(--radius)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    transition: "background var(--transition)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div
                    style={{
                      background: "rgba(76, 154, 255, 0.15)",
                      padding: 6,
                      borderRadius: 6,
                      color: "var(--blue-light)",
                    }}
                  >
                    <CheckSquare size={16} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#fff",
                        marginBottom: 2,
                      }}
                    >
                      Create board
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#8C96A6",
                        lineHeight: 1.3,
                      }}
                    >
                      A board is made up of cards ordered on lists
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <button style={iconBtn} className="hover-lift" title="Notifications">
        <Bell size={18} color="#B6C2CF" />
      </button>

      <button style={iconBtn} className="hover-lift" title="Help">
        <HelpCircle size={18} color="#B6C2CF" />
      </button>

      {/* Profile avatar */}
      <div style={{ position: "relative", marginLeft: 6 }}>
        <div
          onClick={() => setShowProfile((v) => !v)}
          className="hover-lift"
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: user?.avatarColor || "var(--purple)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            cursor: "pointer",
            border: "2px solid transparent",
            transition: "all var(--transition)",
            boxShadow: "var(--shadow-sm)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow = "0 0 0 2px var(--blue-light)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.boxShadow = "var(--shadow-sm)")
          }
          title={user?.name}
        >
          {user?.initials || "U"}
        </div>

        {showProfile && (
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 399 }}
              onClick={() => setShowProfile(false)}
            />
            <div
              className="anim-pop-in"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: 280,
                background: "#282E33",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-xl)",
                border: "1px solid rgba(255,255,255,0.08)",
                zIndex: 400,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(135deg, var(--blue-dark), var(--blue))",
                  padding: "24px 16px 20px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: user?.avatarColor || "var(--purple)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#fff",
                    margin: "0 auto 12px",
                    border: "3px solid rgba(255,255,255,.9)",
                    boxShadow: "var(--shadow)",
                  }}
                >
                  {user?.initials || "U"}
                </div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
                  {user?.name}
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,.8)",
                    fontSize: 13,
                    marginTop: 4,
                  }}
                >
                  {user?.email}
                </div>
              </div>
              <div style={{ padding: "8px 0" }}>
                {[
                  {
                    icon: <UserIcon size={16} />,
                    label: "Display name",
                    value: user?.name,
                  },
                  {
                    icon: <Mail size={16} />,
                    label: "Email",
                    value: user?.email,
                  },
                  {
                    icon: <Briefcase size={16} />,
                    label: "Workspace",
                    value: `${user?.name?.split(" ")[0]}'s Workspace`,
                  },
                  {
                    icon: <Globe size={16} />,
                    label: "Language",
                    value: "English",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 20px",
                    }}
                  >
                    <span style={{ color: "#8C96A6", display: "flex" }}>
                      {item.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#8C96A6",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: ".4px",
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#C7D1DB",
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  padding: "12px",
                }}
              >
                <button
                  onClick={() => {
                    setShowProfile(false);
                    logout();
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    background: "transparent",
                    color: "var(--red)",
                    borderRadius: "var(--radius)",
                    fontWeight: 600,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    border: "1px solid rgba(255, 86, 48, 0.5)",
                    cursor: "pointer",
                    transition: "all var(--transition)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--red)";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--red)";
                  }}
                >
                  <LogOut size={16} /> Log out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

const iconBtn = {
  background: "transparent",
  border: "none",
  width: 32,
  height: 32,
  borderRadius: "var(--radius)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
