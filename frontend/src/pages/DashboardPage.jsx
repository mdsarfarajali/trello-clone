import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import toast from 'react-hot-toast';
import AppNavbar from '../components/AppNavbar';
import InlineCalendar from '../components/InlineCalendar';
import { Kanban, Table2, CalendarDays, LayoutDashboard, Star, MoreVertical, Edit2, Trash2 } from 'lucide-react';

const BOARD_BG_COLORS = [
    '#B7B89F', '#B7E5CD', '#8ABEB9', '#8FABD4',
    '#EFECE3', '#D1855C', '#E5BA41', '#547792',
    '#94B4C1', '#57595B', '#452829', '#FAB95B',
    '#E8E2DB', '#F6E7BC', '#ECECEC', '#C4D4AE',
    '#D4A5A5', '#A8C5DA', '#C9B8D8', '#B8D4C8',
];

const GRADIENTS = [
    'linear-gradient(135deg,#B7E5CD,#8ABEB9)',
    'linear-gradient(135deg,#8FABD4,#94B4C1)',
    'linear-gradient(135deg,#F6E7BC,#E5BA41)',
    'linear-gradient(135deg,#EFECE3,#C4D4AE)',
    'linear-gradient(135deg,#D1855C,#FAB95B)',
    'linear-gradient(135deg,#94B4C1,#547792)',
];


export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newBoardTitle, setNewBoardTitle] = useState('');
    const [selectedBg, setSelectedBg] = useState(BOARD_BG_COLORS[0]);
    const [bgType, setBgType] = useState('color');
    const [creating, setCreating] = useState(false);
    const [dashView, setDashView] = useState('board'); // 'board' | 'table' | 'calendar' | 'dashboard'
    // tracks when each board was starred (boardId -> timestamp ms)
    const starredAtRef = React.useRef({});

    useEffect(() => {
        API.get('/boards').then(res => {
            setBoards(res.data);
            // pre-fill starredAt for already-starred boards using their updatedAt
            res.data.forEach(b => {
                if (b.isStarred) starredAtRef.current[b._id] = new Date(b.updatedAt).getTime();
            });
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleCreateBoard = async (e) => {
        e.preventDefault();
        if (!newBoardTitle.trim()) return;
        setCreating(true);
        try {
            const res = await API.post('/boards', {
                title: newBoardTitle.trim(),
                background: selectedBg,
                backgroundType: bgType
            });
            setBoards(prev => [res.data, ...prev]);
            setNewBoardTitle('');
            setSelectedBg(BOARD_BG_COLORS[0]);
            setShowCreate(false);
            toast.success('Board created!');
            navigate(`/board/${res.data._id}`);
        } catch {
            toast.error('Failed to create board');
        } finally {
            setCreating(false);
        }
    };

    const handleStar = async (e, board) => {
        e.preventDefault(); e.stopPropagation();
        const nowStarring = !board.isStarred;
        try {
            await API.put(`/boards/${board._id}`, { isStarred: nowStarring });
            if (nowStarring) {
                starredAtRef.current[board._id] = Date.now();
            } else {
                delete starredAtRef.current[board._id];
            }
            setBoards(prev => prev.map(b => b._id === board._id ? { ...b, isStarred: nowStarring } : b));
        } catch { }
    };

    const handleDeleteBoard = async (e, boardId) => {
        e.preventDefault(); e.stopPropagation();
        if (!confirm('Delete this board and all its lists and cards? This cannot be undone.')) return;
        try {
            await API.delete(`/boards/${boardId}`);
            setBoards(prev => prev.filter(b => b._id !== boardId));
            toast.success('Board deleted');
        } catch {
            toast.error('Failed to delete board');
        }
    };

    const handleRenameBoard = async (boardId, newTitle) => {
        if (!newTitle.trim()) return;
        try {
            await API.put(`/boards/${boardId}`, { title: newTitle.trim() });
            setBoards(prev => prev.map(b => b._id === boardId ? { ...b, title: newTitle.trim() } : b));
            toast.success('Board renamed');
        } catch {
            toast.error('Failed to rename board');
        }
    };

    const getBg = (board) => board.backgroundType === 'gradient' ? board.background : undefined;
    const getBgColor = (board) => board.backgroundType === 'color' ? board.background : undefined;

    // Sort: starred boards first (most recently starred = leftmost), then unstarred
    const sortedBoards = [...boards].sort((a, b) => {
        const aStarred = a.isStarred;
        const bStarred = b.isStarred;
        if (aStarred && !bStarred) return -1;
        if (!aStarred && bStarred) return 1;
        if (aStarred && bStarred) {
            // most recently starred comes first
            return (starredAtRef.current[b._id] || 0) - (starredAtRef.current[a._id] || 0);
        }
        return 0;
    });

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" style={{ borderTopColor: '#0079BF', border: '4px solid #DFE1E6' }} /></div>;

    return (
        <div className="dashboard">
            <AppNavbar onCreateClick={() => setShowCreate(true)} />

            {/* ── Views sub-header ── */}
            <div style={{
                background: '#23294E',
                borderBottom: '1px solid #2d3561',
                padding: '0 20px',
                display: 'flex', alignItems: 'center', gap: 4,
                height: 42, flexShrink: 0,
            }}>
                <span style={{ color: '#C7D1DB', fontWeight: 700, fontSize: 15, marginRight: 8 }}>
                    {user?.name?.split(' ')[0]}'s workspace
                </span>
                <div style={{ width: 1, height: 20, background: '#3d4580', margin: '0 8px' }} />
                {/* Views pill */}
                {[{ id: 'board', icon: <Kanban size={16} />, label: 'Board' },
                { id: 'table', icon: <Table2 size={16} />, label: 'Table' },
                { id: 'calendar', icon: <CalendarDays size={16} />, label: 'Calendar' },
                { id: 'dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' }].map(v => (
                    <button key={v.id}
                        onClick={() => { setDashView(v.id); }}
                        style={{
                            background: dashView === v.id ? 'rgba(255,255,255,.15)' : 'transparent',
                            color: dashView === v.id ? '#fff' : '#9FAABC',
                            border: 'none', borderRadius: 'var(--radius)',
                            padding: '6px 14px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8,
                            fontSize: 13, fontWeight: dashView === v.id ? 600 : 500,
                            transition: 'all var(--transition)',
                            boxShadow: dashView === v.id ? 'var(--shadow-sm)' : 'none'
                        }}
                        onMouseEnter={e => { if (dashView !== v.id) e.currentTarget.style.background = 'rgba(255,255,255,.08)'; }}
                        onMouseLeave={e => { if (dashView !== v.id) e.currentTarget.style.background = 'transparent'; }}
                    >
                        {v.icon} {v.label}
                    </button>
                ))}
            </div>

            {/* ── Board view (tiles) ── */}
            {dashView === 'board' && (
                <div className="boards-section" style={{ paddingTop: 24 }}>
                    <div style={{ padding: '0 24px' }}>
                        <h2 style={{ marginBottom: 16 }}>📋 Your Boards</h2>
                    </div>
                    <div className="boards-grid" style={{ padding: '0 24px' }}>
                        {sortedBoards.map(board => (
                            <BoardTile key={board._id} board={board} getBg={getBg} getBgColor={getBgColor} onStar={handleStar} onDelete={handleDeleteBoard} onRename={handleRenameBoard} navigate={navigate} />
                        ))}
                        {/* Create new board */}
                        <button className="board-create" onClick={() => setShowCreate(true)}>
                            + Create new board
                        </button>
                    </div>

                    {boards.length === 0 && (
                        <div className="anim-fade-in-up" style={{ textAlign: 'center', padding: '80px 24px', color: '#5E6C84' }}>
                            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                                <Kanban size={48} color="#8C96A6" strokeWidth={1} />
                            </div>
                            <h3 style={{ marginBottom: 8, color: '#172B4D' }}>No boards yet</h3>
                            <p>Create your first board to get started!</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Calendar view ── */}
            {dashView === 'calendar' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <InlineCalendar />
                </div>
            )}

            {/* ── Table view ── */}
            {dashView === 'table' && (
                <div className="anim-fade-in-up" style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                        <thead>
                            <tr>
                                {['Board', 'Background', 'Starred', 'Created'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#5E6C84', textTransform: 'uppercase', letterSpacing: '.4px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedBoards.length === 0 && (
                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 48, color: '#6B778C', fontSize: 15 }}>No boards yet — create one!</td></tr>
                            )}
                            {sortedBoards.map((board, i) => (
                                <tr key={board._id}
                                    className="hover-lift"
                                    onClick={() => navigate(`/board/${board._id}`)}
                                    style={{
                                        cursor: 'pointer', background: '#fff',
                                        boxShadow: 'var(--shadow-sm)',
                                        transition: 'all var(--transition)'
                                    }}
                                >
                                    <td style={{ padding: '16px', fontWeight: 600, color: '#172B4D', fontSize: 14, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 'var(--radius) 0 0 var(--radius)' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: board.background?.startsWith('linear') ? board.background : board.background, flexShrink: 0, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }} />
                                        {board.title}
                                    </td>
                                    <td style={{ padding: '16px', fontSize: 13, color: '#5E6C84' }}>
                                        <span style={{ background: '#F4F5F7', padding: '4px 8px', borderRadius: 4 }}>{board.backgroundType === 'gradient' ? 'Gradient' : 'Color'}</span>
                                    </td>
                                    <td style={{ padding: '16px' }}>{board.isStarred ? <Star size={18} color="#FFC400" fill="#FFC400" /> : <Star size={18} color="#DFE1E6" />}</td>
                                    <td style={{ padding: '16px', fontSize: 13, color: '#5E6C84', borderRadius: '0 var(--radius) var(--radius) 0' }}>{new Date(board.createdAt || Date.now()).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Dashboard stats view ── */}
            {dashView === 'dashboard' && (() => {
                const starred = boards.filter(b => b.isStarred).length;
                const stats = [
                    { label: 'Total Boards', value: boards.length, icon: <LayoutDashboard size={24} color="#0065FF" />, color: '#0065FF', bg: '#E9F2FF' },
                    { label: 'Starred', value: starred, icon: <Star size={24} color="#FF991F" fill="#FF991F" />, color: '#FF991F', bg: '#FFF7E6' },
                    { label: 'Not Starred', value: boards.length - starred, icon: <Star size={24} color="#5E6C84" />, color: '#5E6C84', bg: '#F4F5F7' },
                ];
                return (
                    <div className="anim-fade-in-up" style={{ padding: 32, overflowY: 'auto', flex: 1 }}>
                        <h2 style={{ marginBottom: 24, color: '#172B4D', fontSize: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <LayoutDashboard size={24} /> Workspace Dashboard
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 20, marginBottom: 32 }}>
                            {stats.map(s => (
                                <div key={s.label} className="hover-lift" style={{
                                    background: '#fff', borderLeft: `4px solid ${s.color}`,
                                    borderRadius: 'var(--radius)', padding: '20px 24px',
                                    display: 'flex', flexDirection: 'column', gap: 12,
                                    boxShadow: 'var(--shadow-sm)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ background: s.bg, padding: 10, borderRadius: '50%', display: 'flex' }}>
                                            {s.icon}
                                        </div>
                                        <div style={{ fontSize: 32, fontWeight: 800, color: '#172B4D' }}>{s.value}</div>
                                    </div>
                                    <div style={{ fontSize: 13, color: '#5E6C84', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ background: '#fff', borderRadius: 'var(--radius-md)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ color: '#172B4D', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Recent Boards</div>
                            {boards.map(b => (
                                <div key={b._id}
                                    className="hover-lift"
                                    onClick={() => navigate(`/board/${b._id}`)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 14,
                                        padding: '12px 16px', marginBottom: 8,
                                        border: '1px solid #DFE1E6', borderRadius: 'var(--radius)',
                                        cursor: 'pointer', background: '#fff'
                                    }}
                                >
                                    <div style={{ width: 32, height: 32, borderRadius: 6, background: b.background, flexShrink: 0, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }} />
                                    <span style={{ fontWeight: 600, color: '#172B4D', flex: 1 }}>{b.title}</span>
                                    {b.isStarred && <Star size={16} color="#FF991F" fill="#FF991F" />}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}

            {/* Create Board Modal */}
            {showCreate && (
                <div className="modal-overlay anim-fade-in-up" onClick={() => setShowCreate(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(9, 30, 66, 0.54)', backdropFilter: 'blur(4px)' }}>
                    <div
                        className="modal anim-pop-in"
                        style={{ width: '100%', maxWidth: 440, padding: 24, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ marginBottom: 20, fontSize: 18, color: '#172B4D', fontWeight: 600 }}>Create board</h3>
                        {/* Preview */}
                        <div style={{ height: 100, borderRadius: 'var(--radius-md)', marginBottom: 20, background: bgType === 'gradient' ? selectedBg : bgType === 'color' ? selectedBg : '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}>
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: 20, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{newBoardTitle || 'Board name'}</span>
                        </div>

                        {/* Color picker */}
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#5E6C84', marginBottom: 10 }}>BACKGROUND</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                            {GRADIENTS.map(g => (
                                <div key={g} onClick={() => { setSelectedBg(g); setBgType('gradient'); }}
                                    style={{ width: 44, height: 32, borderRadius: 6, background: g, cursor: 'pointer', outline: selectedBg === g ? '2px solid var(--blue)' : 'none', outlineOffset: 2, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }} />
                            ))}
                            {BOARD_BG_COLORS.map(c => (
                                <div key={c} onClick={() => { setSelectedBg(c); setBgType('color'); }}
                                    style={{ width: 32, height: 32, borderRadius: 6, background: c, cursor: 'pointer', outline: selectedBg === c ? '2px solid var(--blue)' : 'none', outlineOffset: 2, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }} />
                            ))}
                        </div>

                        <form onSubmit={handleCreateBoard}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#5E6C84', marginBottom: 8 }}>BOARD TITLE <span style={{ color: 'var(--red)' }}>*</span></p>
                            <input
                                autoFocus
                                value={newBoardTitle}
                                onChange={e => setNewBoardTitle(e.target.value)}
                                placeholder="Enter board title"
                                style={{ width: '100%', padding: '10px 14px', border: '2px solid #DFE1E6', borderRadius: 'var(--radius)', fontSize: 14, outline: 'none', marginBottom: 20, transition: 'all var(--transition)' }}
                                onFocus={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                                onBlur={e => e.currentTarget.style.borderColor = '#DFE1E6'}
                                required
                            />
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="submit" style={{ flex: 1, background: 'var(--blue)', color: '#fff', padding: '10px', borderRadius: 'var(--radius)', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'background var(--transition)' }} disabled={creating || !newBoardTitle.trim()}>
                                    {creating ? 'Creating...' : 'Create board'}
                                </button>
                                <button type="button" style={{ flex: 1, background: '#F4F5F7', color: '#172B4D', padding: '10px', borderRadius: 'var(--radius)', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'background var(--transition)' }} onClick={() => setShowCreate(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function BoardTile({ board, getBg, getBgColor, onStar, onDelete, onRename, navigate }) {
    const [showMenu, setShowMenu] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(board.title);

    const handleMenuClick = (e) => {
        e.preventDefault(); e.stopPropagation();
        setShowMenu(v => !v);
    };

    const startRename = (e) => {
        e.preventDefault(); e.stopPropagation();
        setRenameValue(board.title);
        setRenaming(true);
        setShowMenu(false);
    };

    const submitRename = async (e) => {
        e.preventDefault(); e.stopPropagation();
        await onRename(board._id, renameValue);
        setRenaming(false);
    };

    return (
        <div
            className="board-tile hover-lift anim-fade-in-up"
            style={{
                background: getBg(board) || getBgColor(board), position: 'relative',
                boxShadow: 'var(--shadow-sm)'
            }}
            onClick={() => !renaming && navigate(`/board/${board._id}`)}
        >
            <div className="board-tile-overlay" />

            {/* Board title or rename input */}
            {renaming ? (
                <form
                    onSubmit={submitRename}
                    onClick={e => e.stopPropagation()}
                    style={{ position: 'relative', zIndex: 2, padding: '4px' }}
                >
                    <input
                        autoFocus
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Escape') setRenaming(false); }}
                        style={{
                            width: '100%', padding: '6px 8px',
                            borderRadius: 'var(--radius)', border: '2px solid var(--blue)',
                            fontSize: 14, fontWeight: 700, outline: 'none',
                            background: '#fff', color: '#172B4D'
                        }}
                    />
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <button type="submit" style={{ padding: '6px 12px', background: 'var(--blue)', color: '#fff', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Save</button>
                        <button type="button" onClick={e => { e.stopPropagation(); setRenaming(false); }} style={{ padding: '6px 12px', background: '#DFE1E6', color: '#172B4D', borderRadius: 'var(--radius)', fontSize: 13, border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                    </div>
                </form>
            ) : (
                <div className="board-tile-title">{board.title}</div>
            )}

            {/* Star button */}
            {!renaming && (
                <button className="board-tile-star" onClick={e => onStar(e, board)} style={{ bottom: 10, left: 10, top: 'auto', right: 'auto', opacity: board.isStarred ? 1 : undefined }}>
                    <Star size={16} color={board.isStarred ? '#FFC400' : 'rgba(255,255,255,0.7)'} fill={board.isStarred ? '#FFC400' : 'none'} />
                </button>
            )}

            {/* Three-dot menu button */}
            {!renaming && (
                <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                    <button
                        className="board-tile-dots"
                        onClick={handleMenuClick}
                        title="More options"
                        style={{ padding: 4, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}
                    >
                        <MoreVertical size={16} />
                    </button>

                    {showMenu && (
                        <>
                            {/* Click-away backdrop */}
                            <div
                                style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                                onClick={e => { e.stopPropagation(); setShowMenu(false); }}
                            />
                            <div className="popover anim-pop-in" style={{ right: 0, top: '120%', minWidth: 160, zIndex: 11, borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid #DFE1E6', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                                <div className="popover-header" style={{ padding: '10px 14px', borderBottom: '1px solid #DFE1E6', fontSize: 12, fontWeight: 700, color: '#5E6C84', textTransform: 'uppercase', letterSpacing: '.4px' }}>Board Actions</div>
                                <div className="popover-item" onClick={startRename} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 14 }}>
                                    <Edit2 size={14} /> Rename
                                </div>
                                <div className="popover-item danger" onClick={e => { setShowMenu(false); onDelete(e, board._id); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 14, color: 'var(--red)' }}>
                                    <Trash2 size={14} /> Delete
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
