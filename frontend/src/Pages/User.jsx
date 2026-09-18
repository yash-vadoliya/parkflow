// User.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  FaUserShield, FaUserTie, FaSearch, FaFilter, FaUndo,
  FaEye, FaTimes, FaCalendarAlt, FaMapMarkerAlt,
  FaCheckCircle, FaBan, FaPlus, FaEdit, FaTrash, FaSpinner, FaUser
} from 'react-icons/fa';
import CONFIG from '../Config'; // adjust the relative path to match your project structure
import { apiRequest, asRows } from '../apiClient';

// NOTE: your /adminuser routes only cover the admin-table roles
// (superadmin, admin, gatekeeper) — customer "user" accounts who book
// parking live in a different table/endpoint, so that role tab has
// been removed here. Wire it up separately once you have that route.

const ROLE_META = {
  super_admin: { label: 'Super Admin', color: '#8b7cf6', icon: FaUserShield },
  superadmin: { label: 'Super Admin', color: '#8b7cf6', icon: FaUserShield },
  admin: { label: 'Admin', color: 'var(--sodium)', icon: FaUserShield },
  gatekeeper: { label: 'Gatekeeper', color: 'var(--go)', icon: FaUserTie },
  end_user: { label: 'End User', color: 'var(--muted)', icon: FaUser },
  user: { label: 'User', color: 'var(--muted)', icon: FaUser },
};

const STATUS_META = {
  active: { label: 'Active', color: 'var(--go)' },
  inactive: { label: 'Inactive', color: 'var(--muted)' },
  blocked: { label: 'Blocked', color: 'var(--stop)' },
};

const emptyFilters = { search: '', role: 'all', status: 'all' };
const emptyForm = { email: '', password: '', password_confirmation: '', phone: '', name: '', user_role: 'admin', plot_id: '', verificationToken: '' };

// Maps a raw DB row (user_id, username, password, role, plot_id, token, ...)
// to the shape this page works with. Adjust the fallbacks here if your
// controller names columns differently.
function normalizeUser(row) {
  const rawRole = String(row.user_role || row.role || '').toLowerCase();
  const userRole = rawRole === 'super_admin' ? 'superadmin' : ['end_user', 'end user'].includes(rawRole) ? 'user' : rawRole;
  return {
    id: row.user_id ?? row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    user_role: userRole,
    plot_id: row.plot_id ?? null,
    status: row.status ?? 'active',
    created_at: row.created_at ?? row.createdAt ?? null,
  };
}

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function User() {
  const [users, setUsers] = useState([]);
  const [plotNames, setPlotNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [activeUser, setActiveUser] = useState(null); // view modal
  const [editingUser, setEditingUser] = useState(null); // edit modal (null = closed, {} = add mode)
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [verificationStep, setVerificationStep] = useState('details'); // details | otp | verified
  const [verificationOtp, setVerificationOtp] = useState('');

  const [filters, setFilters] = useState(emptyFilters);

  // Only superadmin can add/edit/delete — matches authorizeRoles('superadmin')
  // on the POST/PUT routes. admin can still view (GET allows both).
  const currentRole = localStorage.getItem('role');
  const canManage = ['super_admin', 'superadmin', 'admin'].includes(currentRole);
  const allowedCreateRoles = ['super_admin', 'superadmin'].includes(currentRole)
    ? ['superadmin', 'admin', 'gatekeeper']
    : currentRole === 'admin' ? ['admin', 'gatekeeper'] : [];

  const loadUsers = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/user`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to load users.');
      }
      const rows = Array.isArray(data) ? data : data.users || data.data || [];
      setUsers(rows.map(normalizeUser));
      console.log(rows);
    } catch (err) {
      setLoadError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiRequest('/parkingplot')
      .then((payload) => setPlotNames(Object.fromEntries(asRows(payload).map((plot) => [plot.plot_id, plot.plot_name]))))
      .catch(() => setPlotNames({}));
  }, []);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = `${u.name || ''} ${u.email || ''}`.toLowerCase().includes(filters.search.trim().toLowerCase());
      const matchesRole = filters.role === 'all' || u.user_role === filters.role;
      const matchesStatus = filters.status === 'all' || u.status === filters.status;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, filters]);

  const hasActiveFilters = filters.search || filters.role !== 'all' || filters.status !== 'all';
  const clearFilters = () => setFilters(emptyFilters);
  const setRole = (role) => setFilters({ ...filters, role });

  const roleCounts = {
    all: users.length,
    superadmin: users.filter((u) => ['super_admin', 'superadmin'].includes(u.user_role)).length,
    admin: users.filter((u) => u.user_role === 'admin').length,
    gatekeeper: users.filter((u) => u.user_role === 'gatekeeper').length,
    user: users.filter((u) => u.user_role === 'user').length,
  };


  // ---------- Add / Edit ----------
  const openAdd = () => {
    setForm(emptyForm);
    setFormError('');
    setVerificationStep('details');
    setVerificationOtp('');
    setEditingUser({});
  };

  const openEdit = (u) => {
    setForm({ email: u.email, password: '', password_confirmation: '', phone: u.phone || '', name: u.name || '', user_role: u.user_role, plot_id: u.plot_id ?? '', verificationToken: '' });
    setFormError('');
    setEditingUser(u);
    setActiveUser(null);
  };

  const closeForm = () => {
    if (saving) return;
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    const isEdit = Boolean(editingUser?.id);
    if (!isEdit && verificationStep === 'details') {
      try {
        const response = await apiRequest('/user/request-otp', { method: 'POST', body: JSON.stringify({ email: form.email, name: form.name, user_role: form.user_role }) });
        if (!response.success) throw new Error(response.error || 'Verification code could not be sent.');
        setVerificationStep('otp');
      } catch (err) { setFormError(err.message || 'Verification code could not be sent.'); }
      finally { setSaving(false); }
      return;
    }
    if (!isEdit && verificationStep === 'otp') {
      try {
        const response = await apiRequest('/user/verify-otp', { method: 'POST', body: JSON.stringify({ email: form.email, otp: verificationOtp }) });
        setForm((current) => ({ ...current, verificationToken: response.verificationToken }));
        setVerificationStep('verified');
      } catch (err) { setFormError(err.message || 'Email verification failed.'); }
      finally { setSaving(false); }
      return;
    }
    if (!isEdit && form.password !== form.password_confirmation) {
      setFormError('Passwords do not match.');
      setSaving(false);
      return;
    }
    const url = isEdit
      ? `${CONFIG.API_BASE_URL}/user/${editingUser.id}`
      : `${CONFIG.API_BASE_URL}/user`;

    const payload = {
      email: form.email,
      name: form.name,
      phone: form.phone,
      user_role: form.user_role,
      plot_id: form.plot_id === '' ? null : Number(form.plot_id),
      ...(form.password ? { password: form.password } : {}), // only send password if set/changed
      ...(!isEdit ? { password_confirmation: form.password_confirmation, verificationToken: form.verificationToken } : {}),
    };

    try {
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Save failed.');
      }
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      setFormError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete ${u.email}? This can't be undone.`)) return;
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/user/delete/${u.id}`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || 'Delete failed.');
      }
      setActiveUser(null);
      await loadUsers();
    } catch (err) {
      alert(err.message || 'Delete failed.');
    }
  };

  return (
    <div className="user-page">
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

        .user-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: var(--deck);
          color: var(--ink);
          min-height: 100vh;
          padding: 40px;
        }

        .user-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 22px;
          flex-wrap: wrap;
          gap: 14px;
        }

        .user-header h1 { font-size: 26px; font-weight: 800; margin: 0 0 4px; }
        .user-header p { color: var(--muted); font-size: 14px; margin: 0; }

        .btn-add {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--sodium);
          color: var(--deck);
          border: none;
          font-size: 14px;
          font-weight: 700;
          padding: 11px 20px;
          border-radius: 10px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .btn-add:hover { background: #ffc250; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(255,176,32,0.3); }

        .role-tabs { display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }

        .role-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--deck-panel);
          border: 1px solid var(--deck-line);
          color: var(--muted);
          padding: 10px 16px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
        }

        .role-tab .count {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          background: rgba(255,255,255,0.06);
          padding: 1px 7px;
          border-radius: 20px;
        }

        .role-tab.active {
          border-color: var(--role-color, var(--sodium));
          color: var(--role-color, var(--sodium));
          background: color-mix(in srgb, var(--role-color, var(--sodium)) 12%, transparent);
        }

        .role-tab.active .count { background: color-mix(in srgb, var(--role-color, var(--sodium)) 25%, transparent); }

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

        .filter-search { position: relative; flex: 1; min-width: 200px; }

        .filter-search svg {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          color: var(--muted); font-size: 13px;
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
          color-scheme: dark;
        }

        .filter-select option { background: var(--deck-panel); color: var(--ink); }

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

        .btn-clear:hover { color: var(--stop); background: rgba(226,83,74,0.08); }

        .results-line {
          font-size: 13px; color: var(--muted); margin-bottom: 14px;
          display: flex; align-items: center; gap: 6px;
        }

        .user-table-wrap {
          background: var(--deck-panel);
          border: 1px solid var(--deck-line);
          border-radius: 16px;
          overflow-x: auto;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        table.user-table { min-width: 620px; width: 100%; border-collapse: collapse; }

        .user-table th {
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          padding: 16px 20px;
          border-bottom: 1px solid var(--deck-line);
        }

        .user-table td {
          padding: 14px 20px;
          font-size: 14px;
          border-bottom: 1px solid var(--deck-line);
          vertical-align: middle;
        }

        .user-table tbody tr { transition: background 0.2s ease; animation: rowIn 0.25s ease; }

        @keyframes rowIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

        .user-table tbody tr:hover { background: rgba(255,255,255,0.03); }
        .user-table tbody tr:last-child td { border-bottom: none; }

        .user-cell { display: flex; align-items: center; gap: 12px; }

        .avatar {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; flex-shrink: 0;
        }

        .user-name { font-weight: 600; margin: 0; }

        .role-pill, .status-pill {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px;
        }

        .status-pill::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

        .plot-cell { font-size: 13px; color: var(--muted); display: flex; align-items: center; gap: 6px; }
        .plot-cell svg { color: var(--sodium); font-size: 11px; }

        .row-actions { display: flex; gap: 8px; }

        .btn-view, .btn-icon {
          display: inline-flex; align-items: center; gap: 6px;
          background: transparent;
          border: 1px solid var(--deck-line);
          color: var(--ink);
          font-size: 13px; font-weight: 600;
          padding: 7px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: border-color 0.2s ease, transform 0.2s ease, color 0.2s ease;
        }

        .btn-view:hover { border-color: var(--sodium); color: var(--sodium); transform: translateY(-1px); }
        .btn-icon { padding: 7px 10px; }
        .btn-icon.danger:hover { border-color: var(--stop); color: var(--stop); }

        .empty-state, .status-line { padding: 60px 20px; text-align: center; color: var(--muted); }
        .empty-state svg { font-size: 26px; margin-bottom: 10px; }
        .empty-state p { margin: 0 0 14px; font-size: 14px; }

        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ---------- Modal (shared by view + add/edit) ---------- */
        .user-overlay {
          position: fixed; inset: 0;
          background: rgba(10,11,13,0.6);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          z-index: 200; padding: 20px;
          opacity: 0; animation: overlayIn 0.25s ease forwards;
        }

        @keyframes overlayIn { to { opacity: 1; } }

        .user-modal {
          background: rgba(28,32,41,0.94);
          backdrop-filter: blur(20px) saturate(140%);
          border: 1px solid var(--deck-line);
          border-radius: 18px;
          width: 100%; max-width: 460px; max-height: 85vh; overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0,0,0,0.45);
          opacity: 0; transform: translateY(20px) scale(0.98);
          animation: modalIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards;
        }

        @keyframes modalIn { to { opacity: 1; transform: translateY(0) scale(1); } }

        .user-modal-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 24px 26px 16px; border-bottom: 1px solid var(--deck-line);
        }

        .modal-user-row { display: flex; align-items: center; gap: 14px; }

        .avatar-lg {
          width: 52px; height: 52px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; font-weight: 700; flex-shrink: 0;
        }

        .user-modal-header h2 { font-size: 18px; font-weight: 800; margin: 0 0 4px; }
        .user-modal-header .sub { font-size: 12px; color: var(--muted); }

        .btn-close {
          background: rgba(255,255,255,0.06); border: none; color: var(--ink);
          width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .btn-close:hover { background: rgba(255,255,255,0.12); transform: rotate(90deg); }

        .user-modal-body { padding: 20px 26px 26px; }

        .detail-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px; margin-bottom: 20px;
        }

        .detail-item { background: rgba(255,255,255,0.03); border: 1px solid var(--deck-line); border-radius: 10px; padding: 12px 14px; }

        .detail-item .lbl {
          font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em;
          margin: 0 0 4px; display: flex; align-items: center; gap: 5px;
        }

        .detail-item .lbl svg { color: var(--sodium); }
        .detail-item .val { font-size: 13px; font-weight: 600; }

        .modal-footer-actions {
          display: flex; gap: 10px; padding: 0 26px 26px;
        }

        /* ---------- Form ---------- */
        .form-group { margin-bottom: 18px; }

        .form-group label {
          display: block; font-size: 12px; color: var(--muted);
          margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
        }

        .form-control, select.form-control {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--deck-line);
          color: var(--ink);
          padding: 11px 13px;
          border-radius: 9px;
          font-size: 14px;
          outline: none;
          font-family: inherit;
          color-scheme: dark;
        }

        /* Keep native option menus readable on browsers that otherwise use a
           light popup while the modal itself is dark. */
        select.form-control option {
          background: #1c2029;
          color: #f2f3f5;
        }

        .form-control:focus { border-color: var(--sodium); }

        .form-error {
          color: var(--stop);
          font-size: 13px;
          background: rgba(226, 83, 74, 0.1);
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .form-help { margin: 7px 0 0; color: var(--muted); font-size: 12px; line-height: 18px; }

        .btn-primary {
          background: var(--sodium); color: var(--deck); border: none;
          font-size: 14px; font-weight: 700; padding: 11px 20px; border-radius: 10px;
          cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
        }

        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

        .btn-secondary {
          background: transparent; border: 1px solid var(--deck-line); color: var(--muted);
          font-size: 14px; font-weight: 600; padding: 11px 20px; border-radius: 10px; cursor: pointer;
        }

        @media (prefers-reduced-motion: reduce) {
          .user-overlay, .user-modal, .user-table tbody tr, .btn-close, .spin { animation: none !important; transition: none !important; }
        }

        @media (max-width: 1024px) { .user-page { padding: 24px; } }
        @media (max-width: 800px) { .user-table th:nth-child(4), .user-table td:nth-child(4) { display: none; } }
        @media (max-width: 640px) { .user-page { padding: 20px; } .filter-bar { flex-direction: column; align-items: stretch; } }
      `}</style>

      <div className="user-header">
        <div>
          <h1>Users</h1>
          <p>Admins, super admins, and gatekeepers with access to ParkFlow.</p>
        </div>
        {canManage && (
          <button className="btn-add" onClick={openAdd}>
            <FaPlus /> Add user
          </button>
        )}
      </div>

      <div className="role-tabs">
        {['all', 'superadmin', 'admin', 'gatekeeper', 'user'].map((r) => {
          const meta = r === 'all' ? { label: 'All roles', color: 'var(--ink)' } : ROLE_META[r];
          return (
            <div
              key={r}
              className={`role-tab ${filters.role === r ? 'active' : ''}`}
              style={{ '--role-color': meta.color }}
              onClick={() => setRole(r)}
            >
              {meta.label} <span className="count">{roleCounts[r]}</span>
            </div>
          );
        })}
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <FaSearch />
          <input
            placeholder="Search by name or email"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

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
        Showing {filteredUsers.length} of {users.length} users
      </div>

      <div className="user-table-wrap">
        {loading ? (
          <div className="status-line"><FaSpinner className="spin" /> Loading users…</div>
        ) : loadError ? (
          <div className="empty-state">
            <p>{loadError}</p>
            <button className="btn-view" onClick={loadUsers}>Retry</button>
          </div>
        ) : filteredUsers.length ? (
          <table className="user-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Assigned plot</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const rMeta = ROLE_META[u.user_role] || { label: u.user_role, color: 'var(--muted)', icon: FaUserShield };
                const sMeta = STATUS_META[u.status] || STATUS_META.active;
                const initials = (u.name || u.email || '?').slice(0, 2).toUpperCase();
                const RoleIcon = rMeta.icon;

                return (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar" style={{ background: `${rMeta.color}22`, color: rMeta.color }}>
                          {initials}
                        </div>
                        <div><p className="user-name">{u.name}</p><small>{u.email}</small></div>
                      </div>
                    </td>
                    <td>
                      <span className="role-pill" style={{ color: rMeta.color, background: `${rMeta.color}1f` }}>
                        <RoleIcon style={{ fontSize: 11 }} /> {rMeta.label}
                      </span>
                    </td>
                    <td>
                      <span className="status-pill" style={{ color: sMeta.color, background: `${sMeta.color}1f` }}>
                        {sMeta.label}
                      </span>
                    </td>
                    <td>
                      {u.plot_id ? (
                        <span className="plot-cell"><FaMapMarkerAlt />{plotNames[u.plot_id] || `Plot #${u.plot_id}`}</span>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: 13 }}>—</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-view" onClick={() => setActiveUser(u)}>
                          <FaEye /> View
                        </button>
                        {canManage && (
                          <>
                            <button className="btn-icon" onClick={() => openEdit(u)} aria-label="Edit">
                              <FaEdit />
                            </button>
                            <button className="btn-icon danger" onClick={() => handleDelete(u)} aria-label="Delete">
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <FaSearch />
            <p>No users match your filters.</p>
            <button className="btn-view" onClick={clearFilters}>Clear filters</button>
          </div>
        )}
      </div>

      {/* ---------- View modal ---------- */}
      {activeUser && (
        <div className="user-overlay" onClick={() => setActiveUser(null)}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="user-modal-header">
              <div className="modal-user-row">
                <div
                  className="avatar-lg"
                  style={{
                    background: `${ROLE_META[activeUser.user_role]?.color || '#888'}22`,
                    color: ROLE_META[activeUser.user_role]?.color || '#888',
                  }}
                >
                  {(activeUser.name || activeUser.email || '?').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2>{activeUser.name}</h2>
                  <div className="sub">
                    {ROLE_META[activeUser.user_role]?.label || activeUser.user_role} · {STATUS_META[activeUser.status]?.label || 'Active'}
                  </div>
                </div>
              </div>
              <button className="btn-close" onClick={() => setActiveUser(null)} aria-label="Close">
                <FaTimes />
              </button>
            </div>

            <div className="user-modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <p className="lbl"><FaMapMarkerAlt />Assigned plot</p>
                  <p className="val">{activeUser.plot_id ? (plotNames[activeUser.plot_id] || `Plot #${activeUser.plot_id}`) : 'Not assigned'}</p>
                </div>
                {activeUser.created_at && (
                  <div className="detail-item">
                    <p className="lbl"><FaCalendarAlt />Joined</p>
                    <p className="val">{activeUser.created_at}</p>
                  </div>
                )}
                <div className="detail-item">
                  <p className="lbl">Password</p>
                  <p className="val">{activeUser.password}</p>
                </div>
                <div className="detail-item">
                  <p className="lbl">{activeUser.status === 'active' ? <FaCheckCircle /> : <FaBan />}Status</p>
                  <p className="val" style={{ color: STATUS_META[activeUser.status]?.color }}>
                    {STATUS_META[activeUser.status]?.label || 'Active'}
                  </p>
                </div>
              </div>
            </div>

            {canManage && (
              <div className="modal-footer-actions">
                <button className="btn-primary" onClick={() => openEdit(activeUser)}>
                  <FaEdit /> Edit
                </button>
                <button className="btn-secondary" onClick={() => handleDelete(activeUser)}>
                  <FaTrash /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- Add / Edit modal (superadmin only) ---------- */}
      {editingUser && (
        <div className="user-overlay" onClick={closeForm}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="user-modal-header">
              <h2 style={{ margin: 0 }}>{editingUser.id ? 'Edit user' : 'Add user'}</h2>
              <button className="btn-close" onClick={closeForm} aria-label="Close">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="user-modal-body">
                {formError && <div className="form-error">{formError}</div>}

                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    id="name"
                    className="form-control"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input id="email" type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input id="phone" className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>

                <div className="form-group">
                  <label htmlFor="password">
                    {editingUser.id ? 'New password (leave blank to keep current)' : 'Password'}
                  </label>
                  {(editingUser.id || verificationStep === 'verified') && <input id="password" type="password" className="form-control" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingUser.id} minLength={8} />}
                  {!editingUser.id && verificationStep !== 'verified' && <p className="form-help">Verify the email first, then set the password.</p>}
                </div>

                {!editingUser.id && verificationStep === 'otp' && <div className="form-group">
                  <label htmlFor="verification-otp">Email verification code</label>
                  <input id="verification-otp" className="form-control" value={verificationOtp} onChange={(e) => setVerificationOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit OTP" inputMode="numeric" required />
                </div>}

                {!editingUser.id && verificationStep === 'verified' && <div className="form-group">
                  <label htmlFor="password_confirmation">Retype password</label>
                  <input id="password_confirmation" type="password" className="form-control" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} minLength={8} required />
                </div>}

                <div className="form-group">
                  <label htmlFor="user_role">Role</label>
                  <select
                    id="user_role"
                    className="form-control"
                    value={form.user_role}
                    onChange={(e) => {
                      const userRole = e.target.value;
                      setForm((current) => ({ ...current, user_role: userRole }));
                      if (!editingUser.id && verificationStep !== 'details') {
                        setVerificationStep('details');
                        setVerificationOtp('');
                        setForm((current) => ({ ...current, user_role: userRole, verificationToken: '' }));
                      }
                    }}
                  >
                    {allowedCreateRoles.map((key) => {
                      const meta = ROLE_META[key];
                      return (
                        <option key={key} value={key}>{meta.label}</option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="plot_id">Assigned parking plot</label>
                  <select
                    id="plot_id"
                    className="form-control"
                    value={form.plot_id}
                    onChange={(e) => setForm({ ...form, plot_id: e.target.value })}
                  >
                    <option value="">Select a parking plot</option>
                    {Object.entries(plotNames).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving && <FaSpinner className="spin" />} {editingUser.id ? 'Save changes' : verificationStep === 'details' ? 'Send verification code' : verificationStep === 'otp' ? 'Verify email' : 'Create user'}
                </button>
                <button type="button" className="btn-secondary" onClick={closeForm} disabled={saving}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default User;
