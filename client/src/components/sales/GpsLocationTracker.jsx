import React, { useState, useEffect } from 'react';
import { MapPin, RefreshCw, Navigation, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getCurrentGpsPosition } from '../../services/GpsService';

export default function GpsLocationTracker({ onLocationCaptured }) {
  const [gps, setGps] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchGpsPosition();
  }, []);

  const fetchGpsPosition = async () => {
    setIsLocating(true);
    setErrorMsg('');

    try {
      const locationData = await getCurrentGpsPosition();
      setGps(locationData);
      setIsLocating(false);
      if (onLocationCaptured) onLocationCaptured(locationData);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to capture GPS position.');
      setIsLocating(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      borderRadius: '14px',
      padding: '16px',
      marginBottom: '16px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'rgba(59, 130, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Navigation size={16} color="#3b82f6" />
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>Live High-Precision Geolocation</h4>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Verified location stamped on visit entry</span>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchGpsPosition}
          className="btn btn-secondary btn-sm"
          disabled={isLocating}
          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
        >
          <RefreshCw size={12} className={isLocating ? 'spin' : ''} /> {isLocating ? 'Locating...' : 'Refresh GPS'}
        </button>
      </div>

      {gps ? (
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 700 }}>
              📍 {gps.lat.toFixed(5)}°, {gps.lng.toFixed(5)}°
            </span>
            <span className="badge badge-verified" style={{ fontSize: '0.7rem' }}>
              <ShieldCheck size={11} /> ±{gps.accuracyMeters}m GPS Accuracy
            </span>
          </div>
          <p style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px', lineHeight: '1.4' }}>
            Reverse Geocoded Address: <strong style={{ color: '#cbd5e1' }}>{gps.address}</strong>
          </p>
        </div>
      ) : (
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>
          Fetching GPS satellite coordinates & OpenStreetMap address...
        </div>
      )}
    </div>
  );
}
