import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { FaUser, FaParking, FaClipboardList, FaCity, FaSignOutAlt, FaBars, FaTimes, FaTachometerAlt, FaClipboardCheck, FaLightbulb, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';

// Every menu item declares which roles can see it.
// Adjust the `roles` arrays below to change who sees what —
// that's the only thing you need to touch to re-map access.
// Role strings here MUST match the `role` column values in your DB exactly
// (see your admin table: "superadmin", "admin", "gatekeeper" — no underscore).
const NAV_ITEMS = [
  {
    to: '/dashboard',
    icon: FaTachometerAlt,
    label: 'Dashboard',
    roles: ['super_admin', 'superadmin', 'admin', 'gatekeeper'],
  },
  {
    to: '/user',
    icon: FaUser,
    label: 'User',
    roles: ['super_admin', 'superadmin', 'admin'],
  },
  {
    to: '/parking_plot',
    icon: FaParking,
    label: 'Parking Plot',
    roles: ['super_admin', 'superadmin'],
  },
  {
    to: '/parking_plot_request',
    icon: FaClipboardList,
    label: 'Parking Plot Request',
    roles: ['super_admin', 'superadmin'],
  },
  {
    to: '/alignment_suggestions',
    icon: FaLightbulb,
    label: 'Parking Allignment Suggestions',
    roles: ['super_admin', 'superadmin', 'admin'],
  },
  {
    to: '/city',
    icon: FaCity,
    label: 'City',
    roles: ['super_admin', 'superadmin'], // system-level config, kept super-admin only
  },
  {
    to: '/slots',
    icon: FaParking,
    label: 'Slots',
    roles: ['super_admin', 'superadmin', 'admin'],
  },
  {
    to: '/vehicle_rates',
    icon: FaMoneyBillWave,
    label: 'Vehicle Rates',
    roles: ['super_admin', 'superadmin', 'admin'],
  },
  {
    to: '/bookings',
    icon: FaCalendarAlt,
    label: 'Bookings',
    roles: ['super_admin', 'superadmin', 'admin', 'gatekeeper'],
  },
  {
    to: '/gatekeeper_session',
    icon: FaClipboardCheck,
    label: 'Offline Check-in / Check-out',
    roles: ['super_admin', 'superadmin', 'admin', 'gatekeeper'],
  },
];

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Role saved at login time (see Login.jsx -> localStorage.setItem('role', role))
  const role = localStorage.getItem('role');

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <>
      <style>{`
        :root {
          --asphalt: #14171c;
          --asphalt-2: #1d2128;
          --green: #1d9e75;
          --red: #e24b4a;
          --ink: #f5f6f7;
          --muted: #8c8a82;
          --sidebar-width: 260px;
        }

        /* Mobile Hamburger Button (Only shows when sidebar is closed) */
        .mobile-toggle {
          display: none;
          position: fixed;
          top: 15px;
          left: 15px;
          z-index: 100;
          background: var(--asphalt-2);
          color: var(--ink);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mobile-toggle:hover {
          color: var(--green);
        }

        /* Sidebar Container - Fixed height to prevent cutting off */
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0; /* Forces it to the bottom of the screen */
          height: 100vh;
          height: 100dvh; /* Better handling for mobile browsers */
          width: var(--sidebar-width);
          background: var(--asphalt-2);
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease;
          z-index: 105; /* Higher than toggle */
          box-shadow: 4px 0 15px rgba(0,0,0,0.2);
        }

        /* Sidebar Header (Brand & Close Button) */
        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 30px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .brand-word {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: 0.03em;
          color: var(--ink);
          margin: 0;
        }

        .brand-word span {
          color: var(--green);
        }

        /* Close Button inside Sidebar */
        .close-btn {
          display: none;
          background: transparent;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 5px;
        }

        .close-btn:hover {
          color: var(--red);
        }

        /* Navigation Menu */
        .nav-menu {
          flex: 1;
          padding: 20px 15px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto; /* Allows scrolling if menu gets too long */
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 14px 18px;
          color: var(--muted);
          text-decoration: none;
          font-size: 16px;
          font-weight: 500;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          border-radius: 10px;
          transition: all 0.2s ease;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.03);
          color: var(--ink);
        }

        .nav-link.active {
          background: rgba(29, 158, 117, 0.1);
          color: var(--green);
          border-left: 4px solid var(--green);
        }

        .nav-icon {
          font-size: 20px;
        }

        /* Sidebar Footer (Logout) */
        .sidebar-footer {
          padding: 20px 15px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          margin-top: auto; /* Pushes logout to the absolute bottom */
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 15px;
          width: 100%;
          padding: 14px 18px;
          background: transparent;
          color: var(--muted);
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .logout-btn:hover {
          background: rgba(226, 75, 74, 0.1);
          color: var(--red);
        }

        /* Mobile Overlay */
        .sidebar-overlay {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(2px);
          z-index: 80;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        /* Medium tablets keep the sidebar visible but slightly narrower,
           so admin pages get a bit more usable width without collapsing
           into the hamburger pattern too early. */
        @media (max-width: 1024px) and (min-width: 769px) {
          .sidebar { width: 220px; }
          .nav-link { padding: 12px 14px; font-size: 15px; }
        }

        /* Responsive Breakpoints */
        @media (max-width: 768px) {
          .mobile-toggle {
            display: block;
          }

          .close-btn {
            display: block; /* Show X inside sidebar header */
          }

          .sidebar {
            transform: translateX(-100%);
            width: min(var(--sidebar-width), 82vw);
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .sidebar-overlay.open {
            display: block;
            opacity: 1;
          }
        }

        @media (max-width: 360px) {
          .sidebar-header { padding: 22px 16px; }
          .brand-word { font-size: 20px; }
          .nav-link { padding: 12px 14px; font-size: 15px; }
          .nav-icon { font-size: 18px; }
        }
      `}</style>

      {/* 
        Hamburger Button - Now ONLY displays when the sidebar is closed. 
        This prevents it from sitting on top of the logo.
      */}
      {!isOpen && (
        <button className="mobile-toggle" onClick={toggleSidebar}>
          <FaBars size={24} />
        </button>
      )}

      {/* Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={toggleSidebar}
      ></div>

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="brand-word">
            PARK <span>FLOW</span>
          </h2>

          {/* The Close Button is now inside the flex container, aligned to the right */}
          <button className="close-btn" onClick={toggleSidebar}>
            <FaTimes size={20} />
          </button>
        </div>

        <nav className="nav-menu">
          {visibleItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className="nav-link" onClick={() => setIsOpen(false)}>
              <Icon className="nav-icon" />
              {label}
            </NavLink>
          ))}
        </nav>


        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt className="nav-icon" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
