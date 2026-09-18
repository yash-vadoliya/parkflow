// GatekeeperSession.js
import React, { useEffect, useState, useMemo } from 'react';
import {
  FaUserTie, FaMapMarkerAlt, FaEye, FaTimes, FaSignInAlt, FaSignOutAlt,
  FaSearch, FaCalendarAlt, FaClock, FaCircle,
} from 'react-icons/fa';
import { apiRequest, asRows } from '../apiClient';

// ---------- Demo context (replace with real auth) ----------

const PLOTS = {
  101: 'Cyber Towers Basement Parking',
  102: 'Andheri East Open Yard',
  103: 'Whitefield Tech Park Deck',
};

const GATEKEEPERS = [
  { id: 3, name: 'Arjun Reddy', plot_id: 101 },
  { id: 4, name: 'Fatima Sheikh', plot_id: 103 },
  { id: 5, name: 'Vikram Nair', plot_id: 102 },
  { id: 6, name: 'Kiran Das', plot_id: 101 },
];

// current logged-in admin's plot, used when role = 'admin'
const CURRENT_ADMIN_PLOT_ID = 101;
// current logged-in gatekeeper, used when role = 'gatekeeper'
const CURRENT_GATEKEEPER_ID = 3;

// ---------- Dummy session data (mirrors gatekeeper_sessions) ----------

function genSessions(gatekeeperId, plotId, count, daysBack) {
  const sessions = [];
  const now = new Date('2026-08-03T13:20:00');
  for (let i = 0; i < count; i++) {
    const dayOffset = Math.floor(Math.random() * daysBack);
    const loginHour = 8 + Math.floor(Math.random() * 4);
    const shiftLen = 6 + Math.floor(Math.random() * 4);
    const login = new Date(now);
    login.setDate(login.getDate() - dayOffset);
    login.setHours(loginHour, Math.floor(Math.random() * 60), 0, 0);
    const logout = new Date(login);
    logout.setHours(logout.getHours() + shiftLen);
    const isOngoing = dayOffset === 0 && i === 0;
    sessions.push({
      id: `${gatekeeperId}-${i}`,
      gatekeeper_user_id: gatekeeperId,
      plot_id: plotId,
      login_time: login,
      logout_time: isOngoing ? null : logout,
    });
  }
  return sessions.sort((a, b) => b.login_time - a.login_time);
}

// Session history is empty until parking_api exposes a gatekeeper-session endpoint.
const ALL_SESSIONS = [];

const RANGE_OPTIONS = [
  { key: '15d', label: '15 days', days: 15 },
  { key: '1m', label: '1 month', days: 30 },
  { key: '3m', label: '3 months', days: 90 },
  { key: '6m', label: '6 months', days: 180 },
  { key: '1y', label: '1 year', days: 365 },
];

function fmtDateTime(dt) {
  if (!dt) return null;
  return dt.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function durationLabel(login, logout) {
  if (!logout) return 'Ongoing';
  const hrs = (logout - login) / (1000 * 60 * 60);
  return `${hrs.toFixed(1)} hrs`;
}

function GatekeeperSession() {
  // --- demo-only role switcher ---
  const [demoRole, setDemoRole] = useState('super_admin'); // gatekeeper | admin | super_admin

  const [activeGatekeeper, setActiveGatekeeper] = useState(null);
  const [range, setRange] = useState('1m');
  const [search, setSearch] = useState('');
  const [gatekeepers, setGatekeepers] = useState([]);
  const [plotNames, setPlotNames] = useState({});
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    Promise.all([apiRequest('/user'), apiRequest('/parkingplot')])
      .then(([userPayload, plotPayload]) => {
        setGatekeepers(asRows(userPayload).filter((user) => user.role === 'gatekeeper').map((user) => ({
          id: user.user_id,
          name: user.name || user.email,
          plot_id: user.plot_id,
        })));
        setPlotNames(asRows(plotPayload).reduce((result, plot) => ({ ...result, [plot.plot_id]: plot.plot_name }), {}));
      })
      .catch(() => { setGatekeepers([]); setSessions([]); });
  }, []);

  const visibleGatekeepers = useMemo(() => {
    if (demoRole === 'gatekeeper') {
      return gatekeepers.filter((g) => g.id === CURRENT_GATEKEEPER_ID);
    }
    if (demoRole === 'admin') {
      return gatekeepers.filter((g) => g.plot_id === CURRENT_ADMIN_PLOT_ID);
    }
    return gatekeepers;
  }, [demoRole, gatekeepers]);

  const filteredGatekeepers = visibleGatekeepers.filter((g) =>
    g.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const latestSessionFor = (gkId) => sessions.find((s) => s.gatekeeper_user_id === gkId);

  const openHistory = (gk) => {
    setActiveGatekeeper(gk);
    setRange('1m');
  };

  const sessionsForActive = useMemo(() => {
    if (!activeGatekeeper) return [];
    const days = RANGE_OPTIONS.find((r) => r.key === range).days;
    const cutoff = new Date('2026-08-03T13:20:00');
    cutoff.setDate(cutoff.getDate() - days);
    return sessions.filter(
      (s) => s.gatekeeper_user_id === activeGatekeeper.id && s.login_time >= cutoff
    );
  }, [activeGatekeeper, range, sessions]);

  const roleLabel = {
    gatekeeper: 'Gatekeeper (viewing own sessions)',
    admin: `Admin (viewing gatekeepers for ${plotNames[CURRENT_ADMIN_PLOT_ID] || 'your plot'})`,
    super_admin: 'Super admin (viewing all gatekeepers)',
  };

  return (
    <div className="gs-page">
      <style>{`
        :root {
          --deck:       #14171c;
          --deck-panel: #1c2029;
          --deck-line:  rgba(255,255,255,0.08);
          --sodium:     #ffb020;
          --go:         #2bb583;
          --stop:       #e2534a;
          --ink:        #f2f3f5;
          --muted:      #9195a0;
        }

        * { box-sizing: border-box; }

        .gs-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: var(--deck);
          color: var(--ink);
          min-height: 100vh;
          padding: 40px;
        }

        .demo-switcher {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(139,124,246,0.1);
          border: 1px dashed rgba(139,124,246,0.4);
          color: #b6acf9;
          font-size: 12px;
          padding: 8px 14px;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .demo-switcher select {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(139,124,246,0.35);
          color: #b6acf9;
          font-size: 12px;
          font-weight: 600;
          padding: 5px 9px;
          border-radius: 6px;
          outline: none;
          cursor: pointer;
          color-scheme: dark;
        }

        .gs-header {
          margin-bottom: 22px;
        }

        .gs-header h1 {
          font-size: 26px;
          font-weight: 800;
          margin: 0 0 4px;
        }

        .gs-header p {
          color: var(--muted);
          font-size: 14px;
          margin: 0;
        }

        .filter-bar {
          background: var(--deck-panel);
          border: 1px solid var(--deck-line);
          border-radius: 14px;
          padding: 14px 16px;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .filter-search {
          position: relative;
          flex: 1;
          min-width: 200px;
        }

        .filter-search svg {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
          font-size: 13px;
        }

        .filter-search input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--deck-line);
          color: var(--ink);
          padding: 10px 12px 10px 34px;
          border-radius: 9px;
          font-size: 14px;
          outline: none;
          font-family: inherit;
        }

        .filter-search input:focus { border-color: var(--sodium); }

        /* ---------- Gatekeeper grid ---------- */
        .gk-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .gk-card {
          background: var(--deck-panel);
          border: 1px solid var(--deck-line);
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          animation: cardIn 0.3s ease;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .gk-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.2);
          border-color: var(--sodium);
        }

        .gk-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .gk-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(255,176,32,0.14);
          color: var(--sodium);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .gk-name { font-size: 15px; font-weight: 700; margin: 0; }
        .gk-plot { font-size: 12px; color: var(--muted); display: flex; align-items: center; gap: 5px; margin: 2px 0 0; }
        .gk-plot svg { color: var(--sodium); font-size: 10px; }

        .gk-status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--deck-line);
          border-radius: 10px;
          padding: 10px 12px;
          margin-bottom: 14px;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .live-dot.on { background: var(--go); animation: pulse 2s ease-in-out infinite; }
        .live-dot.off { background: var(--muted); }

        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(43,181,131,0.4); }
          50% { opacity: 0.7; box-shadow: 0 0 0 4px rgba(43,181,131,0); }
        }

        .status-text {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-text.on { color: var(--go); }
        .status-text.off { color: var(--muted); }

        .last-time { font-size: 11px; color: var(--muted); font-family: 'Space Mono', monospace; }

        .btn-view {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: transparent;
          border: 1px solid var(--deck-line);
          color: var(--ink);
          font-size: 13px;
          font-weight: 600;
          padding: 9px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s ease;
        }

        .btn-view:hover { border-color: var(--sodium); color: var(--sodium); }

        .empty-state {
          padding: 60px 20px;
          text-align: center;
          color: var(--muted);
        }

        /* ---------- Modal ---------- */
        .gs-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10,11,13,0.6);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 20px;
          opacity: 0;
          animation: overlayIn 0.25s ease forwards;
        }

        @keyframes overlayIn { to { opacity: 1; } }

        .gs-modal {
          background: rgba(28,32,41,0.94);
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          border: 1px solid var(--deck-line);
          border-radius: 18px;
          width: 100%;
          max-width: 620px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0,0,0,0.45);

          opacity: 0;
          transform: translateY(20px) scale(0.98);
          animation: modalIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards;
        }

        @keyframes modalIn { to { opacity: 1; transform: translateY(0) scale(1); } }

        .gs-modal-header {
          position: sticky;
          top: 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 22px 26px 16px;
          background: rgba(28,32,41,0.96);
          border-bottom: 1px solid var(--deck-line);
          z-index: 1;
        }

        .gs-modal-header h2 { font-size: 18px; font-weight: 800; margin: 0 0 4px; }
        .gs-modal-header .sub { font-size: 12px; color: var(--muted); display: flex; align-items: center; gap: 6px; }

        .btn-close {
          background: rgba(255,255,255,0.06);
          border: none;
          color: var(--ink);
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .btn-close:hover { background: rgba(255,255,255,0.12); transform: rotate(90deg); }

        .gs-modal-body { padding: 20px 26px 26px; }

        .range-tabs {
          display: flex;
          gap: 6px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .range-tab {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--deck-line);
          color: var(--muted);
          font-size: 12px;
          font-weight: 600;
          padding: 7px 13px;
          border-radius: 20px;
          cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
        }

        .range-tab.active {
          border-color: var(--sodium);
          color: var(--sodium);
          background: rgba(255,176,32,0.1);
        }

        .session-count {
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 14px;
        }

        .session-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 380px;
          overflow-y: auto;
        }

        .session-row {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--deck-line);
          border-radius: 10px;
          padding: 12px 14px;
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 10px;
          align-items: center;
          animation: rowIn 0.2s ease;
        }

        @keyframes rowIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .session-row.ongoing {
          border-color: rgba(43,181,131,0.4);
          background: rgba(43,181,131,0.06);
        }

        .session-time-block .lbl {
          font-size: 10px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          display: flex;
          align-items: center;
          gap: 4px;
          margin: 0 0 3px;
        }

        .session-time-block .val {
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          font-weight: 600;
        }

        .session-duration {
          font-size: 12px;
          font-weight: 700;
          color: var(--sodium);
          text-align: right;
          white-space: nowrap;
        }

        .session-duration.ongoing-tag {
          color: var(--go);
          display: flex;
          align-items: center;
          gap: 5px;
          justify-content: flex-end;
        }

        .empty-note {
          padding: 40px 10px;
          text-align: center;
          color: var(--muted);
          font-size: 13px;
        }

        @media (prefers-reduced-motion: reduce) {
          .gs-overlay, .gs-modal, .gk-card, .session-row, .live-dot.on, .btn-close { animation: none !important; transition: none !important; }
        }

        @media (max-width: 1024px) {
          .gs-page { padding: 24px; }
          .gk-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
        }

        @media (max-width: 640px) {
          .gs-page { padding: 20px; }
          .session-row { grid-template-columns: 1fr; }
          .session-duration { text-align: left; }
        }
      `}</style>

      <div className="demo-switcher">
        Demo — viewing as:
        <select value={demoRole} onChange={(e) => setDemoRole(e.target.value)}>
          <option value="gatekeeper">Gatekeeper</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super admin</option>
        </select>
        <span style={{ color: 'var(--muted)' }}>· replace with real auth context</span>
      </div>

      <div className="gs-header">
        <h1>Gatekeeper sessions</h1>
        <p>{roleLabel[demoRole]}</p>
      </div>

      {demoRole !== 'gatekeeper' && (
        <div className="filter-bar">
          <div className="filter-search">
            <FaSearch />
            <input
              placeholder="Search gatekeeper by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {filteredGatekeepers.length ? (
        <div className="gk-grid">
          {filteredGatekeepers.map((gk) => {
            const latest = latestSessionFor(gk.id);
            const isOnline = latest && !latest.logout_time;
            const initials = gk.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

            return (
              <div className="gk-card" key={gk.id} onClick={() => openHistory(gk)}>
                <div className="gk-top">
                  <div className="gk-avatar">{initials}</div>
                  <div>
                    <p className="gk-name">{gk.name}</p>
                    <p className="gk-plot"><FaMapMarkerAlt />{PLOTS[gk.plot_id]}</p>
                  </div>
                </div>

                <div className="gk-status-row">
                  <span className={`status-text ${isOnline ? 'on' : 'off'}`}>
                    <span className={`live-dot ${isOnline ? 'on' : 'off'}`}></span>
                    {isOnline ? 'On duty' : 'Off duty'}
                  </span>
                  <span className="last-time">
                    {isOnline
                      ? `since ${fmtDateTime(latest.login_time).split(',')[1]}`
                      : latest
                        ? `last: ${fmtDateTime(latest.logout_time)}`
                        : 'No sessions yet'}
                  </span>
                </div>

                <button className="btn-view" onClick={(e) => { e.stopPropagation(); openHistory(gk); }}>
                  <FaEye /> View session history
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <FaUserTie style={{ fontSize: 24, marginBottom: 10 }} />
          <p>No gatekeepers found.</p>
        </div>
      )}

      {activeGatekeeper && (
        <div className="gs-overlay" onClick={() => setActiveGatekeeper(null)}>
          <div className="gs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gs-modal-header">
              <div>
                <h2>{activeGatekeeper.name}</h2>
                <div className="sub"><FaMapMarkerAlt />{PLOTS[activeGatekeeper.plot_id]}</div>
              </div>
              <button className="btn-close" onClick={() => setActiveGatekeeper(null)} aria-label="Close">
                <FaTimes />
              </button>
            </div>

            <div className="gs-modal-body">
              <div className="range-tabs">
                {RANGE_OPTIONS.map((r) => (
                  <button
                    key={r.key}
                    className={`range-tab ${range === r.key ? 'active' : ''}`}
                    onClick={() => setRange(r.key)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="session-count">
                {sessionsForActive.length} session{sessionsForActive.length !== 1 ? 's' : ''} in this period
              </div>

              {sessionsForActive.length ? (
                <div className="session-list">
                  {sessionsForActive.map((s) => {
                    const ongoing = !s.logout_time;
                    return (
                      <div className={`session-row ${ongoing ? 'ongoing' : ''}`} key={s.id}>
                        <div className="session-time-block">
                          <p className="lbl"><FaSignInAlt />Login</p>
                          <p className="val">{fmtDateTime(s.login_time)}</p>
                        </div>
                        <div className="session-time-block">
                          <p className="lbl"><FaSignOutAlt />Logout</p>
                          <p className="val">{s.logout_time ? fmtDateTime(s.logout_time) : '—'}</p>
                        </div>
                        {ongoing ? (
                          <span className="session-duration ongoing-tag">
                            <FaCircle style={{ fontSize: 7 }} /> Ongoing
                          </span>
                        ) : (
                          <span className="session-duration">{durationLabel(s.login_time, s.logout_time)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-note">
                  <FaClock style={{ fontSize: 20, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                  No sessions in this time range.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GatekeeperSession;
