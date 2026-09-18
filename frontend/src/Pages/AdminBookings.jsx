import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaTicketAlt, FaCheck, FaTimes } from 'react-icons/fa';
import { apiRequest, asRows } from '../apiClient';

const formatDate = (value) => value
  ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
  : '—';

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('all');
  const [plot, setPlot] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [notification, setNotification] = useState('');
  const previousBookings = useRef(null);
  const role = String(localStorage.getItem('role') || '').toLowerCase();
  const isSuperAdmin = ['superadmin', 'super_admin'].includes(role);

  const notify = (message) => {
    setNotification(message);
    window.setTimeout(() => setNotification(''), 5000);
  };

  const loadBookings = async () => {
    try {
      const nextBookings = asRows(await apiRequest('/booking'));
      if (previousBookings.current) {
        const oldById = previousBookings.current;
        const newBooking = nextBookings.find((booking) => !oldById.has(String(booking.booking_id)));
        if (newBooking) notify(`New booking created: ${newBooking.booking_ref || `#${newBooking.booking_id}`}`);
      }
      previousBookings.current = new Map(nextBookings.map((booking) => [String(booking.booking_id), booking]));
      setBookings(nextBookings);
    } catch (requestError) {
      setError(requestError.message || 'Bookings could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    const timer = window.setInterval(loadBookings, 10000);
    return () => window.clearInterval(timer);
  }, []);

  const cities = useMemo(() => [...new Map(bookings.map((item) => [item.city_id, item.city_name]).filter(([id, name]) => id && name))], [bookings]);
  const plots = useMemo(() => [...new Map(bookings.map((item) => [item.plot_id, item.plot_name]).filter(([id, name]) => id && name))], [bookings]);
  const filteredBookings = bookings.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [item.booking_ref, item.customer_name, item.customer_username, item.vehicle_number, item.plot_name, item.city_name, item.state_name, item.country_name]
      .some((value) => String(value || '').toLowerCase().includes(query));
    return matchesSearch
      && (city === 'all' || String(item.city_id) === city)
      && (plot === 'all' || String(item.plot_id) === plot);
  });

  const updateStatus = async (bookingId, status) => {
    setUpdatingId(bookingId);
    try {
      const result = await apiRequest(`/booking/${bookingId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      setBookings((current) => current.map((item) => item.booking_id === bookingId ? { ...item, status } : item));
      if (result.emailSent === false) setError('Booking status updated, but the customer email could not be sent. Check the server SMTP configuration and logs.');
      else notify(status === 'approved' ? 'Booking approved and email sent successfully.' : 'Booking rejected and email sent successfully.');
    } catch (requestError) {
      setError(requestError.message || 'Booking status could not be updated.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="admin-bookings">
      <style>{`
        .admin-bookings { min-height: 100vh; padding: 40px; color: #f2f3f5; font-family: Inter, sans-serif; }
        .ab-head { display:flex; justify-content:space-between; align-items:flex-end; gap:20px; margin-bottom:26px; }
        .ab-kicker { color:#ffb020; font-size:11px; letter-spacing:.16em; text-transform:uppercase; margin:0 0 8px; }
        .ab-head h1 { margin:0 0 6px; font-size:30px; } .ab-head p { margin:0; color:#9195a0; }
        .ab-count { color:#2bb583; font-size:14px; white-space:nowrap; }
        .ab-toolbar { display:flex; flex-wrap:wrap; gap:12px; padding:16px; background:#1c2029; border:1px solid rgba(255,255,255,.08); border-radius:14px; margin-bottom:18px; }
        .ab-search { position:relative; flex:1 1 240px; } .ab-search svg { position:absolute; left:13px; top:13px; color:#9195a0; }
        .ab-toolbar input, .ab-toolbar select { height:40px; border:1px solid rgba(255,255,255,.1); border-radius:8px; background:#14171c; color:#f2f3f5; padding:0 12px; min-width:180px; }
        .ab-search input { width:100%; padding-left:36px; } .ab-table-wrap { overflow:auto; background:#1c2029; border:1px solid rgba(255,255,255,.08); border-radius:14px; }
        .ab-notification { margin:0 0 18px; padding:13px 16px; border:1px solid rgba(43,181,131,.35); border-radius:10px; background:rgba(43,181,131,.12); color:#6de0b4; font-weight:700; }
        .ab-table { width:100%; min-width:900px; border-collapse:collapse; } .ab-table th, .ab-table td { text-align:left; padding:15px 16px; border-bottom:1px solid rgba(255,255,255,.06); }
        .ab-table th { color:#9195a0; font-size:11px; letter-spacing:.08em; text-transform:uppercase; } .ab-table td { font-size:14px; }
        .ab-table tr:last-child td { border-bottom:0; } .ab-main { font-weight:700; } .ab-muted { color:#9195a0; font-size:12px; margin-top:4px; }
        .ab-status { display:inline-block; padding:5px 9px; border-radius:99px; background:rgba(43,181,131,.14); color:#2bb583; text-transform:capitalize; }
        .ab-empty { padding:44px; text-align:center; color:#9195a0; } .ab-error { color:#e2534a; padding:18px 0; }
        .ab-actions { display:flex; gap:7px; } .ab-actions button { border:0; border-radius:7px; padding:8px 9px; background:rgba(43,181,131,.14); color:#2bb583; cursor:pointer; white-space:nowrap; } .ab-actions button:disabled { opacity:.45; cursor:not-allowed; } .ab-actions .ab-reject { background:rgba(226,83,74,.14); color:#e2534a; }
        @media (max-width:700px) { .admin-bookings { padding:24px 16px; } .ab-head { display:block; } .ab-count { display:block; margin-top:12px; } }
      `}</style>
      <div className="ab-head">
        <div><p className="ab-kicker">Operations</p><h1>Bookings</h1><p>{isSuperAdmin ? 'All bookings across every city and parking plot.' : 'Bookings for your assigned parking plot.'}</p></div>
        <div className="ab-count">{filteredBookings.length} booking{filteredBookings.length === 1 ? '' : 's'}</div>
      </div>
      <div className="ab-toolbar">
        <div className="ab-search"><FaSearch /><input aria-label="Search bookings" placeholder="Search reference, customer, vehicle…" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        {isSuperAdmin && <select aria-label="Filter by city" value={city} onChange={(event) => setCity(event.target.value)}><option value="all">All cities</option>{cities.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>}
        {isSuperAdmin && <select aria-label="Filter by parking plot" value={plot} onChange={(event) => setPlot(event.target.value)}><option value="all">All parking plots</option>{plots.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>}
      </div>
      {notification && <div className="ab-notification" role="status">{notification}</div>}
      {error && <div className="ab-error">{error}</div>}
      <div className="ab-table-wrap">
        {loading ? <div className="ab-empty">Loading bookings…</div> : filteredBookings.length === 0 ? <div className="ab-empty">No bookings found for the selected filters.</div> : (
          <table className="ab-table"><thead><tr><th>Booking</th><th>Customer</th><th>Vehicle</th><th>Parking plot</th><th>City</th><th>Schedule</th><th>Status</th>{role === 'gatekeeper' && <th>Action</th>}</tr></thead><tbody>
            {filteredBookings.map((item) => <tr key={item.booking_id}>
              <td><div className="ab-main"><FaTicketAlt /> {item.booking_ref || 'Booking'}</div><div className="ab-muted">Created {formatDate(item.created_at)}</div></td>
              <td><div className="ab-main">{item.customer_name || '—'}</div><div className="ab-muted">Username: {item.customer_username || '—'}</div></td>
              <td><div className="ab-main">{item.vehicle_number || '—'}</div></td>
              <td><div className="ab-main"><FaMapMarkerAlt /> {item.plot_name || '—'}</div><div className="ab-muted">{item.address || item.area_name || '—'}</div></td>
              <td><div className="ab-main">{item.city_name || '—'}</div><div className="ab-muted">{[item.state_name, item.country_name].filter(Boolean).join(', ') || '—'}</div></td>
              <td><div><FaCalendarAlt /> {formatDate(item.start_time)}</div><div className="ab-muted">to {formatDate(item.end_time)}</div></td>
              <td><span className="ab-status">{item.status || 'pending'}</span></td>
              {role === 'gatekeeper' && <td><div className="ab-actions">
                <button disabled={updatingId === item.booking_id || item.status === 'approved'} onClick={() => updateStatus(item.booking_id, 'approved')}><FaCheck /> Approve</button>
                <button className="ab-reject" disabled={updatingId === item.booking_id || item.status === 'reject'} onClick={() => updateStatus(item.booking_id, 'reject')}><FaTimes /> Reject</button>
              </div></td>}
            </tr>)}
          </tbody></table>
        )}
      </div>
    </main>
  );
}

export default AdminBookings;
