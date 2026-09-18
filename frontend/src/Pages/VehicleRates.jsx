import React, { useEffect, useState } from 'react';
import { FaCar, FaMotorcycle, FaRupeeSign, FaSave } from 'react-icons/fa';
import { apiRequest, asRows } from '../apiClient';

const vehicleTypes = { 1: 'Car', 2: 'Bike' };
const emptyForm = { plot_id: '', vehicle_type_id: '1', rate_per_hour: '', minimum_hours: '1', extend_rate_per_hour: '' };

function VehicleRates() {
  const role = String(localStorage.getItem('role') || '').toLowerCase();
  const superAdmin = ['super_admin', 'superadmin'].includes(role);
  const [plots, setPlots] = useState([]);
  const [rates, setRates] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [plotPayload, ratePayload] = await Promise.all([apiRequest('/parkingplot'), apiRequest('/vehicle-rate')]);
      const plotRows = asRows(plotPayload);
      setPlots(plotRows);
      setRates(asRows(ratePayload));
      setForm((current) => ({ ...current, plot_id: current.plot_id || String(plotRows[0]?.plot_id || '') }));
    } catch (requestError) { setError(requestError.message || 'Vehicle rates could not be loaded.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true); setMessage(''); setError('');
    try {
      await apiRequest('/vehicle-rate', { method: 'POST', body: JSON.stringify({
        plot_id: Number(form.plot_id),
        vehicle_type_id: Number(form.vehicle_type_id),
        rate_per_hour: Number(form.rate_per_hour),
        minimum_hours: Number(form.minimum_hours),
        extend_rate_per_hour: form.extend_rate_per_hour === '' ? null : Number(form.extend_rate_per_hour),
      }) });
      setMessage('Vehicle rate saved successfully.');
      await load();
    } catch (requestError) { setError(requestError.message || 'Vehicle rate could not be saved.'); }
    finally { setSaving(false); }
  };

  return <main className="vehicle-rate-page">
    <style>{`
      .vehicle-rate-page { min-height:100vh; padding:40px; color:#f2f3f5; font-family:Inter,sans-serif; }
      .vr-head { margin-bottom:24px; } .vr-head h1 { margin:0 0 6px; font-size:30px; } .vr-head p { margin:0; color:#9195a0; }
      .vr-layout { display:grid; grid-template-columns:minmax(300px,380px) 1fr; gap:22px; align-items:start; }
      .vr-card { background:#1c2029; border:1px solid rgba(255,255,255,.08); border-radius:16px; padding:22px; }
      .vr-card h2 { margin:0 0 18px; font-size:17px; } .vr-field { margin-bottom:15px; } .vr-field label { display:block; margin-bottom:6px; color:#9195a0; font-size:12px; text-transform:uppercase; font-weight:700; }
      .vr-field input,.vr-field select { width:100%; height:42px; padding:0 12px; border-radius:8px; border:1px solid rgba(255,255,255,.12); background:#14171c; color:#f2f3f5; color-scheme:dark; }
      .vr-field option { background:#1c2029; color:#f2f3f5; } .vr-submit { width:100%; border:0; border-radius:9px; padding:12px; background:#ffb020; color:#14171c; font-weight:800; cursor:pointer; } .vr-submit:disabled { opacity:.6; }
      .vr-message { margin-bottom:16px; padding:11px 14px; border-radius:9px; background:rgba(43,181,131,.12); color:#6de0b4; } .vr-error { margin-bottom:16px; color:#e2534a; }
      .vr-table { width:100%; border-collapse:collapse; } .vr-table th,.vr-table td { padding:14px 12px; text-align:left; border-bottom:1px solid rgba(255,255,255,.07); } .vr-table th { color:#9195a0; font-size:11px; text-transform:uppercase; } .vr-table td { font-size:14px; } .vr-type { display:inline-flex; align-items:center; gap:7px; color:#ffb020; font-weight:700; } .vr-rate { color:#6de0b4; font-size:18px; font-weight:900; }
      @media(max-width:800px) { .vehicle-rate-page { padding:24px 16px; } .vr-layout { grid-template-columns:1fr; } .vr-table-wrap { overflow:auto; } .vr-table { min-width:650px; } }
    `}</style>
    <div className="vr-head"><h1>Vehicle rates</h1><p>Configure hourly parking charges for each vehicle type.</p></div>
    {message && <div className="vr-message">{message}</div>}{error && <div className="vr-error">{error}</div>}
    <div className="vr-layout">
      <form className="vr-card" onSubmit={save}><h2><FaRupeeSign /> Add or update rate</h2>
        <div className="vr-field"><label>Parking plot</label><select value={form.plot_id} onChange={(e) => setForm({ ...form, plot_id: e.target.value })} disabled={!superAdmin} required><option value="">Select plot</option>{plots.map((plot) => <option key={plot.plot_id} value={plot.plot_id}>{plot.plot_name} (#{plot.plot_id})</option>)}</select></div>
        <div className="vr-field"><label>Vehicle type</label><select value={form.vehicle_type_id} onChange={(e) => setForm({ ...form, vehicle_type_id: e.target.value })}><option value="1">Car</option><option value="2">Bike</option></select></div>
        <div className="vr-field"><label>Rate per hour (₹)</label><input type="number" min="0" step="0.01" value={form.rate_per_hour} onChange={(e) => setForm({ ...form, rate_per_hour: e.target.value })} required /></div>
        <div className="vr-field"><label>Minimum hours</label><input type="number" min="1" step="0.5" value={form.minimum_hours} onChange={(e) => setForm({ ...form, minimum_hours: e.target.value })} required /></div>
        <div className="vr-field"><label>Extended rate per hour (optional)</label><input type="number" min="0" step="0.01" value={form.extend_rate_per_hour} onChange={(e) => setForm({ ...form, extend_rate_per_hour: e.target.value })} /></div>
        <button className="vr-submit" disabled={saving}><FaSave /> {saving ? 'Saving…' : 'Save vehicle rate'}</button>
      </form>
      <section className="vr-card"><h2>Configured rates</h2><div className="vr-table-wrap">{loading ? <p>Loading rates…</p> : <table className="vr-table"><thead><tr><th>Plot</th><th>Vehicle</th><th>Rate / hour</th><th>Minimum</th><th>Extended</th></tr></thead><tbody>{rates.map((rate) => <tr key={rate.id}><td>{rate.plot_name} <span style={{ color:'#9195a0' }}>#{rate.plot_id}</span></td><td><span className="vr-type">{Number(rate.vehicle_type_id) === 1 ? <FaCar /> : <FaMotorcycle />}{vehicleTypes[rate.vehicle_type_id]}</span></td><td className="vr-rate">₹{Number(rate.rate_per_hour).toFixed(2)}</td><td>{rate.minimum_hours} hr</td><td>{rate.extend_rate_per_hour == null ? '—' : `₹${Number(rate.extend_rate_per_hour).toFixed(2)}`}</td></tr>)}</tbody></table>}{!loading && !rates.length && <p>No vehicle rates configured.</p>}</div></section>
    </div>
  </main>;
}

export default VehicleRates;
