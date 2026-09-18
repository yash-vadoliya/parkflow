// MapPicker.js
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaCrosshairs } from 'react-icons/fa';

// Fix Leaflet's default marker icons, which break under bundlers like webpack/CRA
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// A custom amber pin so it matches the ParkFlow theme instead of Leaflet's default blue
const sodiumIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z" fill="#ffb020"/>
      <circle cx="16" cy="16" r="6.5" fill="#14171c"/>
    </svg>
  `),
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -38],
});

const parkingIcon = L.divIcon({
  className: 'parkflow-parking-icon',
  html: '<span>🅿</span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18],
});

function ClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOnChange({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

/**
 * Reusable map picker.
 *
 * Props:
 * - latitude, longitude: number | '' — current selected coordinates
 * - onChange(lat, lng): called whenever the user clicks the map or drags the pin
 * - height: CSS height of the map (default 260px)
 * - zoom: initial zoom level (default 12 if a location is set, else 5 for all-India view)
 * - readOnly: if true, disables click/drag selection (view-only mode)
 */
function MapPicker({ latitude, longitude, onChange, height = 260, zoom, readOnly = false, markers = [], userLocation = null }) {
  const hasLocation = latitude !== '' && longitude !== '' && latitude != null && longitude != null;
  const center = hasLocation ? [Number(latitude), Number(longitude)] : [22.9734, 78.6569]; // center of India
  const initialZoom = zoom || (hasLocation ? 13 : 5);
  const markerRef = useRef(null);

  const handleSelect = (lat, lng) => {
    if (readOnly) return;
    onChange(Number(lat.toFixed(7)), Number(lng.toFixed(7)));
  };

  return (
    <div className="map-picker-wrap" style={{ height }}>
      <style>{`
        .map-picker-wrap {
          position: relative;
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .map-picker-wrap .leaflet-container {
          width: 100%;
          height: 100%;
          background: #14171c;
          font-family: 'Inter', sans-serif;
        }

        .map-picker-wrap .parkflow-parking-icon {
          background: #ffb020;
          border: 3px solid #14171c;
          border-radius: 50%;
          color: #14171c;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 8px rgba(0,0,0,.45);
          font-size: 21px;
          font-weight: 900;
        }

        .map-picker-wrap .leaflet-control-attribution {
          background: rgba(20,23,28,0.7) !important;
          color: #9195a0 !important;
          font-size: 10px !important;
        }

        .map-picker-wrap .leaflet-control-attribution a {
          color: #ffb020 !important;
        }

        .map-picker-wrap .leaflet-control-zoom a {
          background: rgba(28,32,41,0.9) !important;
          color: #f2f3f5 !important;
          border-color: rgba(255,255,255,0.08) !important;
        }

        .map-picker-wrap .leaflet-control-zoom a:hover {
          background: rgba(255,176,32,0.15) !important;
          color: #ffb020 !important;
        }

        .no-location-hint {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(20,23,28,0.85);
          backdrop-filter: blur(8px);
          color: #f2f3f5;
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 1000;
          pointer-events: none;
          max-width: 90%;
          text-align: center;
          white-space: normal;
        }

        /* Larger touch targets for zoom controls on phones/tablets,
           since Leaflet's default 26px buttons are too small to tap reliably. */
        @media (max-width: 640px) {
          .map-picker-wrap .leaflet-control-zoom a {
            width: 34px !important;
            height: 34px !important;
            line-height: 34px !important;
            font-size: 18px !important;
          }
          .no-location-hint {
            font-size: 11px;
            padding: 5px 10px;
          }
        }
      `}</style>

      <MapContainer
        center={center}
        zoom={initialZoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
        />

        {!readOnly && <ClickHandler onSelect={handleSelect} />}
        <RecenterOnChange lat={hasLocation ? Number(latitude) : null} lng={hasLocation ? Number(longitude) : null} />

        {hasLocation && (
          <Marker
            position={center}
            icon={sodiumIcon}
            draggable={!readOnly}
            ref={markerRef}
            eventHandlers={{
              dragend: () => {
                const marker = markerRef.current;
                if (marker) {
                  const pos = marker.getLatLng();
                  handleSelect(pos.lat, pos.lng);
                }
              },
            }}
          />
        )}

        {userLocation && (
          <Marker position={[Number(userLocation.latitude), Number(userLocation.longitude)]}>
            <Tooltip permanent direction="top">Your location</Tooltip>
          </Marker>
        )}

        {markers.map((place) => {
          const lat = Number(place.latitude);
          const lng = Number(place.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          return (
            <Marker key={place.id} position={[lat, lng]} icon={parkingIcon}>
              <Popup>
                <strong>{place.name}</strong><br />
                {place.address || place.area_name || place.city_name || 'Parking plot'}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {!hasLocation && !readOnly && (
        <div className="no-location-hint">
          <FaCrosshairs /> Click the map to drop a pin
        </div>
      )}
    </div>
  );
}

export default MapPicker;
