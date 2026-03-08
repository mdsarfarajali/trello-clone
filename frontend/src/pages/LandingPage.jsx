import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BOARD_COLORS = ['#0079BF', '#D29034', '#519839', '#B04632', '#89609E', '#CD5A91', '#4BBF6B', '#00AECC'];

export default function LandingPage() {
    const { user, logout } = useAuth();
    const [showProfile, setShowProfile] = useState(false);
    return (
        <div className="landing">
            {/* Navbar */}
            <nav className="landing-nav">
                <Link to="/" className="landing-nav-logo" style={{ textDecoration: 'none', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <TrelloIcon /> Trello
                </Link>
                <div className="landing-nav-spacer" />

                {user ? (
                    /* ── Logged-in state ── */
                    <>
                        <Link to="/boards" className="btn btn-ghost" style={{ fontSize: 14 }}>📋 My Boards</Link>
                        <div style={{ position: 'relative' }}>
                            <div
                                onClick={() => setShowProfile(v => !v)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,.15)' }}
                            >
                                <div style={{
                                    width: 30, height: 30, borderRadius: '50%',
                                    background: user.avatarColor, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    fontSize: 13, fontWeight: 700, color: '#fff'
                                }}>{user.initials}</div>
                                <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{user.name?.split(' ')[0]}</span>
                                <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 11 }}>▼</span>
                            </div>

                            {showProfile && (
                                <>
                                    <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setShowProfile(false)} />
                                    <div style={{
                                        position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                                        width: 260, background: '#fff',
                                        borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,.22)',
                                        border: '1px solid #DFE1E6', zIndex: 200, overflow: 'hidden'
                                    }}>
                                        {/* Header */}
                                        <div style={{ background: 'linear-gradient(135deg,#0079BF,#298FCA)', padding: '18px 16px', textAlign: 'center' }}>
                                            <div style={{
                                                width: 48, height: 48, borderRadius: '50%',
                                                background: user.avatarColor, display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                fontSize: 20, fontWeight: 700, color: '#fff',
                                                margin: '0 auto 8px', border: '3px solid rgba(255,255,255,.4)'
                                            }}>{user.initials}</div>
                                            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{user.name}</div>
                                            <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 12 }}>{user.email}</div>
                                        </div>
                                        {/* Info rows */}
                                        <div style={{ padding: '10px 0' }}>
                                            {[['👤', 'Name', user.name], ['✉️', 'Email', user.email], ['🏢', 'Workspace', `${user.name?.split(' ')[0]}'s Workspace`]].map(([icon, label, value]) => (
                                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px' }}>
                                                    <span style={{ fontSize: 15, width: 20 }}>{icon}</span>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: 10, color: '#5E6C84', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
                                                        <div style={{ fontSize: 13, color: '#172B4D', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ borderTop: '1px solid #DFE1E6', padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <Link to="/boards" onClick={() => setShowProfile(false)} style={{
                                                display: 'block', textAlign: 'center', padding: '8px', borderRadius: 6,
                                                background: '#0079BF', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none'
                                            }}>📋 Go to Boards</Link>
                                            <button onClick={() => { setShowProfile(false); logout(); }} style={{
                                                width: '100%', padding: '9px', background: 'linear-gradient(135deg,#EB5A46,#c94234)',
                                                color: '#fff', borderRadius: 6, fontWeight: 700, fontSize: 14, border: 'none',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                            }}>🚪 Log out</button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    /* ── Guest state ── */
                    <>
                        <Link to="/login" className="btn btn-ghost" style={{ fontSize: 14 }}>Log in</Link>
                        <Link to="/register" className="btn" style={{ background: '#fff', color: '#0079BF', fontWeight: 700 }}>Get Trello for free</Link>
                    </>
                )}
            </nav>

            {/* Hero */}
            <section className="landing-hero">
                <div className="landing-hero-content">
                    <h1>Trello brings all your tasks, teammates, and tools together</h1>
                    <p>Keep everything in the same place—even if your team isn't. Boards, lists, and cards empower teams to do their best work.</p>
                    <div className="landing-hero-btns">
                        <Link to="/register" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: 16 }}>Sign up — it's free!</Link>
                        <a href="#features" className="btn btn-ghost" style={{ padding: '14px 28px', fontSize: 16 }}>Watch video ▶</a>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="landing-features" id="features">
                <h2>A productivity powerhouse</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">📋</div>
                        <h3>Boards</h3>
                        <p>Trello boards keep tasks organized and work moving forward. In a glance, see everything from "things to do" to "aww yeah, we did it!"</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📝</div>
                        <h3>Lists</h3>
                        <p>The different stages of a task. Start as simple as To Do, Doing or Done—or build a workflow custom fit to your team's needs.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🃏</div>
                        <h3>Cards</h3>
                        <p>Cards represent tasks and ideas and hold all the information to get the job done. As you make progress, move cards across lists.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🎯</div>
                        <h3>Labels & Due Dates</h3>
                        <p>Add colorful labels and deadlines to cards for instant visual clarity. Never miss a deadline with due date reminders.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">✅</div>
                        <h3>Checklists</h3>
                        <p>Break big tasks into smaller steps. Track progress with visual progress bars right on the card face.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">👥</div>
                        <h3>Team Collaboration</h3>
                        <p>Assign cards to teammates, leave comments, and keep everyone in sync. Real-time updates so nothing is missed.</p>
                    </div>
                </div>
            </section>

            {/* Mini board preview */}
            <section style={{ background: '#F4F5F7', padding: '60px 24px' }}>
                <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: 28, marginBottom: 40 }}>See how it looks</h2>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {[
                            { title: '📌 To Do', cards: ['Research competitors', 'Write design brief', 'User interviews'] },
                            { title: '⚡ In Progress', cards: ['Wireframes', 'API integration'] },
                            { title: '✅ Done', cards: ['Project kickoff', 'Set up repo', 'Choose tech stack'] },
                        ].map((list, i) => (
                            <div key={i} style={{ background: '#EBECF0', borderRadius: 8, padding: 8, width: 220, textAlign: 'left' }}>
                                <div style={{ fontWeight: 700, fontSize: 14, padding: '4px 6px 8px' }}>{list.title}</div>
                                {list.cards.map((card, j) => (
                                    <div key={j} style={{ background: '#fff', borderRadius: 4, padding: '8px 10px', marginBottom: 8, fontSize: 13, boxShadow: '0 1px 3px rgba(0,0,0,.15)' }}>
                                        {j === 0 && <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}><div style={{ height: 8, width: 40, borderRadius: 4, background: BOARD_COLORS[i * 2] }} /><div style={{ height: 8, width: 30, borderRadius: 4, background: BOARD_COLORS[i * 2 + 1] }} /></div>}
                                        {card}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="landing-cta">
                <h2>Sign up and get started for free today</h2>
                <p>No credit card required. Upgrade anytime.</p>
                <Link to="/register" className="btn" style={{ background: '#fff', color: '#0079BF', padding: '14px 32px', fontSize: 16, fontWeight: 700 }}>
                    Get started — it's free!
                </Link>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <p>© 2024 Trello Clone. Built with ❤️ using React + Node.js</p>
            </footer>
        </div>
    );
}

function TrelloIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
            <rect x="2.5" y="2.5" width="19" height="19" rx="3" fill="none" stroke="white" strokeWidth="1.5" />
            <rect x="5" y="5" width="5.5" height="13" rx="1.5" fill="white" />
            <rect x="13.5" y="5" width="5.5" height="9" rx="1.5" fill="white" />
        </svg>
    );
}
