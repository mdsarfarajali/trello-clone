import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import toast from 'react-hot-toast';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

/* ─── helpers ─── */
function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}
function startOfWeek(d) {
    const s = new Date(d);
    s.setDate(s.getDate() - s.getDay());
    return s;
}
function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}
function formatHour(h) {
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
}

export default function CalendarPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const today = new Date();

    const [view, setView] = useState('month');          // 'month' | 'week' | 'day'
    const [cursor, setCursor] = useState(new Date());   // active date/month
    const [cards, setCards] = useState([]);             // all cards with dueDates
    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showViewMenu, setShowViewMenu] = useState(false);
    const [showJump, setShowJump] = useState(false);
    const [jumpCursor, setJumpCursor] = useState(new Date());
    const [showProfile, setShowProfile] = useState(false);

    /* ─── Fetch all cards with due dates ─── */
    useEffect(() => {
        const load = async () => {
            try {
                const bRes = await API.get('/boards');
                setBoards(bRes.data);
                const allCards = [];
                await Promise.all(bRes.data.map(async (board) => {
                    try {
                        const dRes = await API.get(`/boards/${board._id}`);
                        dRes.data.cards.forEach(c => {
                            if (c.dueDate) allCards.push({ ...c, boardTitle: board.title, boardId: board._id });
                        });
                    } catch { }
                }));
                setCards(allCards);
            } catch { toast.error('Failed to load calendar'); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    /* ─── Navigation ─── */
    const goBack = () => {
        const d = new Date(cursor);
        if (view === 'month') d.setMonth(d.getMonth() - 1);
        else if (view === 'week') d.setDate(d.getDate() - 7);
        else d.setDate(d.getDate() - 1);
        setCursor(d);
    };
    const goNext = () => {
        const d = new Date(cursor);
        if (view === 'month') d.setMonth(d.getMonth() + 1);
        else if (view === 'week') d.setDate(d.getDate() + 7);
        else d.setDate(d.getDate() + 1);
        setCursor(d);
    };
    const goToday = () => setCursor(new Date());

    /* ─── Cards for a specific day ─── */
    const cardsForDay = (date) =>
        cards.filter(c => sameDay(new Date(c.dueDate), date));

    /* ─── Month grid ─── */
    const buildMonthGrid = () => {
        const year = cursor.getFullYear();
        const month = cursor.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevDays = new Date(year, month, 0).getDate();
        const cells = [];
        // prev month padding
        for (let i = firstDay - 1; i >= 0; i--)
            cells.push({ date: new Date(year, month - 1, prevDays - i), faded: true });
        // current month
        for (let d = 1; d <= daysInMonth; d++)
            cells.push({ date: new Date(year, month, d), faded: false });
        // next month padding
        const remaining = 42 - cells.length;
        for (let d = 1; d <= remaining; d++)
            cells.push({ date: new Date(year, month + 1, d), faded: true });
        return cells;
    };

    /* ─── Week dates ─── */
    const weekDates = () => {
        const sw = startOfWeek(cursor);
        return Array.from({ length: 7 }, (_, i) => addDays(sw, i));
    };

    /* ─── Header label ─── */
    const headerLabel = () => {
        if (view === 'month') return `${MONTHS_SHORT[cursor.getMonth()]} ${cursor.getFullYear()}`;
        if (view === 'week') {
            const dates = weekDates();
            return `${MONTHS_SHORT[dates[0].getMonth()]} ${dates[0].getFullYear()}`;
        }
        return `${MONTHS_SHORT[cursor.getMonth()]} ${cursor.getDate()}, ${cursor.getFullYear()}`;
    };

    /* ─── Styles ─── */
    const S = {
        page: {
            minHeight: '100vh',
            background: '#1a1a2e',
            color: '#e0e0e0',
            fontFamily: "'Inter', system-ui, sans-serif",
            display: 'flex', flexDirection: 'column',
        },
        navbar: {
            background: '#16213e',
            borderBottom: '1px solid #2d2d4e',
            padding: '0 16px',
            height: 52,
            display: 'flex', alignItems: 'center', gap: 8,
            flexShrink: 0,
        },
        controls: {
            background: '#1e1e3a',
            borderBottom: '1px solid #2d2d4e',
            padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: 8,
            flexShrink: 0,
        },
        btn: {
            background: '#2d2d4e', color: '#e0e0e0',
            border: 'none', borderRadius: 6,
            padding: '6px 14px', fontSize: 13,
            cursor: 'pointer', fontWeight: 500,
        },
        btnGhost: {
            background: 'transparent', color: '#a0a0c0',
            border: '1px solid #3d3d5c', borderRadius: 6,
            padding: '5px 12px', fontSize: 13,
            cursor: 'pointer',
        },
        gridHeader: {
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: '1px solid #2d2d4e',
        },
        dayHeader: {
            textAlign: 'center', fontSize: 12, color: '#a0a0c0',
            padding: '8px 0', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '.5px',
        },
        monthGrid: {
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            flex: 1,
        },
        cell: (faded, isToday) => ({
            borderRight: '1px solid #2d2d4e',
            borderBottom: '1px solid #2d2d4e',
            padding: 6,
            minHeight: 90,
            position: 'relative',
            background: isToday ? '#1e2d4e' : 'transparent',
            opacity: faded ? 0.4 : 1,
            cursor: 'pointer',
        }),
        dateNum: (isToday) => ({
            width: 26, height: 26, lineHeight: '26px',
            textAlign: 'center', borderRadius: '50%',
            fontSize: 13, fontWeight: isToday ? 700 : 400,
            background: isToday ? '#4f8ef7' : 'transparent',
            color: isToday ? '#fff' : '#c0c0d8',
            display: 'inline-block', marginBottom: 4,
        }),
        eventChip: (color) => ({
            background: color || '#4f8ef7',
            borderRadius: 4, padding: '2px 6px',
            fontSize: 11, color: '#fff',
            marginBottom: 2, display: 'block',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            cursor: 'pointer',
        }),
    };

    const CHIP_COLORS = ['#4f8ef7', '#e05c5c', '#5cb85c', '#d4a017', '#9b59b6', '#e67e22', '#1abc9c'];

    /* ─── Jump mini-calendar ─── */
    const JumpCalendar = () => {
        const jYear = jumpCursor.getFullYear();
        const jMonth = jumpCursor.getMonth();
        const firstDay = new Date(jYear, jMonth, 1).getDay();
        const daysInMonth = new Date(jYear, jMonth + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        return (
            <div style={{
                position: 'absolute', top: 46, left: 0, zIndex: 400,
                background: '#1e1e3a', borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,.6)',
                border: '1px solid #3d3d5c', padding: 16, width: 280,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: '#a0a0c0' }}>Jump to date</span>
                    <button onClick={() => setShowJump(false)} style={{ ...S.btnGhost, padding: '2px 8px', borderRadius: 8 }}>✕</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <button onClick={() => setJumpCursor(new Date(jYear, jMonth - 1, 1))} style={S.btnGhost}>‹</button>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{MONTHS[jMonth]} {jYear}</span>
                    <button onClick={() => setJumpCursor(new Date(jYear, jMonth + 1, 1))} style={S.btnGhost}>›</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                    {DAYS_SHORT.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#6060a0', fontWeight: 600 }}>{d}</div>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                    {cells.map((d, i) => {
                        if (!d) return <div key={`e-${i}`} />;
                        const isT = d === today.getDate() && jMonth === today.getMonth() && jYear === today.getFullYear();
                        const isSel = d === cursor.getDate() && jMonth === cursor.getMonth() && jYear === cursor.getFullYear();
                        return (
                            <button key={d} onClick={() => { setCursor(new Date(jYear, jMonth, d)); setShowJump(false); }}
                                style={{
                                    textAlign: 'center', fontSize: 13, padding: '5px 2px',
                                    borderRadius: 6, border: 'none', cursor: 'pointer',
                                    background: isSel ? '#4f8ef7' : isT ? '#2d3a5c' : 'transparent',
                                    color: isSel ? '#fff' : isT ? '#4f8ef7' : '#c0c0d8',
                                    fontWeight: isT || isSel ? 700 : 400,
                                }}>
                                {d}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    /* ─── Month view ─── */
    const MonthView = () => {
        const cells = buildMonthGrid();
        return (
            <>
                <div style={S.gridHeader}>
                    {DAYS_SHORT.map(d => <div key={d} style={S.dayHeader}>{d}</div>)}
                </div>
                <div style={S.monthGrid}>
                    {cells.map((cell, i) => {
                        const isToday = sameDay(cell.date, today);
                        const dayCards = cardsForDay(cell.date);
                        return (
                            <div key={i} style={S.cell(cell.faded, isToday)}>
                                <div style={S.dateNum(isToday)}>
                                    {cell.date.getDate() === 1 && !isToday
                                        ? `${MONTHS_SHORT[cell.date.getMonth()]} ${cell.date.getDate()}`
                                        : cell.date.getDate()}
                                </div>
                                {dayCards.slice(0, 3).map((c, ci) => (
                                    <span key={c._id}
                                        title={`${c.boardTitle}: ${c.title}`}
                                        onClick={() => navigate(`/board/${c.boardId}`)}
                                        style={S.eventChip(CHIP_COLORS[ci % CHIP_COLORS.length])}>
                                        {c.title}
                                    </span>
                                ))}
                                {dayCards.length > 3 && (
                                    <span style={{ fontSize: 11, color: '#a0a0c0' }}>+{dayCards.length - 3} more</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </>
        );
    };

    /* ─── Week view ─── */
    const WeekView = () => {
        const dates = weekDates();
        return (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }}>
                {/* Day headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', borderBottom: '1px solid #2d2d4e', flexShrink: 0 }}>
                    <div />
                    {dates.map((date, i) => {
                        const isToday = sameDay(date, today);
                        return (
                            <div key={i} style={{ textAlign: 'center', padding: '8px 0', borderLeft: '1px solid #2d2d4e' }}>
                                <div style={{ fontSize: 11, color: '#a0a0c0', textTransform: 'uppercase', letterSpacing: '.5px' }}>{DAYS_SHORT[date.getDay()]}</div>
                                <div style={{ ...S.dateNum(isToday), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '2px auto 0' }}>{date.getDate()}</div>
                            </div>
                        );
                    })}
                </div>
                {/* Hours grid */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                    {HOURS.map(h => (
                        <div key={h} style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', borderBottom: '1px solid #252540', minHeight: 48 }}>
                            <div style={{ fontSize: 11, color: '#6060a0', padding: '4px 6px', textAlign: 'right', paddingTop: 4, flexShrink: 0 }}>{formatHour(h)}</div>
                            {dates.map((date, di) => {
                                const dayCards = cardsForDay(date).filter(c => new Date(c.dueDate).getHours() === h);
                                return (
                                    <div key={di} style={{ borderLeft: '1px solid #2d2d4e', padding: '2px 3px', position: 'relative' }}>
                                        {dayCards.map((c, ci) => (
                                            <span key={c._id}
                                                onClick={() => navigate(`/board/${c.boardId}`)}
                                                title={c.title}
                                                style={{ ...S.eventChip(CHIP_COLORS[ci % CHIP_COLORS.length]), fontSize: 11 }}>
                                                {c.title}
                                            </span>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    /* ─── Day view ─── */
    const DayView = () => (
        <div style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #2d2d4e', fontWeight: 700, fontSize: 15 }}>
                {DAYS_SHORT[cursor.getDay()]}, {MONTHS[cursor.getMonth()]} {cursor.getDate()}, {cursor.getFullYear()}
            </div>
            {HOURS.map(h => {
                const dayCards = cardsForDay(cursor).filter(c => new Date(c.dueDate).getHours() === h);
                return (
                    <div key={h} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', borderBottom: '1px solid #252540', minHeight: 52 }}>
                        <div style={{ fontSize: 12, color: '#6060a0', padding: '6px 12px', textAlign: 'right' }}>{formatHour(h)}</div>
                        <div style={{ borderLeft: '1px solid #2d2d4e', padding: '4px 8px' }}>
                            {dayCards.map((c, ci) => (
                                <span key={c._id}
                                    onClick={() => navigate(`/board/${c.boardId}`)}
                                    style={{ ...S.eventChip(CHIP_COLORS[ci % CHIP_COLORS.length]), fontSize: 13, padding: '6px 10px', marginBottom: 4 }}>
                                    {c.title} <span style={{ opacity: .7, fontSize: 11 }}>— {c.boardTitle}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    if (loading) return (
        <div style={{ ...S.page, alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #3d3d5c', borderTopColor: '#4f8ef7', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
        </div>
    );

    return (
        <div style={S.page}>
            {/* ── Navbar ── */}
            <nav style={S.navbar}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: '#fff', fontWeight: 700, fontSize: 16 }}>
                    <TrelloIcon /> Trello
                </Link>
                <Link to="/boards" style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, textDecoration: 'none', padding: '4px 8px', borderRadius: 4, background: 'rgba(255,255,255,.1)', marginLeft: 4 }}>
                    📋 Boards
                </Link>
                <div style={{ flex: 1 }} />
                {/* Sync button */}
                <button style={{ ...S.btnGhost, borderColor: '#4d4d6e', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    📅 Sync to personal calendar
                </button>
                {/* Profile */}
                <div style={{ position: 'relative' }}>
                    <div onClick={() => setShowProfile(v => !v)} style={{ width: 32, height: 32, borderRadius: '50%', background: user?.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', border: '2px solid rgba(255,255,255,.3)' }}>
                        {user?.initials}
                    </div>
                    {showProfile && (
                        <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setShowProfile(false)} />
                            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 220, background: '#1e1e3a', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,.6)', border: '1px solid #3d3d5c', zIndex: 200, overflow: 'hidden' }}>
                                <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #3d3d5c' }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{user?.name}</div>
                                    <div style={{ fontSize: 12, color: '#a0a0c0', marginTop: 2 }}>{user?.email}</div>
                                </div>
                                <div style={{ padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <Link to="/boards" style={{ padding: '8px', borderRadius: 6, background: '#4f8ef7', color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none', textAlign: 'center' }}>📋 My Boards</Link>
                                    <button onClick={() => { setShowProfile(false); logout(); }} style={{ padding: '8px', background: 'linear-gradient(135deg,#EB5A46,#c94234)', color: '#fff', borderRadius: 6, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>🚪 Log out</button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </nav>

            {/* ── Calendar Controls ── */}
            <div style={S.controls}>
                {/* Month/Year + Jump */}
                <div style={{ position: 'relative' }}>
                    <button onClick={() => { setShowJump(v => !v); setJumpCursor(new Date(cursor)); }}
                        style={{ ...S.btnGhost, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {headerLabel()}
                        <span style={{ fontSize: 11, color: '#a0a0c0' }}>{showJump ? '▲' : '▼'}</span>
                    </button>
                    {showJump && <JumpCalendar />}
                </div>

                <button onClick={goBack} style={{ ...S.btnGhost, padding: '5px 10px' }}>‹</button>
                <button onClick={goToday} style={S.btn}>Today</button>
                <button onClick={goNext} style={{ ...S.btnGhost, padding: '5px 10px' }}>›</button>

                <div style={{ flex: 1 }} />

                {/* View selector */}
                <div style={{ position: 'relative' }}>
                    <button onClick={() => setShowViewMenu(v => !v)}
                        style={{ ...S.btn, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {view.charAt(0).toUpperCase() + view.slice(1)} <span style={{ fontSize: 11 }}>▼</span>
                    </button>
                    {showViewMenu && (
                        <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setShowViewMenu(false)} />
                            <div style={{
                                position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 200,
                                background: '#1e1e3a', borderRadius: 8,
                                boxShadow: '0 8px 24px rgba(0,0,0,.5)',
                                border: '1px solid #3d3d5c', minWidth: 140, overflow: 'hidden',
                            }}>
                                {['day', 'week', 'month'].map(v => (
                                    <button key={v} onClick={() => { setView(v); setShowViewMenu(false); }}
                                        style={{
                                            width: '100%', padding: '10px 16px', textAlign: 'left',
                                            background: view === v ? 'rgba(79,142,247,.15)' : 'transparent',
                                            color: '#e0e0e0', border: 'none', cursor: 'pointer', fontSize: 14,
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        }}>
                                        {v.charAt(0).toUpperCase() + v.slice(1)}
                                        {view === v && <span style={{ color: '#4f8ef7' }}>✓</span>}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Calendar body ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                {view === 'month' && <MonthView />}
                {view === 'week' && <WeekView />}
                {view === 'day' && <DayView />}

                {/* + Add button */}
                <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
                    <button
                        onClick={() => navigate('/boards')}
                        style={{ ...S.btn, background: '#2d3a5c', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,.4)' }}>
                        + Add
                    </button>
                </div>

            </div>
        </div>
    );
}

function TrelloIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
            <rect x="2.5" y="2.5" width="19" height="19" rx="3" fill="none" stroke="white" strokeWidth="1.5" />
            <rect x="5" y="5" width="5.5" height="13" rx="1.5" fill="white" />
            <rect x="13.5" y="5" width="5.5" height="9" rx="1.5" fill="white" />
        </svg>
    );
}
