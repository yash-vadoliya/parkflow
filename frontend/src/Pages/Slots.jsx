// Slots.js
import React, { useEffect, useState, useMemo } from 'react';
import {
  FaCar, FaMotorcycle, FaRupeeSign, FaCheckCircle,
  FaExclamationCircle, FaTimes, FaHourglassHalf, FaSignInAlt,
  FaSignOutAlt, FaSearch, FaClock, FaBookmark,
} from 'react-icons/fa';
import { apiRequest, asRows } from '../apiClient';

// ---------- Status styling: pill color + full-card background tint ----------

const STATUS_META = {
  reserved: { label: 'Reserved', color: '#8b7cf6', bg: 'rgba(139,124,246,0.07)', border: 'rgba(139,124,246,0.25)' },
  checked_in: { label: 'Checked in', color: 'var(--go)', bg: 'rgba(43,181,131,0.07)', border: 'rgba(43,181,131,0.25)' },
  overtime: { label: 'Overtime', color: '#ff6b5e', bg: 'rgba(255,107,94,0.08)', border: 'rgba(255,107,94,0.3)' },
  checked_out: { label: 'Checked out', color: '#9195a0', bg: 'rgba(255,255,255,0.02)', border: 'var(--deck-line)' },
  cancelled: { label: 'Cancelled', color: 'var(--stop)', bg: 'rgba(226,83,74,0.06)', border: 'rgba(226,83,74,0.2)' },
};

const PAYMENT_META = {
  pending: { label: 'Payment pending', color: 'var(--sodium)', bg: 'rgba(255,176,32,0.14)' },
  paid: { label: 'Paid', color: 'var(--go)', bg: 'rgba(43,181,131,0.14)' },
  unpaid: { label: 'Unpaid', color: 'var(--stop)', bg: 'rgba(226,83,74,0.14)' },
  partial: { label: 'Partially paid', color: 'var(--sodium)', bg: 'rgba(255,176,32,0.14)' },
};

const NOW = new Date('2026-08-03T13:20:00');

const initialSlots = [
  {
    id: 1, booking_code: 'BK-4021', slot_label: 'A-01', vehicle_type_id: 1,
    vehicle_number: 'TS09EF4521',
    scheduled_checkin: '2026-08-03 09:00:00', scheduled_checkout: '2026-08-03 13:00:00',
    actual_checkin: '2026-08-03 09:05:00', actual_checkout: null,
    base_amount: 160.0, extended_amount: 0.0, amount_paid: 0.0,
    payment_status: 'pending', booking_status: 'checked_in',
  },
  {
    id: 2, booking_code: 'BK-4022', slot_label: 'A-02', vehicle_type_id: 2,
    vehicle_number: 'TS10AB1187',
    scheduled_checkin: '2026-08-03 08:00:00', scheduled_checkout: '2026-08-03 10:00:00',
    actual_checkin: '2026-08-03 08:02:00', actual_checkout: '2026-08-03 10:20:00',
    base_amount: 30.0, extended_amount: 6.0, amount_paid: 36.0,
    payment_status: 'paid', booking_status: 'checked_out',
  },
  {
    id: 3, booking_code: 'BK-4023', slot_label: 'A-03', vehicle_type_id: 1,
    vehicle_number: 'MH12CD9034',
    scheduled_checkin: '2026-08-03 07:30:00', scheduled_checkout: '2026-08-03 11:30:00',
    actual_checkin: '2026-08-03 07:40:00', actual_checkout: '2026-08-03 11:45:00',
    base_amount: 160.0, extended_amount: 12.0, amount_paid: 0.0,
    payment_status: 'unpaid', booking_status: 'checked_out',
  },
  {
    id: 4, booking_code: 'BK-4024', slot_label: 'B-01', vehicle_type_id: 1,
    vehicle_number: 'KA05MN2231',
    scheduled_checkin: '2026-08-03 06:00:00', scheduled_checkout: '2026-08-03 09:00:00',
    actual_checkin: '2026-08-03 06:10:00', actual_checkout: '2026-08-03 09:05:00',
    base_amount: 120.0, extended_amount: 0.0, amount_paid: 70.0,
    payment_status: 'partial', booking_status: 'checked_out',
  },
  {
    id: 5, booking_code: 'BK-4025', slot_label: 'B-02', vehicle_type_id: 2,
    vehicle_number: 'MH14XY7712',
    scheduled_checkin: '2026-08-03 11:00:00', scheduled_checkout: '2026-08-03 12:30:00',
    actual_checkin: '2026-08-03 11:00:00', actual_checkout: null,
    base_amount: 45.0, extended_amount: 0.0, amount_paid: 45.0,
    payment_status: 'paid', booking_status: 'checked_in',
  },
  {
    id: 6, booking_code: 'BK-4030', slot_label: 'C-01', vehicle_type_id: 2,
    vehicle_number: 'TS08PQ5643',
    scheduled_checkin: '2026-08-03 15:00:00', scheduled_checkout: '2026-08-03 17:00:00',
    actual_checkin: null, actual_checkout: null,
    base_amount: 20.0, extended_amount: 0.0, amount_paid: 20.0,
    payment_status: 'paid', booking_status: 'reserved',
  },
  {
    id: 7, booking_code: 'BK-4031', slot_label: 'C-02', vehicle_type_id: 2,
    vehicle_number: 'MH01ZZ9981',
    scheduled_checkin: '2026-08-03 10:00:00', scheduled_checkout: '2026-08-03 12:00:00',
    actual_checkin: '2026-08-03 10:05:00', actual_checkout: null,
    base_amount: 24.0, extended_amount: 0.0, amount_paid: 0.0,
    payment_status: 'pending', booking_status: 'checked_in',
  },
  {
    id: 8, booking_code: 'BK-4032', slot_label: 'C-03', vehicle_type_id: 1,
    vehicle_number: 'KA03LM4498',
    scheduled_checkin: '2026-08-03 09:30:00', scheduled_checkout: '2026-08-03 12:00:00',
    actual_checkin: '2026-08-03 09:35:00', actual_checkout: null,
    base_amount: 100.0, extended_amount: 0.0, amount_paid: 0.0,
    payment_status: 'pending', booking_status: 'checked_in',
  },
];

function fmtTime(dt) {
  if (!dt) return '—';
  const d = new Date(dt.replace(' ', 'T'));
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function computeHours(checkin, checkout) {
  if (!checkin) return null;
  const start = new Date(checkin.replace(' ', 'T'));
  const end = checkout ? new Date(checkout.replace(' ', 'T')) : NOW;
  return Math.max((end - start) / (1000 * 60 * 60), 0);
}

// Derives the effective card status: overtime is computed, not stored directly
function effectiveStatus(slot) {
  if (slot.booking_status === 'checked_in') {
    const scheduledEnd = new Date(slot.scheduled_checkout.replace(' ', 'T'));
    if (NOW > scheduledEnd) return 'overtime';
  }
  return slot.booking_status;
}

function Slots() {
  const [slots, setSlots] = useState([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    apiRequest('/parkingplot')
      .then((payload) => setSlots(asRows(payload).map((plot) => ({
        id: plot.plot_id,
        booking_code: `PLOT-${plot.plot_id}`,
        slot_label: plot.plot_name || `Plot ${plot.plot_id}`,
        vehicle_type_id: 1,
        vehicle_number: '',
        scheduled_checkin: null,
        scheduled_checkout: null,
        actual_checkin: null,
        actual_checkout: null,
        base_amount: 0,
        extended_amount: 0,
        amount_paid: 0,
        payment_status: 'pending',
        booking_status: plot.approved ? 'reserved' : 'cancelled',
        plot_name: plot.plot_name,
      }))))
      .catch((error) => setLoadError(error.message));
  }, []);
  const [activeSlot, setActiveSlot] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all'); // all | 1 (car) | 2 (bike)

  const filteredSlots = useMemo(() => {
    const q = search.trim().toLowerCase();
    return slots.filter((s) => {
      const last4 = (s.vehicle_number || '').slice(-4).toLowerCase();
      const matchesSearch =
        !q ||
        last4.includes(q) ||
        (s.vehicle_number || '').toLowerCase().includes(q) ||
        s.slot_label.toLowerCase().includes(q) ||
        s.booking_code.toLowerCase().includes(q);

      const status = effectiveStatus(s);
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      const matchesVehicle = vehicleFilter === 'all' || String(s.vehicle_type_id) === vehicleFilter;

      return matchesSearch && matchesStatus && matchesVehicle;
    });
  }, [slots, search, statusFilter, vehicleFilter]);

  const carCount = slots.filter((s) => s.vehicle_type_id === 1).length;
  const bikeCount = slots.filter((s) => s.vehicle_type_id === 2).length;

  const openPayment = (slot) => {
    setActiveSlot(slot);
    setAmountInput('');
  };

  const totalDue = (slot) => slot.base_amount + slot.extended_amount;
  const balanceDue = (slot) => Math.max(totalDue(slot) - slot.amount_paid, 0);

  const addPayment = () => {
    const amt = parseFloat(amountInput);
    if (!amt || amt <= 0) return;
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id !== activeSlot.id) return s;
        const newPaid = Math.min(s.amount_paid + amt, totalDue(s));
        const due = totalDue(s);
        const status = newPaid >= due ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';
        const updated = { ...s, amount_paid: newPaid, payment_status: status };
        setActiveSlot(updated);
        return updated;
      })
    );
    setAmountInput('');
  };

  const markFullyPaid = () => {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id !== activeSlot.id) return s;
        const updated = { ...s, amount_paid: totalDue(s), payment_status: 'paid' };
        setActiveSlot(updated);
        return updated;
      })
    );
  };

  return (
    <div className="slots-page">
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

        .slots-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: var(--deck);
          color: var(--ink);
          min-height: 100vh;
          padding: 40px;
        }

        .slots-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 22px;
          flex-wrap: wrap;
          gap: 14px;
        }

        .slots-header h1 {
          font-size: 26px;
          font-weight: 800;
          margin: 0 0 4px;
        }

        .slots-header p {
          color: var(--muted);
          font-size: 14px;
          margin: 0;
        }

        .filter-bar {
          background: var(--deck-panel);
          border: 1px solid var(--deck-line);
          border-radius: 14px;
          padding: 14px 16px;
          margin-bottom: 22px;
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
        }

        .filter-search input:focus { border-color: var(--sodium); }

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
          color-scheme: dark;
        }

        .filter-select option {
          background: var(--deck-panel);
          color: var(--ink);
        }

        .vehicle-toggle {
          display: flex;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--deck-line);
          border-radius: 9px;
          padding: 3px;
          gap: 3px;
        }

        .vehicle-toggle button {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: var(--muted);
          font-size: 13px;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 7px;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }

        .vehicle-toggle button.active {
          background: rgba(255,176,32,0.14);
          color: var(--sodium);
        }

        .vehicle-toggle button .count {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          opacity: 0.8;
        }

        /* ---------- Slot grid ---------- */
        .slot-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
          gap: 18px;
        }

        .slot-card {
          border: 1px solid var(--deck-line);
          border-radius: 16px;
          padding: 20px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          animation: cardIn 0.3s ease;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .slot-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }

        .slot-card.empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border-style: dashed;
          background: var(--deck-panel);
          color: var(--muted);
          min-height: 220px;
        }

        .slot-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 14px;
        }

        .slot-label-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .slot-vehicle-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(255,176,32,0.12);
          color: var(--sodium);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .slot-label {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--muted);
          letter-spacing: 0.05em;
          margin: 0 0 2px;
        }

        .slot-vehicle-num {
          font-size: 15px;
          font-weight: 700;
          font-family: 'Space Mono', monospace;
          letter-spacing: 0.03em;
          margin: 0;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 9px;
          border-radius: 20px;
          white-space: nowrap;
        }

        .status-pill::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .time-row {
          display: flex;
          justify-content: space-between;
          background: rgba(0,0,0,0.15);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px;
          padding: 10px 12px;
          margin-bottom: 10px;
        }

        .time-block {
          text-align: center;
          flex: 1;
        }

        .time-block .lbl {
          font-size: 10px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          margin: 0 0 4px;
        }

        .time-block .val {
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          font-weight: 700;
        }

        .time-divider {
          width: 1px;
          background: rgba(255,255,255,0.08);
          margin: 2px 10px;
        }

        .hours-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 14px;
        }

        .hours-row strong {
          color: var(--ink);
          font-family: 'Space Mono', monospace;
        }

        .hours-row.overtime strong {
          color: #ff6b5e;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px dashed rgba(255,255,255,0.1);
        }

        .price-total {
          font-family: 'Space Mono', monospace;
          font-size: 18px;
          font-weight: 800;
          display: flex;
          align-items: center;
        }

        .price-sub {
          font-size: 11px;
          color: var(--muted);
        }

        .btn-collect {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,176,32,0.18);
          border: 1px solid rgba(255,176,32,0.45);
          color: var(--sodium);
          font-size: 12px;
          font-weight: 700;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.15s ease;
        }

        .btn-collect:hover {
          background: rgba(255,176,32,0.28);
          transform: translateY(-1px);
        }

        .paid-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--go);
          font-size: 12px;
          font-weight: 700;
        }

        .empty-icon {
          font-size: 26px;
          margin-bottom: 10px;
          opacity: 0.5;
        }

        .results-line {
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 14px;
        }

        /* ---------- Modal ---------- */
        .slot-overlay {
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

        .slot-modal {
          background: rgba(28,32,41,0.94);
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          border: 1px solid var(--deck-line);
          border-radius: 18px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.45);

          opacity: 0;
          transform: translateY(20px) scale(0.98);
          animation: modalIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards;
        }

        @keyframes modalIn {
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .slot-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 22px 24px 14px;
          border-bottom: 1px solid var(--deck-line);
        }

        .slot-modal-header h2 {
          font-size: 17px;
          font-weight: 800;
          margin: 0 0 4px;
        }

        .slot-modal-header .sub {
          font-size: 12px;
          color: var(--muted);
          font-family: 'Space Mono', monospace;
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

        .slot-modal-body {
          padding: 20px 24px 26px;
        }

        .pay-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }

        .pay-stat {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--deck-line);
          border-radius: 10px;
          padding: 12px 14px;
        }

        .pay-stat .lbl {
          font-size: 11px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0 0 4px;
        }

        .pay-stat .val {
          font-family: 'Space Mono', monospace;
          font-size: 17px;
          font-weight: 800;
        }

        .pay-stat.due .val { color: var(--stop); }
        .pay-stat.paid .val { color: var(--go); }

        .field { margin-bottom: 14px; }

        .field label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 6px;
        }

        .amount-input-wrap {
          position: relative;
        }

        .amount-input-wrap svg {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
          font-size: 13px;
        }

        .amount-input-wrap input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--deck-line);
          color: var(--ink);
          padding: 11px 13px 11px 32px;
          border-radius: 9px;
          font-size: 15px;
          font-family: 'Space Mono', monospace;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .amount-input-wrap input:focus {
          border-color: transparent;
          box-shadow: 0 0 0 3px rgba(255,176,32,0.18);
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }

        .btn-add-money {
          flex: 1;
          background: var(--sodium);
          color: var(--deck);
          border: none;
          padding: 12px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .btn-add-money:hover {
          background: #ffc250;
          transform: translateY(-2px);
        }

        .btn-mark-paid {
          background: rgba(43,181,131,0.14);
          border: 1px solid rgba(43,181,131,0.4);
          color: var(--go);
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .btn-mark-paid:hover {
          background: rgba(43,181,131,0.24);
          transform: translateY(-2px);
        }

        .fully-paid-note {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(43,181,131,0.1);
          border: 1px solid rgba(43,181,131,0.3);
          color: var(--go);
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
        }

        .empty-state {
          padding: 60px 20px;
          text-align: center;
          color: var(--muted);
          grid-column: 1 / -1;
        }

        @media (prefers-reduced-motion: reduce) {
          .slot-overlay, .slot-modal, .slot-card, .btn-close { animation: none !important; transition: none !important; }
        }

        @media (max-width: 1024px) {
          .slots-page { padding: 24px; }
        }

        @media (max-width: 640px) {
          .slots-page { padding: 20px; }
          .slot-grid { grid-template-columns: 1fr 1fr; }
          .modal-actions { flex-direction: column; }
        }

        @media (max-width: 420px) {
          .slot-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="slots-header">
        <div>
          <h1>Live parking inventory</h1>
          <p>Vehicle-wise slot status, timing, and payment collection.</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <FaSearch />
          <input
            placeholder="Search last 4 digits, vehicle no., or slot"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="vehicle-toggle">
          <button
            type="button"
            className={vehicleFilter === 'all' ? 'active' : ''}
            onClick={() => setVehicleFilter('all')}
          >
            All <span className="count">{slots.length}</span>
          </button>
          <button
            type="button"
            className={vehicleFilter === '1' ? 'active' : ''}
            onClick={() => setVehicleFilter('1')}
          >
            <FaCar /> 4-wheeler <span className="count">{carCount}</span>
          </button>
          <button
            type="button"
            className={vehicleFilter === '2' ? 'active' : ''}
            onClick={() => setVehicleFilter('2')}
          >
            <FaMotorcycle /> 2-wheeler <span className="count">{bikeCount}</span>
          </button>
        </div>

        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
      </div>

      {loadError && <div className="results-line">Unable to load live parking data: {loadError}</div>}
      <div className="results-line">Showing {filteredSlots.length} of {slots.length} parking plots</div>

      <div className="slot-grid">
        {filteredSlots.length === 0 && (
          <div className="empty-state">
            <FaSearch style={{ fontSize: 22, marginBottom: 8 }} />
            <p>No slots match your search or filters.</p>
          </div>
        )}

        {filteredSlots.map((slot) => {
          const status = effectiveStatus(slot);
          const meta = STATUS_META[status];
          const pMeta = PAYMENT_META[slot.payment_status];
          const hours = computeHours(slot.actual_checkin, slot.actual_checkout);
          const total = totalDue(slot);
          const due = balanceDue(slot);
          const isCheckedOut = slot.booking_status === 'checked_out';
          const isReserved = slot.booking_status === 'reserved';

          return (
            <div
              className="slot-card"
              key={slot.id}
              style={{ background: meta.bg, borderColor: meta.border }}
            >
              <div className="slot-top">
                <div className="slot-label-row">
                  <div className="slot-vehicle-icon">
                    {slot.vehicle_type_id === 1 ? <FaCar /> : <FaMotorcycle />}
                  </div>
                  <div>
                    <p className="slot-label">SLOT {slot.slot_label}</p>
                    <p className="slot-vehicle-num">{slot.vehicle_number}</p>
                  </div>
                </div>
                <span className="status-pill" style={{ color: meta.color, background: `${meta.color}22` }}>
                  {status === 'checked_in' && <FaSignInAlt style={{ fontSize: 10 }} />}
                  {status === 'overtime' && <FaExclamationCircle style={{ fontSize: 10 }} />}
                  {status === 'reserved' && <FaBookmark style={{ fontSize: 10 }} />}
                  {meta.label}
                </span>
              </div>

              {isReserved ? (
                <div className="time-row">
                  <div className="time-block">
                    <p className="lbl"><FaClock />Scheduled in</p>
                    <p className="val">{fmtTime(slot.scheduled_checkin)}</p>
                  </div>
                  <div className="time-divider"></div>
                  <div className="time-block">
                    <p className="lbl"><FaClock />Scheduled out</p>
                    <p className="val">{fmtTime(slot.scheduled_checkout)}</p>
                  </div>
                </div>
              ) : (
                <div className="time-row">
                  <div className="time-block">
                    <p className="lbl"><FaSignInAlt />In</p>
                    <p className="val">{fmtTime(slot.actual_checkin)}</p>
                  </div>
                  <div className="time-divider"></div>
                  <div className="time-block">
                    <p className="lbl"><FaSignOutAlt />Out</p>
                    <p className="val">{fmtTime(slot.actual_checkout)}</p>
                  </div>
                </div>
              )}

              {!isReserved && (
                <div className={`hours-row ${status === 'overtime' ? 'overtime' : ''}`}>
                  <FaHourglassHalf style={{ color: status === 'overtime' ? '#ff6b5e' : 'var(--sodium)' }} />
                  Total: <strong>{hours != null ? hours.toFixed(1) : '—'} hrs</strong>
                  {status === 'overtime' && <span style={{ color: '#ff6b5e', fontWeight: 700 }}>· past scheduled time</span>}
                </div>
              )}

              <div className="price-row">
                <div>
                  <p className="price-total"><FaRupeeSign style={{ fontSize: 14 }} />{total.toFixed(2)}</p>
                  <p className="price-sub">
                    base ₹{slot.base_amount.toFixed(2)}
                    {slot.extended_amount > 0 && ` + ext ₹${slot.extended_amount.toFixed(2)}`}
                  </p>
                </div>

                {isCheckedOut ? (
                  slot.payment_status === 'paid' ? (
                    <span className="paid-badge"><FaCheckCircle /> Paid</span>
                  ) : (
                    <button className="btn-collect" onClick={() => openPayment(slot)}>
                      <FaExclamationCircle /> Collect ₹{due.toFixed(0)}
                    </button>
                  )
                ) : (
                  <span className="status-pill" style={{ color: pMeta.color, background: pMeta.bg }}>
                    {pMeta.label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeSlot && (
        <div className="slot-overlay" onClick={() => setActiveSlot(null)}>
          <div className="slot-modal" onClick={(e) => e.stopPropagation()}>
            <div className="slot-modal-header">
              <div>
                <h2>Collect payment</h2>
                <div className="sub">{activeSlot.vehicle_number} · Slot {activeSlot.slot_label}</div>
              </div>
              <button className="btn-close" onClick={() => setActiveSlot(null)} aria-label="Close">
                <FaTimes />
              </button>
            </div>

            <div className="slot-modal-body">
              <div className="pay-summary">
                <div className="pay-stat">
                  <p className="lbl">Total fare</p>
                  <p className="val">₹{totalDue(activeSlot).toFixed(2)}</p>
                </div>
                <div className="pay-stat paid">
                  <p className="lbl">Paid so far</p>
                  <p className="val">₹{activeSlot.amount_paid.toFixed(2)}</p>
                </div>
                <div className="pay-stat due" style={{ gridColumn: '1 / -1' }}>
                  <p className="lbl">Balance due</p>
                  <p className="val">₹{balanceDue(activeSlot).toFixed(2)}</p>
                </div>
              </div>

              {balanceDue(activeSlot) > 0 ? (
                <>
                  <div className="field">
                    <label>Add payment amount</label>
                    <div className="amount-input-wrap">
                      <FaRupeeSign />
                      <input
                        type="number"
                        min="1"
                        max={balanceDue(activeSlot)}
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        placeholder={balanceDue(activeSlot).toFixed(2)}
                      />
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button className="btn-add-money" onClick={addPayment}>Add money</button>
                    <button className="btn-mark-paid" onClick={markFullyPaid}>Mark fully paid</button>
                  </div>
                </>
              ) : (
                <div className="fully-paid-note">
                  <FaCheckCircle /> This booking is fully paid.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Slots;
