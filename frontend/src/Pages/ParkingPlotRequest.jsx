// ParkingPlotRequest.js
import React, { useState, useMemo, useEffect } from 'react';
import {
  FaMapMarkerAlt, FaEye, FaTimes, FaSearch, FaFilter, FaUndo,
  FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaUserShield, FaClock,
} from 'react-icons/fa';
import { apiRequest, asRows } from '../apiClient';

const STATUS_META = {
  pending: { label: 'Pending', color: 'var(--sodium)', icon: FaHourglassHalf },
  approved: { label: 'Approved', color: 'var(--go)', icon: FaCheckCircle },
  rejected: { label: 'Rejected', color: 'var(--stop)', icon: FaTimesCircle },
};

const emptyFilters = { search: '', city_id: 'all', status: 'all' };

function ParkingPlotRequest() {
  const [requests, setRequests] = useState([]);
  const [cities, setCities] = useState({});
  const [areas, setAreas] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeReq, setActiveReq] = useState(null);
  const [remarksDraft, setRemarksDraft] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const [toast, setToast] = useState(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const [plotPayload, cityPayload, areaPayload] = await Promise.all([
        apiRequest('/parkingplot'), apiRequest('/city'), apiRequest('/area'),
      ]);
      const plots = asRows(plotPayload);
      setRequests(plots.filter((plot) => !Boolean(plot.approved)).map((plot) => ({
        ...plot,
        id: plot.plot_id,
        requested_name: plot.plot_name,
        status: 'pending',
      })));
      setCities(Object.fromEntries(asRows(cityPayload).map((city) => [city.city_id, city.name])));
      setAreas(Object.fromEntries(asRows(areaPayload).map((area) => [area.area_id, area.area_name])));
    } catch (error) {
      setToast(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const quickApprove = async (req, e) => {
    e.stopPropagation();
    try {
      await apiRequest(`/parkingplot/${req.plot_id}`, { method: 'PUT', body: JSON.stringify({ plot_name: req.plot_name, address: req.address, area_id: req.area_id, approved: true }) });
      await loadRequests();
      setToast(`"${req.requested_name}" approved`);
    } catch (error) { setToast(error.message); }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesSearch = (r.requested_name || '').toLowerCase().includes(filters.search.trim().toLowerCase());
      const matchesCity = filters.city_id === 'all' || String(r.city_id) === filters.city_id;
      const matchesStatus = filters.status === 'all' || r.status === filters.status;
      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [requests, filters]);

  const hasActiveFilters = filters.search || filters.city_id !== 'all' || filters.status !== 'all';
  const clearFilters = () => setFilters(emptyFilters);

  const pendingCount = requests.length;

  const openRequest = (req) => {
    setActiveReq(req);
    setRemarksDraft(req.remarks || '');
  };

  const decide = async (decision) => {
    if (decision !== 'approved') {
      setToast('The current API supports approving a plot, but not rejecting one.');
      return;
    }
    try {
      await apiRequest(`/parkingplot/${activeReq.plot_id}`, { method: 'PUT', body: JSON.stringify({ plot_name: activeReq.plot_name, address: activeReq.address, area_id: activeReq.area_id, approved: true }) });
      setActiveReq(null);
      await loadRequests();
    } catch (error) { setToast(error.message); }
  };

  return (
    <div className="ppr-page">
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

        .ppr-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: var(--deck);
          color: var(--ink);
          min-height: 100vh;
          padding: 40px;
        }

        .ppr-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 26px;
          flex-wrap: wrap;
          gap: 14px;
        }

        .ppr-header h1 {
          font-size: 26px;
          font-weight: 800;
          margin: 0 0 4px;
        }

        .ppr-header p {
          color: var(--muted);
          font-size: 14px;
          margin: 0;
        }

        .pending-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,176,32,0.12);
          color: var(--sodium);
          font-size: 13px;
          font-weight: 700;
          padding: 9px 16px;
          border-radius: 10px;
        }

        .pending-chip .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--sodium);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(255,176,32,0.4); }
          50% { opacity: 0.7; box-shadow: 0 0 0 4px rgba(255,176,32,0); }
        }

        .action-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-quick-approve {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(43,181,131,0.14);
  border: 1px solid rgba(43,181,131,0.4);
  color: var(--go);
  font-size: 13px;
  font-weight: 600;
  padding: 7px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
}

.btn-quick-approve:hover {
  background: rgba(43,181,131,0.24);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(43,181,131,0.2);
}

.btn-quick-approve:active {
  transform: scale(0.96);
}

.toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(28,32,41,0.95);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(43,181,131,0.4);
  color: var(--go);
  font-size: 14px;
  font-weight: 600;
  padding: 12px 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.35);
  z-index: 300;

  opacity: 0;
  animation: toastIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards,
             toastOut 0.3s ease 2.2s forwards;
}

@keyframes toastIn {
  from { opacity: 0; transform: translate(-50%, 12px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

@keyframes toastOut {
  to { opacity: 0; transform: translate(-50%, 12px); }
}

@media (prefers-reduced-motion: reduce) {
  .toast, .btn-quick-approve { animation: none !important; transition: none !important; }
}

        /* ---------- Filter bar ---------- */
        .filter-bar {
          background: var(--deck-panel);
          border: 1px solid var(--deck-line);
          border-radius: 14px;
          padding: 16px 18px;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
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
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .filter-search input:focus {
          border-color: transparent;
          box-shadow: 0 0 0 3px rgba(255,176,32,0.18);
        }

        .filter-select {
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--deck-line);
          color: var(--ink);
          padding: 10px 12px;
          border-radius: 9px;
          font-size: 13px;
          font-family: inherit;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s ease;
          color-scheme: dark;
        }

        .filter-select:focus {
          border-color: var(--sodium);
        }

        .filter-select option {
          background: var(--deck-panel);
          color: var(--ink);
        }

        .btn-clear {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: var(--muted);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 10px;
          border-radius: 8px;
          transition: color 0.2s ease, background 0.2s ease;
        }

        .btn-clear:hover {
          color: var(--stop);
          background: rgba(226,83,74,0.08);
        }

        .results-line {
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* ---------- Table ---------- */
        .ppr-table-wrap {
          background: var(--deck-panel);
          border: 1px solid var(--deck-line);
          border-radius: 16px;
          overflow-x: auto;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        table.ppr-table { min-width: 640px; }

        table.ppr-table {
          width: 100%;
          border-collapse: collapse;
        }

        .ppr-table th {
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          padding: 16px 20px;
          border-bottom: 1px solid var(--deck-line);
        }

        .ppr-table td {
          padding: 16px 20px;
          font-size: 14px;
          border-bottom: 1px solid var(--deck-line);
          vertical-align: middle;
        }

        .ppr-table tbody tr {
          transition: background 0.2s ease;
          animation: rowIn 0.25s ease;
        }

        @keyframes rowIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ppr-table tbody tr:hover {
          background: rgba(255,255,255,0.03);
        }

        .ppr-table tbody tr:last-child td {
          border-bottom: none;
        }

        .req-name {
          font-weight: 600;
        }

        .req-address {
          color: var(--muted);
        }

        .req-city {
          color: var(--muted);
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .status-pill::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .btn-view {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: 1px solid var(--deck-line);
          color: var(--ink);
          font-size: 13px;
          font-weight: 600;
          padding: 7px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: border-color 0.2s ease, transform 0.2s ease;
        }

        .btn-view:hover {
          border-color: var(--sodium);
          color: var(--sodium);
          transform: translateY(-1px);
        }

        .empty-state {
          padding: 60px 20px;
          text-align: center;
          color: var(--muted);
        }

        .empty-state svg {
          font-size: 26px;
          margin-bottom: 10px;
          color: var(--muted);
        }

        .empty-state p {
          margin: 0 0 14px;
          font-size: 14px;
        }

        /* ---------- Modal shell ---------- */
        .ppr-overlay {
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

        .ppr-modal {
          background: rgba(28,32,41,0.92);
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

        @keyframes modalIn {
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .ppr-modal-header {
          position: sticky;
          top: 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 24px 28px 16px;
          background: rgba(28,32,41,0.95);
          border-bottom: 1px solid var(--deck-line);
          z-index: 1;
        }

        .ppr-modal-header h2 {
          font-size: 19px;
          font-weight: 800;
          margin: 0 0 4px;
        }

        .ppr-modal-header .sub {
          font-size: 13px;
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-close {
          background: rgba(255,255,255,0.06);
          border: none;
          color: var(--ink);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .btn-close:hover {
          background: rgba(255,255,255,0.12);
          transform: rotate(90deg);
        }

        .ppr-modal-body {
          padding: 22px 28px 30px;
        }

        .mb-section { margin-bottom: 26px; }

        .mb-section h3 {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--sodium);
          margin: 0 0 14px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
        }

        .detail-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--deck-line);
          border-radius: 10px;
          padding: 12px 14px;
        }

        .detail-item .lbl {
          font-size: 11px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0 0 4px;
        }

        .detail-item .val {
          font-size: 14px;
          font-weight: 600;
        }

        .status-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 12px;
          margin-bottom: 22px;
        }

        .status-banner svg {
          font-size: 20px;
          flex-shrink: 0;
        }

        .status-banner .title {
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 2px;
        }

        .status-banner .meta {
          font-size: 12px;
          color: var(--muted);
          margin: 0;
        }

        .remarks-box textarea {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--deck-line);
          color: var(--ink);
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          resize: vertical;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .remarks-box textarea:focus {
          border-color: transparent;
          box-shadow: 0 0 0 3px rgba(255,176,32,0.18);
        }

        .remarks-readonly {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.6;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--deck-line);
          border-radius: 10px;
          padding: 14px;
        }

        .decision-row {
          display: flex;
          gap: 12px;
          margin-top: 14px;
        }

        .btn-approve, .btn-reject {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          padding: 12px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .btn-approve {
          background: var(--go);
          color: #06251b;
        }

        .btn-approve:hover {
          background: #34c793;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(43,181,131,0.3);
        }

        .btn-reject {
          background: rgba(226,83,74,0.14);
          color: var(--stop);
          border: 1px solid rgba(226,83,74,0.35);
        }

        .btn-reject:hover {
          background: rgba(226,83,74,0.22);
          transform: translateY(-2px);
        }

        @media (prefers-reduced-motion: reduce) {
          .ppr-overlay, .ppr-modal, .btn-close, .ppr-table tbody tr, .pending-chip .dot {
            animation: none !important; transition: none !important;
          }
        }

        @media (max-width: 1024px) {
          .ppr-page { padding: 24px; }
        }

        @media (max-width: 640px) {
          .ppr-page { padding: 20px; }
          .filter-bar { flex-direction: column; align-items: stretch; }
          .ppr-table th:nth-child(3), .ppr-table td:nth-child(3) { display: none; }
          .decision-row { flex-direction: column; }
        }
      `}</style>

      <div className="ppr-header">
        <div>
          <h1>Parking plot requests</h1>
          <p>New facility submissions awaiting review before they go live.</p>
        </div>
        <div className="pending-chip">
          <span className="dot"></span>
          {pendingCount} pending review
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <FaSearch />
          <input
            placeholder="Search by requested name"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <select
          className="filter-select"
          value={filters.city_id}
          onChange={(e) => setFilters({ ...filters, city_id: e.target.value })}
        >
          <option value="all">All cities</option>
          {Object.entries(cities).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="all">All statuses</option>
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button className="btn-clear" onClick={clearFilters}>
            <FaUndo /> Clear
          </button>
        )}
      </div>

      <div className="results-line">
        <FaFilter style={{ fontSize: 11 }} />
        Showing {filteredRequests.length} of {requests.length} pending requests
      </div>

      <div className="ppr-table-wrap">
        {loading ? (
          <div className="empty-state"><p>Loading records...</p></div>
        ) : filteredRequests.length ? (
          <table className="ppr-table">
            <thead>
              <tr>
                <th>Requested name</th>
                <th>Address</th>
                <th>City</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => {
                const meta = STATUS_META.pending;
                return (
                  <tr key={req.id}>
                    <td className="req-name">{req.requested_name}</td>
                    <td className="req-address">{req.address || '—'}</td>
                    <td>
                      <span className="req-city"><FaMapMarkerAlt style={{ fontSize: 11 }} />{cities[req.city_id] || '—'}</span>
                    </td>
                    <td>
                      <span className="status-pill" style={{ color: meta.color, background: `${meta.color}1f` }}>
                        {meta.label}
                      </span>
                    </td>
                    <td>
                      <td>
                        <div className="action-cell">
                          {req.status === 'pending' && (
                            <button className="btn-quick-approve" onClick={(e) => quickApprove(req, e)}>
                              <FaCheckCircle /> Approve
                            </button>
                          )}
                          <button className="btn-view" onClick={() => openRequest(req)}>
                            <FaEye /> View
                          </button>
                        </div>
                      </td>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <FaSearch />
            <p>No requests match your filters.</p>
            <button className="btn-view" onClick={clearFilters}>Clear filters</button>
          </div>
        )}
      </div>

      {toast && (
        <div className="toast">
          <FaCheckCircle /> {toast}
        </div>
      )}

      {activeReq && (
        <div className="ppr-overlay" onClick={() => setActiveReq(null)}>
          <div className="ppr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ppr-modal-header">
              <div>
                <h2>{activeReq.requested_name}</h2>
                <div className="sub">
                  <FaMapMarkerAlt /> {areas[activeReq.area_id] || '—'}, {cities[activeReq.city_id] || '—'}
                </div>
              </div>
              <button className="btn-close" onClick={() => setActiveReq(null)} aria-label="Close">
                <FaTimes />
              </button>
            </div>

            <div className="ppr-modal-body">
              {(() => {
                const meta = STATUS_META[activeReq.status];
                const Icon = meta.icon;
                return (
                  <div className="status-banner" style={{ background: `${meta.color}1a`, border: `1px solid ${meta.color}40` }}>
                    <Icon style={{ color: meta.color }} />
                    <div>
                      <p className="title" style={{ color: meta.color }}>{meta.label}</p>
                      <p className="meta">
                        {activeReq.reviewed_at
                          ? <>Reviewed {activeReq.reviewed_at}</>
                          : 'Awaiting admin review'}
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div className="mb-section">
                <h3>Request details</h3>
                <div className="detail-grid">
                  <div className="detail-item"><p className="lbl">Request ID</p><p className="val">#{activeReq.id}</p></div>
                  <div className="detail-item"><p className="lbl">Owner ID</p><p className="val">#{activeReq.owner_id}</p></div>
                  <div className="detail-item"><p className="lbl">City</p><p className="val">{cities[activeReq.city_id] || '—'}</p></div>
                  <div className="detail-item"><p className="lbl">Area</p><p className="val">{areas[activeReq.area_id] || '—'}</p></div>
                  <div className="detail-item"><p className="lbl">Coordinates</p><p className="val">{activeReq.latitude && activeReq.longitude ? `${activeReq.latitude}, ${activeReq.longitude}` : 'Not provided'}</p></div>
                  <div className="detail-item"><p className="lbl">Submitted</p><p className="val"><FaClock style={{ marginRight: 6, color: 'var(--sodium)', fontSize: 12 }} />{activeReq.created_at}</p></div>
                </div>
              </div>

              <div className="mb-section">
                <h3>Address</h3>
                <div className="remarks-readonly">{activeReq.address || 'No address provided.'}</div>
              </div>

              <div className="mb-section remarks-box">
                <h3>
                  {activeReq.status === 'pending' ? 'Review remarks' : 'Remarks'}
                </h3>
                {activeReq.status === 'pending' ? (
                  <>
                    <textarea
                      rows={3}
                      placeholder="Add a note for approval or rejection..."
                      value={remarksDraft}
                      onChange={(e) => setRemarksDraft(e.target.value)}
                    />
                    <div className="decision-row">
                      <button className="btn-approve" onClick={() => decide('approved')}>
                        <FaCheckCircle /> Approve
                      </button>
                      <button className="btn-reject" onClick={() => decide('rejected')}>
                        <FaTimesCircle /> Reject
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="remarks-readonly">
                    {activeReq.remarks || 'No remarks were recorded for this decision.'}
                  </div>
                )}
              </div>

              {activeReq.status !== 'pending' && (
                <div className="mb-section">
                  <h3>Reviewed by</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <p className="lbl">Admin</p>
                      <p className="val"><FaUserShield style={{ marginRight: 6, color: 'var(--sodium)', fontSize: 12 }} />{activeReq.reviewed_by_uid || '—'}</p>
                    </div>
                    <div className="detail-item">
                      <p className="lbl">Reviewed at</p>
                      <p className="val">{activeReq.reviewed_at}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParkingPlotRequest;
