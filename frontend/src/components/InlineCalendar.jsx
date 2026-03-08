import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import toast from 'react-hot-toast';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const CHIP_COLORS = ['#4f8ef7', '#e05c5c', '#5cb85c', '#d4a017', '#9b59b6', '#e67e22', '#1abc9c'];

function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}
function startOfWeek(d) {
    const s = new Date(d); s.setDate(s.getDate() - s.getDay()); return s;
}
function addDays(d, n) {
    const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function formatHour(h) {
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
}

export default function InlineCalendar() {
    const navigate = useNavigate();
    const today = new Date();
    const [calView, setCalView] = useState('month');
    const [cursor, setCursor] = useState(new Date());
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showViewMenu, setShowViewMenu] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const bRes = await API.get('/boards');
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

    const goBack = () => {
        const d = new Date(cursor);
        if (calView === 'month') d.setMonth(d.getMonth() - 1);
        else if (calView === 'week') d.setDate(d.getDate() - 7);
        else d.setDate(d.getDate() - 1);
        setCursor(d);
    };
    const goNext = () => {
        const d = new Date(cursor);
        if (calView === 'month') d.setMonth(d.getMonth() + 1);
        else if (calView === 'week') d.setDate(d.getDate() + 7);
        else d.setDate(d.getDate() + 1);
        setCursor(d);
    };
    const goToday = () => setCursor(new Date());

    const cardsForDay = (date) => cards.filter(c => sameDay(new Date(c.dueDate), date));

    const headerLabel = () => {
        if (calView === 'month') return `${MONTHS_SHORT[cursor.getMonth()]} ${cursor.getFullYear()}`;
        if (calView === 'week') {
            const sw = startOfWeek(cursor);
            return `${MONTHS_SHORT[sw.getMonth()]} ${sw.getFullYear()}`;
        }
        return `${MONTHS_SHORT[cursor.getMonth()]} ${cursor.getDate()}, ${cursor.getFullYear()}`;
    };

    const buildMonthGrid = () => {
        const year = cursor.getFullYear(), month = cursor.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevDays = new Date(year, month, 0).getDate();
        const cells = [];
        for (let i = firstDay - 1; i >= 0; i--) cells.push({ date: new Date(year, month - 1, prevDays - i), faded: true });
        for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d), faded: false });
        const remaining = 42 - cells.length;
        for (let d = 1; d <= remaining; d++) cells.push({ date: new Date(year, month + 1, d), faded: true });
        return cells;
    };

    const weekDates = () => {
        const sw = startOfWeek(cursor);
        return Array.from({ length: 7 }, (_, i) => addDays(sw, i));
    };

    /* ── Styles ── */
    const S = {
        controls: {
            background: '#fff', borderBottom: '1px solid #DFE1E6',
            padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        },
        btn: { background: 'rgba(9,30,66,0.04)', color: '#172B4D', border: 'none', borderRadius: 'var(--radius)', padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600, transition: 'background var(--transition)' },
        btnGhost: { background: 'transparent', color: '#5E6C84', border: 'none', borderRadius: 'var(--radius)', padding: '4px 8px', fontSize: 16, cursor: 'pointer', transition: 'background var(--transition)' },
        cell: (faded, isToday) => ({
            borderRight: '1px solid #DFE1E6', borderBottom: '1px solid #DFE1E6',
            padding: 8, minHeight: 100, position: 'relative',
            background: isToday ? 'rgba(0,121,191,0.05)' : '#fff',
            opacity: faded ? 0.4 : 1, cursor: 'default',
        }),
        dateNum: (isToday) => ({
            width: 26, height: 26, lineHeight: '26px', textAlign: 'center',
            borderRadius: '50%', fontSize: 13, fontWeight: isToday ? 700 : 500,
            background: isToday ? 'var(--blue)' : 'transparent',
            color: isToday ? '#fff' : '#172B4D', display: 'inline-block', marginBottom: 4,
        }),
        chip: (color) => ({
            background: color, borderRadius: 'var(--radius)', padding: '2px 6px',
            fontSize: 11, color: '#fff', marginBottom: 4, fontWeight: 500,
            display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            cursor: 'pointer', boxShadow: 'var(--shadow-sm)'
        }),
    };

    if (loading) return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" style={{ borderTopColor: '#0079BF', border: '4px solid #DFE1E6' }} />
        </div>
    );

    return (
        <div className="anim-fade-in-up" style={{ margin: 24, borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid #DFE1E6', display: 'flex', flexDirection: 'column', flex: 1, background: '#fff', color: '#172B4D', overflow: 'hidden', minHeight: 0 }}>
            {/* Calendar controls bar */}
            <div style={S.controls}>
                <span style={{ fontWeight: 700, fontSize: 16, color: '#172B4D', marginRight: 8 }}>{headerLabel()}</span>
                <button className="hover-lift" onClick={goBack} style={S.btnGhost}>‹</button>
                <button className="hover-lift" onClick={goToday} style={S.btn}>Today</button>
                <button className="hover-lift" onClick={goNext} style={S.btnGhost}>›</button>
                <div style={{ flex: 1 }} />

                {/* Month/Week/Day selector */}
                <div style={{ position: 'relative' }}>
                    <button className="hover-lift" onClick={() => setShowViewMenu(v => !v)} style={{ ...S.btn, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {calView.charAt(0).toUpperCase() + calView.slice(1)} <span style={{ fontSize: 10 }}>▼</span>
                    </button>
                    {showViewMenu && (
                        <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setShowViewMenu(false)} />
                            <div className="popover anim-pop-in" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#fff', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid #DFE1E6', zIndex: 200, minWidth: 140, overflow: 'hidden' }}>
                                {['month', 'week', 'day'].map(v => (
                                    <button key={v} onClick={() => { setCalView(v); setShowViewMenu(false); }}
                                        className="hover-lift"
                                        style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: calView === v ? 'rgba(9,30,66,0.08)' : 'transparent', color: '#172B4D', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 500 }}>
                                        {v.charAt(0).toUpperCase() + v.slice(1)}
                                        {calView === v && <span style={{ color: 'var(--blue)' }}>✓</span>}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Calendar body */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', background: '#F4F5F7' }}>
                {/* Month view */}
                {calView === 'month' && (() => {
                    const cells = buildMonthGrid();
                    return (
                        <>
                            {/* Day headers */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#fff', borderBottom: '1px solid #DFE1E6', flexShrink: 0 }}>
                                {DAYS_SHORT.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 12, color: '#5E6C84', padding: '10px 0', fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase' }}>{d}</div>)}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, overflow: 'auto' }}>
                                {cells.map((cell, i) => {
                                    const isToday = sameDay(cell.date, today);
                                    const dayCards = cardsForDay(cell.date);
                                    return (
                                        <div key={i} className="hover-lift" style={S.cell(cell.faded, isToday)}>
                                            <div style={S.dateNum(isToday)}>
                                                {cell.date.getDate() === 1 && !isToday
                                                    ? `${MONTHS_SHORT[cell.date.getMonth()]} ${cell.date.getDate()}`
                                                    : cell.date.getDate()}
                                            </div>
                                            {dayCards.slice(0, 3).map((c, ci) => (
                                                <span key={c._id} title={`${c.boardTitle}: ${c.title}`}
                                                    onClick={() => navigate(`/board/${c.boardId}`)}
                                                    className="hover-lift"
                                                    style={S.chip(CHIP_COLORS[ci % CHIP_COLORS.length])}>
                                                    {c.title}
                                                </span>
                                            ))}
                                            {dayCards.length > 3 && <span style={{ fontSize: 11, color: '#5E6C84', fontWeight: 600, display: 'block', marginTop: 4 }}>+{dayCards.length - 3} more</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    );
                })()}

                {/* Week view */}
                {calView === 'week' && (() => {
                    const dates = weekDates();
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto', background: '#fff' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', borderBottom: '1px solid #DFE1E6', flexShrink: 0, background: '#F4F5F7' }}>
                                <div />
                                {dates.map((date, i) => {
                                    const isToday = sameDay(date, today);
                                    return (
                                        <div key={i} style={{ textAlign: 'center', padding: '10px 0', borderLeft: '1px solid #DFE1E6' }}>
                                            <div style={{ fontSize: 11, color: '#5E6C84', textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 700 }}>{DAYS_SHORT[date.getDay()]}</div>
                                            <div style={{ ...S.dateNum(isToday), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '4px auto 0' }}>{date.getDate()}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ flex: 1, overflow: 'auto' }}>
                                {HOURS.map(h => (
                                    <div key={h} className="hover-lift" style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', borderBottom: '1px solid #DFE1E6', minHeight: 48 }}>
                                        <div style={{ fontSize: 11, color: '#5E6C84', padding: '8px', textAlign: 'right', fontWeight: 500 }}>{formatHour(h)}</div>
                                        {dates.map((date, di) => {
                                            const dayCards = cardsForDay(date).filter(c => new Date(c.dueDate).getHours() === h);
                                            return (
                                                <div key={di} style={{ borderLeft: '1px solid #DFE1E6', padding: '2px 4px' }}>
                                                    {dayCards.map((c, ci) => (
                                                        <span key={c._id} onClick={() => navigate(`/board/${c.boardId}`)} title={c.title}
                                                            className="hover-lift"
                                                            style={{ ...S.chip(CHIP_COLORS[ci % CHIP_COLORS.length]), fontSize: 11 }}>{c.title}</span>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                {/* Day view */}
                {calView === 'day' && (
                    <div style={{ flex: 1, overflow: 'auto', background: '#fff' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #DFE1E6', fontWeight: 700, fontSize: 16, color: '#172B4D', background: '#F4F5F7' }}>
                            {DAYS_SHORT[cursor.getDay()]}, {MONTHS[cursor.getMonth()]} {cursor.getDate()}, {cursor.getFullYear()}
                        </div>
                        {HOURS.map(h => {
                            const dayCards = cardsForDay(cursor).filter(c => new Date(c.dueDate).getHours() === h);
                            return (
                                <div key={h} className="hover-lift" style={{ display: 'grid', gridTemplateColumns: '80px 1fr', borderBottom: '1px solid #DFE1E6', minHeight: 60 }}>
                                    <div style={{ fontSize: 12, color: '#5E6C84', padding: '12px 16px', textAlign: 'right', fontWeight: 500 }}>{formatHour(h)}</div>
                                    <div style={{ borderLeft: '1px solid #DFE1E6', padding: '8px 12px' }}>
                                        {dayCards.map((c, ci) => (
                                            <span key={c._id} onClick={() => navigate(`/board/${c.boardId}`)}
                                                className="hover-lift"
                                                style={{ ...S.chip(CHIP_COLORS[ci % CHIP_COLORS.length]), fontSize: 13, padding: '6px 10px', marginBottom: 6, display: 'inline-block' }}>
                                                {c.title} <span style={{ opacity: .8, fontSize: 11, marginLeft: 4 }}>— {c.boardTitle}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
