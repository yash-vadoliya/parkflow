import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCar, FaEnvelope, FaPhone, FaCalendarAlt, FaClipboardList, FaUserCircle, FaEye } from 'react-icons/fa';
import { apiRequest } from '../apiClient';

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    apiRequest('/profile')
      .then(setProfile)
      .catch((err) => {
        setError(err.message || 'Profile could not be loaded.');
        if (!localStorage.getItem('token')) navigate('/login');
      });
  }, [navigate]);

  const user = profile?.user;
  const bookings = profile?.bookings || (profile?.lastBooking ? [profile.lastBooking] : []);
  const lastBooking = selectedBooking;
  const formatDate = (value) => value ? new Date(value).toLocaleString() : '—';

  return (
    <main className="profile-page">
      <style>{`
        .profile-page { min-height: 100vh; padding: 130px 5% 70px; background: #14171c; color: #f2f3f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .profile-shell { max-width: 1000px; margin: 0 auto; }
        .profile-eyebrow { color: #ffb020; font-family: 'Courier New', monospace; font-size: 11px; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; }
        .profile-page h1 { margin: 8px 0 6px; font-size: 34px; }
        .profile-lead { margin: 0 0 30px; color: #8b8f97; }
        .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .profile-card { background: #1c2029; border: 1px solid rgba(255,255,255,.06); border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,.16); }
        .profile-card.wide { grid-column: 1 / -1; }
        .profile-card h2 { display: flex; align-items: center; gap: 10px; margin: 0 0 20px; font-size: 17px; }
        .profile-card h2 svg { color: #ffb020; }
        .profile-avatar { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .profile-avatar-icon { color: #ffb020; font-size: 42px; }
        .profile-avatar strong { display: block; font-size: 20px; }
        .profile-avatar span { color: #8b8f97; font-size: 13px; }
        .detail-row { display: flex; align-items: center; gap: 10px; padding: 11px 0; border-bottom: 1px dashed rgba(255,255,255,.08); color: #8b8f97; font-size: 14px; }
        .detail-row:last-child { border-bottom: 0; }
        .detail-row svg { color: #2bb583; width: 15px; }
        .detail-row strong { margin-left: auto; color: #f2f3f5; font-weight: 600; text-align: right; }
        .vehicle-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
        .vehicle-item { padding: 16px; background: #14171c; border: 1px solid rgba(255,255,255,.06); border-radius: 10px; }
        .vehicle-item strong { display: block; color: #ffb020; font-family: 'Courier New', monospace; letter-spacing: .08em; }
        .vehicle-item span { display: block; margin-top: 6px; color: #8b8f97; font-size: 12px; text-transform: capitalize; }
        .empty-state { color: #8b8f97; font-size: 14px; }
        .booking-status { color: #2bb583; text-transform: capitalize; }
        .booking-list { display:grid; gap:12px; }
        .booking-item { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:16px; background:#14171c; border:1px solid rgba(255,255,255,.06); border-radius:10px; }
        .booking-item strong { display:block; } .booking-item span { display:block; color:#8b8f97; font-size:12px; margin-top:5px; }
        .booking-item button { display:flex; align-items:center; gap:7px; border:1px solid rgba(255,176,32,.35); border-radius:8px; padding:9px 12px; background:rgba(255,176,32,.1); color:#ffb020; cursor:pointer; white-space:nowrap; }
        .booking-detail-card { margin-top:14px; padding:18px; border:1px solid rgba(43,181,131,.3); border-radius:12px; background:rgba(43,181,131,.06); }
        .profile-error { max-width: 500px; margin: 80px auto; padding: 18px; color: #e2534a; background: rgba(226,83,74,.1); border-radius: 10px; text-align: center; }
        @media (max-width: 640px) { .profile-page { padding: 105px 20px 50px; } .profile-page h1 { font-size: 28px; } .profile-grid { grid-template-columns: 1fr; } .profile-card.wide { grid-column: auto; } .detail-row { align-items: flex-start; } .detail-row strong { max-width: 58%; word-break: break-word; } }
      `}</style>

      <div className="profile-shell">
        {error ? <div className="profile-error">{error}</div> : <>
          <div className="profile-eyebrow">Account overview</div>
          <h1>My Profile</h1>
          <p className="profile-lead">Your ParkFlow account, vehicles, and bookings.</p>

          <div className="profile-grid">
            <section className="profile-card wide">
              <h2><FaClipboardList /> My bookings</h2>
              {bookings.length ? <div className="booking-list">{bookings.map((booking) => <div className="booking-item" key={booking.booking_id}>
                <div><strong>{booking.booking_ref || 'Booking'}</strong><span>{booking.plot_name || booking.address || 'Parking plot'} · <span className="booking-status">{booking.status || 'pending'}</span></span></div>
                <button type="button" onClick={() => setSelectedBooking(booking)}><FaEye /> View</button>
              </div>)}</div> : <p className="empty-state">You have no bookings yet.</p>}
            </section>

            <section className="profile-card">
              <h2><FaUserCircle /> Personal details</h2>
              <div className="profile-avatar"><FaUserCircle className="profile-avatar-icon" /><div><strong>{user?.name || 'Loading…'}</strong><span>{user?.user_role || 'user'}</span></div></div>
              <div className="detail-row"><FaEnvelope /> Email <strong>{user?.email || '—'}</strong></div>
              <div className="detail-row"><FaPhone /> Phone <strong>{user?.phone || 'Not added'}</strong></div>
              <div className="detail-row"><FaCalendarAlt /> Member since <strong>{formatDate(user?.created_at)}</strong></div>
            </section>

            <section className="profile-card">
              <h2><FaCar /> My vehicles</h2>
              {profile?.vehicles?.length ? <div className="vehicle-list">{profile.vehicles.map((vehicle) => <div className="vehicle-item" key={vehicle.vehicle_id}><strong>{vehicle.vehicle_number}</strong><span>{vehicle.vehicle_type || 'Vehicle'}</span></div>)}</div> : <p className="empty-state">No vehicles added yet. Add one when you make a booking.</p>}
            </section>

            <section className="profile-card wide">
              <h2><FaClipboardList /> Booking details</h2>
              {lastBooking ? <div className="booking-details">
                <div className="detail-row">Customer <strong>{user?.name || '—'}</strong></div>
                <div className="detail-row">Address <strong>{lastBooking.address || '—'}</strong></div>
                <div className="detail-row">City <strong>{[lastBooking.city_name, lastBooking.state_name, lastBooking.country_name].filter(Boolean).join(', ') || '—'}</strong></div>
                <div className="detail-row">Amount <strong>₹{lastBooking.total_amount ?? 0}</strong></div>
                <div className="detail-row">Booking reference <strong>{lastBooking.booking_ref || '—'}</strong></div>
                <div className="detail-row">Parking plot <strong>{lastBooking.plot_name || lastBooking.address || '—'}</strong></div>
                <div className="detail-row">Vehicle <strong>{lastBooking.vehicle_number || '—'} {lastBooking.vehicle_type ? `(${lastBooking.vehicle_type})` : ''}</strong></div>
                <div className="detail-row">Schedule <strong>{formatDate(lastBooking.start_time)} – {formatDate(lastBooking.end_time)}</strong></div>
                <div className="detail-row">Status <strong className="booking-status">{lastBooking.status || '—'}</strong></div>
              </div> : <p className="empty-state">Select View on a booking to see all details.</p>}
            </section>
          </div>
        </>}
      </div>
    </main>
  );
}

export default Profile;
