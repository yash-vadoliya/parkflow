import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CONFIG from '../Config'; // adjust the relative path to match your project structure

// Maps the selected role to its API endpoint, post-login destination,
// and which identifier field that role logs in with.
function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupStep, setSignupStep] = useState('details');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupOtp, setSignupOtp] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupVerificationToken, setSignupVerificationToken] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setStatus('loading');

    const endpoint = '/userlogin';
    const body = { email, password };

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Invalid email or password.');
      }

      const token = data.token;
      if (!token) {
        throw new Error('Login succeeded but no token was returned.');
      }

      // IMPORTANT: use the actual role from the DB record the backend
      // returns (e.g. "superadmin" / "admin" / "gatekeeper"), NOT the
      // login tab the user clicked. The tab only picks the endpoint —
      // your admin table stores several distinct roles behind one login.
      const actualRole = String(data.role || data.user?.user_role || '').toLowerCase();

      // Persist auth info for this session.
      localStorage.setItem('token', token);
      localStorage.setItem('role', actualRole);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      setStatus('success');
      const staffRoles = ['super_admin', 'superadmin', 'admin', 'gatekeeper'];
      const redirectTo = staffRoles.includes(actualRole) ? '/dashboard' : '/booking';
      setTimeout(() => navigate(redirectTo), 900);
    } catch (err) {
      setError(err.message || 'Invalid credentials.');
      setStatus('idle');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setStatus('loading');
    try {
      let endpoint;
      let body;
      if (signupStep === 'details') {
        endpoint = '/signup/request-otp';
        body = { name: signupName, email: signupEmail, phone: signupPhone };
      } else if (signupStep === 'otp') {
        endpoint = '/signup/verify-otp';
        body = { email: signupEmail, otp: signupOtp };
      } else {
        if (signupPassword !== signupConfirmPassword) throw new Error('Passwords do not match.');
        endpoint = '/signup/complete';
        body = { email: signupEmail, password: signupPassword, verificationToken: signupVerificationToken };
      }
      const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || data?.message || 'Sign up could not be completed.');

      if (signupStep === 'details') {
        setSignupStep('otp');
        setNotice('Verification code sent. Check your email.');
      } else if (signupStep === 'otp') {
        setSignupVerificationToken(data.verificationToken);
        setSignupStep('password');
        setNotice('Email verified. Create your password.');
      } else {
        setMode('login');
        setEmail(signupEmail);
        setSignupStep('details');
        setNotice('Account created. Sign in with your new password.');
      }
    } catch (err) {
      setError(err.message || 'Sign up could not be completed.');
    } finally {
      setStatus('idle');
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setNotice('');
    setStatus('idle');
    if (nextMode === 'signup') setSignupStep('details');
  };

  return (
    <div className="background-dark">
      <style>{`
        :root {
          --deck:       #14171c;
          --deck-panel: #1c2029;
          --deck-line:  rgba(255,255,255,0.06);
          --sodium:     #ffb020;
          --go:         #2bb583;
          --stop:       #e2534a;
          --ink:        #f2f3f5;
          --muted:      #8b8f97;
        }

        * { box-sizing: border-box; }

        .background-dark {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: var(--deck);
          color: var(--ink);
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        .background-dark::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            90deg,
            transparent 0 78px,
            rgba(255,255,255,0.035) 78px 82px
          );
          z-index: 0;
        }

        .background-dark::after {
          content: "";
          position: absolute;
          top: -40%;
          left: -20%;
          width: 60%;
          height: 180%;
          background: radial-gradient(ellipse at center, rgba(255,176,32,0.08) 0%, transparent 70%);
          transform: rotate(20deg);
          animation: sweep 14s ease-in-out infinite;
          z-index: 0;
        }

        @keyframes sweep {
          0%   { left: -30%; }
          50%  { left: 90%; }
          100% { left: -30%; }
        }

        .login-card {
          background: var(--deck-panel);
          width: 100%;
          max-width: 420px;
          padding: 40px;
          border-radius: 20px;
          border: 1px solid var(--deck-line);
          box-shadow: 0 24px 40px rgba(0, 0, 0, 0.4);
          z-index: 1;
          position: relative;

          opacity: 0;
          transform: translateY(30px);
          animation: slideUpFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideUpFade {
          to { opacity: 1; transform: translateY(0); }
        }

        .card-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .plate-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          color: var(--deck);
          background: var(--sodium);
          padding: 3px 10px;
          border-radius: 5px;
          margin-bottom: 14px;
        }

        .brand-word {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: 0.03em;
          margin: 0;
        }

        .brand-word span { color: var(--sodium); }

        .subtitle {
          color: var(--muted);
          font-size: 14px;
          margin-top: 5px;
        }

        .notice-message {
          color: var(--go);
          font-size: 13px;
          line-height: 20px;
          margin-bottom: 20px;
          text-align: center;
          background: rgba(43, 181, 131, 0.1);
          padding: 10px;
          border-radius: 8px;
        }

        .signup-prompt {
          margin: 22px 0 0;
          color: var(--muted);
          font-size: 13px;
          text-align: center;
        }

        .signup-link {
          padding: 0;
          border: 0;
          background: transparent;
          color: var(--sodium);
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .signup-link:hover { color: #ffc250; }

        /* ---------- Role switch ---------- */
        .role-switch {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--deck);
          border: 1px solid var(--deck-line);
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 26px;
          position: relative;
        }

        .role-btn {
          position: relative;
          z-index: 1;
          background: transparent;
          border: none;
          color: var(--muted);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 10px 0;
          border-radius: 8px;
          cursor: pointer;
          transition: color 0.25s ease;
        }

        .role-btn.active {
          color: var(--deck);
        }

        .role-thumb {
          position: absolute;
          top: 4px;
          bottom: 4px;
          left: 4px;
          width: calc(50% - 4px);
          background: var(--sodium);
          border-radius: 8px;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .role-switch[data-role="admin"] .role-thumb {
          transform: translateX(100%);
        }

        .form-group {
          margin-bottom: 24px;
          position: relative;
        }

        .form-group label {
          display: block;
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 8px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          transition: color 0.25s ease;
        }

        .form-group:focus-within label {
          color: var(--sodium);
        }

        .input-wrap { position: relative; }

        .form-control {
          width: 100%;
          background: var(--deck);
          border: 1px solid var(--deck-line);
          color: var(--ink);
          padding: 14px 16px;
          border-radius: 10px;
          font-size: 16px;
          outline: none;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }

        .form-control:focus {
          border-color: transparent;
          box-shadow: 0 0 0 3px rgba(255, 176, 32, 0.18);
        }

        .input-underline {
          position: absolute;
          left: 50%;
          bottom: -1px;
          height: 2px;
          width: 0;
          background: var(--sodium);
          border-radius: 2px;
          transform: translateX(-50%);
          transition: width 0.3s ease;
        }

        .form-control:focus ~ .input-underline {
          width: 100%;
        }

        .error-message {
          color: var(--stop);
          font-size: 13px;
          margin-bottom: 20px;
          text-align: center;
          background: rgba(226, 83, 74, 0.1);
          padding: 10px;
          border-radius: 8px;
          animation: shake 0.4s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }

        .gate-wrap {
          position: relative;
          height: 50px;
        }

        .btn-login {
          width: 100%;
          height: 100%;
          background: var(--sodium);
          color: var(--deck);
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .btn-login:hover:not(:disabled) {
          background: #ffc250;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(255, 176, 32, 0.3);
        }

        .btn-login:active:not(:disabled) { transform: translateY(0); }

        .btn-login:disabled { cursor: not-allowed; opacity: 0.9; }

        .spinner {
          width: 18px;
          height: 18px;
          border: 3px solid rgba(20, 23, 28, 0.25);
          border-radius: 50%;
          border-top-color: var(--deck);
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .boom-arm {
          position: absolute;
          left: 8px;
          bottom: 50%;
          width: 46%;
          height: 8px;
          border-radius: 4px;
          background: repeating-linear-gradient(
            90deg,
            var(--ink) 0 14px,
            var(--stop) 14px 28px
          );
          transform-origin: left center;
          transform: rotate(0deg);
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transition: transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .gate-wrap.success .boom-arm {
          transform: rotate(-72deg);
        }

        .gate-wrap.success .btn-login {
          background: var(--go);
        }

        .go-text {
          opacity: 0;
          animation: fadeIn 0.3s ease 0.35s forwards;
        }

        @keyframes fadeIn { to { opacity: 1; } }

        @media (prefers-reduced-motion: reduce) {
          .login-card, .background-dark::after, .boom-arm, .btn-login, .go-text {
            animation: none !important;
            transition: none !important;
          }
        }

        @media (max-width: 900px) {
          .background-dark { padding: 16px; }
        }

        @media (max-width: 480px) {
          .login-card { padding: 30px 20px; border-radius: 16px; }
          .brand-word { font-size: 26px; }
        }
      `}</style>

      <div className="login-card">
        <div className="card-header">
          <div className="plate-chip">{mode === 'login' ? 'SECURE ACCESS' : 'NEW ACCOUNT'}</div>
          <h1 className="brand-word">
            PARK <span>FLOW</span>
          </h1>
          <div className="subtitle">{mode === 'login' ? 'Sign in to continue' : 'Create your ParkFlow account'}</div>
        </div>

        {mode === 'login' ? <form onSubmit={handleLogin}>
          {error && <div className="error-message">{error}</div>}
          {notice && <div className="notice-message">{notice}</div>}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrap">
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="you@parkflow.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <span className="input-underline" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <input
                type="password"
                id="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="input-underline" />
            </div>
          </div>

          <div className={`gate-wrap ${status === 'success' ? 'success' : ''}`}>
            <button type="submit" className="btn-login" disabled={status !== 'idle'}>
              {status === 'loading' && <span className="spinner"></span>}
              {status === 'idle' && 'Sign In'}
              {status === 'loading' && 'Verifying'}
              {status === 'success' && <span className="go-text">Access Granted</span>}
            </button>
            <span className="boom-arm" />
          </div>
          <p className="signup-prompt">New to ParkFlow? <button type="button" className="signup-link" onClick={() => switchMode('signup')}>Create an account</button></p>
        </form> : <form onSubmit={handleSignup}>
          {error && <div className="error-message">{error}</div>}
          {notice && <div className="notice-message">{notice}</div>}

          {signupStep === 'details' && <>
            <div className="form-group"><label htmlFor="signup-name">Full Name</label><div className="input-wrap"><input id="signup-name" className="form-control" placeholder="Your name" value={signupName} onChange={(e) => setSignupName(e.target.value)} required /><span className="input-underline" /></div></div>
            <div className="form-group"><label htmlFor="signup-email">Email Address</label><div className="input-wrap"><input type="email" id="signup-email" className="form-control" placeholder="you@example.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required /><span className="input-underline" /></div></div>
            <div className="form-group"><label htmlFor="signup-phone">Phone (optional)</label><div className="input-wrap"><input type="tel" id="signup-phone" className="form-control" placeholder="Phone number" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} /><span className="input-underline" /></div></div>
          </>}
          {signupStep === 'otp' && <div className="form-group"><label htmlFor="signup-otp">Email OTP</label><div className="input-wrap"><input type="text" id="signup-otp" className="form-control" placeholder="Enter 6-digit OTP" value={signupOtp} onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" required /><span className="input-underline" /></div></div>}
          {signupStep === 'password' && <>
            <div className="form-group"><label htmlFor="signup-password">Password</label><div className="input-wrap"><input type="password" id="signup-password" className="form-control" placeholder="At least 8 characters" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} minLength={8} required /><span className="input-underline" /></div></div>
            <div className="form-group"><label htmlFor="signup-confirm-password">Confirm Password</label><div className="input-wrap"><input type="password" id="signup-confirm-password" className="form-control" placeholder="Repeat your password" value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} minLength={8} required /><span className="input-underline" /></div></div>
          </>}

          <div className="gate-wrap">
            <button type="submit" className="btn-login" disabled={status !== 'idle'}>
              {status === 'loading' && <span className="spinner" />}
              {status === 'idle' && signupStep === 'details' && 'Send Verification Code'}
              {status === 'idle' && signupStep === 'otp' && 'Verify Email'}
              {status === 'idle' && signupStep === 'password' && 'Create Account'}
              {status === 'loading' && 'Signing in'}
            </button>
            <span className="boom-arm" />
          </div>
          <p className="signup-prompt">Already have an account? <button type="button" className="signup-link" onClick={() => switchMode('login')}>Sign in</button></p>
        </form>}
      </div>
    </div>
  );
}

export default Login;
