// City.js
import React, { useState, useRef, useEffect } from 'react';
import {
  FaCity, FaPlus, FaMapMarkerAlt, FaEye, FaTimes, FaSearch,
  FaCrosshairs, FaCheckCircle, FaLayerGroup,
} from 'react-icons/fa';
import MapPicker from '../Components/MapPicker';
import { apiRequest, asRows } from '../apiClient';

const BOUNDS = { latMin: 8.0, latMax: 35.5, lngMin: 68.0, lngMax: 97.5 };

const emptyCityForm = { name: '', state: '', country: 'India' };
const emptyAreaForm = { name: '', latitude: '', longitude: '' };

function City() {
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [citySearch, setCitySearch] = useState('');

  const [showAddCity, setShowAddCity] = useState(false);
  const [cityForm, setCityForm] = useState(emptyCityForm);

  const [showAddArea, setShowAddArea] = useState(false);
  const [areaForm, setAreaForm] = useState(emptyAreaForm);
  const [activeArea, setActiveArea] = useState(null);

  const mapRef = useRef(null);

  const loadData = async () => {
    const [cityPayload, areaPayload] = await Promise.all([apiRequest('/city'), apiRequest('/area')]);
    const nextCities = asRows(cityPayload).map((city) => ({ ...city, id: city.city_id, country: city.country || 'India' }));
    const nextAreas = asRows(areaPayload).map((area) => ({ ...area, id: area.area_id, name: area.area_name }));
    setCities(nextCities);
    setAreas(nextAreas);
    setSelectedCityId((current) => current || nextCities[0]?.id || null);
  };

  useEffect(() => { loadData().catch(console.error); }, []);

  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(citySearch.trim().toLowerCase())
  );

  const selectedCity = cities.find((c) => c.id === selectedCityId);
  const cityAreas = areas.filter((a) => a.city_id === selectedCityId);

  const handleAddCity = async (e) => {
    e.preventDefault();
    if (!cityForm.name.trim()) return;
    await apiRequest('/city', { method: 'POST', body: JSON.stringify({ name: cityForm.name, state: cityForm.state }) });
    await loadData();
    setCityForm(emptyCityForm); setShowAddCity(false);
  };

  const handleMapClick = (e) => {
    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pctX = Math.min(Math.max(x / rect.width, 0), 1);
    const pctY = Math.min(Math.max(y / rect.height, 0), 1);

    const lng = BOUNDS.lngMin + pctX * (BOUNDS.lngMax - BOUNDS.lngMin);
    const lat = BOUNDS.latMax - pctY * (BOUNDS.latMax - BOUNDS.latMin);

    setAreaForm({ ...areaForm, latitude: lat.toFixed(7), longitude: lng.toFixed(7) });
  };

  const pinPosition = () => {
    if (!areaForm.latitude || !areaForm.longitude) return null;
    const lat = parseFloat(areaForm.latitude);
    const lng = parseFloat(areaForm.longitude);
    const pctX = ((lng - BOUNDS.lngMin) / (BOUNDS.lngMax - BOUNDS.lngMin)) * 100;
    const pctY = ((BOUNDS.latMax - lat) / (BOUNDS.latMax - BOUNDS.latMin)) * 100;
    return { left: `${pctX}%`, top: `${pctY}%` };
  };

  const handleAddArea = async (e) => {
    e.preventDefault();
    if (!areaForm.name.trim() || !areaForm.latitude || !areaForm.longitude) return;
    await apiRequest('/area', { method: 'POST', body: JSON.stringify({ area_name: areaForm.name, city_id: selectedCityId, latitude: parseFloat(areaForm.latitude), longitude: parseFloat(areaForm.longitude) }) });
    await loadData();
    setAreaForm(emptyAreaForm); setShowAddArea(false);
  };

  const pin = pinPosition();

  return (
    <div className="city-page">
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

        .city-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: var(--deck);
          color: var(--ink);
          min-height: 100vh;
          padding: 40px;
        }

        .city-header {
          margin-bottom: 26px;
        }

        .city-header h1 {
          font-size: 26px;
          font-weight: 800;
          margin: 0 0 4px;
        }

        .city-header p {
          color: var(--muted);
          font-size: 14px;
          margin: 0;
        }

        .city-layout {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 20px;
          align-items: start;
        }

        /* ---------- Left: city list ---------- */
        .city-panel {
          background: var(--deck-panel);
          border: 1px solid var(--deck-line);
          border-radius: 16px;
          padding: 18px;
        }

        .panel-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .panel-top h2 {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          margin: 0;
        }

        .btn-icon-add {
          background: rgba(255,176,32,0.14);
          border: 1px solid rgba(255,176,32,0.35);
          color: var(--sodium);
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .btn-icon-add:hover {
          background: rgba(255,176,32,0.24);
          transform: rotate(90deg);
        }

        .city-search {
          position: relative;
          margin-bottom: 14px;
        }

        .city-search svg {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
          font-size: 12px;
        }

        .city-search input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--deck-line);
          color: var(--ink);
          padding: 9px 10px 9px 30px;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          font-family: inherit;
        }

        .city-search input:focus {
          border-color: var(--sodium);
        }

        .city-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 460px;
          overflow-y: auto;
        }

        .city-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .city-item:hover {
          background: rgba(255,255,255,0.03);
        }

        .city-item.active {
          background: rgba(255,176,32,0.1);
          border-color: rgba(255,176,32,0.35);
        }

        .city-item-icon {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--muted);
          font-size: 14px;
          flex-shrink: 0;
        }

        .city-item.active .city-item-icon {
          background: rgba(255,176,32,0.18);
          color: var(--sodium);
        }

        .city-item-name {
          font-size: 14px;
          font-weight: 600;
          margin: 0;
        }

        .city-item-state {
          font-size: 12px;
          color: var(--muted);
          margin: 1px 0 0;
        }

        .city-item-count {
          margin-left: auto;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--muted);
          background: rgba(255,255,255,0.05);
          padding: 2px 7px;
          border-radius: 20px;
        }

        /* ---------- Right: areas panel ---------- */
        .areas-panel {
          background: var(--deck-panel);
          border: 1px solid var(--deck-line);
          border-radius: 16px;
          padding: 24px;
          min-height: 300px;
          overflow-x: auto;
        }

        .areas-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 22px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .areas-top h2 {
          font-size: 20px;
          font-weight: 800;
          margin: 0 0 4px;
        }

        .areas-top .sub {
          font-size: 13px;
          color: var(--muted);
        }

        .btn-add {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--sodium);
          color: var(--deck);
          border: none;
          font-size: 14px;
          font-weight: 700;
          padding: 10px 18px;
          border-radius: 10px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .btn-add:hover {
          background: #ffc250;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(255,176,32,0.3);
        }

        table.area-table {
          width: 100%;
          border-collapse: collapse;
        }

        .area-table th {
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          padding: 12px 14px;
          border-bottom: 1px solid var(--deck-line);
        }

        .area-table td {
          padding: 14px;
          font-size: 14px;
          border-bottom: 1px solid var(--deck-line);
        }

        .area-table tr:last-child td { border-bottom: none; }

        .area-table tr {
          animation: rowIn 0.25s ease;
        }

        @keyframes rowIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .area-name {
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .area-name svg { color: var(--sodium); font-size: 12px; }

        .coord {
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          color: var(--muted);
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

        .empty-note {
          padding: 40px 10px;
          text-align: center;
          color: var(--muted);
          font-size: 14px;
        }

        /* ---------- Modal shell ---------- */
        .city-overlay {
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

        .city-modal {
          background: rgba(28,32,41,0.94);
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          border: 1px solid var(--deck-line);
          border-radius: 18px;
          width: 100%;
          max-width: 560px;
          max-height: 88vh;
          overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0,0,0,0.45);

          opacity: 0;
          transform: translateY(20px) scale(0.98);
          animation: modalIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards;
        }

        @keyframes modalIn {
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .city-modal-header {
          position: sticky;
          top: 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 22px 26px 14px;
          background: rgba(28,32,41,0.96);
          border-bottom: 1px solid var(--deck-line);
          z-index: 1;
        }

        .city-modal-header h2 {
          font-size: 18px;
          font-weight: 800;
          margin: 0 0 4px;
        }

        .city-modal-header .sub {
          font-size: 12px;
          color: var(--muted);
        }

        .btn-close {
          background: rgba(255,255,255,0.06);
          border: none;
          color: var(--ink);
          width: 30px;
          height: 30px;
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

        .city-modal-body {
          padding: 20px 26px 26px;
        }

        .field { margin-bottom: 16px; }

        .field label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 6px;
        }

        .field input, .field select {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--deck-line);
          color: var(--ink);
          padding: 11px 13px;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          color-scheme: dark;
        }

        .field input:focus, .field select:focus {
          border-color: transparent;
          box-shadow: 0 0 0 3px rgba(255,176,32,0.18);
        }

        .field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .btn-submit {
          width: 100%;
          background: var(--sodium);
          color: var(--deck);
          border: none;
          padding: 13px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .btn-submit:hover {
          background: #ffc250;
          transform: translateY(-2px);
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* ---------- Mock map picker ---------- */
        .map-picker {
          position: relative;
          width: 100%;
          height: 260px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--deck-line);
          cursor: crosshair;
          background:
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px) 0 0 / 40px 40px,
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px) 0 0 / 40px 40px,
            radial-gradient(ellipse at 40% 35%, rgba(255,176,32,0.08), transparent 55%),
            radial-gradient(ellipse at 70% 70%, rgba(43,181,131,0.06), transparent 50%),
            #171a20;
        }

        .map-picker .axis-label {
          position: absolute;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: var(--muted);
          pointer-events: none;
        }

        .map-pin {
          position: absolute;
          width: 22px;
          height: 22px;
          transform: translate(-50%, -100%);
          pointer-events: none;
          animation: pinDrop 0.35s cubic-bezier(0.34,1.56,0.64,1);
        }

        @keyframes pinDrop {
          from { transform: translate(-50%, -160%); opacity: 0; }
          to { transform: translate(-50%, -100%); opacity: 1; }
        }

        .map-pin svg {
          font-size: 22px;
          color: var(--stop);
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
        }

        .map-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--muted);
          margin: 8px 0 16px;
        }

        .map-hint svg { color: var(--sodium); }

        @media (prefers-reduced-motion: reduce) {
          .city-overlay, .city-modal, .btn-close, .area-table tr, .map-pin {
            animation: none !important; transition: none !important;
          }
        }

        @media (max-width: 1024px) {
          .city-page { padding: 24px; }
          .city-layout { gap: 16px; }
        }

        @media (max-width: 860px) {
          .city-layout { grid-template-columns: 1fr; }
        }

        @media (max-width: 640px) {
          .city-page { padding: 20px; }
          .field-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="city-header">
        <h1>Cities and areas</h1>
        <p>Manage service cities and pinpoint each area's exact location.</p>
      </div>

      <div className="city-layout">
        <div className="city-panel">
          <div className="panel-top">
            <h2>Cities</h2>
            <button className="btn-icon-add" onClick={() => setShowAddCity(true)} aria-label="Add city">
              <FaPlus size={12} />
            </button>
          </div>

          <div className="city-search">
            <FaSearch />
            <input
              placeholder="Search cities"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
            />
          </div>

          <div className="city-list">
            {filteredCities.map((city) => {
              const count = areas.filter((a) => a.city_id === city.id).length;
              return (
                <div
                  key={city.id}
                  className={`city-item ${city.id === selectedCityId ? 'active' : ''}`}
                  onClick={() => setSelectedCityId(city.id)}
                >
                  <div className="city-item-icon"><FaCity /></div>
                  <div>
                    <p className="city-item-name">{city.name}</p>
                    <p className="city-item-state">{city.state}, {city.country}</p>
                  </div>
                  <span className="city-item-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="areas-panel">
          {selectedCity ? (
            <>
              <div className="areas-top">
                <div>
                  <h2>{selectedCity.name}</h2>
                  <p className="sub">{selectedCity.state}, {selectedCity.country} · {cityAreas.length} areas</p>
                </div>
                <button className="btn-add" onClick={() => setShowAddArea(true)}>
                  <FaPlus /> Add area
                </button>
              </div>

              {cityAreas.length ? (
                <table className="area-table">
                  <thead>
                    <tr>
                      <th>Area name</th>
                      <th>Latitude</th>
                      <th>Longitude</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cityAreas.map((area) => (
                      <tr key={area.id}>
                        <td className="area-name"><FaMapMarkerAlt />{area.name}</td>
                        <td className="coord">{area.latitude ? Number(area.latitude).toFixed(4) : '—'}</td>
                        <td className="coord">{area.longitude ? Number(area.longitude).toFixed(4) : '—'}</td>
                        <td>
                          <button className="btn-view" onClick={() => setActiveArea(area)}>
                            <FaEye /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-note">No areas added for this city yet.</div>
              )}
            </>
          ) : (
            <div className="empty-note">Select a city to view its areas.</div>
          )}
        </div>
      </div>

      {showAddCity && (
        <div className="city-overlay" onClick={() => setShowAddCity(false)}>
          <div className="city-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="city-modal-header">
              <div>
                <h2>Add city</h2>
                <div className="sub">Demo form — saves locally only</div>
              </div>
              <button className="btn-close" onClick={() => setShowAddCity(false)} aria-label="Close">
                <FaTimes />
              </button>
            </div>
            <form className="city-modal-body" onSubmit={handleAddCity}>
              <div className="field">
                <label>City name</label>
                <input
                  value={cityForm.name}
                  onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                  placeholder="e.g. Pune"
                  required
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>State</label>
                  <input
                    value={cityForm.state}
                    onChange={(e) => setCityForm({ ...cityForm, state: e.target.value })}
                    placeholder="e.g. Maharashtra"
                  />
                </div>
                <div className="field">
                  <label>Country</label>
                  <input
                    value={cityForm.country}
                    onChange={(e) => setCityForm({ ...cityForm, country: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" className="btn-submit">Save city</button>
            </form>
          </div>
        </div>
      )}

      {showAddArea && (
        <div className="city-overlay" onClick={() => setShowAddArea(false)}>
          <div className="city-modal" onClick={(e) => e.stopPropagation()}>
            <div className="city-modal-header">
              <div>
                <h2>Add area to {selectedCity?.name}</h2>
                <div className="sub">Click the map to set an exact location</div>
              </div>
              <button className="btn-close" onClick={() => setShowAddArea(false)} aria-label="Close">
                <FaTimes />
              </button>
            </div>
            <form className="city-modal-body" onSubmit={handleAddArea}>
              <div className="field">
                <label>Area name</label>
                <input
                  value={areaForm.name}
                  onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                  placeholder="e.g. Hitech City"
                  required
                />
              </div>

              <div className="map-hint">
                <FaLayerGroup /> Click anywhere on the map to drop a pin and capture coordinates
              </div>

              <MapPicker
                latitude={areaForm.latitude}
                longitude={areaForm.longitude}
                onChange={(lat, lng) =>
                  setAreaForm({ ...areaForm, latitude: lat.toString(), longitude: lng.toString() })
                }
                height={280}
              />

              <div className="field-row">
                <div className="field">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="0.0000001"
                    value={areaForm.latitude}
                    onChange={(e) => setAreaForm({ ...areaForm, latitude: e.target.value })}
                    placeholder="17.4435"
                    required
                  />
                </div>
                <div className="field">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="0.0000001"
                    value={areaForm.longitude}
                    onChange={(e) => setAreaForm({ ...areaForm, longitude: e.target.value })}
                    placeholder="78.3772"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={!areaForm.latitude || !areaForm.longitude}>
                Save area
              </button>
            </form>
          </div>
        </div>
      )}

      {activeArea && (
        <div className="city-overlay" onClick={() => setActiveArea(null)}>
          <div className="city-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="city-modal-header">
              <div>
                <h2>{activeArea.name}</h2>
                <div className="sub">{CITIESLookup(cities, activeArea.city_id)}</div>
              </div>
              <button className="btn-close" onClick={() => setActiveArea(null)} aria-label="Close">
                <FaTimes />
              </button>
            </div>
            <div className="city-modal-body">
              <div className="field-row">
                <div className="field">
                  <label>Latitude</label>
                  <input value={activeArea.latitude} readOnly />
                </div>
                <div className="field">
                  <label>Longitude</label>
                  <input value={activeArea.longitude} readOnly />
                </div>
              </div>
              <div className="map-hint">
                <FaCrosshairs /> <FaCheckCircle /> Location confirmed for this area
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CITIESLookup(cities, cityId) {
  const city = cities.find((c) => c.id === cityId);
  return city ? `${city.name}, ${city.state}` : '';
}

export default City;
