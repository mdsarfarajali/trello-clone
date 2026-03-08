import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/* ─── Shared social-button style ─── */
const socialBtn = {
    display: 'flex', alignItems: 'center', gap: 12,
    width: '100%', padding: '10px 14px',
    border: '1px solid #DFE1E6', borderRadius: 4,
    fontSize: 14, fontWeight: 500, color: '#172B4D',
    background: '#fff', cursor: 'pointer', marginBottom: 10,
    transition: 'background .15s, box-shadow .15s',
};

/* ─── Login Page ─── */
export function LoginPage() {
    const [view, setView] = useState('options'); // 'options' | 'phone' | 'email'
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/boards');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSocial = (provider) => {
        toast('OAuth not configured — use email login below.', { icon: 'ℹ️' });
    };

    const handlePhoneSubmit = (e) => {
        e.preventDefault();
        toast('Phone OTP not configured — use email login.', { icon: 'ℹ️' });
        setView('email');
    };

    return (
        <div className="auth-page">
            <div className="auth-logo"><TrelloLogo /> Trello</div>
            <div className="auth-card">
                {view === 'options' && (
                    <>
                        <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#172B4D', marginBottom: 4 }}>
                            Log in to Trello
                        </h2>
                        <p style={{ textAlign: 'center', fontSize: 13, color: '#5E6C84', marginBottom: 24 }}>
                            Choose how you'd like to continue
                        </p>

                        {/* Google */}
                        <button
                            style={socialBtn}
                            onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                            onClick={() => handleSocial('Google')}
                        >
                            <GoogleIcon />
                            <span>Continue with Google</span>
                        </button>

                        {/* Phone */}
                        <button
                            style={socialBtn}
                            onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                            onClick={() => setView('phone')}
                        >
                            <PhoneIcon />
                            <span>Continue with phone number</span>
                        </button>

                        {/* Divider */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 14px' }}>
                            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #DFE1E6' }} />
                            <span style={{ fontSize: 12, color: '#5E6C84' }}>or</span>
                            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #DFE1E6' }} />
                        </div>

                        {/* Email */}
                        <button
                            className="auth-submit"
                            style={{ marginTop: 0, display: 'block', textAlign: 'center' }}
                            onClick={() => setView('email')}
                        >
                            Continue with email
                        </button>

                        <div className="auth-link" style={{ marginTop: 20 }}>
                            Don't have an account? <Link to="/register">Sign up</Link>
                        </div>
                    </>
                )}

                {view === 'phone' && (
                    <>
                        <button onClick={() => setView('options')} style={{ color: '#0079BF', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
                            ← Back
                        </button>
                        <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#172B4D', marginBottom: 4 }}>Enter your phone number</h2>
                        <p style={{ textAlign: 'center', fontSize: 13, color: '#5E6C84', marginBottom: 24 }}>
                            We'll send a one-time code to verify
                        </p>
                        <form onSubmit={handlePhoneSubmit}>
                            <div className="auth-field">
                                <label>Phone number</label>
                                <input
                                    type="tel"
                                    autoFocus
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="+1 (555) 000-0000"
                                    required
                                />
                            </div>
                            <button type="submit" className="auth-submit" disabled={!phone.trim()}>
                                Send code
                            </button>
                        </form>
                    </>
                )}

                {view === 'email' && (
                    <>
                        <button onClick={() => setView('options')} style={{ color: '#0079BF', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
                            ← Back
                        </button>
                        <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#172B4D', marginBottom: 4 }}>Log in with email</h2>
                        <p style={{ textAlign: 'center', fontSize: 13, color: '#5E6C84', marginBottom: 24 }}>
                            Enter your Trello account details
                        </p>
                        {error && <div className="auth-error">{error}</div>}
                        <form onSubmit={handleEmailLogin}>
                            <div className="auth-field">
                                <label>Email</label>
                                <input type="email" autoFocus value={email} onChange={e => setEmail(e.target.value)} required placeholder="Enter your email" />
                            </div>
                            <div className="auth-field">
                                <label>Password</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter your password" />
                            </div>
                            <button type="submit" className="auth-submit" disabled={loading}>
                                {loading ? 'Logging in...' : 'Log in →'}
                            </button>
                        </form>
                    </>
                )}
            </div>

            <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 12, marginTop: 20, textAlign: 'center', maxWidth: 320 }}>
                By continuing, you acknowledge that you have read and understood our{' '}
                <a href="#" style={{ color: '#fff', textDecoration: 'underline' }}>Terms of Service</a> and{' '}
                <a href="#" style={{ color: '#fff', textDecoration: 'underline' }}>Privacy Policy</a>.
            </p>
        </div>
    );
}

/* ─── Register Page ─── */
export function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            await register(name, email, password);
            navigate('/boards');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSocial = () => toast('OAuth not configured — use email to sign up.', { icon: 'ℹ️' });

    return (
        <div className="auth-page">
            <div className="auth-logo"><TrelloLogo /> Trello</div>
            <div className="auth-card">
                <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#172B4D', marginBottom: 4 }}>
                    Create your account
                </h2>
                <p style={{ textAlign: 'center', fontSize: 13, color: '#5E6C84', marginBottom: 20 }}>
                    Sign up — it's free!
                </p>

                {/* Social buttons */}
                <button style={socialBtn}
                    onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    onClick={handleSocial}>
                    <GoogleIcon /><span>Sign up with Google</span>
                </button>
                <button style={socialBtn}
                    onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    onClick={handleSocial}>
                    <MicrosoftIcon /><span>Sign up with Microsoft</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0 14px' }}>
                    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #DFE1E6' }} />
                    <span style={{ fontSize: 12, color: '#5E6C84' }}>or sign up with email</span>
                    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #DFE1E6' }} />
                </div>

                {error && <div className="auth-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label>Full Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your full name" autoFocus />
                    </div>
                    <div className="auth-field">
                        <label>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
                    </div>
                    <div className="auth-field">
                        <label>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="At least 6 characters" />
                    </div>
                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? 'Creating account...' : 'Sign up →'}
                    </button>
                </form>

                <div className="auth-link" style={{ marginTop: 18 }}>
                    Already have an account? <Link to="/login">Log in</Link>
                </div>
            </div>
        </div>
    );
}

/* ─── Icons ─── */
function TrelloLogo() {
    return (
        <svg viewBox="0 0 24 24" fill="white" width="32" height="32">
            <rect x="2.5" y="2.5" width="19" height="19" rx="3" fill="none" stroke="white" strokeWidth="1.5" />
            <rect x="5" y="5" width="5.5" height="13" rx="1.5" fill="white" />
            <rect x="13.5" y="5" width="5.5" height="9" rx="1.5" fill="white" />
        </svg>
    );
}

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

function MicrosoftIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 23 23">
            <rect x="1" y="1" width="10" height="10" fill="#F25022" />
            <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
            <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
            <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
        </svg>
    );
}

function PhoneIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#172B4D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
    );
}
