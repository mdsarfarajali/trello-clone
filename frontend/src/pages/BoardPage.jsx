import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useAuth } from "../context/AuthContext";
import API from "../api";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import SortableList from "../components/SortableList";
import CardModal from "../components/CardModal";
import AppNavbar from "../components/AppNavbar";
import {
  Kanban,
  Table2,
  CalendarDays,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  LayoutGrid,
} from "lucide-react";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export default function BoardPage() {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeCard, setActiveCard] = useState(null);
  const [activeList, setActiveList] = useState(null);

  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);

  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");

  const [editingTitle, setEditingTitle] = useState(false);
  const [boardTitle, setBoardTitle] = useState("");
  const [boardView, setBoardView] = useState("board"); // 'board'|'table'|'calendar'|'dashboard'
  const [showViewMenu, setShowViewMenu] = useState(false);

  const titleInputRef = useRef(null);
  const socketRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Fetch board data
  useEffect(() => {
    setLoading(true);
    API.get(`/boards/${boardId}`)
      .then((res) => {
        setBoard(res.data.board);
        setBoardTitle(res.data.board.title);
        setLists(res.data.lists.sort((a, b) => a.position - b.position));
        setCards(res.data.cards.sort((a, b) => a.position - b.position));
        setLoading(false);
      })
      .catch(() => {
        toast.error("Board not found");
        navigate("/boards");
      });
  }, [boardId]);

  // Socket.IO
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit("joinBoard", boardId);

    socket.on("cardCreated", ({ card }) => setCards((prev) => [...prev, card]));
    socket.on("cardUpdated", ({ card }) =>
      setCards((prev) => prev.map((c) => (c._id === card._id ? card : c))),
    );
    socket.on("cardDeleted", ({ cardId }) =>
      setCards((prev) => prev.filter((c) => c._id !== cardId)),
    );
    socket.on("cardMoved", ({ cards: updatedCards }) => setCards(updatedCards));
    socket.on("listCreated", ({ list }) =>
      setLists((prev) =>
        [...prev, list].sort((a, b) => a.position - b.position),
      ),
    );
    socket.on("listUpdated", ({ list }) =>
      setLists((prev) => prev.map((l) => (l._id === list._id ? list : l))),
    );
    socket.on("listDeleted", ({ listId }) => {
      setLists((prev) => prev.filter((l) => l._id !== listId));
      setCards((prev) => prev.filter((c) => c.list !== listId));
    });
    socket.on("listsReordered", ({ lists: reorderedLists }) => {
      setLists((prev) =>
        prev
          .map((l) => {
            const updated = reorderedLists.find((rl) => rl._id === l._id);
            return updated ? { ...l, position: updated.position } : l;
          })
          .sort((a, b) => a.position - b.position),
      );
    });

    return () => {
      socket.emit("leaveBoard", boardId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [boardId]);

  const getCardsForList = useCallback(
    (listId) =>
      cards
        .filter(
          (c) =>
            c.list === listId ||
            c.list?._id === listId ||
            c.list?.toString() === listId,
        )
        .sort((a, b) => a.position - b.position),
    [cards],
  );

  // Drag handling
  const handleDragStart = (event) => {
    const { active } = event;
    const type = active.data.current?.type;
    if (type === "card") setActiveCard(cards.find((c) => c._id === active.id));
    if (type === "list") setActiveList(lists.find((l) => l._id === active.id));
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveCard(null);
    setActiveList(null);
    if (!over) return;

    const activeType = active.data.current?.type;

    if (activeType === "list") {
      const oldIdx = lists.findIndex((l) => l._id === active.id);
      const newIdx = lists.findIndex((l) => l._id === over.id);
      if (oldIdx === newIdx) return;
      const newLists = arrayMove(lists, oldIdx, newIdx).map((l, i) => ({
        ...l,
        position: i * 1000,
      }));
      setLists(newLists);
      try {
        await API.post("/lists/reorder", {
          lists: newLists.map((l) => ({ _id: l._id, position: l.position })),
        });
        socketRef.current?.emit("listsReordered", { boardId, lists: newLists });
      } catch {
        toast.error("Failed to reorder lists");
      }
      return;
    }

    if (activeType === "card") {
      const sourceListId = active.data.current?.listId;
      const destListId =
        over.data.current?.listId || over.data.current?.sortable?.containerId;
      if (!destListId) return;

      const destListCards = getCardsForList(destListId).filter(
        (c) => c._id !== active.id,
      );
      const overIdx = destListCards.findIndex((c) => c._id === over.id);

      let newPosition;
      if (overIdx === -1) newPosition = destListCards.length * 1000;
      else if (overIdx === 0) newPosition = destListCards[0].position / 2;
      else
        newPosition =
          (destListCards[overIdx - 1].position +
            destListCards[overIdx].position) /
          2;

      setCards((prev) =>
        prev.map((c) =>
          c._id === active.id
            ? { ...c, list: destListId, position: newPosition }
            : c,
        ),
      );

      try {
        await API.post("/cards/move", {
          cardId: active.id,
          sourceListId,
          destListId,
          newPosition,
        });
        socketRef.current?.emit("cardMoved", {
          boardId,
          cardId: active.id,
          sourceListId,
          destListId,
        });
      } catch {
        toast.error("Failed to move card");
      }
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.data.current?.type !== "card") return;

    const overListId =
      over.data.current?.listId ||
      over.data.current?.sortable?.containerId ||
      (lists.find((l) => l._id === over.id) ? over.id : null);

    if (!overListId) return;
    const activeCard = cards.find((c) => c._id === active.id);
    if (!activeCard) return;
    const curListId = activeCard.list?._id || activeCard.list;
    if (curListId !== overListId) {
      setCards((prev) =>
        prev.map((c) => (c._id === active.id ? { ...c, list: overListId } : c)),
      );
    }
  };

  const handleAddList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    try {
      const res = await API.post("/lists", {
        title: newListTitle.trim(),
        boardId,
      });
      setLists((prev) => [...prev, res.data]);
      setNewListTitle("");
      setAddingList(false);
      socketRef.current?.emit("listCreated", { boardId, list: res.data });
      toast.success("List added!");
    } catch {
      toast.error("Failed to add list");
    }
  };

  const handleUpdateTitle = async () => {
    if (!boardTitle.trim() || boardTitle === board.title) {
      setBoardTitle(board.title);
      return;
    }
    try {
      await API.put(`/boards/${boardId}`, { title: boardTitle });
      setBoard((prev) => ({ ...prev, title: boardTitle }));
    } catch {
      setBoardTitle(board.title);
    }
    setEditingTitle(false);
  };

  const openCard = async (cardId) => {
    try {
      const res = await API.get(`/cards/${cardId}`);
      setSelectedCard(res.data);
      setShowCardModal(true);
    } catch {
      toast.error("Failed to load card");
    }
  };

  const handleCardUpdate = (updatedCard) => {
    setCards((prev) =>
      prev.map((c) => (c._id === updatedCard._id ? updatedCard : c)),
    );
    setSelectedCard(updatedCard);
    socketRef.current?.emit("cardUpdated", { boardId, card: updatedCard });
  };

  const handleCardDelete = (cardId) => {
    setCards((prev) => prev.filter((c) => c._id !== cardId));
    setShowCardModal(false);
    socketRef.current?.emit("cardDeleted", { boardId, cardId });
    toast.success("Card deleted");
  };

  const handleAddCard = async (listId, title) => {
    try {
      const res = await API.post("/cards", { title, listId, boardId });
      setCards((prev) => [...prev, res.data]);
      socketRef.current?.emit("cardCreated", { boardId, card: res.data });
    } catch {
      toast.error("Failed to add card");
    }
  };

  const handleDeleteList = async (listId) => {
    if (!confirm("Delete this list and all its cards?")) return;
    try {
      await API.delete(`/lists/${listId}`);
      setLists((prev) => prev.filter((l) => l._id !== listId));
      setCards((prev) =>
        prev.filter((c) => (c.list?._id || c.list) !== listId),
      );
      socketRef.current?.emit("listDeleted", { boardId, listId });
      toast.success("List deleted");
    } catch {
      toast.error("Failed to delete list");
    }
  };

  const handleUpdateListTitle = async (listId, title) => {
    try {
      const res = await API.put(`/lists/${listId}`, { title });
      setLists((prev) => prev.map((l) => (l._id === listId ? res.data : l)));
      socketRef.current?.emit("listUpdated", { boardId, list: res.data });
    } catch {}
  };

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0079BF",
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  const bgStyle =
    board?.backgroundType === "gradient"
      ? { background: board.background }
      : { background: board?.background || "#0079BF" };

  return (
    <div className="board-container" style={bgStyle}>
      {/* Shared dark navbar */}
      <AppNavbar onCreateClick={() => navigate("/boards")} />

      {/* Board sub-header: title + views */}
      <div
        style={{
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(4px)",
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: "1px solid rgba(255,255,255,.1)",
          flexShrink: 0,
        }}
      >
        {editingTitle ? (
          <input
            ref={titleInputRef}
            value={boardTitle}
            onChange={(e) => setBoardTitle(e.target.value)}
            onBlur={handleUpdateTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUpdateTitle();
              if (e.key === "Escape") {
                setBoardTitle(board.title);
                setEditingTitle(false);
              }
            }}
            style={{
              background: "rgba(255,255,255,.2)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,.4)",
              borderRadius: 4,
              padding: "4px 10px",
              fontWeight: 700,
              fontSize: 16,
              outline: "none",
              minWidth: 120,
            }}
            autoFocus
          />
        ) : (
          <span
            onClick={() => setEditingTitle(true)}
            style={{
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              padding: "4px 10px",
              borderRadius: 4,
              background: "rgba(255,255,255,.1)",
            }}
          >
            {boardTitle}
          </span>
        )}

        {/* Views pill */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowViewMenu((v) => !v)}
            style={{
              background: "rgba(255,255,255,.15)",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              padding: "5px 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <ViewIcon view={boardView} />{" "}
            {boardView.charAt(0).toUpperCase() + boardView.slice(1)}{" "}
            <span style={{ fontSize: 10, opacity: 0.7 }}>▼</span>
          </button>

          {showViewMenu && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 299 }}
                onClick={() => setShowViewMenu(false)}
              />
              {/* Trello-style Views panel */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: "calc(100% + 6px)",
                  background: "#2C2D30",
                  borderRadius: 12,
                  boxShadow: "0 12px 40px rgba(0,0,0,.8)",
                  border: "1px solid #3C434A",
                  zIndex: 300,
                  width: 320,
                  overflow: "hidden",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px 12px",
                    borderBottom: "1px solid #3C434A",
                  }}
                >
                  <div style={{ flex: 1 }} />
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: "#9FAABC",
                      letterSpacing: ".2px",
                    }}
                  >
                    Views
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => setShowViewMenu(false)}
                      style={{
                        color: "#9FAABC",
                        background: "rgba(255,255,255,.08)",
                        border: "none",
                        borderRadius: 6,
                        width: 28,
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: 16,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {/* Views list */}
                <div style={{ padding: "8px 0" }}>
                  {[
                    { id: "board", label: "Board", svg: <Kanban size={18} /> },
                    { id: "table", label: "Table", svg: <Table2 size={18} /> },
                    {
                      id: "calendar",
                      label: "Calendar",
                      svg: <CalendarDays size={18} />,
                    },
                    {
                      id: "dashboard",
                      label: "Dashboard",
                      svg: <LayoutDashboard size={18} />,
                    },
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setBoardView(v.id);
                        setShowViewMenu(false);
                        if (v.id === "calendar") navigate("/calendar");
                      }}
                      style={{
                        width: "100%",
                        padding: "12px 20px",
                        textAlign: "left",
                        background:
                          boardView === v.id
                            ? "rgba(100,120,255,.18)"
                            : "transparent",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        color: boardView === v.id ? "#A8B9FF" : "#C7D1DB",
                        transition: "all var(--transition)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#383C42")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          boardView === v.id
                            ? "rgba(100,120,255,.18)"
                            : "transparent")
                      }
                    >
                      <span
                        style={{
                          color: boardView === v.id ? "#A8B9FF" : "#9FAABC",
                          flexShrink: 0,
                          display: "flex",
                        }}
                      >
                        {v.svg}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>
                        {v.label}
                      </span>
                      {boardView === v.id && (
                        <span
                          style={{
                            color: "#A8B9FF",
                            marginLeft: "auto",
                            fontSize: 14,
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {board?.members?.slice(0, 4).map((m) => (
            <div
              key={m.user._id}
              className="avatar avatar-sm"
              style={{ background: m.user.avatarColor }}
              title={m.user.name}
            >
              {m.user.initials}
            </div>
          ))}
        </div>
      </div>

      {/* ── Board view (Kanban DnD) ── */}
      {boardView === "board" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={lists.map((l) => l._id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="board-lists-wrapper">
              {lists.map((list) => (
                <SortableList
                  key={list._id}
                  list={list}
                  cards={getCardsForList(list._id)}
                  onAddCard={handleAddCard}
                  onOpenCard={openCard}
                  onDeleteList={handleDeleteList}
                  onUpdateTitle={handleUpdateListTitle}
                  boardMembers={board?.members || []}
                  boardLabels={board?.labels || []}
                />
              ))}

              {/* Add list */}
              <div className="add-list-wrapper">
                {addingList ? (
                  <form className="add-list-form" onSubmit={handleAddList}>
                    <input
                      autoFocus
                      className="add-list-input"
                      placeholder="Enter list title..."
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setAddingList(false);
                      }}
                    />
                    <div className="add-list-actions">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ fontSize: 13 }}
                      >
                        Add list
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingList(false);
                          setNewListTitle("");
                        }}
                        style={{ color: "rgba(255,255,255,.7)", fontSize: 20 }}
                      >
                        ✕
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    className="add-list-btn"
                    onClick={() => setAddingList(true)}
                  >
                    + Add a list
                  </button>
                )}
              </div>
            </div>
          </SortableContext>

          <DragOverlay
            dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: { active: { opacity: "0.4" } },
              }),
            }}
          >
            {activeCard ? (
              <div
                className="card"
                style={{
                  transform: "rotate(3deg)",
                  boxShadow: "0 8px 24px rgba(0,0,0,.4)",
                }}
              >
                {activeCard.title}
              </div>
            ) : null}
            {activeList ? (
              <div className="list-wrapper" style={{ opacity: 0.9 }}>
                <div
                  className="list"
                  style={{ boxShadow: "0 8px 24px rgba(0,0,0,.4)" }}
                >
                  <div className="list-title" style={{ padding: "8px 6px" }}>
                    {activeList.title}
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* ── Table view ── */}
      {boardView === "table" &&
        (() => {
          const allCards = lists.flatMap((l) =>
            getCardsForList(l._id).map((c) => ({ ...c, listTitle: l.title })),
          );
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return (
            <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  background: "rgba(0,0,0,0.35)",
                  borderRadius: 10,
                  overflow: "hidden",
                  boxShadow: "0 4px 24px rgba(0,0,0,.4)",
                }}
              >
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.4)" }}>
                    {["Title", "List", "Labels", "Due Date", "Status"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#B6C2CF",
                            textTransform: "uppercase",
                            letterSpacing: ".5px",
                            borderBottom: "1px solid rgba(255,255,255,.1)",
                          }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {allCards.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          padding: 48,
                          color: "#C7D1DB",
                          fontSize: 15,
                        }}
                      >
                        No cards yet — add some from the Board view
                      </td>
                    </tr>
                  )}
                  {allCards.map((card, i) => {
                    const due = card.dueDate ? new Date(card.dueDate) : null;
                    const isOverdue =
                      due && due < today && !card.dueDateCompleted;
                    const isDueToday =
                      due && due.toDateString() === new Date().toDateString();
                    return (
                      <tr
                        key={card._id}
                        className="hover-lift"
                        onClick={() => openCard(card._id)}
                        style={{
                          cursor: "pointer",
                          background:
                            i % 2 === 0
                              ? "rgba(255,255,255,.05)"
                              : "transparent",
                          transition: "all var(--transition)",
                          boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.06)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(255,255,255,.12)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            i % 2 === 0
                              ? "rgba(255,255,255,.05)"
                              : "transparent")
                        }
                      >
                        <td
                          style={{
                            padding: "11px 16px",
                            color: "#C7D1DB",
                            fontWeight: 500,
                            fontSize: 14,
                          }}
                        >
                          {card.title}
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          <span
                            style={{
                              background: "rgba(255,255,255,.12)",
                              color: "#B6C2CF",
                              borderRadius: 4,
                              padding: "3px 8px",
                              fontSize: 12,
                            }}
                          >
                            {card.listTitle}
                          </span>
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          {(card.labelColors || [])
                            .slice(0, 3)
                            .map((color, li) => (
                              <span
                                key={li}
                                style={{
                                  display: "inline-block",
                                  background: color,
                                  borderRadius: 3,
                                  padding: "2px 8px",
                                  fontSize: 11,
                                  color: "#fff",
                                  marginRight: 3,
                                  minWidth: 24,
                                  height: 16,
                                }}
                              >
                                &nbsp;
                              </span>
                            ))}
                        </td>
                        <td
                          style={{
                            padding: "11px 16px",
                            fontSize: 13,
                            color: isOverdue
                              ? "#EB5A46"
                              : isDueToday
                                ? "#F2D600"
                                : "#B6C2CF",
                          }}
                        >
                          {due ? due.toLocaleDateString() : "—"}
                          {isOverdue && (
                            <span
                              style={{
                                marginLeft: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#EB5A46",
                              }}
                            >
                              OVERDUE
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          <span
                            style={{
                              background: card.dueDateCompleted
                                ? "#61BD4F"
                                : "rgba(255,255,255,.12)",
                              color: card.dueDateCompleted ? "#fff" : "#B6C2CF",
                              borderRadius: 20,
                              padding: "3px 10px",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {card.dueDateCompleted ? "✓ Done" : "In progress"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}

      {/* ── Dashboard / stats view ── */}
      {boardView === "dashboard" &&
        (() => {
          const allCards = lists.flatMap((l) => getCardsForList(l._id));
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const overdue = allCards.filter(
            (c) =>
              c.dueDate && new Date(c.dueDate) < today && !c.dueDateCompleted,
          ).length;
          const dueToday = allCards.filter(
            (c) =>
              c.dueDate &&
              new Date(c.dueDate).toDateString() === new Date().toDateString(),
          ).length;
          const completed = allCards.filter((c) => c.dueDateCompleted).length;
          const pending = allCards.length - completed;
          const stats = [
            {
              label: "Total Cards",
              value: allCards.length,
              icon: <Copy size={24} color="#4C9AFF" />,
              color: "#4C9AFF",
              bg: "rgba(76,154,255,.15)",
            },
            {
              label: "Completed",
              value: completed,
              icon: <CheckCircle2 size={24} color="#61BD4F" />,
              color: "#61BD4F",
              bg: "rgba(97,189,79,.15)",
            },
            {
              label: "In Progress",
              value: pending,
              icon: <Clock size={24} color="#F2D600" />,
              color: "#F2D600",
              bg: "rgba(242,214,0,.15)",
            },
            {
              label: "Overdue",
              value: overdue,
              icon: <AlertCircle size={24} color="#EB5A46" />,
              color: "#EB5A46",
              bg: "rgba(235,90,70,.15)",
            },
            {
              label: "Due Today",
              value: dueToday,
              icon: <CalendarDays size={24} color="#FF9F1A" />,
              color: "#FF9F1A",
              bg: "rgba(255,159,26,.15)",
            },
            {
              label: "Lists",
              value: lists.length,
              icon: <LayoutGrid size={24} color="#A8C5DA" />,
              color: "#A8C5DA",
              bg: "rgba(168,197,218,.15)",
            },
          ];
          const pct = allCards.length
            ? Math.round((completed / allCards.length) * 100)
            : 0;
          return (
            <div
              className="anim-fade-in-up"
              style={{ padding: 32, overflowY: "auto", flex: 1 }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
                  gap: 20,
                  marginBottom: 32,
                }}
              >
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="hover-lift"
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      borderLeft: `4px solid ${s.color}`,
                      borderRadius: "var(--radius)",
                      padding: "20px 24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          background: s.bg,
                          padding: 10,
                          borderRadius: "50%",
                          display: "flex",
                        }}
                      >
                        {s.icon}
                      </div>
                      <div
                        style={{ fontSize: 32, fontWeight: 800, color: "#fff" }}
                      >
                        {s.value}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#B6C2CF",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
              {/* Progress bar */}
              <div
                style={{
                  background: "rgba(0,0,0,.3)",
                  borderRadius: 12,
                  padding: "20px 24px",
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{ color: "#C7D1DB", fontWeight: 700, fontSize: 15 }}
                  >
                    Overall Completion
                  </span>
                  <span
                    style={{ color: "#61BD4F", fontWeight: 800, fontSize: 18 }}
                  >
                    {pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 12,
                    background: "rgba(255,255,255,.1)",
                    borderRadius: 99,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: "linear-gradient(90deg,#61BD4F,#4BBF6B)",
                      borderRadius: 99,
                      transition: "width .4s",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 8,
                    fontSize: 12,
                    color: "#8C96A6",
                  }}
                >
                  <span>{completed} completed</span>
                  <span>{allCards.length - completed} remaining</span>
                </div>
              </div>
              {/* Per-list breakdown */}
              <div
                style={{
                  background: "rgba(0,0,0,.3)",
                  borderRadius: 12,
                  padding: "20px 24px",
                }}
              >
                <div
                  style={{
                    color: "#C7D1DB",
                    fontWeight: 700,
                    fontSize: 15,
                    marginBottom: 16,
                  }}
                >
                  Cards per List
                </div>
                {lists.map((l) => (
                  <div key={l._id} style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ color: "#B6C2CF", fontSize: 13 }}>
                        {l.title}
                      </span>
                      <span style={{ color: "#8C96A6", fontSize: 13 }}>
                        {getCardsForList(l._id).length}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        background: "rgba(255,255,255,.08)",
                        borderRadius: 99,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${allCards.length ? (getCardsForList(l._id).length / allCards.length) * 100 : 0}%`,
                          background: "#4C9AFF",
                          borderRadius: 99,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

      {/* Card Modal */}
      {showCardModal && selectedCard && (
        <CardModal
          card={selectedCard}
          board={board}
          lists={lists}
          onClose={() => setShowCardModal(false)}
          onUpdate={handleCardUpdate}
          onDelete={handleCardDelete}
          currentUser={user}
        />
      )}
    </div>
  );
}

function ViewIcon({ view }) {
  const iconProps = { size: 16, style: { display: "flex" } };
  if (view === "table") return <Table2 {...iconProps} />;
  if (view === "calendar") return <CalendarDays {...iconProps} />;
  if (view === "dashboard") return <LayoutDashboard {...iconProps} />;
  return <Kanban {...iconProps} />;
}
