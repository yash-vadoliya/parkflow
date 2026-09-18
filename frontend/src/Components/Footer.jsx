// Footer.js
import React, { useEffect, useRef, useState } from 'react';
import { FaParking, FaMapMarkerAlt, FaEnvelope, FaPhone } from 'react-icons/fa';

function Footer() {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const cityLinks = ['Mumbai', 'Bengaluru', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai'];

  return (
    <footer ref={ref} className={`site-footer ${visible ? 'visible' : ''}`}>
      <style>{`
        :root {
          --deck:       #14171c;
          --deck-line:  rgba(255,255,255,0.07);
          --sodium:     #ffb020;
          --ink:        #f2f3f5;
          --muted:      #8b8f97;
        }

        * { box-sizing: border-box; }

        .site-footer {
  position: relative;
  background: linear-gradient(rgba(20,23,28,0.9), rgba(20,23,28,0.9));
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  border-top: 1px solid var(--deck-line);
  padding: 56px 40px 28px;
  color: #c7cad0;

  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1);
}

        .site-footer.visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (max-width: 560px) {
  .site-footer {
    padding: 40px 20px 24px;
  }
  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

        .footer-grid {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1.2fr;
          gap: 32px;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .footer-brand-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: rgba(255,176,32,0.14);
          color: var(--sodium);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
        }

        .footer-brand-word {
          color: var(--ink);
          font-size: 17px;
          font-weight: 800;
          margin: 0;
        }

        .footer-brand-word span { color: var(--sodium); }

        .footer-col p.desc {
          font-size: 13px;
          line-height: 1.7;
          max-width: 260px;
          margin: 0;
        }

        .footer-col h4 {
          color: var(--ink);
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 0 0 14px;
        }

        .footer-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .footer-link {
          background: none;
          border: none;
          padding: 0;
          text-align: left;
          color: var(--muted);
          font-size: 13px;
          cursor: pointer;
          width: fit-content;
          position: relative;
          transition: color 0.2s ease, transform 0.2s ease;
        }

        .footer-link:hover {
          color: var(--sodium);
          transform: translateX(3px);
        }

        .contact-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          margin-bottom: 12px;
        }

        .contact-row svg {
          color: var(--sodium);
          margin-top: 2px;
          flex-shrink: 0;
        }

        .footer-bottom {
          max-width: 1100px;
          margin: 40px auto 0;
          padding-top: 20px;
          border-top: 1px solid var(--deck-line);
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          font-size: 12px;
        }

        .footer-bottom .pulse-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--sodium);
          margin-right: 6px;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(255,176,32,0.4); }
          50% { opacity: 0.7; box-shadow: 0 0 0 4px rgba(255,176,32,0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .site-footer, .footer-link, .footer-bottom .pulse-dot {
            animation: none !important;
            transition: none !important;
          }
        }

        @media (max-width: 1024px) {
          .site-footer { padding: 48px 28px 24px; }
          .footer-grid { gap: 24px; }
        }

        @media (max-width: 800px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 28px 20px;
          }
          .footer-col p.desc { max-width: none; }
        }

        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 26px;
          }
          .contact-row span { word-break: break-word; }
        }
      `}</style>

      <div className="footer-grid">
        <div className="footer-col">
          <div className="footer-brand">
            <div className="footer-brand-icon"><FaParking /></div>
            <p className="footer-brand-word">PARK <span>FLOW</span></p>
          </div>
          <p className="desc">
            Real-time parking facility management for cities across India —
            occupancy tracking, entry and exit logging, and reporting in one dashboard.
          </p>
        </div>

        <div className="footer-col">
          <h4>Cities</h4>
          <ul>
            {cityLinks.map((c) => (
              <li key={c}><button className="footer-link">{c}</button></li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h4>Product</h4>
          <ul>
            <li><button className="footer-link">Dashboard</button></li>
            <li><button className="footer-link">Operator login</button></li>
            <li><button className="footer-link">Reports</button></li>
            <li><button className="footer-link">Pricing</button></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <div className="contact-row">
            <FaMapMarkerAlt />
            <span>4th Floor, Cyber Towers, Hyderabad, Telangana, India</span>
          </div>
          <div className="contact-row">
            <FaEnvelope />
            <span>support@parkflow.in</span>
          </div>
          <div className="contact-row">
            <FaPhone />
            <span>+91 40 4567 8900</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span><span className="pulse-dot"></span>All systems operational</span>
        <span>© {new Date().getFullYear()} ParkFlow. All rights reserved.</span>
      </div>
    </footer>
  );
}

export default Footer;