import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const STARS = [
  { top: 6, left: 8, size: 2, delay: 0 },
  { top: 14, left: 18, size: 3, delay: 0.6 },
  { top: 9, left: 28, size: 2, delay: 1.2 },
  { top: 20, left: 6, size: 2, delay: 1.8 },
  { top: 30, left: 14, size: 3, delay: 0.3 },
  { top: 12, left: 40, size: 2, delay: 2.1 },
  { top: 24, left: 46, size: 2, delay: 0.9 },
  { top: 5, left: 55, size: 3, delay: 1.5 },
  { top: 34, left: 60, size: 2, delay: 0.2 },
  { top: 16, left: 66, size: 2, delay: 2.4 },
  { top: 8, left: 74, size: 2, delay: 1.0 },
  { top: 27, left: 80, size: 3, delay: 1.7 },
  { top: 38, left: 88, size: 2, delay: 0.5 },
  { top: 3, left: 92, size: 2, delay: 2.0 },
  { top: 40, left: 34, size: 2, delay: 1.3 },
  { top: 22, left: 96, size: 2, delay: 0.8 },
  { top: 32, left: 22, size: 2, delay: 1.9 },
  { top: 18, left: 84, size: 3, delay: 0.4 },
  { top: 42, left: 50, size: 2, delay: 1.1 },
  { top: 11, left: 12, size: 2, delay: 2.3 },
];

function Splashscreen() {
  const navigate = useNavigate();

  useEffect(() => {
    // Set a timer to navigate after 10 seconds (10000 milliseconds)
    const timer = setTimeout(() => {
      navigate('/home');
    }, 10000);

    // Cleanup the timer if the component unmounts before 10s
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-container">
      <style>{`
        :root {
          --asphalt: #14171c;
          --asphalt-2: #1d2128;
          --sky-1: #0b0d12;
          --sky-2: #161c26;
          --lane: #f2c94c;
          --green: #1d9e75;
          --green-dark: #04342c;
          --red: #e24b4a;
          --ink: #f5f6f7;
          --muted: #8c8a82;
          --moon: #f4efe0;
        }

        .splash-container {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Helvetica, Arial, sans-serif;
          background: var(--asphalt);
          color: var(--ink);
          width: 100vw;
          min-height: 100vh;
          min-height: 100dvh;
          overflow: hidden;
          position: relative;
        }

        /* NIGHT SKY */
        .sky {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 54vh;
          background: linear-gradient(180deg, var(--sky-1) 0%, var(--sky-2) 100%);
          overflow: hidden;
          z-index: 0;
        }

        .star {
          position: absolute;
          border-radius: 50%;
          background: var(--ink);
          animation: twinkle 2.6s ease-in-out infinite;
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }

        /* MOON — Uses transparent SVG mask to prevent dark background overlap */
        .moon {
          position: absolute;
          top: 6vh;
          right: 9vw;
          width: clamp(46px, 6vw, 84px);
          height: clamp(46px, 6vw, 84px);
          filter: drop-shadow(0 0 clamp(12px, 2vw, 24px) rgba(244, 239, 224, 0.35));
        }

        /* ROAD */
        .ground {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 46vh;
          background: var(--asphalt-2);
          border-top: clamp(3px, 0.4vh, 6px) solid var(--lane);
          z-index: 0;
        }

        .ground::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background-image: repeating-linear-gradient(
            90deg,
            var(--lane) 0 3vw,
            transparent 3vw 8vw
          );
          background-position-y: 0;
          height: clamp(2px, 0.3vh, 4px);
          opacity: 0.8;
        }

        /* BRAND */
        .brand {
          position: absolute;
          top: 16vh;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: clamp(12px, 2vh, 22px);
          z-index: 5;
          text-align: center;
        }

        .brand-mark {
          width: clamp(72px, 9vw, 140px);
          height: clamp(72px, 9vw, 140px);
          border-radius: clamp(16px, 2vw, 30px);
          background: var(--asphalt);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-mark svg {
          width: 62%;
          height: 62%;
        }

        .brand-word {
          font-size: clamp(28px, 4.4vw, 58px);
          font-weight: 800;
          letter-spacing: 0.03em;
        }

        .brand-word span {
          color: var(--green);
        }

        /* PARKING SLOT — Sized and aligned to fit the parked car cleanly */
        .slot {
          position: absolute;
          bottom: 11.5vh;
          left: 50vw;
          width: clamp(120px, 15vw, 200px);
          height: clamp(85px, 12vh, 145px);
          border: clamp(2px, 0.3vw, 4px) dashed rgba(245, 246, 247, 0.35);
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding-top: 8px;
          gap: 6px;
          z-index: 1;
        }

        .slot-label {
          font-weight: 800;
          font-size: clamp(14px, 1.6vw, 22px);
          color: rgba(245, 246, 247, 0.5);
        }

        .slot-dot {
          width: clamp(9px, 1vw, 14px);
          height: clamp(9px, 1vw, 14px);
          border-radius: 50%;
          animation: slotStatus 14s ease-in-out infinite;
        }

        /* GATE */
        .gate {
          position: absolute;
          bottom: 15vh;
          left: 14vw;
          z-index: 3;
          width: clamp(140px, 16vw, 240px);
          height: clamp(70px, 10vh, 120px);
        }

        .gate-housing {
          position: absolute;
          left: 0;
          bottom: 0;
          width: clamp(30px, 3.6vw, 48px);
          height: clamp(64px, 9.4vh, 112px);
          background: linear-gradient(180deg, #4a4f57, #22262c);
          border-radius: 6px 6px 3px 3px;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
        }

        .gate-housing::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 22%;
          border-radius: 6px 6px 0 0;
          background-image: repeating-linear-gradient(
            45deg,
            var(--lane) 0 6px,
            #14171c 6px 12px
          );
        }

        .gate-housing::after {
          content: "";
          position: absolute;
          left: 18%;
          right: 18%;
          top: 40%;
          height: 30%;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 6px 0 0 rgba(255, 255, 255, 0.05);
        }

        .gate-light {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: clamp(6px, 0.7vw, 10px);
          height: clamp(6px, 0.7vw, 10px);
          border-radius: 50%;
          background: var(--red);
          box-shadow: 0 0 6px rgba(226, 75, 74, 0.8);
          animation: beacon 1s ease-in-out infinite;
        }

        @keyframes beacon {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }

        .gate-arm {
          position: absolute;
          left: clamp(17px, 2vw, 27px);
          bottom: clamp(58px, 8.6vh, 102px);
          width: clamp(90px, 11vw, 170px);
          height: clamp(9px, 1vw, 14px);
          border-radius: 3px;
          background-image: repeating-linear-gradient(
            90deg,
            var(--ink) 0 16px,
            var(--red) 16px 32px
          );
          transform-origin: 0% 50%;
          animation: gateSwing 14s ease-in-out infinite;
          box-shadow: 0 2px 3px rgba(0, 0, 0, 0.35);
        }

        .gate-arm::before {
          content: "";
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          width: clamp(16px, 1.8vw, 26px);
          height: clamp(13px, 1.5vw, 20px);
          background: #2b2f36;
          border-radius: 3px;
        }

        .gate-arm::after {
          content: "";
          position: absolute;
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          width: clamp(11px, 1.2vw, 16px);
          height: clamp(11px, 1.2vw, 16px);
          border-radius: 50%;
          background: var(--red);
          box-shadow: 0 0 5px rgba(226, 75, 74, 0.7);
        }

        @keyframes gateSwing {
          0%, 9%    { transform: rotate(0deg); }
          13%, 28%  { transform: rotate(-80deg); }
          32%, 65%  { transform: rotate(0deg); }
          69%, 83%  { transform: rotate(-80deg); }
          87%, 100% { transform: rotate(0deg); }
        }

        @keyframes slotStatus {
          0%, 27%   { background: var(--green); box-shadow: 0 0 0 4px rgba(29, 158, 117, 0.25); }
          30%, 55%  { background: var(--red);   box-shadow: 0 0 0 4px rgba(226, 75, 74, 0.22); }
          58%, 100% { background: var(--green); box-shadow: 0 0 0 4px rgba(29, 158, 117, 0.25); }
        }

        /* CAR — Centered inside slot at 52vw */
        .car-track {
          position: absolute;
          bottom: 13.2vh;
          left: 0;
          z-index: 4;
          width: clamp(95px, 11vw, 150px);
          animation: carDriveX 14s ease-in-out infinite;
        }

        .car-flip {
          width: 100%;
          animation: carFlip 14s steps(1, end) infinite;
        }

        .car-flip svg {
          width: 100%;
          height: auto;
          display: block;
        }

        #carLight {
          animation: lightDim 14s ease-in-out infinite;
        }

        @keyframes carDriveX {
          0%   { transform: translateX(-30vw); }
          12%  { transform: translateX(13vw); }
          30%  { transform: translateX(52vw); }
          54%  { transform: translateX(52vw); }
          70%  { transform: translateX(13vw); }
          86%  { transform: translateX(-30vw); }
          100% { transform: translateX(-30vw); }
        }

        @keyframes carFlip {
          0%   { transform: scaleX(-1); }
          55%  { transform: scaleX(-1); }
          56%  { transform: scaleX(1); }
          99%  { transform: scaleX(1); }
          100% { transform: scaleX(-1); }
        }

        @keyframes lightDim {
          0%, 28%   { opacity: 1; }
          31%, 53%  { opacity: 0.2; }
          56%, 100% { opacity: 1; }
        }

        .status {
          position: absolute;
          left: 0;
          right: 0;
          bottom: clamp(16px, 4vh, 40px);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          z-index: 5;
        }

        .status-dot {
          width: clamp(5px, 0.6vw, 8px);
          height: clamp(5px, 0.6vw, 8px);
          border-radius: 50%;
          background: var(--green);
          animation: dotPulse 1s ease-in-out infinite;
        }

        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        .status-text {
          font-size: clamp(11px, 1vw, 16px);
          color: var(--muted);
        }

        @media (prefers-reduced-motion: reduce) {
          .gate-arm, .car-track, .car-flip, #carLight, .slot-dot, .star, .gate-light { animation: none; }
          .car-track { transform: translateX(52vw); }
          .car-flip { transform: scaleX(-1); }
          .slot-dot { background: var(--red); }
          .gate-arm { transform: rotate(-80deg); }
        }
      `}</style>

      <div className="sky">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="star"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
        <div className="moon">
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
            <defs>
              <mask id="moon-cutout">
                <rect x="0" y="0" width="100" height="100" fill="white" />
                <circle cx="34" cy="38" r="42" fill="black" />
              </mask>
            </defs>
            <circle cx="50" cy="50" r="44" fill="var(--moon)" mask="url(#moon-cutout)" />
          </svg>
        </div>
      </div>

      <div className="ground"></div>

      <div className="brand">
        <div className="brand-mark">
          <svg viewBox="0 0 200 200" role="img" aria-label="Park Flow logo mark">
            <text
              x="100"
              y="128"
              textAnchor="middle"
              fontFamily="Arial, Helvetica, sans-serif"
              fontWeight="800"
              fontSize="118"
              fill="#F5F6F7"
            >
              P
            </text>
            <path
              d="M42,152 C66,132 86,172 110,152 C128,136 142,150 158,146"
              fill="none"
              stroke="#1D9E75"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <circle cx="158" cy="146" r="7" fill="#1D9E75" />
          </svg>
        </div>
        <div className="brand-word">
          PARK <span>FLOW</span>
        </div>
      </div>

      <div className="slot">
        <div className="slot-label">P</div>
        <div className="slot-dot"></div>
      </div>

      <div className="gate">
        <div className="gate-housing">
          <span className="gate-light"></span>
        </div>
        <div className="gate-arm"></div>
      </div>

      <div className="car-track">
        <div className="car-flip">
          <svg viewBox="0 0 120 60" role="img" aria-label="Car">
            <path
              d="M8,44 L12,44 C12,44 15,29 30,25 L46,25 C50,19 58,15 70,15 L86,15 C97,15 104,22 108,31 L112,44 Z"
              fill="#1D9E75"
            />
            <path
              d="M33,25 L46,25 C50,19 58,15 70,15 L82,15 C86,19 86,25 86,25 Z"
              fill="#0F6E56"
            />
            <circle cx="30" cy="47" r="9" fill="#14171C" />
            <circle cx="30" cy="47" r="3.5" fill="#8C8A82" />
            <circle cx="90" cy="47" r="9" fill="#14171C" />
            <circle cx="90" cy="47" r="3.5" fill="#8C8A82" />
            <circle id="carLight" cx="111" cy="35" r="4" fill="#F2C94C" />
          </svg>
        </div>
      </div>

      <div className="status">
        <span className="status-dot"></span>
        <span className="status-text">Live gate and slot activity</span>
      </div>
    </div>
  );
}

export default Splashscreen;