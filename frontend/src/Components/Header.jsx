import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaParking, FaBars, FaTimes, FaUserAlt, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { apiRequest } from '../apiClient';

const HOME_PATH = '/home';

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = Boolean(localStorage.getItem('token'));
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })();

  const logout = async () => {
    try { await apiRequest('/userlogout', { method: 'POST' }); } catch (error) { /* clear local session even if the API is unavailable */ }
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    setProfileOpen(false);
    setMenuOpen(false);
    navigate(HOME_PATH);
  };

  const links = [
    { label: 'Home', path: HOME_PATH, section: 'home' },
    { label: 'Cities', path: `${HOME_PATH}#cities`, section: 'cities' },
    { label: 'Why ParkFlow', path: `${HOME_PATH}#parkFlow`, section: 'parkFlow' },
    { label: 'Booking', path: '/booking', section: null },
  ];

  useEffect(() => {
    const onScroll = () => {
      // 1. Handle background change on scroll
      setScrolled(window.scrollY > 20);

      // 2. Handle active section detection
      if (location.pathname !== HOME_PATH) return;

      const sectionIds = ['home', 'cities', 'parkFlow'];
      let current = 'home';
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // If section is near the top of the viewport
          if (rect.top <= 150) {
            current = id;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  // Handle locking body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [menuOpen]);

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const offset = 80; // height of header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const go = (link) => {
    setMenuOpen(false);

    if (link.section) {
      if (location.pathname === HOME_PATH) {
        scrollToSection(link.section);
      } else {
        // If not on home, navigate first then scroll (handled by Home component useEffect usually)
        navigate(HOME_PATH, { state: { scrollTo: link.section } });
      }
    } else {
      navigate(link.path);
    }
  };

  return (
    <>
      <header className={`site-header ${scrolled ? 'scrolled' : ''} ${menuOpen ? 'menu-is-open' : ''}`}>
        <style>{`
          :root {
            --deck: #0b0d12;
            --sodium: #ffb020;
            --ink: #f2f3f5;
            --muted: #8b8f97;
            --glass: rgba(20, 23, 28, 0.8);
            --border: rgba(255, 255, 255, 0.08);
          }

          .site-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            padding: 24px 5%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            background: transparent;
          }

          .site-header.scrolled {
            padding: 14px 5%;
            background: var(--glass);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
          }

          /* BRAND */
          .brand {
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            z-index: 1001;
          }

          .brand-icon {
            width: 40px;
            height: 40px;
            background: var(--sodium);
            color: var(--deck);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            transition: transform 0.3s ease;
            box-shadow: 0 4px 15px rgba(255, 176, 32, 0.3);
          }

          .brand:hover .brand-icon {
            transform: scale(1.05) rotate(-5deg);
          }

          .brand-word {
            color: var(--ink);
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.02em;
            margin: 0;
          }

          .brand-word span { color: var(--sodium); }

          /* DESKTOP NAV */
          .main-nav {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(255,255,255,0.03);
            padding: 6px;
            border-radius: 14px;
            border: 1px solid var(--border);
          }

          .nav-link {
            background: none;
            border: none;
            color: var(--muted);
            font-size: 14px;
            font-weight: 600;
            padding: 10px 18px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
          }

          .nav-link:hover {
            color: var(--ink);
            background: rgba(255,255,255,0.05);
          }

          .nav-link.active {
            color: var(--sodium);
            background: rgba(255, 176, 32, 0.1);
          }

          .btn-login-nav {
            background: var(--sodium);
            color: var(--deck);
            border: none;
            font-size: 14px;
            font-weight: 700;
            padding: 10px 22px;
            border-radius: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-left: 10px;
            transition: all 0.3s ease;
          }

          .btn-login-nav:hover {
            background: #fff;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
          }

          .profile-wrap { position: relative; margin-left: 10px; }

          .profile-trigger {
            background: var(--sodium);
            color: var(--deck);
            border: none;
            font-size: 14px;
            font-weight: 700;
            padding: 10px 14px;
            border-radius: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .profile-trigger:hover { background: #ffc250; }

          .profile-menu {
            position: absolute;
            top: calc(100% + 10px);
            right: 0;
            width: 190px;
            padding: 8px;
            background: #1c2029;
            border: 1px solid var(--border);
            border-radius: 12px;
            box-shadow: 0 16px 30px rgba(0,0,0,0.35);
          }

          .profile-menu-label {
            padding: 8px 10px 10px;
            color: var(--muted);
            font-size: 12px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .profile-menu-item {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            border: 0;
            border-radius: 8px;
            background: transparent;
            color: var(--ink);
            font-size: 14px;
            text-align: left;
            cursor: pointer;
          }

          .profile-menu-item:hover { background: rgba(255,255,255,0.06); color: var(--sodium); }
          .profile-menu-item.logout-item:hover { color: #e2534a; }

          /* MOBILE TOGGLE */
          .menu-toggle {
            display: none;
            width: 44px;
            height: 44px;
            border-radius: 10px;
            background: rgba(255,255,255,0.05);
            border: 1px solid var(--border);
            color: var(--ink);
            font-size: 20px;
            cursor: pointer;
            z-index: 1001;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }

          /* MOBILE PANEL */
          .mobile-panel {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: 300px;
            background: #14171c;
            z-index: 1000;
            padding: 100px 24px 40px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            transform: translateX(100%);
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            border-left: 1px solid var(--border);
          }

          .mobile-panel.open { transform: translateX(0); }

          .mobile-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(4px);
            z-index: 999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.4s ease;
          }

          .mobile-overlay.visible {
            opacity: 1;
            pointer-events: auto;
          }

          @media (max-width: 960px) {
            .main-nav { display: none; }
            .menu-toggle { display: flex; }
          }

          @media (max-width: 480px) {
            .brand-word { display: none; } /* Show only icon on tiny screens to save space */
            .mobile-panel { width: 100%; }
          }
        `}</style>

        {/* Brand/Logo */}
        <div className="brand" onClick={() => go({ path: HOME_PATH, section: 'home' })}>
          <div className="brand-icon"><FaParking /></div>
          <p className="brand-word">PARK<span>FLOW</span></p>
        </div>

        {/* Desktop Navigation */}
        <nav className="main-nav">
          {links.map((l) => (
            <button
              key={l.label}
              type="button"
              className={`nav-link ${activeSection === l.section && location.pathname === HOME_PATH ? 'active' : ''}`}
              onClick={() => go(l)}
            >
              {l.label}
            </button>
          ))}
          {isLoggedIn ? <div className="profile-wrap">
            <button type="button" className="profile-trigger" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen}>
              <FaUserCircle size={16} /> {storedUser?.name || 'Profile'}
            </button>
            {profileOpen && <div className="profile-menu">
              <div className="profile-menu-label">{storedUser?.email || 'Signed in'}</div>
              <button type="button" className="profile-menu-item" onClick={() => { setProfileOpen(false); navigate('/profile'); }}><FaUserAlt size={13} /> Profile</button>
              <button type="button" className="profile-menu-item logout-item" onClick={logout}><FaSignOutAlt size={13} /> Logout</button>
            </div>}
          </div> : <button type="button" className="btn-login-nav" onClick={() => navigate('/login')}>
            <FaUserAlt size={12} /> Login
          </button>}
        </nav>

        {/* Mobile Hamburger */}
        <button
          type="button"
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Mobile Sidebar */}
        <div className={`mobile-panel ${menuOpen ? 'open' : ''}`}>
          <div style={{ marginBottom: '20px', color: 'var(--muted)', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Navigation</div>
          {links.map((l) => (
            <button
              type="button"
              key={l.label}
              className={`nav-link ${activeSection === l.section ? 'active' : ''}`}
              onClick={() => go(l)}
              style={{ textAlign: 'left', fontSize: '18px', padding: '15px 20px' }}
            >
              {l.label}
            </button>
          ))}
          <div style={{ marginTop: 'auto' }}>
            {isLoggedIn ? <>
              <button type="button" className="nav-link" onClick={() => { setMenuOpen(false); navigate('/profile'); }} style={{ width: '100%', textAlign: 'left', fontSize: '16px', padding: '14px 20px' }}><FaUserAlt size={14} />&nbsp; Profile</button>
              <button type="button" className="btn-login-nav" onClick={logout} style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '16px' }}><FaSignOutAlt size={14} /> Logout</button>
            </> : <button type="button" className="btn-login-nav" onClick={() => { setMenuOpen(false); navigate('/login'); }} style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '16px' }}>Login to Account</button>}
          </div>
        </div>

        {/* Click-to-close Overlay for Mobile */}
        <div
          className={`mobile-overlay ${menuOpen ? 'visible' : ''}`}
          onClick={() => setMenuOpen(false)}
        />
      </header>
    </>
  );
}

export default Header;
