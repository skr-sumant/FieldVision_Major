import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Leaflet Icons using Inline SVGs
const salesRepIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="%233b82f6" stroke="%23ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

const visitIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="%2310b981" stroke="%23ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

export default function LiveMap({ salesReps = [], visits = [] }) {
  // Center of Western India (Mumbai region)
  const defaultCenter = [19.0760, 72.8777];

  // Route lines coordinates
  const safeVisits = Array.isArray(visits) ? visits : [];
  const routePoints = safeVisits
    .filter(v => v && v.gpsLocation && v.gpsLocation.lat)
    .map(v => [v.gpsLocation.lat, v.gpsLocation.lng]);

  return (
    <div style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
      <MapContainer center={defaultCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route Line connecting visits */}
        {routePoints.length > 1 && (
          <Polyline positions={routePoints} color="#3b82f6" weight={4} opacity={0.7} dashArray="8, 8" />
        )}

        {/* Sales Representatives Live Markers */}
        {salesReps.map((rep) => {
          if (!rep.liveLocation) return null;
          return (
            <Marker
              key={rep.id}
              position={[rep.liveLocation.lat, rep.liveLocation.lng]}
              icon={salesRepIcon}
            >
              <Popup>
                <div style={{ color: '#0f172a', padding: '4px' }}>
                  <strong style={{ fontSize: '0.95rem' }}>👨‍💼 {rep.name}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#475569', margin: '4px 0' }}>
                    Status: <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{rep.status}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem' }}>📍 {rep.liveLocation.address}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                    Target: {rep.dailyTarget} visits/day
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Visited Shops Markers */}
        {visits.map((visit) => {
          if (!visit.gpsLocation || !visit.gpsLocation.lat) return null;
          return (
            <Marker
              key={visit.id}
              position={[visit.gpsLocation.lat, visit.gpsLocation.lng]}
              icon={visitIcon}
            >
              <Popup>
                <div style={{ color: '#0f172a', padding: '4px' }}>
                  <strong style={{ fontSize: '0.95rem' }}>🏪 {visit.shopName}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    Owner: {visit.customerName} ({visit.phone})
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 'bold', margin: '4px 0' }}>
                    Order Value: ₹{Number(visit.orderAmount).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Rep: {visit.repName} | Status: {visit.status}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
