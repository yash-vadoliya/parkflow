import React, { useEffect, useState } from 'react';
import { FaCar, FaCheckCircle, FaTimesCircle, FaParking } from 'react-icons/fa';
import { loadParkingReferenceData } from '../liveParkingData';

function Dashboard() {
  const [plots, setPlots] = useState([]);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    loadParkingReferenceData()
      .then(({ plots: livePlots }) => setPlots(livePlots))
      .catch((error) => setLoadError(error.message));
  }, []);
  const totalSlots = plots.length;
  const availableSlots = plots.filter((plot) => plot.approved).length;
  const occupiedSlots = 0;
  const occupancyPct = totalSlots ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

  const activity = [
    { plate: 'XYZ 1234', status: 'entry', time: 'Just now', duration: '—' },
    { plate: 'ABC 9876', status: 'exit', time: '5 mins ago', duration: '2h 15m' },
    { plate: 'DEF 5544', status: 'entry', time: '12 mins ago', duration: '—' },
    { plate: 'LMN 1122', status: 'exit', time: '25 mins ago', duration: '4h 30m' },
  ];
  const liveActivity = plots.map((plot) => ({
    plate: plot.name,
    status: plot.approved ? 'entry' : 'exit',
    time: plot.city_name || 'Live plot',
    duration: plot.area_name || '—',
  }));

  return (
    <main className="dashboard-content">
      <style>{`
        :root {
          --deck:       #14171c;
          --deck-panel: #1c2029;
          --deck-line:  rgba(255,255,255,0.06);
          --sodium:     #ffb020;   /* sodium-vapor garage lighting */
          --go:         #2bb583;
          --stop:       #e2534a;
          --ink:        #f2f3f5;
          --muted:      #8b8f97;
        }

        .dashboard-content {
          padding: 40px;
          color: var(--ink);
          width: 100%;
          font-family: 'Inter', sans-serif;
        }

        .page-header { margin-bottom: 30px; }

        .page-header .eyebrow {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
          color: var(--sodium);
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .page-header h1 {
          font-size: 28px;
          margin: 0 0 4px 0;
          font-weight: 800;
          letter-spacing: -0.01em;
        }

        .page-header p {
          color: var(--muted);
          margin: 0;
          font-size: 15px;
        }

        /* ---------- Signature: barrier-arm occupancy gauge ---------- */
        .gauge-section {
          background: var(--deck-panel);
          border: 1px solid var(--deck-line);
          border-radius: 16px;
          padding: 24px 28px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .gauge-top {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 14px;
        }

        .gauge-top h2 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--muted);
        }

        .gauge-top .gauge-pct {
          font-family: 'Space Mono', monospace;
          font-size: 20px;
          font-weight: 700;
          color: var(--sodium);
        }

        .gauge-track {
          position: relative;
          height: 22px;
          border-radius: 6px;
          background:
            repeating-linear-gradient(
              135deg,
              rgba(255,255,255,0.9) 0 14px,
              var(--deck) 14px 28px
            );
          overflow: hidden;
          border: 1px solid var(--deck-line);
        }

        .gauge-fill {
          position: absolute;
          top: 0; left: 0; bottom: 0;
          background:
            repeating-linear-gradient(
              135deg,
              var(--stop) 0 14px,
              #b23a33 14px 28px
            );
          transition: width 0.4s ease;
        }

        .gauge-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          font-size: 13px;
          color: var(--muted);
        }

        .gauge-labels strong { color: var(--ink); }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: var(--deck-panel);
          border: 1px solid var(--deck-line);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.22);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          position: relative;
        }

        /* LED-style ring glow instead of flat tint square */
        .stat-icon.total     { background: rgba(255,176,32,0.12); color: var(--sodium); box-shadow: 0 0 0 3px rgba(255,176,32,0.15); }
        .stat-icon.available { background: rgba(43,181,131,0.12); color: var(--go);     box-shadow: 0 0 0 3px rgba(43,181,131,0.15); }
        .stat-icon.occupied  { background: rgba(226,83,74,0.12);  color: var(--stop);   box-shadow: 0 0 0 3px rgba(226,83,74,0.15); }

        .stat-info h3 {
          margin: 0;
          font-size: 27px;
          font-weight: 800;
          font-family: 'Space Mono', monospace;
        }

        .stat-info p {
          margin: 4px 0 0 0;
          color: var(--muted);
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* ---------- Recent Activity: ticket-stub rows ---------- */
        .activity-section {
          background: var(--deck-panel);
          border: 1px solid var(--deck-line);
          border-radius: 16px;
          padding: 24px 28px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .activity-section h2 {
          margin: 0 0 18px 0;
          font-size: 16px;
          font-weight: 700;
        }

        .ticket-row {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr 1fr;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px dashed var(--deck-line);
        }

        .ticket-row:last-child { border-bottom: none; }

        .ticket-row .plate {
          font-family: 'Space Mono', monospace;
          font-weight: 700;
          letter-spacing: 0.08em;
          font-size: 14px;
        }

        .ticket-row .col-label {
          display: none;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          width: fit-content;
        }

        .badge::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .badge.entry { background: rgba(43,181,131,0.12); color: var(--go); }
        .badge.exit  { background: rgba(226,83,74,0.12);  color: var(--stop); }

        .ticket-row .time,
        .ticket-row .duration {
          font-size: 14px;
          color: var(--muted);
        }

        .head-row {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr 1fr;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--deck-line);
          margin-bottom: 4px;
        }

        .head-row span {
          color: var(--muted);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        @media (max-width: 1024px) {
          .dashboard-content { padding: 24px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .dashboard-content { padding: 20px; padding-top: 70px; }
          .stats-grid { grid-template-columns: 1fr; }
          .head-row { display: none; }
          .ticket-row {
            grid-template-columns: 1fr 1fr;
            row-gap: 6px;
          }
          .ticket-row .col-label {
            display: inline;
            color: var(--muted);
            font-size: 11px;
            text-transform: uppercase;
            margin-right: 6px;
          }
        }
      `}</style>

      <div className="page-header">
        <div className="eyebrow">
          <FaParking style={{ marginRight: 6 }} />
          Live Facility Status
        </div>
        <h1>Dashboard Overview</h1>
        <p>Real-time occupancy across your parking facilities</p>
      </div>

      <div className="gauge-section">
        <div className="gauge-top">
          <h2>Facility Occupancy</h2>
          <span className="gauge-pct">{occupancyPct}%</span>
        </div>
        <div className="gauge-track">
          <div className="gauge-fill" style={{ width: `${occupancyPct}%` }} />
        </div>
        <div className="gauge-labels">
          <span><strong>{occupiedSlots}</strong> occupied</span>
          <span><strong>{availableSlots}</strong> available of <strong>{totalSlots}</strong> total</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total"><FaCar /></div>
          <div className="stat-info">
            <h3>{totalSlots}</h3>
            <p>Total Slots</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon available"><FaCheckCircle /></div>
          <div className="stat-info">
            <h3>{availableSlots}</h3>
            <p>Available Slots</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon occupied"><FaTimesCircle /></div>
          <div className="stat-info">
            <h3>{occupiedSlots}</h3>
            <p>Occupied Slots</p>
          </div>
        </div>
      </div>

      <div className="activity-section">
        <h2>Recent Activity</h2>

        <div className="head-row">
          <span>Vehicle Plate</span>
          <span>Status</span>
          <span>Time</span>
          <span>Duration</span>
        </div>

        {liveActivity.map((row, i) => (
          <div className="ticket-row" key={i}>
            <div className="plate">{row.plate}</div>
            <div>
              <span className={`badge ${row.status}`}>
                {row.status === 'entry' ? 'Entry' : 'Exit'}
              </span>
            </div>
            <div className="time">
              <span className="col-label">Time</span>{row.time}
            </div>
            <div className="duration">
              <span className="col-label">Duration</span>{row.duration}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default Dashboard;
