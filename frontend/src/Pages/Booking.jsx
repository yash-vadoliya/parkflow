// Booking.js
import React, { useEffect, useState } from 'react';
import {
  FaCar, FaMotorcycle, FaParking, FaClipboardList, FaArrowLeft,
  FaCheckCircle, FaCalendarAlt, FaMapMarkerAlt, FaMoneyBillWave,
  FaIdCard, FaRupeeSign,
  FaCrosshairs, FaClock, FaSearch, FaPlus,
} from 'react-icons/fa';
import { apiRequest } from '../apiClient';
import { loadParkingReferenceData } from '../liveParkingData';
import MapPicker from '../Components/MapPicker';

const emptyBooking = {
  city_id: '', plot_id: '', vehicle_id: '', vehicle_type_id: '1', vehicle_number: '',
  booking_mode: 'online', scheduled_checkin: '', scheduled_checkout: '',
  payment_mode: 'online', is_monthly_pass: false,
};

const emptyRequest = {
  requested_name: '', city_id: '', area_id: '', address: '',
};

const distanceBetween = (from, to) => {
  const earthRadiusKm = 6371;
  const toRadians = (value) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(from.latitude))
    * Math.cos(toRadians(to.latitude))
    * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

function Booking() {
  const [mode, setMode] = useState('choose'); // choose | nearby | booking | request
  const [bookingForm, setBookingForm] = useState(emptyBooking);
  const [requestForm, setRequestForm] = useState(emptyRequest);
  const [toast, setToast] = useState(null);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [nearbyPlots, setNearbyPlots] = useState([]);
  const [detectedArea, setDetectedArea] = useState('');
  const [detectedCity, setDetectedCity] = useState('');
  const [showPlots, setShowPlots] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ vehicle_number: '', vehicle_type: 'car' });
  const [bookingBusy, setBookingBusy] = useState(false);

  useEffect(() => {
    apiRequest('/vehicle')
      .then((payload) => setVehicles(payload.data || []))
      .catch((error) => {
        setVehicles([]);
        showToast(error.message || 'Vehicles could not be loaded.');
      })
      .finally(() => setVehiclesLoading(false));
  }, []);

  useEffect(() => {
    loadParkingReferenceData()
      .then(({ cities: liveCities, areas: liveAreas, plots: livePlots }) => {
        setCities(liveCities);
        setAreas(liveAreas);
        setPlots(livePlots.filter((plot) => plot.approved));
        setBookingForm((current) => ({ ...current, city_id: String(liveCities[0]?.id || ''), plot_id: String(livePlots.find((plot) => plot.approved)?.id || '') }));
        const firstCityId = String(liveCities[0]?.id || '');
        const firstArea = liveAreas.find((area) => String(area.city_id) === firstCityId);
        setRequestForm((current) => ({
          ...current,
          city_id: firstCityId,
          area_id: String(firstArea?.id || ''),
        }));
      })
      .catch((error) => setLoadError(error.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Resolve the city first so a plot from another city can never be selected.
    if (!userLocation || !plots.length) return;
    // Wait for reverse geocoding before filtering. This prevents the initial
    // render from briefly showing plots from every city.
    if (!detectedCity) {
      setNearbyPlots([]);
      return;
    }

    const cityPlots = detectedCity
      ? plots.filter((plot) => String(plot.city_name || '').trim().toLowerCase() === detectedCity.trim().toLowerCase())
      : plots;

    const plotsWithDistance = cityPlots
      .map((plot) => {
        const latitude = Number(plot.latitude);
        const longitude = Number(plot.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
        return {
          ...plot,
          distanceKm: distanceBetween(userLocation, { latitude, longitude }),
        };
      })
      .filter(Boolean)
      .sort((first, second) => first.distanceKm - second.distanceKm);

    setNearbyPlots(plotsWithDistance);
    if (plotsWithDistance[0]) {
      setBookingForm((current) => ({
        ...current,
        city_id: String(plotsWithDistance[0].city_id || ''),
        plot_id: String(plotsWithDistance[0].id),
      }));
    }
  }, [userLocation, plots, detectedCity]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const resetAll = () => {
    setBookingForm(emptyBooking);
    setRequestForm(emptyRequest);
    setMode('choose');
  };

  const locateUser = () => {
    // Location must be obtained before choosing a plot so we never show distant plots.
    setLocationStatus('loading');
    setUserLocation(null);
    setDetectedArea('');
    setDetectedCity('');
    setNearbyPlots([]);
    setShowPlots(false);

    if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      setLocationStatus('insecure');
      return;
    }

    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = { latitude: coords.latitude, longitude: coords.longitude };
        setUserLocation(location);
        setDetectedArea('Detecting area name…');
        setLocationStatus('success');
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.latitude}&lon=${location.longitude}&zoom=18&addressdetails=1`)
          .then((response) => response.ok ? response.json() : Promise.reject(new Error('Reverse geocoding failed')))
          .then((result) => {
            const address = result.address || {};
            const city = address.city || address.town || address.municipality || address.village || '';
            setDetectedCity(city);
            setDetectedArea(address.suburb || address.neighbourhood || address.village || address.town || address.city_district || city || 'Area name unavailable');
          })
          .catch(() => setDetectedArea('Area name unavailable'));
      },
      (error) => setLocationStatus(error.code === 1 ? 'denied' : 'error'),
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 60000 },
    );
  };

  const startBooking = () => {
    setMode('nearby');
    locateUser();
  };

  const selectMapLocation = (latitude, longitude) => {
    const location = { latitude, longitude };
    setUserLocation(location);
    setDetectedCity('');
    setDetectedArea('Resolving selected location…');
    setLocationStatus('success');
    setShowPlots(false);
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Reverse geocoding failed')))
      .then((result) => {
        const address = result.address || {};
        const city = address.city || address.town || address.municipality || address.village || '';
        setDetectedCity(city);
        setDetectedArea(address.suburb || address.neighbourhood || address.village || address.town || address.city_district || city || 'Selected map location');
      })
      .catch(() => setDetectedArea('Selected map location'));
  };

  const choosePlot = (plot) => {
    setBookingForm((current) => ({
      ...current,
      city_id: String(plot.city_id || ''),
      plot_id: String(plot.id),
    }));
    setMode('booking');
  };

  // Once a location is selected, never fall back to the global plot list.
  const plotsToShow = userLocation ? nearbyPlots : (showPlots ? plots : []);
  const mapPlots = userLocation ? nearbyPlots : (showPlots ? plots : []);
  const findParkingSpots = () => {
    setShowPlots(true);
    setLocationStatus('manual');
    setNearbyPlots([]);
  };

  const plotImage = (plot) => plot.images?.find((image) => image.is_cover)?.image_url || plot.images?.[0]?.image_url || '/logo192.png';
  const plotRates = (plot) => plot.rates?.length ? plot.rates : [
    { vehicle_type_id: 1, rate_per_hour: 40 },
    { vehicle_type_id: 2, rate_per_hour: 20 },
  ];

  const selectedPlot = [...plots, ...nearbyPlots].find((plot) => String(plot.id) === String(bookingForm.plot_id));
  const selectedRate = plotRates(selectedPlot || {}).find((rate) => String(rate.vehicle_type_id) === String(bookingForm.vehicle_type_id));
  const bookingStart = new Date(bookingForm.scheduled_checkin);
  const bookingEnd = new Date(bookingForm.scheduled_checkout);
  const bookingDuration = bookingEnd > bookingStart ? (bookingEnd - bookingStart) / (1000 * 60 * 60) : 0;
  const billableHours = bookingDuration > 0 ? Math.ceil(bookingDuration) : 0;
  const totalCharge = billableHours * Number(selectedRate?.rate_per_hour || 0);

  const createBooking = async () => {
    const start = new Date(bookingForm.scheduled_checkin);
    const end = new Date(bookingForm.scheduled_checkout);
    const hours = (end - start) / (1000 * 60 * 60);
    const totalAmount = Math.max(0, Math.ceil(hours) * Number(selectedRate?.rate_per_hour || 0));

    const result = await apiRequest('/booking', {
      method: 'POST',
      body: JSON.stringify({
        vehicle_id: bookingForm.vehicle_id || undefined,
        vehicle_number: bookingForm.vehicle_number,
        vehicle_type: bookingForm.vehicle_type_id === '1' ? 'car' : 'bike',
        plot_id: Number(bookingForm.plot_id),
        start_time: bookingForm.scheduled_checkin,
        end_time: bookingForm.scheduled_checkout,
        total_amount: totalAmount,
      }),
    });
    showToast(`Booking ${result.booking_ref || ''} created successfully`);
    setMode('choose');
    setBookingForm(emptyBooking);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    const start = new Date(bookingForm.scheduled_checkin);
    const end = new Date(bookingForm.scheduled_checkout);
    const hours = (end - start) / (1000 * 60 * 60);

    if (!bookingForm.vehicle_id) {
      showToast('Select or add one of your vehicles before booking.');
      return;
    }
    if (!bookingForm.plot_id || !Number.isFinite(hours) || hours <= 0) {
      showToast('Choose a parking plot and a valid check-in/check-out time.');
      return;
    }

    try {
      setBookingBusy(true);
      await createBooking();
    } catch (error) {
      showToast(error.message);
    } finally {
      setBookingBusy(false);
    }
  };
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleForm.vehicle_number.trim()) {
      showToast('Enter a vehicle number.');
      return;
    }
    try {
      const result = await apiRequest('/vehicle', {
        method: 'POST',
        body: JSON.stringify(vehicleForm),
      });
      const vehicle = result.data;
      setVehicles((current) => [vehicle, ...current]);
      setBookingForm((current) => ({
        ...current,
        vehicle_id: String(vehicle.vehicle_id),
        vehicle_number: vehicle.vehicle_number,
        vehicle_type_id: vehicle.vehicle_type === 'bike' ? '2' : '1',
      }));
      setVehicleForm({ vehicle_number: '', vehicle_type: 'car' });
      setShowAddVehicle(false);
      showToast('Vehicle added successfully');
    } catch (error) {
      showToast(error.message);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/parkingplot', { method: 'POST', body: JSON.stringify({ plot_name: requestForm.requested_name, address: requestForm.address, area_id: requestForm.area_id, approved: false }) });
      showToast(`Request for "${requestForm.requested_name}" submitted`);
      resetAll();
    } catch (error) {
      showToast(error.message);
    }
  };

  const selectedRequestCity = cities.find((city) => String(city.id) === String(requestForm.city_id));
  const selectedRequestArea = areas.find((area) => String(area.id) === String(requestForm.area_id));

  return (
    <div className="bk-page">
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

  .bk-page {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: var(--deck);
    color: var(--ink);
    min-height: 100vh;
    /* Keep the content below the fixed site header and centered in the page. */
    padding: 132px 24px 96px;
    overflow-x: hidden;
  }

  .bk-inner {
    width: min(100%, 980px);
    margin: 0 auto;
  }

  .bk-header {
    text-align: center;
    max-width: 680px;
    margin: 0 auto 44px;
  }

  .plate-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.15em;
    color: var(--deck);
    background: var(--sodium);
    padding: 4px 12px;
    border-radius: 5px;
    margin-bottom: 16px;
  }

  .bk-header h1 {
    font-size: 30px;
    font-weight: 800;
    margin: 0 0 10px;
  }

  .bk-header p {
    color: var(--muted);
    font-size: 15px;
    max-width: 480px;
    margin: 0 auto;
    line-height: 1.6;
  }

  /* ---------- Choice cards ---------- */
  .choice-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    max-width: 780px;
    margin: 0 auto;
    opacity: 0;
    transform: translateY(16px);
    animation: riseIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
  }

  @keyframes riseIn {
    to { opacity: 1; transform: translateY(0); }
  }

  .choice-card {
    background: var(--deck-panel);
    border: 1px solid var(--deck-line);
    border-radius: 18px;
    padding: 30px 24px;
    cursor: pointer;
    text-align: left;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    min-width: 0;
  }

  .choice-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 24px rgba(0,0,0,0.25);
    border-color: var(--sodium);
  }

  .choice-icon {
    width: 50px;
    height: 50px;
    border-radius: 14px;
    background: rgba(255,176,32,0.12);
    color: var(--sodium);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    margin-bottom: 18px;
  }

  .choice-card h3 {
    font-size: 17px;
    font-weight: 700;
    margin: 0 0 8px;
  }

  .choice-card p {
    font-size: 13px;
    color: var(--muted);
    line-height: 1.6;
    margin: 0;
  }

  .choice-card .go-arrow {
    margin-top: 16px;
    font-size: 13px;
    font-weight: 700;
    color: var(--sodium);
  }

  /* ---------- Form shell ---------- */
  .form-shell {
    background: var(--deck-panel);
    border: 1px solid var(--deck-line);
    border-radius: 18px;
    padding: 32px;
    max-width: 780px;
    margin: 0 auto;
    opacity: 0;
    transform: translateY(16px);
    animation: riseIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards;
  }

  .btn-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 22px;
    padding: 0;
    transition: color 0.2s ease, transform 0.2s ease;
  }

  .btn-back:hover {
    color: var(--sodium);
    transform: translateX(-3px);
  }

  .form-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 26px;
  }

  .form-title-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: rgba(255,176,32,0.12);
    color: var(--sodium);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }

  .form-title h2 {
    font-size: 19px;
    font-weight: 800;
    margin: 0 0 2px;
  }

  .form-title p {
    font-size: 12px;
    color: var(--muted);
    margin: 0;
  }

  .location-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--muted);
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--deck-line);
    border-radius: 9px;
    padding: 11px 13px;
    margin: -8px 0 22px;
    font-size: 12px;
  }

  .location-banner svg { color: var(--sodium); flex-shrink: 0; }
  .location-banner.success { color: var(--go); border-color: rgba(43,181,131,0.35); }
  .location-banner.success svg { color: var(--go); }
  .location-banner.error { color: var(--stop); border-color: rgba(226,83,74,0.35); }
  .location-banner.error svg { color: var(--stop); }

  .plot-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
    margin-top: 8px;
  }

  .map-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin: 18px 0 10px; color: var(--muted); font-size: 12px; }
  .map-toolbar span { display: inline-flex; align-items: center; gap: 7px; }
  .map-toolbar svg { color: var(--sodium); }
  .locate-btn { display: inline-flex; align-items: center; gap: 7px; border: 1px solid rgba(255,176,32,.5); border-radius: 8px; padding: 8px 11px; background: rgba(255,176,32,.1); color: var(--sodium); cursor: pointer; font: inherit; font-weight: 700; }
  .find-spots-btn { display: inline-flex; align-items: center; gap: 7px; margin: 10px 0 0 8px; border: 0; border-radius: 8px; padding: 9px 12px; background: var(--sodium); color: var(--deck); cursor: pointer; font: inherit; font-size: 12px; font-weight: 800; }
  .map-coordinate-note { color: var(--muted); font-size: 11px; line-height: 1.5; margin: 8px 0 18px; }
  .plot-card { overflow: hidden; background: rgba(255,255,255,.035); border: 1px solid var(--deck-line); border-radius: 14px; transition: transform .2s ease, border-color .2s ease; }
  .plot-card:hover { transform: translateY(-3px); border-color: var(--sodium); }
  .plot-card-image { display: block; width: 100%; height: 145px; object-fit: cover; background: #252a33; }
  .plot-card-body { padding: 15px; }
  .plot-card-heading { display: flex; justify-content: space-between; gap: 8px; }
  .plot-card-heading h3 { margin: 0 0 6px; font-size: 15px; color: var(--ink); }
  .plot-card-heading p { display: flex; gap: 5px; margin: 0; color: var(--muted); font-size: 11px; line-height: 1.45; }
  .plot-card-heading p svg { color: var(--sodium); flex-shrink: 0; margin-top: 2px; }
  .plot-card-meta, .plot-rates { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 13px; color: var(--muted); font-size: 11px; }
  .plot-card-meta span, .plot-rates span { display: inline-flex; align-items: center; gap: 4px; }
  .plot-card-meta svg, .plot-rates svg { color: var(--sodium); }
  .plot-rates { color: var(--go); padding-top: 10px; border-top: 1px solid var(--deck-line); }
  .plot-rate-value { font-size: 17px; font-weight: 900; letter-spacing: .01em; text-shadow: 0 2px 8px rgba(43,181,131,.35); }
  .plot-rate-label { font-size: 13px; font-weight: 700; color: var(--ink); text-shadow: 0 1px 5px rgba(242,243,245,.28); }
  .plot-card-cta { width: 100%; display: flex; justify-content: space-between; margin-top: 15px; padding: 10px 12px; border: 0; border-radius: 8px; background: var(--sodium); color: var(--deck); cursor: pointer; font: inherit; font-weight: 800; }
  .plot-card-cta span { font-size: 17px; line-height: 12px; }
  .booking-map-block { margin-bottom: 20px; }

  .plot-choice {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 14px;
    text-align: left;
    color: var(--ink);
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--deck-line);
    border-radius: 10px;
    cursor: pointer;
    font-family: inherit;
    transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
  }

  .plot-choice:hover {
    border-color: var(--sodium);
    background: rgba(255,176,32,0.08);
    transform: translateY(-1px);
  }

  .plot-choice-name { font-size: 14px; font-weight: 700; }
  .plot-choice-address { color: var(--muted); font-size: 12px; margin-top: 3px; }
  .plot-choice-distance { color: var(--go); font-size: 12px; font-weight: 700; white-space: nowrap; }
  .plot-empty { color: var(--muted); font-size: 13px; padding: 12px 0; }

  .user-location {
    color: var(--muted);
    background: rgba(43,181,131,0.07);
    border: 1px solid rgba(43,181,131,0.22);
    border-radius: 9px;
    padding: 10px 12px;
    margin-bottom: 14px;
    font-size: 12px;
    line-height: 1.5;
  }

  .user-location strong { color: var(--go); }
  .retry-location {
    margin-top: 10px;
    padding: 8px 12px;
    border: 1px solid rgba(226,83,74,0.4);
    border-radius: 7px;
    color: var(--stop);
    background: transparent;
    cursor: pointer;
    font: inherit;
    font-size: 12px;
  }

  .field { margin-bottom: 16px; }

  .field label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 6px;
  }

  .field label svg { color: var(--sodium); font-size: 11px; }

  .vehicle-field-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .vehicle-field-heading label { margin-bottom: 6px; }
  .add-vehicle-btn, .save-vehicle-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid rgba(255,176,32,0.45);
    border-radius: 7px;
    padding: 7px 10px;
    color: var(--sodium);
    background: rgba(255,176,32,0.08);
    font: inherit;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }
  .add-vehicle-btn:hover, .save-vehicle-btn:hover { background: rgba(255,176,32,0.16); }
  .vehicle-empty { padding: 12px; border: 1px dashed var(--deck-line); border-radius: 9px; color: var(--muted); font-size: 13px; }
  .selected-rate { margin-top: 9px; color: var(--go); font-size: 13px; }
  .charge-summary { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin: 22px 0; padding: 22px 24px; min-height: 112px; border: 1px solid rgba(255,176,32,.42); border-radius: 14px; background: linear-gradient(135deg, rgba(255,176,32,.14), rgba(255,176,32,.04)); box-shadow: 0 12px 28px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.05); }
  .charge-summary-label { margin: 0; color: var(--sodium); font-size: 16px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
  .charge-summary-note { margin: 8px 0 0; color: var(--muted); font-size: 13px; }
  .charge-summary-amount { color: var(--ink); font-size: 36px; line-height: 1; font-weight: 900; letter-spacing: -.03em; text-shadow: 0 3px 12px rgba(255,176,32,.4); white-space: nowrap; }
  .add-vehicle-form { display: grid; grid-template-columns: 1.5fr .8fr auto; gap: 8px; margin-top: 10px; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--deck-line); border-radius: 9px; }
  .add-vehicle-form input, .add-vehicle-form select { min-width: 0; }
  .save-vehicle-btn { justify-content: center; color: var(--deck); background: var(--sodium); border-color: var(--sodium); }

  .field input, .field select, .field textarea {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--deck-line);
    color: var(--ink);
    padding: 11px 13px;
    border-radius: 9px;
    font-size: 14px;
    outline: none;
    font-family: inherit;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    color-scheme: dark;
  }

  .field input:focus, .field select:focus, .field textarea:focus {
    border-color: transparent;
    box-shadow: 0 0 0 3px rgba(255,176,32,0.18);
  }

  .field select option {
    background: var(--deck-panel);
    color: var(--ink);
  }

  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .selected-location {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: -2px 0 18px;
    padding: 10px 12px;
    border: 1px solid rgba(43,181,131,0.28);
    border-radius: 9px;
    background: rgba(43,181,131,0.08);
    color: var(--muted);
    font-size: 12px;
  }

  .selected-location svg { color: var(--go); }
  .selected-location strong { color: var(--ink); }

  .vt-toggle {
    display: flex;
    gap: 10px;
  }

  .vt-option {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--deck-line);
    color: var(--muted);
    padding: 12px;
    border-radius: 9px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
  }

  .vt-option.selected {
    border-color: var(--sodium);
    color: var(--sodium);
    background: rgba(255,176,32,0.08);
  }

  .mode-toggle {
    display: flex;
    gap: 10px;
  }

  .mode-option {
    flex: 1;
    text-align: center;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--deck-line);
    color: var(--muted);
    padding: 10px;
    border-radius: 9px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
  }

  .mode-option.selected {
    border-color: var(--go);
    color: var(--go);
    background: rgba(43,181,131,0.08);
  }

  .checkbox-row {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--deck-line);
    border-radius: 9px;
    padding: 12px 14px;
    margin-bottom: 20px;
    cursor: pointer;
  }

  .checkbox-row input {
    width: 16px;
    height: 16px;
    accent-color: var(--sodium);
    cursor: pointer;
    flex-shrink: 0;
  }

  .checkbox-row span {
    font-size: 13px;
    color: var(--ink);
  }

  .btn-submit {
    width: 100%;
    background: var(--sodium);
    color: var(--deck);
    border: none;
    padding: 14px;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    margin-top: 6px;
    transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  }

  .btn-submit:hover {
    background: #ffc250;
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(255,176,32,0.3);
  }

  /* ---------- Toast ---------- */
  .toast {
    position: fixed;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(28,32,41,0.95);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(43,181,131,0.4);
    color: var(--go);
    font-size: 14px;
    font-weight: 600;
    padding: 13px 22px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 12px 30px rgba(0,0,0,0.35);
    z-index: 300;
    max-width: 90vw;
    text-align: center;

    opacity: 0;
    animation: toastIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards,
               toastOut 0.3s ease 2.7s forwards;
  }


  @keyframes toastIn {
    from { opacity: 0; transform: translate(-50%, 12px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }

  @keyframes toastOut {
    to { opacity: 0; transform: translate(-50%, 12px); }
  }

  @media (prefers-reduced-motion: reduce) {
    .choice-grid, .form-shell, .toast, .choice-card, .btn-back {
      animation: none !important; transition: none !important;
    }
  }

  /* ---------- Tablet ---------- */
  @media (max-width: 900px) {
    .bk-page { padding: 116px 20px 80px; }
    .form-shell { padding: 28px; }
  }

  /* ---------- Phone ---------- */
  @media (max-width: 640px) {
    .bk-page { padding: 104px 16px 64px; }
    .bk-header h1 { font-size: 24px; }
    .bk-header p { font-size: 13px; }
    .choice-grid { grid-template-columns: 1fr; }
    .field-row { grid-template-columns: 1fr; }
    .form-shell { padding: 22px 18px; }
    .vt-toggle, .mode-toggle { flex-direction: column; }
    .add-vehicle-form { grid-template-columns: 1fr; }
    .toast { bottom: 18px; padding: 11px 16px; font-size: 13px; }
    .map-toolbar { align-items: flex-start; flex-direction: column; }
  }

  /* ---------- Small phone ---------- */
  @media (max-width: 380px) {
    .choice-card { padding: 24px 18px; }
    .form-title { gap: 10px; }
    .form-title-icon { width: 36px; height: 36px; font-size: 15px; }
    .form-title h2 { font-size: 16px; }
  }
`}</style>
      <div className="bk-inner">
        <div className="bk-header">
          <div className="plate-chip">PARKFLOW BOOKING</div>
          <h1>Book a spot or list your own</h1>
          <p>
            Reserve a parking slot at a live facility near you, or if you own
            unused space, request to have it listed as a new ParkFlow facility.
          </p>
        </div>

        {mode === 'choose' && (
          <div className="choice-grid">
            <button type="button" className="choice-card" onClick={startBooking}>
              <div className="choice-icon"><FaParking /></div>
              <h3>Book a parking slot</h3>
              <p>Reserve a car or bike slot at an existing ParkFlow facility for a specific time window.</p>
              <div className="go-arrow">Start booking →</div>
            </button>

            <button type="button" className="choice-card" onClick={() => setMode('request')}>
              <div className="choice-icon"><FaClipboardList /></div>
              <h3>Request a new parking plot</h3>
              <p>Own land or a building with unused parking? Submit it for review to go live on ParkFlow.</p>
              <div className="go-arrow">Submit request →</div>
            </button>
          </div>
        )}

        {mode === 'nearby' && (
          <div className="form-shell">
            <button type="button" className="btn-back" onClick={resetAll}>
              <FaArrowLeft /> Back to options
            </button>

            <div className="form-title">
              <div className="form-title-icon"><FaMapMarkerAlt /></div>
              <div>
                <h2>Choose a parking plot</h2>
                <p>Tap a plot to continue with your booking</p>
              </div>
            </div>

            <div className={`location-banner ${locationStatus}`}>
              <FaMapMarkerAlt />
              {locationStatus === 'loading' && 'Finding your location… Showing all approved plots meanwhile.'}
              {locationStatus === 'success' && nearbyPlots.length > 0 && `Nearest parking plot found (${nearbyPlots[0].distanceKm.toFixed(1)} km away).`}
              {locationStatus === 'success' && nearbyPlots.length === 0 && `No approved parking plot with valid coordinates is available in ${detectedCity || 'your city'}.`}
              {(locationStatus === 'error' || locationStatus === 'denied') && <>Location permission was unavailable.<br /><button type="button" className="retry-location" onClick={locateUser}>Try location again</button></>}
              {locationStatus === 'insecure' && <>Mobile browsers require HTTPS to use live location. You can choose plots manually below.</>}
              {!userLocation && <button type="button" className="find-spots-btn" onClick={findParkingSpots}><FaSearch /> Find parking spots</button>}
              {locationStatus === 'idle' && 'Allow location access to find the nearest parking plot.'}
            </div>

            {userLocation && (
              <div className="user-location">
                <strong>Your location:</strong> {detectedArea || 'Detecting area…'}<br />
                {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
              </div>
            )}

            <div className="map-toolbar">
              <span><FaMapMarkerAlt /> Pick a location on the map or use your live location</span>
              <button type="button" className="locate-btn" onClick={locateUser}><FaCrosshairs /> Use live location</button>
            </div>
            <MapPicker
              latitude={userLocation?.latitude ?? ''}
              longitude={userLocation?.longitude ?? ''}
              onChange={selectMapLocation}
              markers={mapPlots}
              userLocation={userLocation}
              height={340}
            />

            {loading && <div className="plot-empty">Loading parking plots…</div>}
            {!loading && loadError && <div className="plot-empty">Unable to load parking plots: {loadError}</div>}
            {!loading && !loadError && (
              <div className="plot-list">
                {plotsToShow.map((plot) => (
                  <article className="plot-card" key={plot.id}>
                    <img className="plot-card-image" src={plotImage(plot)} alt={plot.name} onError={(e) => { e.currentTarget.src = '/logo192.png'; }} />
                    <div className="plot-card-body">
                      <div className="plot-card-heading">
                        <div><h3>{plot.name}</h3><p><FaMapMarkerAlt /> {plot.address || plot.area_name || plot.city_name || 'Address not available'}</p></div>
                        {plot.distanceKm != null && <span className="plot-choice-distance">{plot.distanceKm.toFixed(1)} km</span>}
                      </div>
                      <div className="plot-card-meta"><span><FaCar /> {plot.total_car_slots ?? '—'} car</span><span><FaMotorcycle /> {plot.total_bike_slots ?? '—'} bike</span><span><FaClock /> Open parking</span></div>
                      <div className="plot-rates">{plotRates(plot).map((rate) => <span key={rate.vehicle_type_id} className="plot-rate-item"><FaRupeeSign /> <strong className="plot-rate-value">{Number(rate.rate_per_hour).toFixed(2)}/hr</strong> <span className="plot-rate-label">{Number(rate.vehicle_type_id) === 1 ? 'Car' : 'Bike'}</span></span>)}</div>
                      <button type="button" className="plot-card-cta" onClick={() => choosePlot(plot)}>Book this plot <span>→</span></button>
                    </div>
                  </article>
                ))}
                {!plotsToShow.length && locationStatus !== 'loading' && <div className="plot-empty">No nearest parking plot is available for your location.</div>}
              </div>
            )}
          </div>
        )}

        {mode === 'booking' && (
          <div className="form-shell">
            <button type="button" className="btn-back" onClick={resetAll}>
              <FaArrowLeft /> Back to options
            </button>

            <div className="form-title">
              <div className="form-title-icon"><FaParking /></div>
              <div>
                <h2>Book a parking slot</h2>
                <p>Fill in your vehicle and schedule details</p>
              </div>
            </div>

            <div className={`location-banner ${locationStatus}`}>
              <FaMapMarkerAlt />
              {locationStatus === 'loading' && 'Finding your location and nearest parking plots…'}
              {locationStatus === 'success' && nearbyPlots.length > 0 && `Nearest parking selected (${nearbyPlots[0].distanceKm.toFixed(1)} km away)`}
              {locationStatus === 'success' && nearbyPlots.length === 0 && 'Your location was found, but no parking plot has coordinates yet.'}
              {(locationStatus === 'error' || locationStatus === 'denied') && 'Location permission was unavailable. Choose a parking plot manually.'}
              {locationStatus === 'insecure' && 'Live location requires HTTPS on mobile. Choose parking spots manually.'}
              {locationStatus === 'idle' && 'Allow location access to see parking plots nearest to you.'}
              {!userLocation && <button type="button" className="find-spots-btn" onClick={findParkingSpots}><FaSearch /> Find parking spots</button>}
            </div>

            {userLocation && (
              <div className="user-location">
                <strong>Your location:</strong> {detectedArea || 'Detecting area…'}<br />
                {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
              </div>
            )}

            <div className="booking-map-block">
              <div className="map-toolbar">
                <span><FaMapMarkerAlt /> Booking location</span>
                <button type="button" className="locate-btn" onClick={locateUser}><FaCrosshairs /> Fetch live location</button>
              </div>
              <MapPicker
                latitude={userLocation?.latitude ?? ''}
                longitude={userLocation?.longitude ?? ''}
                onChange={selectMapLocation}
                markers={mapPlots}
                userLocation={userLocation}
                height={300}
              />
              <p className="map-coordinate-note">Click or drag the pin to manually choose a location. The selected latitude and longitude are used to find nearby plots.</p>
            </div>

            <form onSubmit={handleBookingSubmit}>
              <div className="field-row">
                <div className="field">
                  <label><FaMapMarkerAlt />City</label>
                  <select
                    value={bookingForm.city_id}
                    onChange={(e) => {
                      const cityId = e.target.value;
                      const firstPlot = plots.find((p) => String(p.city_id) === cityId);
                      setBookingForm({ ...bookingForm, city_id: cityId, plot_id: firstPlot ? String(firstPlot.id) : '' });
                    }}
                  >
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label><FaParking />Parking plot</label>
                  <select
                    value={bookingForm.plot_id}
                    onChange={(e) => setBookingForm({ ...bookingForm, plot_id: e.target.value })}
                  >
                    {(nearbyPlots.length ? nearbyPlots : plots)
                      .filter((p) => String(p.city_id) === bookingForm.city_id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}{p.distanceKm != null ? ` — ${p.distanceKm.toFixed(1)} km away` : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <div className="vehicle-field-heading">
                  <label><FaIdCard />Your vehicle</label>
                  <button type="button" className="add-vehicle-btn" onClick={() => setShowAddVehicle(!showAddVehicle)}><FaPlus /> Add vehicle</button>
                </div>
                {vehiclesLoading ? <div className="vehicle-empty">Loading your vehicles…</div> : vehicles.length ? <select
                  value={bookingForm.vehicle_id}
                  onChange={(e) => {
                    const vehicle = vehicles.find((item) => String(item.vehicle_id) === e.target.value);
                    setBookingForm({
                      ...bookingForm,
                      vehicle_id: e.target.value,
                      vehicle_number: vehicle?.vehicle_number || '',
                      vehicle_type_id: vehicle?.vehicle_type === 'bike' ? '2' : '1',
                    });
                  }}
                  required
                >
                  <option value="">Select your vehicle</option>
                  {vehicles.map((vehicle) => <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>{vehicle.vehicle_number} · {vehicle.vehicle_type}</option>)}
                </select> : <div className="vehicle-empty">No vehicle saved yet. Add one to continue.</div>}

                {showAddVehicle && <div className="add-vehicle-form">
                  <input value={vehicleForm.vehicle_number} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_number: e.target.value.toUpperCase() })} placeholder="Vehicle number e.g. TS09EF4521" required />
                  <select value={vehicleForm.vehicle_type} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_type: e.target.value })}>
                    <option value="car">Car</option>
                    <option value="bike">Bike</option>
                  </select>
                  <button type="button" className="save-vehicle-btn" onClick={handleAddVehicle}>Save vehicle</button>
                </div>}
                <div className="selected-rate">Vehicle rate: <strong>₹{Number(selectedRate?.rate_per_hour || 0).toFixed(2)} / hour</strong></div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label><FaCalendarAlt />Check-in</label>
                  <input
                    type="datetime-local"
                    value={bookingForm.scheduled_checkin}
                    onChange={(e) => setBookingForm({ ...bookingForm, scheduled_checkin: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label><FaCalendarAlt />Check-out</label>
                  <input
                    type="datetime-local"
                    value={bookingForm.scheduled_checkout}
                    onChange={(e) => setBookingForm({ ...bookingForm, scheduled_checkout: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="charge-summary" aria-live="polite">
                <div>
                  <p className="charge-summary-label">Total charges</p>
                  <p className="charge-summary-note">{billableHours ? `${billableHours} billable hour${billableHours === 1 ? '' : 's'} × ₹${Number(selectedRate?.rate_per_hour || 0).toFixed(2)}/hr` : 'Choose check-in and check-out times'}</p>
                </div>
                <strong className="charge-summary-amount">₹{totalCharge.toFixed(2)}</strong>
              </div>

              <div className="field">
                <label><FaMoneyBillWave />Payment mode</label>
                <div className="mode-toggle">
                  <div
                    className={`mode-option ${bookingForm.payment_mode === 'online' ? 'selected' : ''}`}
                    onClick={() => setBookingForm({ ...bookingForm, payment_mode: 'online' })}
                  >
                    Online
                  </div>
                  <div
                    className={`mode-option ${bookingForm.payment_mode === 'offline' ? 'selected' : ''}`}
                    onClick={() => setBookingForm({ ...bookingForm, payment_mode: 'offline' })}
                  >
                    Offline (pay at gate)
                  </div>
                </div>
              </div>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={bookingForm.is_monthly_pass}
                  onChange={(e) => setBookingForm({ ...bookingForm, is_monthly_pass: e.target.checked })}
                />
                <span>Book this as a monthly pass instead of a single visit</span>
              </label>

              <button type="submit" className="btn-submit" disabled={bookingBusy}>{bookingBusy ? 'Booking…' : 'Confirm booking'}</button>
            </form>
          </div>
        )}

        {mode === 'request' && (
          <div className="form-shell">
            <button type="button" className="btn-back" onClick={resetAll}>
              <FaArrowLeft /> Back to options
            </button>

            <div className="form-title">
              <div className="form-title-icon"><FaClipboardList /></div>
              <div>
                <h2>Request a new parking plot</h2>
                <p>Submit your facility details for admin review</p>
              </div>
            </div>

            <form onSubmit={handleRequestSubmit}>
              <div className="field">
                <label><FaParking />Plot name</label>
                <input
                  value={requestForm.requested_name}
                  onChange={(e) => setRequestForm({ ...requestForm, requested_name: e.target.value })}
                  placeholder="e.g. Kondapur Rooftop Parking"
                  required
                />
              </div>

              <div className="field-row">
                <div className="field">
                  <label><FaMapMarkerAlt />City</label>
                  <select
                    value={requestForm.city_id}
                    onChange={(e) => {
                      const cityId = e.target.value;
                      const firstArea = areas.find((area) => String(area.city_id) === cityId);
                      setRequestForm((current) => ({
                        ...current,
                        city_id: cityId,
                        area_id: firstArea ? String(firstArea.id) : '',
                      }));
                    }}
                  >
                    {!cities.length && <option value="">No cities available</option>}
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Area</label>
                  <select
                    value={requestForm.area_id}
                    onChange={(e) => setRequestForm({ ...requestForm, area_id: e.target.value })}
                    disabled={!requestForm.city_id}
                  >
                    {!areas.some((area) => String(area.city_id) === String(requestForm.city_id)) && (
                      <option value="">No areas available for this city</option>
                    )}
                    {areas.filter((area) => String(area.city_id) === String(requestForm.city_id)).map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="selected-location" aria-live="polite">
                <FaMapMarkerAlt />
                <span>
                  Selected location: <strong>{selectedRequestCity?.name || 'No city selected'}</strong>
                  {' · '}
                  <strong>{selectedRequestArea?.name || 'No area selected'}</strong>
                </span>
              </div>

              <div className="field">
                <label><FaRupeeSign style={{ opacity: 0 }} />Address</label>
                <textarea
                  rows={3}
                  value={requestForm.address}
                  onChange={(e) => setRequestForm({ ...requestForm, address: e.target.value })}
                  placeholder="Full address of the plot"
                />
              </div>

              <button type="submit" className="btn-submit">Submit request</button>
            </form>
          </div>
        )}
      </div>

      {toast && (
        <div className="toast">
          <FaCheckCircle /> {toast}
        </div>
      )}
    </div>
  );
}

export default Booking;
