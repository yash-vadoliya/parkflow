// // ParkingPlot.js
// import React, { useState, useMemo } from 'react';
// import {
//   FaMapMarkerAlt, FaPlus, FaEye, FaTimes, FaCar, FaMotorcycle,
//   FaCheckCircle, FaQrcode, FaRupeeSign, FaImage, FaSearch,
//   FaSortAmountDown, FaSortAmountUp, FaFilter, FaUndo,
// } from 'react-icons/fa';

// // ---------- Dummy data (mirrors the SQL schema) ----------

// const CITIES = { 1: 'Hyderabad', 2: 'Mumbai', 3: 'Bengaluru' };
// const AREAS = { 1: 'Gachibowli', 2: 'Andheri East', 3: 'Whitefield' };
// const VEHICLE_TYPES = { 1: 'Car', 2: 'Bike' };

// const STATUS_META = {
//   pending_profile: { label: 'Pending profile', color: 'var(--sodium)' },
//   active: { label: 'Active', color: 'var(--go)' },
//   inactive: { label: 'Inactive', color: 'var(--muted)' },
//   suspended: { label: 'Suspended', color: 'var(--stop)' },
// };

// const initialPlots = [
//   {
//     id: 101, request_id: 5001, owner_id: 21, admin_id: 1, city_id: 1, area_id: 1,
//     name: 'Cyber Towers Basement Parking', address: '4th Floor Access, Cyber Towers, Gachibowli, Hyderabad',
//     latitude: 17.4435, longitude: 78.3772,
//     description: 'Covered basement facility with 24x7 security and CCTV coverage across two levels.',
//     total_car_slots: 80, total_bike_slots: 120,
//     online_percentage: 65.0, offline_percentage: 35.0,
//     accept_online_payment: 1, accept_offline_payment: 1,
//     upi_id: 'cybertowers@parkflow', qr_code_image_url: 'qr_101.png',
//     advance_booking_enabled: 1, advance_booking_amount: 50.0, minimum_booking_minutes: 60,
//     status: 'active', created_at: '2026-02-11 09:20:00',
//     images: [
//       { id: 1, image_url: 'plot_101_entrance.jpg', is_cover: 1 },
//       { id: 2, image_url: 'plot_101_level1.jpg', is_cover: 0 },
//       { id: 3, image_url: 'plot_101_level2.jpg', is_cover: 0 },
//     ],
//     rates: [
//       { id: 1, vehicle_type_id: 1, rate_per_hour: 40.0, minimum_hours: 1.0, extend_rate_per_hour: 35.0 },
//       { id: 2, vehicle_type_id: 2, rate_per_hour: 15.0, minimum_hours: 1.0, extend_rate_per_hour: 12.0 },
//     ],
//   },
//   {
//     id: 102, request_id: 5008, owner_id: 34, admin_id: 1, city_id: 2, area_id: 2,
//     name: 'Andheri East Open Yard', address: 'Plot 12, Marol Industrial Estate, Andheri East, Mumbai',
//     latitude: 19.1197, longitude: 72.8697,
//     description: 'Open-air yard suited for long-duration bookings, near the metro station.',
//     total_car_slots: 45, total_bike_slots: 60,
//     online_percentage: 50.0, offline_percentage: 50.0,
//     accept_online_payment: 1, accept_offline_payment: 1,
//     upi_id: 'andheriyard@parkflow', qr_code_image_url: 'qr_102.png',
//     advance_booking_enabled: 0, advance_booking_amount: 0.0, minimum_booking_minutes: 30,
//     status: 'pending_profile', created_at: '2026-05-02 14:05:00',
//     images: [
//       { id: 4, image_url: 'plot_102_yard.jpg', is_cover: 1 },
//     ],
//     rates: [
//       { id: 3, vehicle_type_id: 1, rate_per_hour: 30.0, minimum_hours: 2.0, extend_rate_per_hour: 25.0 },
//     ],
//   },
//   {
//     id: 103, request_id: 5012, owner_id: 40, admin_id: 2, city_id: 3, area_id: 3,
//     name: 'Whitefield Tech Park Deck', address: 'Block C Basement, ITPL Main Road, Whitefield, Bengaluru',
//     latitude: 12.9698, longitude: 77.7500,
//     description: 'Multi-level deck attached to a tech park, high daytime turnover.',
//     total_car_slots: 150, total_bike_slots: 200,
//     online_percentage: 80.0, offline_percentage: 20.0,
//     accept_online_payment: 1, accept_offline_payment: 0,
//     upi_id: 'whitefielddeck@parkflow', qr_code_image_url: 'qr_103.png',
//     advance_booking_enabled: 1, advance_booking_amount: 100.0, minimum_booking_minutes: 60,
//     status: 'active', created_at: '2026-01-28 11:40:00',
//     images: [
//       { id: 5, image_url: 'plot_103_deck_a.jpg', is_cover: 1 },
//       { id: 6, image_url: 'plot_103_deck_b.jpg', is_cover: 0 },
//     ],
//     rates: [
//       { id: 4, vehicle_type_id: 1, rate_per_hour: 50.0, minimum_hours: 1.0, extend_rate_per_hour: 45.0 },
//       { id: 5, vehicle_type_id: 2, rate_per_hour: 20.0, minimum_hours: 1.0, extend_rate_per_hour: 18.0 },
//     ],
//   },
//   {
//     id: 104, request_id: 5019, owner_id: 52, admin_id: null, city_id: 1, area_id: 1,
//     name: 'Gachibowli Residency Slots', address: 'Near DLF Cyber City Gate 2, Gachibowli, Hyderabad',
//     latitude: 17.4400, longitude: 78.3489,
//     description: 'Residential complex overflow parking, suspended pending compliance review.',
//     total_car_slots: 20, total_bike_slots: 30,
//     online_percentage: 60.0, offline_percentage: 40.0,
//     accept_online_payment: 0, accept_offline_payment: 1,
//     upi_id: null, qr_code_image_url: null,
//     advance_booking_enabled: 0, advance_booking_amount: 0.0, minimum_booking_minutes: 60,
//     status: 'suspended', created_at: '2025-11-30 08:15:00',
//     images: [],
//     rates: [
//       { id: 6, vehicle_type_id: 1, rate_per_hour: 25.0, minimum_hours: 1.0, extend_rate_per_hour: null },
//     ],
//   },
//   {
//     id: 105, request_id: 5022, owner_id: 61, admin_id: 2, city_id: 3, area_id: 3,
//     name: 'ITPL Visitor Parking', address: 'Gate 3, ITPL Main Road, Whitefield, Bengaluru',
//     latitude: 12.9855, longitude: 77.7370,
//     description: 'Currently offline for resurfacing work, expected back online next month.',
//     total_car_slots: 35, total_bike_slots: 40,
//     online_percentage: 55.0, offline_percentage: 45.0,
//     accept_online_payment: 1, accept_offline_payment: 1,
//     upi_id: 'itplvisitor@parkflow', qr_code_image_url: null,
//     advance_booking_enabled: 0, advance_booking_amount: 0.0, minimum_booking_minutes: 60,
//     status: 'inactive', created_at: '2025-09-14 10:00:00',
//     images: [
//       { id: 7, image_url: 'plot_105_front.jpg', is_cover: 1 },
//     ],
//     rates: [],
//   },
// ];

// const emptyForm = {
//   name: '', address: '', city_id: '1', area_id: '1',
//   total_car_slots: '', total_bike_slots: '', description: '',
// };

// const emptyFilters = { search: '', city_id: 'all', status: 'all' };

// function ParkingPlot() {
//   const [plots, setPlots] = useState(initialPlots);
//   const [activePlot, setActivePlot] = useState(null);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [form, setForm] = useState(emptyForm);

//   const [filters, setFilters] = useState(emptyFilters);
//   const [sortDir, setSortDir] = useState(null); // null | 'asc' | 'desc'

//   const filteredPlots = useMemo(() => {
//     let list = plots.filter((p) => {
//       const matchesSearch = p.name.toLowerCase().includes(filters.search.trim().toLowerCase());
//       const matchesCity = filters.city_id === 'all' || String(p.city_id) === filters.city_id;
//       const matchesStatus = filters.status === 'all' || p.status === filters.status;
//       return matchesSearch && matchesCity && matchesStatus;
//     });

//     if (sortDir) {
//       list = [...list].sort((a, b) => {
//         const totalA = a.total_car_slots + a.total_bike_slots;
//         const totalB = b.total_car_slots + b.total_bike_slots;
//         return sortDir === 'asc' ? totalA - totalB : totalB - totalA;
//       });
//     }

//     return list;
//   }, [plots, filters, sortDir]);

//   const hasActiveFilters = filters.search || filters.city_id !== 'all' || filters.status !== 'all' || sortDir;

//   const clearFilters = () => {
//     setFilters(emptyFilters);
//     setSortDir(null);
//   };

//   const toggleSort = () => {
//     setSortDir((prev) => (prev === null ? 'desc' : prev === 'desc' ? 'asc' : null));
//   };

//   const handleAddPlot = (e) => {
//     e.preventDefault();
//     if (!form.name.trim()) return;
//     const newPlot = {
//       ...form,
//       id: Math.max(...plots.map((p) => p.id)) + 1,
//       request_id: null, owner_id: 0, admin_id: null,
//       city_id: Number(form.city_id), area_id: Number(form.area_id),
//       latitude: 0, longitude: 0,
//       total_car_slots: Number(form.total_car_slots) || 0,
//       total_bike_slots: Number(form.total_bike_slots) || 0,
//       online_percentage: 60.0, offline_percentage: 40.0,
//       accept_online_payment: 1, accept_offline_payment: 1,
//       upi_id: null, qr_code_image_url: null,
//       advance_booking_enabled: 0, advance_booking_amount: 0.0,
//       minimum_booking_minutes: 60,
//       status: 'pending_profile',
//       created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
//       images: [],
//       rates: [],
//     };
//     setPlots([newPlot, ...plots]);
//     setForm(emptyForm);
//     setShowAddModal(false);
//   };

//   return (
//     <div className="pp-page">
//       <style>{`
//         :root {
//           --deck:       #14171c;
//           --deck-panel: #1c2029;
//           --deck-line:  rgba(255,255,255,0.08);
//           --sodium:     #ffb020;
//           --go:         #2bb583;
//           --stop:       #e2534a;
//           --ink:        #f2f3f5;
//           --muted:      #9195a0;
//         }

//         * { box-sizing: border-box; }

//         .pp-page {
//           font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
//           background: var(--deck);
//           color: var(--ink);
//           min-height: 100vh;
//           padding: 40px;
//         }

//         .pp-header {
//           display: flex;
//           justify-content: space-between;
//           align-items: flex-end;
//           margin-bottom: 26px;
//           flex-wrap: wrap;
//           gap: 14px;
//         }

//         .pp-header h1 {
//           font-size: 26px;
//           font-weight: 800;
//           margin: 0 0 4px;
//         }

//         .pp-header p {
//           color: var(--muted);
//           font-size: 14px;
//           margin: 0;
//         }

//         .btn-add {
//           display: inline-flex;
//           align-items: center;
//           gap: 8px;
//           background: var(--sodium);
//           color: var(--deck);
//           border: none;
//           font-size: 14px;
//           font-weight: 700;
//           padding: 11px 20px;
//           border-radius: 10px;
//           cursor: pointer;
//           transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
//         }

//         .btn-add:hover {
//           background: #ffc250;
//           transform: translateY(-2px);
//           box-shadow: 0 6px 15px rgba(255,176,32,0.3);
//         }

//         /* ---------- Filter bar ---------- */
//         .filter-bar {
//           background: var(--deck-panel);
//           border: 1px solid var(--deck-line);
//           border-radius: 14px;
//           padding: 16px 18px;
//           margin-bottom: 18px;
//           display: flex;
//           align-items: center;
//           gap: 12px;
//           flex-wrap: wrap;
//         }

//         .filter-search {
//           position: relative;
//           flex: 1;
//           min-width: 200px;
//         }

//         .filter-search svg {
//           position: absolute;
//           left: 13px;
//           top: 50%;
//           transform: translateY(-50%);
//           color: var(--muted);
//           font-size: 13px;
//         }

//         .filter-search input {
//           width: 100%;
//           background: rgba(255,255,255,0.04);
//           border: 1px solid var(--deck-line);
//           color: var(--ink);
//           padding: 10px 12px 10px 34px;
//           border-radius: 9px;
//           font-size: 14px;
//           outline: none;
//           font-family: inherit;
//           transition: border-color 0.2s ease, box-shadow 0.2s ease;
//         }

//         .filter-search input:focus {
//           border-color: transparent;
//           box-shadow: 0 0 0 3px rgba(255,176,32,0.18);
//         }

//     .filter-select {
//   background: rgba(255,255,255,0.04);
//   border: 1px solid var(--deck-line);
//   color: var(--ink);
//   padding: 10px 12px;
//   border-radius: 9px;
//   font-size: 13px;
//   font-family: inherit;
//   outline: none;
//   cursor: pointer;
//   transition: border-color 0.2s ease;
//   color-scheme: dark;
// }

//         .filter-select option {
//   background: var(--deck-panel);
//   color: var(--ink);
// }

//         .filter-select:focus {
//           border-color: var(--sodium);
//         }

//         .btn-sort {
//           display: inline-flex;
//           align-items: center;
//           gap: 7px;
//           background: rgba(255,255,255,0.04);
//           border: 1px solid var(--deck-line);
//           color: var(--ink);
//           padding: 10px 14px;
//           border-radius: 9px;
//           font-size: 13px;
//           font-weight: 600;
//           cursor: pointer;
//           transition: border-color 0.2s ease, color 0.2s ease;
//         }

//         .btn-sort:hover, .btn-sort.on {
//           border-color: var(--sodium);
//           color: var(--sodium);
//         }

//         .btn-clear {
//           display: inline-flex;
//           align-items: center;
//           gap: 6px;
//           background: none;
//           border: none;
//           color: var(--muted);
//           font-size: 13px;
//           font-weight: 600;
//           cursor: pointer;
//           padding: 8px 10px;
//           border-radius: 8px;
//           transition: color 0.2s ease, background 0.2s ease;
//         }

//         .btn-clear:hover {
//           color: var(--stop);
//           background: rgba(226,83,74,0.08);
//         }

//         .results-line {
//           font-size: 13px;
//           color: var(--muted);
//           margin-bottom: 14px;
//           display: flex;
//           align-items: center;
//           gap: 6px;
//         }

//         /* ---------- Table ---------- */
//         .pp-table-wrap {
//           background: var(--deck-panel);
//           border: 1px solid var(--deck-line);
//           border-radius: 16px;
//           overflow-x: auto;
//           box-shadow: 0 4px 12px rgba(0,0,0,0.15);
//         }

//         table.pp-table { min-width: 560px; }

//         table.pp-table {
//           width: 100%;
//           border-collapse: collapse;
//         }

//         .pp-table th {
//           text-align: left;
//           font-size: 12px;
//           font-weight: 700;
//           text-transform: uppercase;
//           letter-spacing: 0.05em;
//           color: var(--muted);
//           padding: 16px 20px;
//           border-bottom: 1px solid var(--deck-line);
//         }

//         .pp-table td {
//           padding: 16px 20px;
//           font-size: 14px;
//           border-bottom: 1px solid var(--deck-line);
//           vertical-align: middle;
//         }

//         .pp-table tbody tr {
//           transition: background 0.2s ease;
//           animation: rowIn 0.25s ease;
//         }

//         @keyframes rowIn {
//           from { opacity: 0; transform: translateY(4px); }
//           to { opacity: 1; transform: translateY(0); }
//         }

//         .pp-table tbody tr:hover {
//           background: rgba(255,255,255,0.03);
//         }

//         .pp-table tbody tr:last-child td {
//           border-bottom: none;
//         }

//         .plot-name {
//           font-weight: 600;
//         }

//         .plot-address {
//           color: var(--muted);
//         }

//         .status-pill {
//           display: inline-flex;
//           align-items: center;
//           gap: 6px;
//           font-size: 12px;
//           font-weight: 600;
//           padding: 4px 10px;
//           border-radius: 20px;
//         }

//         .status-pill::before {
//           content: '';
//           width: 6px;
//           height: 6px;
//           border-radius: 50%;
//           background: currentColor;
//         }

//         .btn-view {
//           display: inline-flex;
//           align-items: center;
//           gap: 6px;
//           background: transparent;
//           border: 1px solid var(--deck-line);
//           color: var(--ink);
//           font-size: 13px;
//           font-weight: 600;
//           padding: 7px 14px;
//           border-radius: 8px;
//           cursor: pointer;
//           transition: border-color 0.2s ease, transform 0.2s ease;
//         }

//         .btn-view:hover {
//           border-color: var(--sodium);
//           color: var(--sodium);
//           transform: translateY(-1px);
//         }

//         .empty-state {
//           padding: 60px 20px;
//           text-align: center;
//           color: var(--muted);
//         }

//         .empty-state svg {
//           font-size: 26px;
//           margin-bottom: 10px;
//           color: var(--muted);
//         }

//         .empty-state p {
//           margin: 0 0 14px;
//           font-size: 14px;
//         }

//         /* ---------- Modal shell ---------- */
//         .pp-overlay {
//           position: fixed;
//           inset: 0;
//           background: rgba(10,11,13,0.6);
//           backdrop-filter: blur(6px);
//           -webkit-backdrop-filter: blur(6px);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           z-index: 200;
//           padding: 20px;
//           opacity: 0;
//           animation: overlayIn 0.25s ease forwards;
//         }

//         @keyframes overlayIn { to { opacity: 1; } }

//         .pp-modal {
//           background: rgba(28,32,41,0.92);
//           backdrop-filter: blur(20px) saturate(140%);
//           -webkit-backdrop-filter: blur(20px) saturate(140%);
//           border: 1px solid var(--deck-line);
//           border-radius: 18px;
//           width: 100%;
//           max-width: 720px;
//           max-height: 85vh;
//           overflow-y: auto;
//           box-shadow: 0 24px 60px rgba(0,0,0,0.45);

//           opacity: 0;
//           transform: translateY(20px) scale(0.98);
//           animation: modalIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards;
//         }

//         @keyframes modalIn {
//           to { opacity: 1; transform: translateY(0) scale(1); }
//         }

//         .pp-modal-header {
//           position: sticky;
//           top: 0;
//           display: flex;
//           justify-content: space-between;
//           align-items: flex-start;
//           padding: 24px 28px 16px;
//           background: rgba(28,32,41,0.95);
//           border-bottom: 1px solid var(--deck-line);
//           z-index: 1;
//         }

//         .pp-modal-header h2 {
//           font-size: 19px;
//           font-weight: 800;
//           margin: 0 0 4px;
//         }

//         .pp-modal-header .sub {
//           font-size: 13px;
//           color: var(--muted);
//           display: flex;
//           align-items: center;
//           gap: 6px;
//         }

//         .btn-close {
//           background: rgba(255,255,255,0.06);
//           border: none;
//           color: var(--ink);
//           width: 32px;
//           height: 32px;
//           border-radius: 50%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           cursor: pointer;
//           flex-shrink: 0;
//           transition: background 0.2s ease, transform 0.2s ease;
//         }

//         .btn-close:hover {
//           background: rgba(255,255,255,0.12);
//           transform: rotate(90deg);
//         }

//         .pp-modal-body {
//           padding: 22px 28px 30px;
//         }

//         .mb-section { margin-bottom: 26px; }

//         .mb-section h3 {
//           font-size: 12px;
//           font-weight: 700;
//           text-transform: uppercase;
//           letter-spacing: 0.06em;
//           color: var(--sodium);
//           margin: 0 0 14px;
//         }

//         .detail-grid {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
//           gap: 14px;
//         }

//         .detail-item {
//           background: rgba(255,255,255,0.03);
//           border: 1px solid var(--deck-line);
//           border-radius: 10px;
//           padding: 12px 14px;
//         }

//         .detail-item .lbl {
//           font-size: 11px;
//           color: var(--muted);
//           text-transform: uppercase;
//           letter-spacing: 0.04em;
//           margin: 0 0 4px;
//         }

//         .detail-item .val {
//           font-size: 14px;
//           font-weight: 600;
//         }

//         .desc-box {
//           font-size: 14px;
//           color: var(--muted);
//           line-height: 1.6;
//           background: rgba(255,255,255,0.03);
//           border: 1px solid var(--deck-line);
//           border-radius: 10px;
//           padding: 14px;
//         }

//         .img-grid {
//           display: grid;
//           grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
//           gap: 12px;
//         }

//         .img-card {
//           position: relative;
//           background: rgba(255,255,255,0.04);
//           border: 1px solid var(--deck-line);
//           border-radius: 10px;
//           padding: 18px 8px;
//           text-align: center;
//           font-size: 11px;
//           color: var(--muted);
//           transition: transform 0.2s ease, border-color 0.2s ease;
//         }

//         .img-card:hover {
//           transform: translateY(-3px);
//           border-color: var(--sodium);
//         }

//         .img-card svg {
//           font-size: 22px;
//           color: var(--muted);
//           margin-bottom: 8px;
//           display: block;
//           margin-left: auto;
//           margin-right: auto;
//         }

//         .cover-badge {
//           position: absolute;
//           top: 6px;
//           right: 6px;
//           background: var(--sodium);
//           color: var(--deck);
//           font-size: 9px;
//           font-weight: 700;
//           padding: 2px 6px;
//           border-radius: 5px;
//         }

//         .empty-note {
//           font-size: 13px;
//           color: var(--muted);
//           font-style: italic;
//         }

//         table.rates-table {
//           width: 100%;
//           border-collapse: collapse;
//         }

//         .rates-table th {
//           text-align: left;
//           font-size: 11px;
//           text-transform: uppercase;
//           letter-spacing: 0.05em;
//           color: var(--muted);
//           padding: 10px 12px;
//           border-bottom: 1px solid var(--deck-line);
//         }

//         .rates-table td {
//           padding: 12px;
//           font-size: 13px;
//           border-bottom: 1px solid var(--deck-line);
//         }

//         .rates-table tr:last-child td { border-bottom: none; }

//         .vt-chip {
//           display: inline-flex;
//           align-items: center;
//           gap: 6px;
//           font-size: 13px;
//           font-weight: 600;
//         }

//         /* ---------- Add form ---------- */
//         .field {
//           margin-bottom: 16px;
//         }

//         .field label {
//           display: block;
//           font-size: 12px;
//           font-weight: 600;
//           color: var(--muted);
//           text-transform: uppercase;
//           letter-spacing: 0.04em;
//           margin-bottom: 6px;
//         }

//      .field input, .field select, .field textarea {
//   width: 100%;
//   background: rgba(255,255,255,0.04);
//   border: 1px solid var(--deck-line);
//   color: var(--ink);
//   padding: 11px 13px;
//   border-radius: 8px;
//   font-size: 14px;
//   outline: none;
//   font-family: inherit;
//   transition: border-color 0.2s ease, box-shadow 0.2s ease;
//   color-scheme: dark;
// }

// .field select option {
//   background: var(--deck-panel);
//   color: var(--ink);
// }

//         .field input:focus, .field select:focus, .field textarea:focus {
//           border-color: transparent;
//           box-shadow: 0 0 0 3px rgba(255,176,32,0.18);
//         }

//         .field-row {
//           display: grid;
//           grid-template-columns: 1fr 1fr;
//           gap: 14px;
//         }

//         .btn-submit {
//           width: 100%;
//           background: var(--sodium);
//           color: var(--deck);
//           border: none;
//           padding: 13px;
//           border-radius: 10px;
//           font-size: 15px;
//           font-weight: 700;
//           cursor: pointer;
//           transition: background 0.2s ease, transform 0.2s ease;
//         }

//         .btn-submit:hover {
//           background: #ffc250;
//           transform: translateY(-2px);
//         }

//         @media (prefers-reduced-motion: reduce) {
//           .pp-overlay, .pp-modal, .btn-close, .pp-table tbody tr { animation: none !important; transition: none !important; }
//         }

//         @media (max-width: 1024px) {
//           .pp-page { padding: 24px; }
//         }

//         @media (max-width: 640px) {
//           .pp-page { padding: 20px; }
//           .field-row { grid-template-columns: 1fr; }
//           .pp-table th:nth-child(3), .pp-table td:nth-child(3) { display: none; }
//           .filter-bar { flex-direction: column; align-items: stretch; }
//         }
//       `}</style>

//       <div className="pp-header">
//         <div>
//           <h1>Parking plots</h1>
//           <p>Facility profiles registered by owners across your cities.</p>
//         </div>
//         <button className="btn-add" onClick={() => setShowAddModal(true)}>
//           <FaPlus /> Add plot
//         </button>
//       </div>

//       <div className="filter-bar">
//         <div className="filter-search">
//           <FaSearch />
//           <input
//             placeholder="Search by name"
//             value={filters.search}
//             onChange={(e) => setFilters({ ...filters, search: e.target.value })}
//           />
//         </div>

//         <select
//           className="filter-select"
//           value={filters.city_id}
//           onChange={(e) => setFilters({ ...filters, city_id: e.target.value })}
//         >
//           <option value="all">All cities</option>
//           {Object.entries(CITIES).map(([id, name]) => (
//             <option key={id} value={id}>{name}</option>
//           ))}
//         </select>

//         <select
//           className="filter-select"
//           value={filters.status}
//           onChange={(e) => setFilters({ ...filters, status: e.target.value })}
//         >
//           <option value="all">All statuses</option>
//           {Object.entries(STATUS_META).map(([key, meta]) => (
//             <option key={key} value={key}>{meta.label}</option>
//           ))}
//         </select>

//         <button className={`btn-sort ${sortDir ? 'on' : ''}`} onClick={toggleSort}>
//           {sortDir === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
//           {sortDir === 'asc' ? 'Slots: low to high' : sortDir === 'desc' ? 'Slots: high to low' : 'Sort by slots'}
//         </button>

//         {hasActiveFilters && (
//           <button className="btn-clear" onClick={clearFilters}>
//             <FaUndo /> Clear
//           </button>
//         )}
//       </div>

//       <div className="results-line">
//         <FaFilter style={{ fontSize: 11 }} />
//         Showing {filteredPlots.length} of {plots.length} plots
//       </div>

//       <div className="pp-table-wrap">
//         {filteredPlots.length ? (
//           <table className="pp-table">
//             <thead>
//               <tr>
//                 <th>Name</th>
//                 <th>Address</th>
//                 <th>Status</th>
//                 <th></th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredPlots.map((plot) => {
//                 const meta = STATUS_META[plot.status];
//                 return (
//                   <tr key={plot.id}>
//                     <td className="plot-name">{plot.name}</td>
//                     <td className="plot-address">{plot.address || '—'}</td>
//                     <td>
//                       <span className="status-pill" style={{ color: meta.color, background: `${meta.color}1f` }}>
//                         {meta.label}
//                       </span>
//                     </td>
//                     <td>
//                       <button className="btn-view" onClick={() => setActivePlot(plot)}>
//                         <FaEye /> View
//                       </button>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         ) : (
//           <div className="empty-state">
//             <FaSearch />
//             <p>No plots match your filters.</p>
//             <button className="btn-view" onClick={clearFilters}>Clear filters</button>
//           </div>
//         )}
//       </div>

//       {activePlot && (
//         <div className="pp-overlay" onClick={() => setActivePlot(null)}>
//           <div className="pp-modal" onClick={(e) => e.stopPropagation()}>
//             <div className="pp-modal-header">
//               <div>
//                 <h2>{activePlot.name}</h2>
//                 <div className="sub">
//                   <FaMapMarkerAlt /> {AREAS[activePlot.area_id]}, {CITIES[activePlot.city_id]}
//                 </div>
//               </div>
//               <button className="btn-close" onClick={() => setActivePlot(null)} aria-label="Close">
//                 <FaTimes />
//               </button>
//             </div>

//             <div className="pp-modal-body">
//               <div className="mb-section">
//                 <h3>Plot details</h3>
//                 <div className="detail-grid">
//                   <div className="detail-item"><p className="lbl">Plot ID</p><p className="val">#{activePlot.id}</p></div>
//                   <div className="detail-item"><p className="lbl">Status</p><p className="val" style={{ color: STATUS_META[activePlot.status].color }}>{STATUS_META[activePlot.status].label}</p></div>
//                   <div className="detail-item"><p className="lbl">Owner ID</p><p className="val">#{activePlot.owner_id || '—'}</p></div>
//                   <div className="detail-item"><p className="lbl">Request ID</p><p className="val">{activePlot.request_id ? `#${activePlot.request_id}` : '—'}</p></div>
//                   <div className="detail-item"><p className="lbl">Car slots</p><p className="val"><FaCar style={{ marginRight: 6, color: 'var(--sodium)' }} />{activePlot.total_car_slots}</p></div>
//                   <div className="detail-item"><p className="lbl">Bike slots</p><p className="val"><FaMotorcycle style={{ marginRight: 6, color: 'var(--sodium)' }} />{activePlot.total_bike_slots}</p></div>
//                   <div className="detail-item"><p className="lbl">Coordinates</p><p className="val">{activePlot.latitude}, {activePlot.longitude}</p></div>
//                   <div className="detail-item"><p className="lbl">Min. booking</p><p className="val">{activePlot.minimum_booking_minutes} mins</p></div>
//                   <div className="detail-item"><p className="lbl">Online / Offline split</p><p className="val">{activePlot.online_percentage}% / {activePlot.offline_percentage}%</p></div>
//                   <div className="detail-item"><p className="lbl">Advance booking</p><p className="val">{activePlot.advance_booking_enabled ? `Yes (₹${activePlot.advance_booking_amount})` : 'Disabled'}</p></div>
//                   <div className="detail-item"><p className="lbl">Payments accepted</p><p className="val">{[activePlot.accept_online_payment && 'Online', activePlot.accept_offline_payment && 'Offline'].filter(Boolean).join(', ') || 'None'}</p></div>
//                   <div className="detail-item"><p className="lbl">UPI ID</p><p className="val">{activePlot.upi_id || '—'}</p></div>
//                   <div className="detail-item"><p className="lbl">Created</p><p className="val">{activePlot.created_at}</p></div>
//                 </div>
//               </div>

//               <div className="mb-section">
//                 <h3>Description</h3>
//                 <div className="desc-box">{activePlot.description || 'No description provided.'}</div>
//               </div>

//               <div className="mb-section">
//                 <h3>Images {activePlot.qr_code_image_url && <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· QR: <FaQrcode style={{ verticalAlign: -2 }} /> {activePlot.qr_code_image_url}</span>}</h3>
//                 {activePlot.images.length ? (
//                   <div className="img-grid">
//                     {activePlot.images.map((img) => (
//                       <div className="img-card" key={img.id}>
//                         {img.is_cover ? <span className="cover-badge">Cover</span> : null}
//                         <FaImage />
//                         {img.image_url}
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <p className="empty-note">No images uploaded for this plot yet.</p>
//                 )}
//               </div>

//               <div className="mb-section">
//                 <h3>Rates</h3>
//                 {activePlot.rates.length ? (
//                   <table className="rates-table">
//                     <thead>
//                       <tr>
//                         <th>Vehicle type</th>
//                         <th>Rate / hr</th>
//                         <th>Min. hours</th>
//                         <th>Extend rate / hr</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {activePlot.rates.map((rate) => (
//                         <tr key={rate.id}>
//                           <td>
//                             <span className="vt-chip">
//                               {rate.vehicle_type_id === 1 ? <FaCar /> : <FaMotorcycle />}
//                               {VEHICLE_TYPES[rate.vehicle_type_id]}
//                             </span>
//                           </td>
//                           <td><FaRupeeSign style={{ fontSize: 11 }} /> {rate.rate_per_hour.toFixed(2)}</td>
//                           <td>{rate.minimum_hours}</td>
//                           <td>{rate.extend_rate_per_hour != null ? <>₹{rate.extend_rate_per_hour.toFixed(2)}</> : '—'}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 ) : (
//                   <p className="empty-note">No rates configured for this plot yet.</p>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {showAddModal && (
//         <div className="pp-overlay" onClick={() => setShowAddModal(false)}>
//           <div className="pp-modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
//             <div className="pp-modal-header">
//               <div>
//                 <h2>Add parking plot</h2>
//                 <div className="sub"><FaCheckCircle /> Demo form — saves locally only</div>
//               </div>
//               <button className="btn-close" onClick={() => setShowAddModal(false)} aria-label="Close">
//                 <FaTimes />
//               </button>
//             </div>

//             <form className="pp-modal-body" onSubmit={handleAddPlot}>
//               <div className="field">
//                 <label>Name</label>
//                 <input
//                   value={form.name}
//                   onChange={(e) => setForm({ ...form, name: e.target.value })}
//                   placeholder="e.g. HITEC City Basement Parking"
//                   required
//                 />
//               </div>

//               <div className="field">
//                 <label>Address</label>
//                 <input
//                   value={form.address}
//                   onChange={(e) => setForm({ ...form, address: e.target.value })}
//                   placeholder="Street, area, city"
//                 />
//               </div>

//               <div className="field-row">
//                 <div className="field">
//                   <label>City</label>
//                   <select value={form.city_id} onChange={(e) => setForm({ ...form, city_id: e.target.value })}>
//                     {Object.entries(CITIES).map(([id, name]) => (
//                       <option key={id} value={id}>{name}</option>
//                     ))}
//                   </select>
//                 </div>
//                 <div className="field">
//                   <label>Area</label>
//                   <select value={form.area_id} onChange={(e) => setForm({ ...form, area_id: e.target.value })}>
//                     {Object.entries(AREAS).map(([id, name]) => (
//                       <option key={id} value={id}>{name}</option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               <div className="field-row">
//                 <div className="field">
//                   <label>Car slots</label>
//                   <input
//                     type="number"
//                     min="0"
//                     value={form.total_car_slots}
//                     onChange={(e) => setForm({ ...form, total_car_slots: e.target.value })}
//                     placeholder="0"
//                   />
//                 </div>
//                 <div className="field">
//                   <label>Bike slots</label>
//                   <input
//                     type="number"
//                     min="0"
//                     value={form.total_bike_slots}
//                     onChange={(e) => setForm({ ...form, total_bike_slots: e.target.value })}
//                     placeholder="0"
//                   />
//                 </div>
//               </div>

//               <div className="field">
//                 <label>Description</label>
//                 <textarea
//                   rows={3}
//                   value={form.description}
//                   onChange={(e) => setForm({ ...form, description: e.target.value })}
//                   placeholder="Brief facility description"
//                 />
//               </div>

//               <button type="submit" className="btn-submit">Save plot</button>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default ParkingPlot;


import React, { useState, useEffect, useMemo } from 'react';
import {
  FaMapMarkerAlt, FaPlus, FaEye, FaTimes, FaCar, FaMotorcycle,
  FaCheckCircle, FaQrcode, FaRupeeSign, FaImage, FaSearch,
  FaSortAmountDown, FaSortAmountUp, FaFilter, FaUndo,
} from 'react-icons/fa';

// Import your API config instance
import { apiRequest, asRows } from '../apiClient';

const VEHICLE_TYPES = { 1: 'Car', 2: 'Bike' };

const STATUS_META = {
  pending_profile: { label: 'Pending profile', color: 'var(--sodium)' },
  active: { label: 'Active', color: 'var(--go)' },
  inactive: { label: 'Inactive', color: 'var(--muted)' },
  suspended: { label: 'Suspended', color: 'var(--stop)' },
};

const emptyForm = {
  name: '', address: '', city_id: '', area_id: '',
  total_car_slots: '', total_bike_slots: '', car_rate: '', bike_rate: '', description: '',
};

const emptyFilters = { search: '', city_id: 'all' };

function ParkingPlot() {
  const [plots, setPlots] = useState([]);
  const [cities, setCities] = useState({});
  const [areas, setAreas] = useState({});

  const [activePlot, setActivePlot] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [filters, setFilters] = useState(emptyFilters);
  const [sortDir, setSortDir] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Data from API on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch plots, cities, and areas concurrently
        const [plotRes, cityRes, areaRes] = await Promise.all([
          apiRequest('/parkingplot'),
          apiRequest('/city'),
          apiRequest('/area')
        ]);

        // Safely extract data array
        const plotData = asRows(plotRes);
        const cityData = asRows(cityRes);
        const areaData = asRows(areaRes);

        setPlots(plotData);

        // Convert City and Area arrays to Object Maps for easy lookup (e.g. { 1: 'Hyderabad' })
        const cityMap = {};
        cityData.forEach(c => cityMap[c.city_id || c.id] = c.city_name || c.name);
        setCities(cityMap);

        const areaMap = {};
        areaData.forEach(a => areaMap[a.area_id || a.id] = a.area_name || a.name);
        setAreas(areaMap);

        // Set default form selections if data exists
        if (cityData.length > 0 && areaData.length > 0) {
          setForm(prev => ({
            ...prev,
            city_id: cityData[0].city_id || cityData[0].id,
            area_id: areaData[0].area_id || areaData[0].id
          }));
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to load data. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPlots = useMemo(() => {
    let list = plots.filter((p) => {
      // Show ONLY Approved/Active plots
      const isApproved = Boolean(p.approved) || String(p.status || '').toLowerCase() === 'approved';
      const matchesSearch = (p.plot_name || p.name || '').toLowerCase().includes(filters.search.trim().toLowerCase());
      const matchesCity = filters.city_id === 'all' || String(p.city_id || '') === filters.city_id;
      return isApproved && matchesSearch && matchesCity;
    });

    if (sortDir) {
      list = [...list].sort((a, b) => {
        const totalA = (Number(a.total_car_slots) || 0) + (Number(a.total_bike_slots) || 0);
        const totalB = (Number(b.total_car_slots) || 0) + (Number(b.total_bike_slots) || 0);
        return sortDir === 'asc' ? totalA - totalB : totalB - totalA;
      });
    }
    return list;
  }, [plots, filters, sortDir]);

  const hasActiveFilters = filters.search || filters.city_id !== 'all' || sortDir;

  const clearFilters = () => {
    setFilters(emptyFilters);
    setSortDir(null);
  };

  const toggleSort = () => {
    setSortDir((prev) => (prev === null ? 'desc' : prev === 'desc' ? 'asc' : null));
  };

  // POST new plot to API
  const handleAddPlot = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      const payload = {
        plot_name: form.name,
        address: form.address,
        area_id: Number(form.area_id),
        approved: false,
        rates: [
          { vehicle_type_id: 1, rate_per_hour: form.car_rate },
          { vehicle_type_id: 2, rate_per_hour: form.bike_rate },
        ],
      };

      await apiRequest('/parkingplot', { method: 'POST', body: JSON.stringify(payload) });

      // Refresh plot list after successful add
      const updatedPlots = await apiRequest('/parkingplot');
      setPlots(asRows(updatedPlots));

      setForm({ ...emptyForm, city_id: Object.keys(cities)[0], area_id: Object.keys(areas)[0] });
      setShowAddModal(false);
      alert("Parking plot added successfully!");

    } catch (error) {
      console.error("Error adding plot:", error);
      alert("Failed to add parking plot.");
    }
  };

  return (
    <div className="pp-page">
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

        .pp-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: var(--deck);
          color: var(--ink);
          min-height: 100vh;
          padding: 40px;
        }

        .pp-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 26px;
          flex-wrap: wrap;
          gap: 14px;
        }

        .pp-header h1 {
          font-size: 26px;
          font-weight: 800;
          margin: 0 0 4px;
        }

        .pp-header p {
          color: var(--muted);
          font-size: 14px;
          margin: 0;
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
          padding: 11px 20px;
          border-radius: 10px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .btn-add:hover {
          background: #ffc250;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(255,176,32,0.3);
        }

        /* ---------- Filter bar ---------- */
        .filter-bar {
          background: var(--deck-panel);
          border: 1px solid var(--deck-line);
          border-radius: 14px;
          padding: 16px 18px;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .filter-search {
          position: relative;
          flex: 1;
          min-width: 200px;
        }

        .filter-search svg {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
          font-size: 13px;
        }

        .filter-search input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--deck-line);
          color: var(--ink);
          padding: 10px 12px 10px 34px;
          border-radius: 9px;
          font-size: 14px;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .filter-search input:focus {
          border-color: transparent;
          box-shadow: 0 0 0 3px rgba(255,176,32,0.18);
        }

        .filter-select {
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--deck-line);
          color: var(--ink);
          padding: 10px 12px;
          border-radius: 9px;
          font-size: 13px;
          font-family: inherit;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s ease;
          color-scheme: dark;
        }
        
        .filter-select option {
          background: var(--deck-panel);
          color: var(--ink);
        }

        .filter-select:focus {
          border-color: var(--sodium);
        }

        .btn-sort {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--deck-line);
          color: var(--ink);
          padding: 10px 14px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s ease;
        }

        .btn-sort:hover, .btn-sort.on {
          border-color: var(--sodium);
          color: var(--sodium);
        }

        .btn-clear {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: var(--muted);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 10px;
          border-radius: 8px;
          transition: color 0.2s ease, background 0.2s ease;
        }

        .btn-clear:hover {
          color: var(--stop);
          background: rgba(226,83,74,0.08);
        }

        .results-line {
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* ---------- Table ---------- */
        .pp-table-wrap {
          background: var(--deck-panel);
          border: 1px solid var(--deck-line);
          border-radius: 16px;
          overflow-x: auto;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        table.pp-table { min-width: 560px; }

        table.pp-table {
          width: 100%;
          border-collapse: collapse;
        }

        .pp-table th {
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          padding: 16px 20px;
          border-bottom: 1px solid var(--deck-line);
        }

        .pp-table td {
          padding: 16px 20px;
          font-size: 14px;
          border-bottom: 1px solid var(--deck-line);
          vertical-align: middle;
        }

        .pp-table tbody tr {
          transition: background 0.2s ease;
          animation: rowIn 0.25s ease;
        }

        @keyframes rowIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .pp-table tbody tr:hover {
          background: rgba(255,255,255,0.03);
        }

        .pp-table tbody tr:last-child td {
          border-bottom: none;
        }

        .plot-name {
          font-weight: 600;
        }

        .plot-address {
          color: var(--muted);
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .status-pill::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
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

        .empty-state {
          padding: 60px 20px;
          text-align: center;
          color: var(--muted);
        }

        .empty-state svg {
          font-size: 26px;
          margin-bottom: 10px;
          color: var(--muted);
        }

        .empty-state p {
          margin: 0 0 14px;
          font-size: 14px;
        }

        /* ---------- Modal shell ---------- */
        .pp-overlay {
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

        .pp-modal {
          background: rgba(28,32,41,0.92);
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          border: 1px solid var(--deck-line);
          border-radius: 18px;
          width: 100%;
          max-width: 720px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0,0,0,0.45);

          opacity: 0;
          transform: translateY(20px) scale(0.98);
          animation: modalIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards;
        }

        @keyframes modalIn {
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .pp-modal-header {
          position: sticky;
          top: 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 24px 28px 16px;
          background: rgba(28,32,41,0.95);
          border-bottom: 1px solid var(--deck-line);
          z-index: 1;
        }

        .pp-modal-header h2 {
          font-size: 19px;
          font-weight: 800;
          margin: 0 0 4px;
        }

        .pp-modal-header .sub {
          font-size: 13px;
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-close {
          background: rgba(255,255,255,0.06);
          border: none;
          color: var(--ink);
          width: 32px;
          height: 32px;
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

        .pp-modal-body {
          padding: 22px 28px 30px;
        }

        .mb-section { margin-bottom: 26px; }

        .mb-section h3 {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--sodium);
          margin: 0 0 14px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
        }

        .detail-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--deck-line);
          border-radius: 10px;
          padding: 12px 14px;
        }

        .detail-item .lbl {
          font-size: 11px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0 0 4px;
        }

        .detail-item .val {
          font-size: 14px;
          font-weight: 600;
        }

        .desc-box {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.6;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--deck-line);
          border-radius: 10px;
          padding: 14px;
        }

        .img-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
        }

        .img-card {
          position: relative;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--deck-line);
          border-radius: 10px;
          padding: 18px 8px;
          text-align: center;
          font-size: 11px;
          color: var(--muted);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .img-card:hover {
          transform: translateY(-3px);
          border-color: var(--sodium);
        }

        .img-card svg {
          font-size: 22px;
          color: var(--muted);
          margin-bottom: 8px;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }

        .cover-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          background: var(--sodium);
          color: var(--deck);
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 5px;
        }

        .empty-note {
          font-size: 13px;
          color: var(--muted);
          font-style: italic;
        }

        table.rates-table {
          width: 100%;
          border-collapse: collapse;
        }

        .rates-table th {
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          padding: 10px 12px;
          border-bottom: 1px solid var(--deck-line);
        }

        .rates-table td {
          padding: 12px;
          font-size: 13px;
          border-bottom: 1px solid var(--deck-line);
        }

        .rates-table tr:last-child td { border-bottom: none; }

        .vt-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
        }

        /* ---------- Add form ---------- */
        .field {
          margin-bottom: 16px;
        }

        .field label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 6px;
        }

        .field input, .field select, .field textarea {
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

        .field select option {
          background: var(--deck-panel);
          color: var(--ink);
        }

        .field input:focus, .field select:focus, .field textarea:focus {
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

        @media (prefers-reduced-motion: reduce) {
          .pp-overlay, .pp-modal, .btn-close, .pp-table tbody tr { animation: none !important; transition: none !important; }
        }

        @media (max-width: 1024px) {
          .pp-page { padding: 24px; }
        }

        @media (max-width: 640px) {
          .pp-page { padding: 20px; }
          .field-row { grid-template-columns: 1fr; }
          .pp-table th:nth-child(3), .pp-table td:nth-child(3) { display: none; }
          .filter-bar { flex-direction: column; align-items: stretch; }
        }
      `}</style>

      <div className="pp-header">
        <div>
          <h1>Parking plots</h1>
          <p>Facility profiles registered by owners across your cities.</p>
        </div>
        <button className="btn-add" onClick={() => setShowAddModal(true)}>
          <FaPlus /> Add plot
        </button>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <FaSearch />
          <input
            placeholder="Search by name"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <select
          className="filter-select"
          value={filters.city_id}
          onChange={(e) => setFilters({ ...filters, city_id: e.target.value })}
        >
          <option value="all">All cities</option>
          {Object.entries(cities).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>

        <button className={`btn-sort ${sortDir ? 'on' : ''}`} onClick={toggleSort}>
          {sortDir === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
          {sortDir === 'asc' ? 'Slots: low to high' : sortDir === 'desc' ? 'Slots: high to low' : 'Sort by slots'}
        </button>

        {hasActiveFilters && (
          <button className="btn-clear" onClick={clearFilters}>
            <FaUndo /> Clear
          </button>
        )}
      </div>

      <div className="results-line">
        <FaFilter style={{ fontSize: 11 }} />
        Showing {filteredPlots.length} of {plots.filter(p => Boolean(p.approved) || String(p.status || '').toLowerCase() === 'approved').length} approved plots
      </div>

      <div className="pp-table-wrap">
        {loading ? (
          <div className="empty-state">
            <p>Loading records...</p>
          </div>
        ) : filteredPlots.length ? (
          <table className="pp-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredPlots.map((plot) => {
                const meta = STATUS_META.active;
                return (
                  <tr key={plot.plot_id || plot.id}>
                    <td className="plot-name">{plot.plot_name || plot.name}</td>
                    <td className="plot-address">{plot.address || '—'}</td>
                    <td>
                      <span className="status-pill" style={{ color: meta.color, background: `${meta.color}1f` }}>
                        {meta.label}
                      </span>
                    </td>
                    <td>
                      <button className="btn-view" onClick={() => setActivePlot(plot)}>
                        <FaEye /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <FaSearch />
            <p>No plots match your filters.</p>
            <button className="btn-view" onClick={clearFilters}>Clear filters</button>
          </div>
        )}
      </div>

      {activePlot && (
        <div className="pp-overlay" onClick={() => setActivePlot(null)}>
          <div className="pp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pp-modal-header">
              <div>
                <h2>{activePlot.plot_name || activePlot.name}</h2>
                <div className="sub">
                  <FaMapMarkerAlt /> {areas[activePlot.area_id]}, {cities[activePlot.city_id]}
                </div>
              </div>
              <button className="btn-close" onClick={() => setActivePlot(null)} aria-label="Close">
                <FaTimes />
              </button>
            </div>

            <div className="pp-modal-body">
              <div className="mb-section">
                <h3>Plot details</h3>
                <div className="detail-grid">
                  <div className="detail-item"><p className="lbl">Plot ID</p><p className="val">#{activePlot.plot_id || activePlot.id}</p></div>
                  <div className="detail-item"><p className="lbl">Status</p><p className="val" style={{ color: STATUS_META.active.color }}>Active</p></div>
                  <div className="detail-item"><p className="lbl">Owner ID</p><p className="val">#{activePlot.owner_id || '—'}</p></div>
                  <div className="detail-item"><p className="lbl">Car slots</p><p className="val"><FaCar style={{ marginRight: 6, color: 'var(--sodium)' }} />{activePlot.total_car_slots || 0}</p></div>
                  <div className="detail-item"><p className="lbl">Bike slots</p><p className="val"><FaMotorcycle style={{ marginRight: 6, color: 'var(--sodium)' }} />{activePlot.total_bike_slots || 0}</p></div>
                  <div className="detail-item"><p className="lbl">Created</p><p className="val">{activePlot.created_at ? new Date(activePlot.created_at).toLocaleString() : '—'}</p></div>
                </div>
              </div>

              <div className="mb-section">
                <h3>Description</h3>
                <div className="desc-box">{activePlot.description || 'No description provided.'}</div>
              </div>

              <div className="mb-section">
                <h3>Images {activePlot.qr_code_image_url && <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· QR: <FaQrcode style={{ verticalAlign: -2 }} /> {activePlot.qr_code_image_url}</span>}</h3>
                {activePlot.images && activePlot.images.length ? (
                  <div className="img-grid">
                    {activePlot.images.map((img) => (
                      <div className="img-card" key={img.id}>
                        {img.is_cover ? <span className="cover-badge">Cover</span> : null}
                        <FaImage />
                        {img.image_url}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-note">No images uploaded for this plot yet.</p>
                )}
              </div>

              <div className="mb-section">
                <h3>Rates</h3>
                {activePlot.rates && activePlot.rates.length ? (
                  <table className="rates-table">
                    <thead>
                      <tr>
                        <th>Vehicle type</th>
                        <th>Rate / hr</th>
                        <th>Min. hours</th>
                        <th>Extend rate / hr</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activePlot.rates.map((rate) => (
                        <tr key={rate.id}>
                          <td>
                            <span className="vt-chip">
                              {rate.vehicle_type_id === 1 ? <FaCar /> : <FaMotorcycle />}
                              {VEHICLE_TYPES[rate.vehicle_type_id]}
                            </span>
                          </td>
                          <td><FaRupeeSign style={{ fontSize: 11 }} /> {rate.rate_per_hour.toFixed(2)}</td>
                          <td>{rate.minimum_hours}</td>
                          <td>{rate.extend_rate_per_hour != null ? <>₹{rate.extend_rate_per_hour.toFixed(2)}</> : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="empty-note">No rates configured for this plot yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="pp-overlay" onClick={() => setShowAddModal(false)}>
          <div className="pp-modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="pp-modal-header">
              <div>
                <h2>Add parking plot</h2>
                <div className="sub"><FaCheckCircle /> Submit via API Route</div>
              </div>
              <button className="btn-close" onClick={() => setShowAddModal(false)} aria-label="Close">
                <FaTimes />
              </button>
            </div>

            <form className="pp-modal-body" onSubmit={handleAddPlot}>
              <div className="field">
                <label>Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. HITEC City Basement Parking"
                  required
                />
              </div>

              <div className="field">
                <label>Address</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street, area, city"
                />
              </div>

              <div className="field-row">
                <div className="field">
                  <label>City</label>
                  <select value={form.city_id} onChange={(e) => setForm({ ...form, city_id: e.target.value })}>
                    {Object.entries(cities).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Area</label>
                  <select value={form.area_id} onChange={(e) => setForm({ ...form, area_id: e.target.value })}>
                    {Object.entries(areas).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Car rate / hour (₹)</label>
                  <input type="number" min="0" step="0.01" value={form.car_rate} onChange={(e) => setForm({ ...form, car_rate: e.target.value })} placeholder="e.g. 40" required />
                </div>
                <div className="field">
                  <label>Bike rate / hour (₹)</label>
                  <input type="number" min="0" step="0.01" value={form.bike_rate} onChange={(e) => setForm({ ...form, bike_rate: e.target.value })} placeholder="e.g. 20" required />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Car slots</label>
                  <input
                    type="number"
                    min="0"
                    value={form.total_car_slots}
                    onChange={(e) => setForm({ ...form, total_car_slots: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="field">
                  <label>Bike slots</label>
                  <input
                    type="number"
                    min="0"
                    value={form.total_bike_slots}
                    onChange={(e) => setForm({ ...form, total_bike_slots: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="field">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief facility description"
                />
              </div>

              <button type="submit" className="btn-submit">Save plot</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParkingPlot;
