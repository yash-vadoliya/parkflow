// import React, { useEffect, useState } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { FaMapMarkerAlt, FaBolt, FaShieldAlt, FaMobileAlt, FaArrowRight } from 'react-icons/fa';
// import { loadParkingReferenceData } from '../liveParkingData';

// function Home() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [cities, setCities] = useState([]);

//   useEffect(() => {
//     loadParkingReferenceData()
//       .then(({ cities: liveCities, plots }) => {
//         setCities(liveCities.map((city) => ({
//           ...city,
//           slots: `${plots.filter((plot) => String(plot.city_id) === String(city.id)).length}`,
//           region: city.state || 'India',
//         })));
//       })
//       .catch(() => setCities([]));
//   }, []);

//   useEffect(() => {
//     const sectionId = location.state?.scrollTo;
//     if (sectionId) {
//       requestAnimationFrame(() => {
//         requestAnimationFrame(() => {
//           const el = document.getElementById(sectionId);
//           if (el) {
//             el.scrollIntoView({ behavior: 'smooth', block: 'start' });
//           }
//           window.history.replaceState({}, document.title);
//         });
//       });
//     }
//   }, [location.state]);

//   const features = [
//     {
//       icon: <FaBolt />,
//       title: 'Real-time slot tracking',
//       body: 'Live occupancy updates the moment a vehicle enters or exits, so operators always see accurate availability.',
//     },
//     {
//       icon: <FaShieldAlt />,
//       title: 'Secure operator access',
//       body: 'Role-based logins keep facility data and payment records visible only to authorized staff.',
//     },
//     {
//       icon: <FaMobileAlt />,
//       title: 'Works on any device',
//       body: 'Manage a facility from a front-desk terminal, a tablet at the gate, or a phone on the go.',
//     },
//   ];

//   return (
//     <div className="home-page">
//       <style>{`
//   :root {
//     --deck:       #14171c;
//     --deck-panel: #1c2029;
//     --deck-line:  rgba(255,255,255,0.06);
//     --sodium:     #ffb020;
//     --go:         #2bb583;
//     --stop:       #e2534a;
//     --ink:        #f2f3f5;
//     --muted:      #8b8f97;
//   }

//   * { box-sizing: border-box; }

//   .home-page {
//     font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
//     background: var(--deck);
//     color: var(--ink);
//     min-height: 100vh;
//     overflow-x: hidden;
//   }

//   /* ---------- Hero ---------- */
//   .hero {
//     position: relative;
//     overflow: hidden;
//     padding: 90px 40px 70px;
//     text-align: center;
//   }

//   .hero::before {
//     content: "";
//     position: absolute;
//     inset: 0;
//     background-image: repeating-linear-gradient(
//       90deg,
//       transparent 0 78px,
//       rgba(255,255,255,0.035) 78px 82px
//     );
//     z-index: 0;
//   }

//   .hero::after {
//     content: "";
//     position: absolute;
//     top: -40%;
//     left: -20%;
//     width: 60%;
//     height: 180%;
//     background: radial-gradient(ellipse at center, rgba(255,176,32,0.08) 0%, transparent 70%);
//     transform: rotate(20deg);
//     animation: sweep 16s ease-in-out infinite;
//     z-index: 0;
//   }

//   @keyframes sweep {
//     0%   { left: -30%; }
//     50%  { left: 90%; }
//     100% { left: -30%; }
//   }

//   .hero-inner {
//     position: relative;
//     z-index: 1;
//     max-width: 640px;
//     margin: 0 auto;
//     opacity: 0;
//     transform: translateY(24px);
//     animation: riseIn 0.7s cubic-bezier(0.16,1,0.3,1) forwards;
//   }

//   @keyframes riseIn {
//     to { opacity: 1; transform: translateY(0); }
//   }

//   .plate-chip {
//     display: inline-flex;
//     align-items: center;
//     gap: 6px;
//     font-family: 'Space Mono', monospace;
//     font-size: 11px;
//     letter-spacing: 0.15em;
//     color: var(--deck);
//     background: var(--sodium);
//     padding: 4px 12px;
//     border-radius: 5px;
//     margin-bottom: 18px;
//   }

//   .hero h1 {
//     font-size: 42px;
//     font-weight: 800;
//     letter-spacing: -0.01em;
//     margin: 0 0 16px;
//     line-height: 1.15;
//   }

//   .hero h1 span { color: var(--sodium); }

//   .hero p {
//     color: var(--muted);
//     font-size: 16px;
//     line-height: 1.6;
//     margin: 0 0 30px;
//   }

//   .hero-actions {
//     display: flex;
//     gap: 14px;
//     justify-content: center;
//     flex-wrap: wrap;
//   }

//   .btn-primary, .btn-secondary {
//     font-size: 15px;
//     font-weight: 700;
//     padding: 13px 26px;
//     border-radius: 10px;
//     cursor: pointer;
//     border: none;
//     display: inline-flex;
//     align-items: center;
//     gap: 8px;
//     justify-content: center;
//     transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
//   }

//   .btn-primary {
//     background: var(--sodium);
//     color: var(--deck);
//   }

//   .btn-primary:hover {
//     background: #ffc250;
//     transform: translateY(-2px);
//     box-shadow: 0 6px 15px rgba(255,176,32,0.3);
//   }

//   .btn-secondary {
//     background: transparent;
//     color: var(--ink);
//     border: 1px solid var(--deck-line);
//   }

//   .btn-secondary:hover {
//     border-color: var(--muted);
//     transform: translateY(-2px);
//   }

//   /* ---------- Stats strip ---------- */
//   .stats-strip {
//     position: relative;
//     z-index: 1;
//     display: grid;
//     grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
//     gap: 20px;
//     max-width: 900px;
//     margin: 50px auto 0;
//   }

//   .stats-strip .stat {
//     text-align: center;
//     min-width: 0;
//   }

//   .stats-strip .stat h3 {
//     font-family: 'Space Mono', monospace;
//     font-size: 26px;
//     font-weight: 800;
//     color: var(--sodium);
//     margin: 0;
//     word-break: break-word;
//   }

//   .stats-strip .stat p {
//     font-size: 12px;
//     color: var(--muted);
//     text-transform: uppercase;
//     letter-spacing: 0.05em;
//     margin: 6px 0 0;
//   }

//   /* ---------- Section shell ---------- */
//   section {
//     max-width: 1100px;
//     margin: 0 auto;
//     padding: 60px 40px;
//   }

//   .section-head {
//     text-align: center;
//     margin-bottom: 34px;

//   }

//   .section-head .eyebrow {
//     font-family: 'Space Mono', monospace;
//     font-size: 11px;
//     letter-spacing: 0.18em;
//     color: var(--sodium);
//     text-transform: uppercase;
//     margin-bottom: 8px;
//   }

//   .section-head h2 {
//     font-size: 26px;
//     font-weight: 800;
//     margin: 0 0 8px;
//   }

//   .section-head p {
//     color: var(--muted);
//     font-size: 14px;
//     max-width: 480px;
//     margin: 0 auto;
//   }

//   /* ---------- Cities grid ---------- */
//   .cities-grid {
//     display: grid;
//     grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
//     gap: 18px;
//   }

//   .city-card {
//     background: var(--deck-panel);
//     border: 1px solid var(--deck-line);
//     border-radius: 16px;
//     padding: 22px;
//     display: flex;
//     align-items: center;
//     gap: 16px;
//     box-shadow: 0 4px 12px rgba(0,0,0,0.12);
//     transition: transform 0.2s ease, box-shadow 0.2s ease;
//     min-width: 0;
//   }

//   .city-card:hover {
//     transform: translateY(-4px);
//     box-shadow: 0 8px 20px rgba(0,0,0,0.22);
//   }

//   .city-icon {
//     width: 42px;
//     height: 42px;
//     border-radius: 50%;
//     background: rgba(255,176,32,0.12);
//     color: var(--sodium);
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     font-size: 17px;
//     flex-shrink: 0;
//   }

//   .city-card h3 {
//     margin: 0;
//     font-size: 16px;
//     font-weight: 700;
//   }

//   .city-card .region {
//     font-size: 12px;
//     color: var(--muted);
//     margin: 2px 0 6px;
//   }

//   .city-card .slots {
//     font-family: 'Space Mono', monospace;
//     font-size: 13px;
//     color: var(--go);
//   }

//   /* ---------- Features ---------- */
//   .features-grid {
//     display: grid;
//     grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
//     gap: 20px;
//   }

//   .feature-card {
//     background: var(--deck-panel);
//     border: 1px solid var(--deck-line);
//     border-radius: 16px;
//     padding: 26px;
//     transition: transform 0.2s ease, box-shadow 0.2s ease;
//     min-width: 0;
//   }

//   .feature-card:hover {
//     transform: translateY(-4px);
//     box-shadow: 0 8px 20px rgba(0,0,0,0.22);
//   }

//   .feature-icon {
//     width: 46px;
//     height: 46px;
//     border-radius: 12px;
//     background: rgba(43,181,131,0.12);
//     color: var(--go);
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     font-size: 19px;
//     margin-bottom: 16px;
//   }

//   .feature-card h3 {
//     font-size: 16px;
//     font-weight: 700;
//     margin: 0 0 8px;
//   }

//   .feature-card p {
//     font-size: 14px;
//     color: var(--muted);
//     line-height: 1.6;
//     margin: 0;
//   }

//   /* ---------- CTA ---------- */
//   .cta-section {
//     text-align: center;
//     border-top: 1px dashed var(--deck-line);
//   }

//   .cta-section h2 {
//     font-size: 24px;
//     font-weight: 800;
//     margin: 0 0 10px;
//   }

//   .cta-section p {
//     color: var(--muted);
//     font-size: 14px;
//     margin: 0 0 26px;
//   }

//   @media (prefers-reduced-motion: reduce) {
//     .hero-inner, .hero::after {
//       animation: none !important;
//     }
//   }

//   /* ---------- Tablet ---------- */
//   @media (max-width: 900px) {
//     .hero { padding: 70px 28px 56px; }
//     .hero h1 { font-size: 34px; }
//     section { padding: 48px 28px; }
//     .stats-strip { grid-template-columns: repeat(2, 1fr); gap: 24px 16px; }
//   }

//   /* ---------- Phone ---------- */
//   @media (max-width: 640px) {
//     .hero { padding: 56px 20px 40px; }
//     .hero h1 { font-size: 28px; }
//     .hero p { font-size: 14px; }
//     section { padding: 40px 20px; }
//     .section-head h2 { font-size: 22px; }
//     .hero-actions { flex-direction: column; align-items: stretch; }
//     .hero-actions .btn-primary, .hero-actions .btn-secondary { width: 100%; }
//     .stats-strip { grid-template-columns: repeat(2, 1fr); gap: 20px 12px; margin-top: 36px; }
//     .stats-strip .stat h3 { font-size: 20px; }
//     .cities-grid, .features-grid { grid-template-columns: 1fr; }
//   }

//   /* ---------- Small phone ---------- */
//   @media (max-width: 380px) {
//     .hero h1 { font-size: 24px; }
//     .plate-chip { font-size: 10px; padding: 3px 10px; }
//     .stats-strip { grid-template-columns: 1fr 1fr; }
//   }
// `}</style>

//       <div className="hero" id="home">
//         <div className="hero-inner">
//           <div className="plate-chip">TRUSTED ACROSS INDIA</div>
//           <h1>Smarter parking, <span>fewer headaches</span></h1>
//           <p>
//             ParkFlow gives facility operators real-time occupancy tracking,
//             entry and exit logging, and reporting — built for busy Indian
//             cities where every slot counts.
//           </p>
//           <div className="hero-actions">
//             <button className="btn-primary" onClick={() => navigate('/login')}>
//               Operator login <FaArrowRight />
//             </button>
//             <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
//               View live dashboard
//             </button>
//           </div>
//         </div>

//         <div className="stats-strip">
//           <div className="stat"><h3>18+</h3><p>Cities live</p></div>
//           <div className="stat"><h3>340+</h3><p>Facilities managed</p></div>
//           <div className="stat"><h3>18,000+</h3><p>Slots tracked</p></div>
//           <div className="stat"><h3>99.6%</h3><p>Uptime</p></div>
//         </div>
//       </div>

//       <section id="cities">
//         <div className="section-head">
//           <div className="eyebrow">Where we operate</div>
//           <h2>Live in cities across India</h2>
//           <p>From metro hubs to growing tier-2 cities, ParkFlow runs facilities of every size.</p>
//         </div>
//         <div className="cities-grid">
//           {cities.map((city) => (
//             <div className="city-card" key={city.name}>
//               <div className="city-icon"><FaMapMarkerAlt /></div>
//               <div>
//                 <h3>{city.name}</h3>
//                 <p className="region">{city.region}</p>
//                 <p className="slots">{city.slots} slots tracked</p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </section>

//       <section>
//         <div className="section-head" id="parkFlow">
//           <div className="eyebrow">Why ParkFlow</div>
//           <h2>Built for the way facilities actually run</h2>
//           <p>Everything an operator needs, without the clutter.</p>
//         </div>
//         <div className="features-grid">
//           {features.map((f) => (
//             <div className="feature-card" key={f.title}>
//               <div className="feature-icon">{f.icon}</div>
//               <h3>{f.title}</h3>
//               <p>{f.body}</p>
//             </div>
//           ))}
//         </div>
//       </section>

//       <section className="cta-section">
//         <h2>Ready to see your facility on ParkFlow?</h2>
//         <p>Log in to the operator dashboard and check live occupancy in seconds.</p>
//         <button className="btn-primary" onClick={() => navigate('/login')}>
//           Get started <FaArrowRight />
//         </button>
//       </section>
//     </div>
//   );
// }

// export default Home;

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaMapMarkerAlt, FaBolt, FaShieldAlt, FaMobileAlt, FaArrowRight } from 'react-icons/fa';
import { loadParkingReferenceData } from '../liveParkingData';

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cities, setCities] = useState([]);

  useEffect(() => {
    loadParkingReferenceData()
      .then(({ cities: liveCities, plots }) => {
        setCities(liveCities.map((city) => ({
          ...city,
          slots: `${plots.filter((plot) => String(plot.city_id) === String(city.id)).length}`,
          region: city.state || 'India',
        })));
      })
      .catch(() => setCities([]));
  }, []);

  useEffect(() => {
    const sectionId = location.state?.scrollTo;
    if (sectionId) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          window.history.replaceState({}, document.title);
        });
      });
    }
  }, [location.state]);

  const features = [
    {
      icon: <FaBolt />,
      title: 'Real-time slot tracking',
      body: 'Live occupancy updates the moment a vehicle enters or exits, so operators always see accurate availability.',
    },
    {
      icon: <FaShieldAlt />,
      title: 'Secure operator access',
      body: 'Role-based logins keep facility data and payment records visible only to authorized staff.',
    },
    {
      icon: <FaMobileAlt />,
      title: 'Works on any device',
      body: 'Manage a facility from a front-desk terminal, a tablet at the gate, or a phone on the go.',
    },
  ];

  return (
    <div className="home-page">
      <style>{`
  :root {
    --bg-main:       #005a5a; /* Rich Teal */
    --bg-card:       #004444; /* Darker Teal for Cards */
    --deck-line:     rgba(255,255,255,0.15); 
    --accent:        #ffca28; /* Gold/Yellow Accent */
    --accent-hover:  #ffdb58; 
    --text-main:     #ffffff; 
    --text-muted:    #b2dfdb; /* Soft Teal for Subtext */
    --icon-bg:       rgba(255, 202, 40, 0.15);
  }

  * { box-sizing: border-box; }

  .home-page {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: var(--bg-main);
    color: var(--text-main);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ---------- Hero Section with Video ---------- */
  .hero {
    position: relative;
    overflow: hidden;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 40px;
    text-align: center;
  }

  .hero-video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
  }

  /* Teal overlay to make text readable over the video */
  .hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 90, 90, 0.75); 
    z-index: 1;
  }

  .hero-inner {
    position: relative;
    z-index: 2;
    max-width: 800px; /* Wider for larger text */
    width: 100%;
    margin: 0 auto;
    opacity: 0;
    transform: translateY(24px);
    animation: riseIn 0.8s ease-out forwards;
  }

  @keyframes riseIn {
    to { opacity: 1; transform: translateY(0); }
  }

  .plate-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'Space Mono', monospace;
    font-size: 14px; /* Increased */
    letter-spacing: 0.15em;
    color: #003333; 
    background: var(--accent);
    padding: 6px 16px;
    border-radius: 6px;
    margin-bottom: 24px;
    font-weight: 800;
  }

  .hero h1 {
    font-size: 64px; /* Increased */
    font-weight: 900;
    letter-spacing: -0.02em;
    margin: 0 0 20px;
    line-height: 1.1;
  }

  .hero h1 span { color: var(--accent); }

  .hero p {
    color: var(--text-muted);
    font-size: 22px; /* Increased */
    line-height: 1.6;
    margin: 0 0 40px;
  }

  .hero-actions {
    display: flex;
    gap: 20px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-primary, .btn-secondary {
    font-size: 18px; /* Increased */
    font-weight: 700;
    padding: 16px 32px;
    border-radius: 12px;
    cursor: pointer;
    border: none;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    justify-content: center;
    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }

  .btn-primary {
    background: var(--accent);
    color: #003333;
  }

  .btn-primary:hover {
    background: var(--accent-hover);
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(255, 202, 40, 0.4);
  }

  .btn-secondary {
    background: transparent;
    color: var(--text-main);
    border: 2px solid var(--deck-line);
  }

  .btn-secondary:hover {
    border-color: var(--text-muted);
    background: rgba(255,255,255,0.1);
    transform: translateY(-3px);
  }

  /* ---------- Stats strip ---------- */
  .stats-strip {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 30px;
    width: 100%;
    max-width: 1000px;
    margin: 60px auto 0;
  }

  .stats-strip .stat h3 {
    font-family: 'Space Mono', monospace;
    font-size: 36px; /* Increased */
    font-weight: 800;
    color: var(--accent);
    margin: 0;
  }

  .stats-strip .stat p {
    font-size: 14px; /* Increased */
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 8px 0 0;
  }

  /* ---------- Section Shell ---------- */
  section {
    max-width: 1200px; /* Increased */
    margin: 0 auto;
    padding: 60px 40px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .section-head {
    text-align: center;
    margin-bottom: 60px;
  }

  .section-head .eyebrow {
    font-family: 'Space Mono', monospace;
    font-size: 14px;
    letter-spacing: 0.2em;
    color: var(--accent);
    text-transform: uppercase;
    margin-bottom: 12px;
    font-weight: 800;
  }

  .section-head h2 {
    font-size: 42px; /* Increased */
    font-weight: 900;
    margin: 0 0 16px;
  }

  .section-head p {
    color: var(--text-muted);
    font-size: 20px; /* Increased */
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }

  /* ---------- Cities Grid ---------- */
  .cities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    width: 100%;
  }

  .city-card {
    background: var(--bg-card);
    border: 1px solid var(--deck-line);
    border-radius: 20px;
    padding: 30px; /* Increased */
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    transition: transform 0.3s ease, border-color 0.3s ease;
  }

  .city-card:hover {
    transform: translateY(-6px);
    border-color: var(--accent);
  }

  .city-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--icon-bg);
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
  }

  .city-card h3 {
    margin: 0;
    font-size: 22px; /* Increased */
    font-weight: 800;
  }

  .city-card .region {
    font-size: 16px;
    color: var(--text-muted);
    margin: 4px 0 8px;
  }

  .city-card .slots {
    font-family: 'Space Mono', monospace;
    font-size: 15px;
    color: #69f0ae; /* Mint */
    font-weight: 600;
  }

  /* ---------- Features Grid ---------- */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 30px;
    width: 100%;
  }

  .feature-card {
    background: var(--bg-card);
    border: 1px solid var(--deck-line);
    border-radius: 20px;
    padding: 40px 30px; /* Larger box */
    text-align: center;
    transition: transform 0.3s ease, border-color 0.3s ease;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  }

  .feature-card:hover {
    transform: translateY(-6px);
    border-color: var(--accent);
  }

  .feature-icon {
    width: 70px;
    height: 70px;
    border-radius: 16px;
    background: rgba(105, 240, 174, 0.15);
    color: #69f0ae;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    margin: 0 auto 24px;
  }

  .feature-card h3 {
    font-size: 24px; /* Increased */
    font-weight: 800;
    margin: 0 0 16px;
  }

  .feature-card p {
    font-size: 18px; /* Increased */
    color: var(--text-muted);
    line-height: 1.7;
    margin: 0;
  }

  /* ---------- CTA ---------- */
  .cta-section {
    text-align: center;
    border-top: 1px dashed var(--deck-line);
    align-items: center;
  }

  .cta-section h2 {
    font-size: 42px;
    font-weight: 900;
    margin: 0 0 20px;
  }

  .cta-section p {
    color: var(--text-muted);
    font-size: 20px;
    margin: 0 0 40px;
  }

  /* ---------- Responsiveness ---------- */
  @media (max-width: 1024px) {
    .hero h1 { font-size: 52px; }
    .section-head h2, .cta-section h2 { font-size: 36px; }
  }

  @media (max-width: 768px) {
    .hero { padding: 40px 20px; }
    .hero h1 { font-size: 42px; }
    .hero p { font-size: 18px; }
    .btn-primary, .btn-secondary { width: 100%; font-size: 16px; }
    .stats-strip { grid-template-columns: repeat(2, 1fr); gap: 24px; }
    section { padding: 60px 20px; }
    .section-head h2, .cta-section h2 { font-size: 32px; }
    .cities-grid, .features-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 480px) {
    .hero h1 { font-size: 34px; }
    .stats-strip { grid-template-columns: 1fr; gap: 20px; }
    .feature-card, .city-card { padding: 24px; }
  }
`}</style>

      <div className="hero" id="home">
        {/* Background Video Layer */}
        {/* Replace "parkflow-bg.mp4" with the path to your actual video in the public folder */}
        <video autoPlay loop muted playsInline className="hero-video">
          <source src="/parkflow-bg.mp4" type="video/mp4" />
        </video>

        {/* Overlay to darken video slightly so text pops */}
        <div className="hero-overlay"></div>

        <div className="hero-inner">
          <div className="plate-chip">TRUSTED ACROSS INDIA</div>
          <h1>Smarter parking, <br /><span>fewer headaches</span></h1>
          <p>
            ParkFlow gives facility operators real-time occupancy tracking,
            entry and exit logging, and reporting — built for busy Indian
            cities where every slot counts.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate('/login')}>
              Operator login <FaArrowRight />
            </button>
            <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
              View live dashboard
            </button>
          </div>
        </div>

        <div className="stats-strip">
          <div className="stat"><h3>18+</h3><p>Cities live</p></div>
          <div className="stat"><h3>340+</h3><p>Facilities managed</p></div>
          <div className="stat"><h3>18,000+</h3><p>Slots tracked</p></div>
          <div className="stat"><h3>99.6%</h3><p>Uptime</p></div>
        </div>
      </div>

      <section id="cities">
        <div className="section-head">
          <div className="eyebrow">Where we operate</div>
          <h2>Live in cities across India</h2>
          <p>From metro hubs to growing tier-2 cities, ParkFlow runs facilities of every size.</p>
        </div>
        <div className="cities-grid">
          {cities.map((city) => (
            <div className="city-card" key={city.name}>
              <div className="city-icon"><FaMapMarkerAlt /></div>
              <div>
                <h3>{city.name}</h3>
                <p className="region">{city.region}</p>
                <p className="slots">{city.slots} slots tracked</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="parkFlow">
        <div className="section-head">
          <div className="eyebrow">Why ParkFlow</div>
          <h2>Built for the way facilities actually run</h2>
          <p>Everything an operator needs, without the clutter.</p>
        </div>
        <div className="features-grid">
          {features.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to see your facility on ParkFlow?</h2>
        <p>Log in to the operator dashboard and check live occupancy in seconds.</p>
        <button className="btn-primary" onClick={() => navigate('/login')}>
          Get started <FaArrowRight />
        </button>
      </section>
    </div>
  );
}

export default Home;