// AlignmentSuggestion.js
import React, { useState, useMemo, useEffect } from 'react';
import {
  FaRulerCombined, FaCar, FaMotorcycle, FaMagic, FaCheckCircle,
  FaTimesCircle, FaEye, FaTimes, FaMapMarkerAlt, FaLayerGroup,
  FaExclamationTriangle, FaBuilding,
} from 'react-icons/fa';

// Import your API config instance
import { apiRequest, asRows } from '../apiClient'; //[cite: 3]

const STATUS_META = {
  generated: { label: 'Generated', color: 'var(--sodium)' },
  accepted: { label: 'Accepted', color: 'var(--go)' },
  rejected: { label: 'Rejected', color: 'var(--stop)' },
};

const VEHICLE_FOCUS_META = {
  both: { label: 'Both', icon: null },
  car_only: { label: 'Car only', icon: FaCar },
  bike_only: { label: 'Bike only', icon: FaMotorcycle },
};

// ---------- Architectural heuristic engine ----------
const CAR_AREA_PER_SLOT = 260;   // sqft incl. share of aisle
const BIKE_AREA_PER_SLOT = 28;   // sqft incl. share of aisle
const CIRCULATION_FACTOR = 0.68; // usable fraction after aisles/entry-exit

const CAR_STALL_DIMENSIONS = { width: 8, length: 16 };   // ft
const BIKE_STALL_DIMENSIONS = { width: 3, length: 7 };   // ft

function resolveDimensions({ width_ft, length_ft }) {
  const width = Number(width_ft) || 0;
  const length = Number(length_ft) || 0;
  return { width, length, totalArea: width * length };
}

function splitAcrossFloors(count, floors) {
  const base = Math.floor(count / floors);
  const remainder = count % floors;
  return Array.from({ length: floors }, (_, i) => base + (i < remainder ? 1 : 0));
}

function generateSuggestion(input) {
  const { width, length, totalArea } = resolveDimensions(input);
  const usableArea = totalArea * CIRCULATION_FACTOR;
  const floors = Math.max(Number(input.floors) || 1, 1);

  const maxCarOnly = Math.floor(usableArea / CAR_AREA_PER_SLOT);
  const maxBikeOnly = Math.floor(usableArea / BIKE_AREA_PER_SLOT);

  const requestedCar = Number(input.requested_car_slots) || 0;
  const requestedBike = Number(input.requested_bike_slots) || 0;
  const vehicleFocus = input.vehicle_focus || 'both';

  let carSlots, bikeSlots, note;

  if (vehicleFocus === 'car_only') {
    carSlots = requestedCar > 0 ? Math.min(requestedCar, maxCarOnly) : maxCarOnly;
    bikeSlots = 0;
    note = requestedCar > 0 && requestedCar > maxCarOnly
      ? `Car-only mode — requested ${requestedCar} exceeds capacity, capped at the max ${maxCarOnly} cars this area supports.`
      : 'Car-only mode — this area is suggested entirely for car parking, no bike slots.';
  } else if (vehicleFocus === 'bike_only') {
    bikeSlots = requestedBike > 0 ? Math.min(requestedBike, maxBikeOnly) : maxBikeOnly;
    carSlots = 0;
    note = requestedBike > 0 && requestedBike > maxBikeOnly
      ? `Bike-only mode — requested ${requestedBike} exceeds capacity, capped at the max ${maxBikeOnly} bikes this area supports.`
      : 'Bike-only mode — this area is suggested entirely for bike parking, no car slots.';
  } else if (requestedCar === 0 && requestedBike === 0) {
    const carArea = usableArea * 0.7;
    const bikeArea = usableArea * 0.3;
    carSlots = Math.floor(carArea / CAR_AREA_PER_SLOT);
    bikeSlots = Math.floor(bikeArea / BIKE_AREA_PER_SLOT);
    note = 'No slot preference given — auto-proposed a 70/30 car-to-bike area split based on typical demand.';
  } else {
    const reqCarArea = requestedCar * CAR_AREA_PER_SLOT;
    const reqBikeArea = requestedBike * BIKE_AREA_PER_SLOT;

    if (reqCarArea + reqBikeArea <= usableArea) {
      carSlots = requestedCar;
      const remaining = usableArea - reqCarArea - reqBikeArea;
      const extraBikes = Math.floor(remaining / BIKE_AREA_PER_SLOT);
      bikeSlots = requestedBike + extraBikes;
      note = extraBikes > 0
        ? `Requested mix fits comfortably — added ${extraBikes} extra bike slots using leftover space.`
        : 'Requested mix fits the plot as specified.';
    } else {
      const totalReqArea = reqCarArea + reqBikeArea || 1;
      const scale = usableArea / totalReqArea;
      carSlots = Math.max(Math.floor(requestedCar * scale), 0);
      bikeSlots = Math.max(Math.floor(requestedBike * scale), 0);
      note = 'Requested slot count exceeds what this plot can hold — scaled down proportionally to fit.';
    }
  }

  const carPerFloor = splitAcrossFloors(carSlots, floors);
  const bikePerFloor = splitAcrossFloors(bikeSlots, floors);
  const floorBreakdown = Array.from({ length: floors }, (_, i) => ({
    floor: i + 1,
    cars: carPerFloor[i],
    bikes: bikePerFloor[i],
  }));

  return {
    width, length, totalArea, usableArea, carSlots, bikeSlots,
    maxCarOnly, maxBikeOnly, note, floors, floorBreakdown, vehicleFocus,
  };
}

// ---------- Top-down aerial layout diagram ----------

const RENDER_CAP = 120;

function ParkingSlot({ type, side }) {
  const isLeft = side === 'left';
  return (
    <div className={`p-slot p-slot-${type}`} style={{
      borderLeft: isLeft ? '2px solid rgba(255,255,255,0.7)' : 'none',
      borderRight: !isLeft ? '2px solid rgba(255,255,255,0.7)' : 'none',
    }}>
      {type === 'car' ? (
        <div className="p-slot-car-body">
          <div className="p-slot-windshield" style={{ right: isLeft ? 6 : 'auto', left: !isLeft ? 6 : 'auto' }} />
          <div className="p-slot-rearwindow" style={{ left: isLeft ? 4 : 'auto', right: !isLeft ? 4 : 'auto' }} />
        </div>
      ) : type === 'bike' ? (
        <div className="p-slot-bike-body" />
      ) : null}
    </div>
  );
}

function LayoutDiagram({ result }) {
  const { carSlots, bikeSlots } = result;
  const totalRender = Math.min(carSlots + bikeSlots, RENDER_CAP);
  const overflow = (carSlots + bikeSlots) - totalRender;

  let slotsArr = [
    ...Array(Math.min(carSlots, RENDER_CAP)).fill('car'),
    ...Array(Math.max(0, Math.min(bikeSlots, RENDER_CAP - carSlots))).fill('bike'),
  ];

  const COL_SIZE = 8;
  const columns = [];
  for (let i = 0; i < slotsArr.length; i += COL_SIZE) {
    columns.push(slotsArr.slice(i, i + COL_SIZE));
  }

  const bays = [];
  for (let i = 0; i < columns.length; i += 2) {
    bays.push([columns[i], columns[i + 1] || []]);
  }

  return (
    <div className="lot-surface">
      <div className="lot-bays">
        {bays.map((bay, idx) => (
          <div key={idx} className="lot-bay">
            <div className="lot-bay-col">
              {bay[0].map((type, i) => <ParkingSlot key={`l-${i}`} type={type} side="left" />)}
              {Array.from({ length: COL_SIZE - bay[0].length }).map((_, i) => (
                <ParkingSlot key={`e-l-${i}`} type="empty" side="left" />
              ))}
            </div>

            <div className="lot-aisle">
              <div className="lot-aisle-line" />
              <div className="lot-aisle-label">ROUTE {(idx + 1).toString().padStart(2, '0')}</div>
            </div>

            {bay[1].length > 0 || bay[0].length > 0 ? (
              <div className="lot-bay-col">
                {bay[1].map((type, i) => <ParkingSlot key={`r-${i}`} type={type} side="right" />)}
                {Array.from({ length: COL_SIZE - bay[1].length }).map((_, i) => (
                  <ParkingSlot key={`e-r-${i}`} type="empty" side="right" />
                ))}
              </div>
            ) : (
              <div className="lot-bay-col-empty" />
            )}
          </div>
        ))}
      </div>

      {overflow > 0 && (
        <p className="lot-overflow-note">+ {overflow} more slots (not drawn in visualization)</p>
      )}
    </div>
  );
}

function StallSpecs({ result }) {
  if (result.carSlots <= 0 && result.bikeSlots <= 0) return null;
  return (
    <div className="stall-specs">
      {result.carSlots > 0 && (
        <div className="stall-spec-chip car">
          <FaCar />
          <span>Car stall: {CAR_STALL_DIMENSIONS.width} ft × {CAR_STALL_DIMENSIONS.length} ft per car</span>
        </div>
      )}
      {result.bikeSlots > 0 && (
        <div className="stall-spec-chip bike">
          <FaMotorcycle />
          <span>Bike stall: {BIKE_STALL_DIMENSIONS.width} ft × {BIKE_STALL_DIMENSIONS.length} ft per bike</span>
        </div>
      )}
    </div>
  );
}

function FloorBreakdown({ floorBreakdown, vehicleFocus }) {
  if (!floorBreakdown || floorBreakdown.length <= 1) return null;

  return (
    <div className="floor-breakdown">
      <div className="floor-breakdown-title">
        <FaBuilding style={{ fontSize: 12 }} /> Floor-wise distribution
      </div>
      <div className="floor-list">
        {floorBreakdown.map((f) => (
          <div className="floor-row" key={f.floor}>
            <span className="floor-num">Floor {f.floor}</span>
            <div className="floor-counts">
              {vehicleFocus !== 'bike_only' && (
                <span className="floor-count car"><FaCar style={{ fontSize: 10 }} /> {f.cars}</span>
              )}
              {vehicleFocus !== 'car_only' && (
                <span className="floor-count bike"><FaMotorcycle style={{ fontSize: 10 }} /> {f.bikes}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const emptyForm = {
  plot_id: '',
  width_ft: '',
  length_ft: '',
  requested_car_slots: '',
  requested_bike_slots: '',
  vehicle_focus: 'both',
  floors: '1',
};

const initialHistory = [
  {
    id: 1, plot_id: 103, width_ft: 180, length_ft: 90,
    requested_car_slots: 60, requested_bike_slots: 80,
    suggested_car_slots: 60, suggested_bike_slots: 112, status: 'accepted',
    floors: 1, vehicle_focus: 'both',
    created_at: '2026-06-10 10:20:00',
  },
  {
    id: 2, plot_id: 101, width_ft: 95, length_ft: 100,
    requested_car_slots: 40, requested_bike_slots: 50,
    suggested_car_slots: 24, suggested_bike_slots: 30, status: 'rejected',
    floors: 1, vehicle_focus: 'both',
    created_at: '2026-05-22 14:05:00',
  },
];

function AlignmentSuggestion() {
  const [plots, setPlots] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(initialHistory);
  const [activeRecord, setActiveRecord] = useState(null);

  // Fetch live plot data using apiRequest
  useEffect(() => {
    const fetchPlots = async () => {
      try {
        const response = await apiRequest('/parkingplot'); //[cite: 3]
        const plotArray = asRows(response); //[cite: 3]

        const plotsMap = {};

        plotArray.forEach(plot => {
          // Check for standard ID variations, matching ParkingPlot[cite: 3]
          const plotId = plot.plot_id || plot.id || plot._id;
          const plotName = plot.plot_name || plot.name || plot.title || `Plot ${plotId}`;

          if (plotId) {
            plotsMap[plotId] = plotName;
          }
        });

        if (Object.keys(plotsMap).length === 0) {
          throw new Error("API returned an empty structure or no plots found.");
        }

        setPlots(plotsMap);

        // Automatically select the first plot if available
        const firstId = Object.keys(plotsMap)[0];
        if (firstId) {
          setForm(prev => ({ ...prev, plot_id: String(firstId) }));
        }

      } catch (error) {
        console.error('Failed to fetch parking plots, loading fallback list:', error);

        const fallbackPlots = {
          101: 'Cyber Towers Basement Parking',
          102: 'Andheri East Open Yard',
          103: 'Whitefield Tech Park Deck',
        };
        setPlots(fallbackPlots);
        setForm(prev => ({ ...prev, plot_id: '101' }));
      }
    };

    fetchPlots();
  }, []);

  const canGenerate = useMemo(() => form.width_ft && form.length_ft && form.plot_id, [form]);

  const liveCapacity = useMemo(() => {
    if (!canGenerate) return null;
    const { totalArea } = resolveDimensions(form);
    const usableArea = totalArea * CIRCULATION_FACTOR;
    return {
      maxCar: Math.floor(usableArea / CAR_AREA_PER_SLOT),
      maxBike: Math.floor(usableArea / BIKE_AREA_PER_SLOT),
    };
  }, [form, canGenerate]);

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!canGenerate) return;
    setResult(generateSuggestion(form));
  };

  const saveSuggestion = (status) => {
    if (!result) return;
    const newRecord = {
      id: Math.max(...history.map((h) => h.id), 0) + 1,
      plot_id: Number(form.plot_id) || form.plot_id,
      width_ft: Number(form.width_ft),
      length_ft: Number(form.length_ft),
      requested_car_slots: Number(form.requested_car_slots) || 0,
      requested_bike_slots: Number(form.requested_bike_slots) || 0,
      suggested_car_slots: result.carSlots,
      suggested_bike_slots: result.bikeSlots,
      floors: result.floors,
      vehicle_focus: result.vehicleFocus,
      status,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    setHistory([newRecord, ...history]);
    setResult(null);
    setForm(prev => ({ ...emptyForm, plot_id: prev.plot_id }));
  };

  return (
    <div className="as-page">
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

        .as-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: var(--deck);
          color: var(--ink);
          min-height: 100vh;
          padding: 40px;
        }

        .as-header { margin-bottom: 24px; }
        .as-header h1 { font-size: 26px; font-weight: 800; margin: 0 0 4px; }
        .as-header p { color: var(--muted); font-size: 14px; margin: 0; }

        .engine-note {
          display: flex; align-items: center; gap: 8px;
          background: rgba(139,124,246,0.08);
          border: 1px dashed rgba(139,124,246,0.35);
          color: #b6acf9; font-size: 12px; padding: 8px 14px;
          border-radius: 10px; margin-bottom: 22px;
          flex-wrap: wrap;
        }

        .as-layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 20px;
          align-items: start;
          margin-bottom: 34px;
        }

        .form-panel, .result-panel {
          background: var(--deck-panel);
          border: 1px solid var(--deck-line);
          border-radius: 16px;
          padding: 24px;
          min-width: 0;
        }

        .panel-title { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .panel-title-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(255,176,32,0.12); color: var(--sodium);
          display: flex; align-items: center; justify-content: center; font-size: 15px;
          flex-shrink: 0;
        }
        .panel-title h2 { font-size: 15px; font-weight: 700; margin: 0; }

        .field { margin-bottom: 16px; }
        .field label {
          display: block; font-size: 12px; font-weight: 600; color: var(--muted);
          text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px;
        }
        .field input, .field select {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid var(--deck-line); color: var(--ink);
          padding: 10px 12px; border-radius: 8px; font-size: 14px;
          outline: none; font-family: inherit;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          color-scheme: dark;
        }
        .field input:focus, .field select:focus {
          border-color: transparent; box-shadow: 0 0 0 3px rgba(255,176,32,0.18);
        }
        .field select option { background: var(--deck-panel); color: var(--ink); }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .focus-tabs { display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; }
        .focus-tab {
          flex: 1; min-width: 90px; display: flex; align-items: center; justify-content: center; gap: 6px;
          text-align: center; background: rgba(255,255,255,0.03);
          border: 1px solid var(--deck-line); color: var(--muted);
          padding: 9px 8px; border-radius: 8px; cursor: pointer;
          font-size: 11px; font-weight: 600;
          transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
        }
        .focus-tab.active {
          border-color: #8b7cf6; color: #b6acf9; background: rgba(139,124,246,0.1);
        }

        .live-capacity {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: rgba(43,181,131,0.08);
          border: 1px solid rgba(43,181,131,0.3);
          color: #8ee6c0;
          font-size: 12px;
          padding: 10px 12px;
          border-radius: 9px;
          margin-bottom: 16px;
          line-height: 1.5;
          animation: liveIn 0.2s ease;
        }

        .live-capacity strong {
          color: var(--go);
          font-family: 'Space Mono', monospace;
        }

        @keyframes liveIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .field-hint { font-size: 11px; color: var(--muted); margin: -10px 0 16px; }

        .btn-generate {
          width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: var(--sodium); color: var(--deck); border: none;
          padding: 13px; border-radius: 10px; font-size: 14px; font-weight: 700;
          cursor: pointer; margin-top: 4px;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .btn-generate:hover:not(:disabled) { background: #ffc250; transform: translateY(-2px); }
        .btn-generate:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .result-panel { min-height: 340px; display: flex; flex-direction: column; }
        .result-placeholder {
          flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
          color: var(--muted); text-align: center; font-size: 13px;
        }
        .result-placeholder svg { font-size: 28px; margin-bottom: 10px; opacity: 0.5; }

        .capacity-strip { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
        .capacity-chip {
          flex: 1; min-width: 140px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--deck-line);
          border-radius: 10px; padding: 10px 12px;
        }
        .capacity-chip .lbl {
          font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 4px;
        }
        .capacity-chip .val { font-family: 'Space Mono', monospace; font-size: 15px; font-weight: 700; }

        .suggestion-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
        .sugg-stat {
          background: rgba(255,255,255,0.03); border: 1px solid var(--deck-line);
          border-radius: 10px; padding: 12px 14px; text-align: center;
        }
        .sugg-stat .num { font-family: 'Space Mono', monospace; font-size: 24px; font-weight: 800; }
        .sugg-stat.car .num { color: var(--sodium); }
        .sugg-stat.bike .num { color: var(--go); }
        .sugg-stat .lbl { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 4px; }
        .sugg-stat.dim { opacity: 0.35; }

        .area-note { font-size: 12px; color: var(--muted); margin-bottom: 14px; }

        .engine-comment {
          display: flex; gap: 8px; background: rgba(255,176,32,0.06);
          border: 1px solid rgba(255,176,32,0.25); color: #ffcf7a;
          font-size: 12px; padding: 10px 12px; border-radius: 10px;
          margin-bottom: 16px; line-height: 1.5;
        }

        .stall-specs { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
        .stall-spec-chip {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 600;
          padding: 8px 12px; border-radius: 9px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--deck-line);
        }
        .stall-spec-chip.car { color: var(--sodium); }
        .stall-spec-chip.bike { color: var(--go); }

        .floor-breakdown {
          margin-top: 16px;
          background: rgba(139,124,246,0.06);
          border: 1px solid rgba(139,124,246,0.25);
          border-radius: 10px;
          padding: 12px 14px;
        }
        .floor-breakdown-title {
          display: flex; align-items: center; gap: 7px;
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
          color: #b6acf9; margin-bottom: 10px;
        }
        .floor-list { display: flex; flex-direction: column; gap: 6px; }
        .floor-row {
          display: flex; justify-content: space-between; align-items: center;
          background: rgba(255,255,255,0.03);
          border-radius: 8px; padding: 7px 10px;
        }
        .floor-num { font-size: 12px; font-weight: 600; color: var(--ink); }
        .floor-counts { display: flex; gap: 12px; }
        .floor-count {
          display: flex; align-items: center; gap: 5px;
          font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700;
        }
        .floor-count.car { color: var(--sodium); }
        .floor-count.bike { color: var(--go); }

        .decision-row { display: flex; gap: 10px; margin-top: 16px; }
        .btn-accept, .btn-reject {
          flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          border: none; padding: 11px; border-radius: 10px; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: transform 0.2s ease, background 0.2s ease;
        }
        .btn-accept { background: var(--go); color: #06251b; }
        .btn-accept:hover { background: #34c793; transform: translateY(-2px); }
        .btn-reject {
          background: rgba(226,83,74,0.14); color: var(--stop); border: 1px solid rgba(226,83,74,0.35);
        }
        .btn-reject:hover { background: rgba(226,83,74,0.22); transform: translateY(-2px); }

        .history-title { font-size: 16px; font-weight: 700; margin: 0 0 14px; }
        .as-table-wrap {
          background: var(--deck-panel); border: 1px solid var(--deck-line);
          border-radius: 16px; overflow-x: auto;
        }

        table.as-table { min-width: 620px; }
        table.as-table { width: 100%; border-collapse: collapse; }
        .as-table th {
          text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.05em; color: var(--muted); padding: 14px 18px;
          border-bottom: 1px solid var(--deck-line);
        }
        .as-table td { padding: 14px 18px; font-size: 13px; border-bottom: 1px solid var(--deck-line); }
        .as-table tr:last-child td { border-bottom: none; }

        .status-pill {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px;
        }
        .status-pill::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

        .slot-mix { display: flex; gap: 10px; font-family: 'Space Mono', monospace; font-size: 12px; }
        .slot-mix .car { color: var(--sodium); }
        .slot-mix .bike { color: var(--go); }

        .floors-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; color: var(--muted); font-family: 'Space Mono', monospace;
        }

        .btn-view {
          display: inline-flex; align-items: center; gap: 6px; background: transparent;
          border: 1px solid var(--deck-line); color: var(--ink); font-size: 12px; font-weight: 600;
          padding: 6px 12px; border-radius: 8px; cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s ease;
        }
        .btn-view:hover { border-color: var(--sodium); color: var(--sodium); }

        /* ---------- Aerial lot surface (top-down layout diagram) ---------- */
        .lot-surface {
          background: #2a2e37;
          border: 1px solid var(--deck-line);
          border-radius: 12px;
          padding: 24px 20px;
          overflow-x: auto;
          position: relative;
        }

        .lot-bays {
          display: flex;
          gap: 34px;
          min-width: min-content;
          margin: 0 auto;
          justify-content: center;
        }

        .lot-bay { display: flex; gap: 46px; position: relative; }

        .lot-bay-col { display: flex; flex-direction: column; }
        .lot-bay-col-empty { width: 60px; }

        .lot-aisle {
          position: absolute; left: 50%; top: 0; bottom: 0; width: 46px;
          transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
        }

        .lot-aisle-line {
          width: 2px; height: 100%;
          background: repeating-linear-gradient(to bottom, rgba(255,255,255,0.4) 0, rgba(255,255,255,0.4) 12px, transparent 12px, transparent 24px);
        }

        .lot-aisle-label {
          position: absolute;
          transform: rotate(-90deg);
          font-size: 10px;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.6);
          font-family: 'Space Mono', monospace;
          white-space: nowrap;
          background: #2a2e37;
          padding: 4px 10px;
          border-radius: 4px;
        }

        .p-slot {
          width: 60px; height: 32px;
          border-bottom: 2px solid rgba(255,255,255,0.7);
          border-top: 2px solid rgba(255,255,255,0.7);
          display: flex; align-items: center; justify-content: center;
          margin: -1px 0;
          position: relative;
          flex-shrink: 0;
        }

        .p-slot-car-body {
          width: 44px; height: 20px;
          background-color: var(--sodium);
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          position: relative;
        }

        .p-slot-windshield {
          position: absolute; top: 3px; bottom: 3px; width: 6px;
          background-color: rgba(0,0,0,0.4); border-radius: 2px;
        }

        .p-slot-rearwindow {
          position: absolute; top: 4px; bottom: 4px; width: 4px;
          background-color: rgba(0,0,0,0.2); border-radius: 1px;
        }

        .p-slot-bike-body {
          width: 20px; height: 10px;
          background-color: var(--go);
          border-radius: 2px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .lot-overflow-note {
          font-size: 11px; color: rgba(255,255,255,0.6);
          margin: 16px 0 0; text-align: center;
        }

        .as-overlay {
          position: fixed; inset: 0; background: rgba(10,11,13,0.6);
          backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center;
          z-index: 200; padding: 20px; opacity: 0; animation: overlayIn 0.25s ease forwards;
        }
        @keyframes overlayIn { to { opacity: 1; } }

        .as-modal {
          background: rgba(28,32,41,0.94); backdrop-filter: blur(20px) saturate(140%);
          border: 1px solid var(--deck-line); border-radius: 18px;
          width: 100%; max-width: 640px; max-height: 88vh; overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0,0,0,0.45);
          opacity: 0; transform: translateY(20px) scale(0.98);
          animation: modalIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes modalIn { to { opacity: 1; transform: translateY(0) scale(1); } }

        .as-modal-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 22px 26px 16px; border-bottom: 1px solid var(--deck-line);
        }
        .as-modal-header h2 { font-size: 17px; font-weight: 800; margin: 0 0 4px; }
        .as-modal-header .sub { font-size: 12px; color: var(--muted); }

        .btn-close {
          background: rgba(255,255,255,0.06); border: none; color: var(--ink);
          width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.2s ease, transform 0.2s ease;
          flex-shrink: 0;
        }
        .btn-close:hover { background: rgba(255,255,255,0.12); transform: rotate(90deg); }

        .as-modal-body { padding: 20px 26px 26px; }

        @media (prefers-reduced-motion: reduce) {
          .as-overlay, .as-modal, .btn-close, .live-capacity { animation: none !important; transition: none !important; }
        }

        @media (max-width: 1024px) {
          .as-page { padding: 24px; }
          .as-layout { grid-template-columns: 340px 1fr; }
        }

        @media (max-width: 900px) {
          .as-layout { grid-template-columns: 1fr; }
        }

        @media (max-width: 640px) {
          .as-page { padding: 16px; }
          .as-header h1 { font-size: 22px; }
          .form-panel, .result-panel { padding: 16px; border-radius: 12px; }
          .field-row { grid-template-columns: 1fr; }
          .capacity-strip { flex-direction: column; }
          .suggestion-stats { grid-template-columns: 1fr; }
          .focus-tab { font-size: 10px; padding: 8px 4px; min-width: 70px; }
          .decision-row { flex-direction: column; }
          .stall-specs { flex-direction: column; }
          table.as-table { min-width: 520px; }
          .lot-surface { padding: 16px 12px; }
          .lot-bays { gap: 20px; }
          .lot-bay { gap: 30px; }
          .lot-aisle { width: 30px; }
          .p-slot { width: 46px; height: 26px; }
          .p-slot-car-body { width: 34px; height: 16px; }
          .p-slot-bike-body { width: 15px; height: 8px; }
        }

        @media (max-width: 400px) {
          .as-page { padding: 12px; }
          .as-header h1 { font-size: 19px; }
          .as-header p { font-size: 13px; }
          .engine-note { font-size: 11px; }
        }
      `}</style>

      <div className="as-header">
        <h1>Alignment suggestions</h1>
        <p>Get an optimal car/bike slot layout for a plot based on its available area.</p>
      </div>

      <div className="engine-note">
        <FaLayerGroup /> Powered by a rule-based layout engine (standard stall footprints + circulation ratios) — runs instantly, no API cost.
      </div>

      <div className="as-layout">
        <div className="form-panel">
          <div className="panel-title">
            <div className="panel-title-icon"><FaRulerCombined /></div>
            <h2>Plot dimensions</h2>
          </div>

          <form onSubmit={handleGenerate}>
            <div className="field">
              <label><FaMapMarkerAlt style={{ marginRight: 4 }} />Plot</label>
              <select value={form.plot_id} onChange={(e) => setForm({ ...form, plot_id: e.target.value })}>
                {Object.keys(plots).length === 0 && <option value="">Loading plots...</option>}
                {Object.entries(plots).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Width (ft)</label>
                <input
                  type="number" min="1"
                  value={form.width_ft}
                  onChange={(e) => setForm({ ...form, width_ft: e.target.value })}
                  placeholder="e.g. 180"
                />
              </div>
              <div className="field">
                <label>Length (ft)</label>
                <input
                  type="number" min="1"
                  value={form.length_ft}
                  onChange={(e) => setForm({ ...form, length_ft: e.target.value })}
                  placeholder="e.g. 90"
                />
              </div>
            </div>

            {liveCapacity && (
              <div className="live-capacity">
                <FaMagic style={{ fontSize: 11, marginTop: 2, flexShrink: 0 }} />
                <span>
                  This area can freely park <strong>{liveCapacity.maxCar} cars</strong> or <strong>{liveCapacity.maxBike} bikes</strong> (if used for one vehicle type only)
                </span>
              </div>
            )}

            <div className="field">
              <label>Vehicle focus</label>
              <div className="focus-tabs">
                {Object.entries(VEHICLE_FOCUS_META).map(([key, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <div
                      key={key}
                      className={`focus-tab ${form.vehicle_focus === key ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, vehicle_focus: key })}
                    >
                      {Icon && <Icon />} {meta.label}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="field-row" style={{ gridTemplateColumns: (form.vehicle_focus !== 'both') ? '1fr' : '1fr 1fr' }}>
              {form.vehicle_focus !== 'bike_only' && (
                <div className="field">
                  <label><FaCar style={{ marginRight: 4, color: 'var(--sodium)' }} />Requested car slots</label>
                  <input
                    type="number" min="0"
                    value={form.requested_car_slots}
                    onChange={(e) => setForm({ ...form, requested_car_slots: e.target.value })}
                    placeholder="0"
                  />
                </div>
              )}
              {form.vehicle_focus !== 'car_only' && (
                <div className="field">
                  <label><FaMotorcycle style={{ marginRight: 4, color: 'var(--go)' }} />Requested bike slots</label>
                  <input
                    type="number" min="0"
                    value={form.requested_bike_slots}
                    onChange={(e) => setForm({ ...form, requested_bike_slots: e.target.value })}
                    placeholder="0"
                  />
                </div>
              )}
            </div>
            <p className="field-hint">Leave blank to auto-detect the best mix for this area.</p>

            <div className="field">
              <label><FaBuilding style={{ marginRight: 4, color: '#b6acf9' }} />Number of floors</label>
              <input
                type="number" min="1" max="20"
                value={form.floors}
                onChange={(e) => setForm({ ...form, floors: e.target.value })}
                placeholder="1"
              />
            </div>
            <p className="field-hint">Total suggested slots split evenly across each floor.</p>

            <button type="submit" className="btn-generate" disabled={!canGenerate}>
              <FaMagic /> Generate suggestion
            </button>
          </form>
        </div>

        <div className="result-panel">
          <div className="panel-title">
            <div className="panel-title-icon"><FaLayerGroup /></div>
            <h2>Suggested layout</h2>
          </div>

          {!result ? (
            <div className="result-placeholder">
              <FaCar />
              <p>Enter the plot's width and length and generate a suggestion to see the layout here.</p>
            </div>
          ) : (
            <>
              <div className="capacity-strip">
                {result.vehicleFocus !== 'bike_only' && (
                  <div className="capacity-chip">
                    <p className="lbl">Max capacity — cars only</p>
                    <p className="val" style={{ color: 'var(--sodium)' }}>{result.maxCarOnly} cars</p>
                  </div>
                )}
                {result.vehicleFocus !== 'car_only' && (
                  <div className="capacity-chip">
                    <p className="lbl">Max capacity — bikes only</p>
                    <p className="val" style={{ color: 'var(--go)' }}>{result.maxBikeOnly} bikes</p>
                  </div>
                )}
              </div>

              <div className="suggestion-stats" style={{ gridTemplateColumns: (result.vehicleFocus !== 'both') ? '1fr' : '1fr 1fr' }}>
                {result.vehicleFocus !== 'bike_only' && (
                  <div className="sugg-stat car">
                    <div className="num">{result.carSlots}</div>
                    <div className="lbl">Suggested cars</div>
                  </div>
                )}
                {result.vehicleFocus !== 'car_only' && (
                  <div className="sugg-stat bike">
                    <div className="num">{result.bikeSlots}</div>
                    <div className="lbl">Suggested bikes</div>
                  </div>
                )}
              </div>

              <p className="area-note">
                Total area = {result.width.toFixed(0)} ft × {result.length.toFixed(0)} ft ≈ {result.totalArea.toFixed(0)} sq ft · usable for slots ≈ {result.usableArea.toFixed(0)} sq ft (after aisles/circulation)
                {result.floors > 1 && <> · spread across <strong>{result.floors} floors</strong></>}
              </p>

              <div className="engine-comment">
                <FaExclamationTriangle style={{ flexShrink: 0, marginTop: 2 }} />
                {result.note}
              </div>

              {/* Shows the per-vehicle stall footprint whenever that vehicle
                  type is present — both together when the mix includes both. */}
              <StallSpecs result={result} />

              <LayoutDiagram result={result} />

              <FloorBreakdown floorBreakdown={result.floorBreakdown} vehicleFocus={result.vehicleFocus} />

              <div className="decision-row">
                <button className="btn-accept" onClick={() => saveSuggestion('accepted')}>
                  <FaCheckCircle /> Accept
                </button>
                <button className="btn-reject" onClick={() => saveSuggestion('rejected')}>
                  <FaTimesCircle /> Reject
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <h3 className="history-title">Suggestion history</h3>
      <div className="as-table-wrap">
        <table className="as-table">
          <thead>
            <tr>
              <th>Plot</th>
              <th>Requested</th>
              <th>Suggested</th>
              <th>Floors</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {history.map((rec) => {
              const meta = STATUS_META[rec.status];
              return (
                <tr key={rec.id}>
                  <td>{plots[rec.plot_id] || `Plot #${rec.plot_id}`}</td>
                  <td>
                    <span className="slot-mix">
                      <span className="car"><FaCar style={{ fontSize: 10 }} /> {rec.requested_car_slots}</span>
                      <span className="bike"><FaMotorcycle style={{ fontSize: 10 }} /> {rec.requested_bike_slots}</span>
                    </span>
                  </td>
                  <td>
                    <span className="slot-mix">
                      <span className="car"><FaCar style={{ fontSize: 10 }} /> {rec.suggested_car_slots}</span>
                      <span className="bike"><FaMotorcycle style={{ fontSize: 10 }} /> {rec.suggested_bike_slots}</span>
                    </span>
                  </td>
                  <td>
                    <span className="floors-badge"><FaBuilding style={{ fontSize: 10 }} /> {rec.floors || 1}</span>
                  </td>
                  <td>
                    <span className="status-pill" style={{ color: meta.color, background: `${meta.color}1f` }}>
                      {meta.label}
                    </span>
                  </td>
                  <td>
                    <button className="btn-view" onClick={() => setActiveRecord(rec)}>
                      <FaEye /> View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {activeRecord && (
        <div className="as-overlay" onClick={() => setActiveRecord(null)}>
          <div className="as-modal" onClick={(e) => e.stopPropagation()}>
            <div className="as-modal-header">
              <div>
                <h2>{plots[activeRecord.plot_id] || `Plot #${activeRecord.plot_id}`}</h2>
                <div className="sub">Suggestion #{activeRecord.id} · {activeRecord.created_at}</div>
              </div>
              <button className="btn-close" onClick={() => setActiveRecord(null)} aria-label="Close">
                <FaTimes />
              </button>
            </div>
            <div className="as-modal-body">
              <div className="suggestion-stats" style={{ gridTemplateColumns: (activeRecord.vehicle_focus !== 'both') ? '1fr' : '1fr 1fr' }}>
                {activeRecord.vehicle_focus !== 'bike_only' && (
                  <div className="sugg-stat car">
                    <div className="num">{activeRecord.suggested_car_slots}</div>
                    <div className="lbl">Suggested car</div>
                  </div>
                )}
                {activeRecord.vehicle_focus !== 'car_only' && (
                  <div className="sugg-stat bike">
                    <div className="num">{activeRecord.suggested_bike_slots}</div>
                    <div className="lbl">Suggested bike</div>
                  </div>
                )}
              </div>

              <StallSpecs result={{ carSlots: activeRecord.suggested_car_slots, bikeSlots: activeRecord.suggested_bike_slots }} />

              <LayoutDiagram
                result={{ carSlots: activeRecord.suggested_car_slots, bikeSlots: activeRecord.suggested_bike_slots }}
              />
              <FloorBreakdown
                floorBreakdown={
                  activeRecord.floors > 1
                    ? Array.from({ length: activeRecord.floors }, (_, i) => ({
                      floor: i + 1,
                      cars: splitAcrossFloors(activeRecord.suggested_car_slots, activeRecord.floors)[i],
                      bikes: splitAcrossFloors(activeRecord.suggested_bike_slots, activeRecord.floors)[i],
                    }))
                    : null
                }
                vehicleFocus={activeRecord.vehicle_focus || 'both'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlignmentSuggestion;