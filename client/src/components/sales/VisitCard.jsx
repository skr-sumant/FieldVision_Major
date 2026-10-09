import React, { useState } from 'react';
import { Camera, Share2, MapPin, Clock, DollarSign, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';

export default function VisitCard({ visit }) {
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const openWhatsAppAlert = () => {
    const text = `*FieldVision Visit Receipt*\n\n📍 *Shop:* ${visit.shopName}\n👤 *Owner:* ${visit.customerName}\n📱 *Phone:* ${visit.phone}\n💰 *Order Total:* ₹${Number(visit.orderAmount).toLocaleString('en-IN')}\n💳 *Payment Status:* ${visit.paymentStatus}\n🕒 *Timestamp:* ${new Date(visit.timestamp).toLocaleTimeString('en-IN')}\n🌐 *GPS Proof:* Lat ${visit.gpsLocation?.lat?.toFixed(5)}, Lng ${visit.gpsLocation?.lng?.toFixed(5)}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <div style={{
        background: 'rgba(23, 32, 54, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '14px',
        padding: '16px',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>{visit.shopName}</h4>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              {visit.customerName} • {visit.phone}
            </span>
          </div>

          <span className={`badge ${visit.status === 'Verified' ? 'badge-verified' : 'badge-pending'}`}>
            {visit.status === 'Verified' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
            {visit.status}
          </span>
        </div>

        {/* Info Grid */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.5)',
          borderRadius: '8px',
          padding: '10px 12px',
          margin: '10px 0',
          fontSize: '0.78rem',
          color: '#cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div>📍 <strong>Address:</strong> {visit.address}</div>
          <div>💰 <strong>Order Total:</strong> <span style={{ color: '#34d399', fontWeight: 700 }}>₹{Number(visit.orderAmount).toLocaleString('en-IN')}</span> ({visit.paymentStatus})</div>
          {visit.orderItems && <div>📦 <strong>Items:</strong> {visit.orderItems}</div>}
          <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: '2px' }}>
            🕒 {new Date(visit.timestamp).toLocaleTimeString('en-IN')} | GPS Accuracy: ±{visit.gpsLocation?.accuracyMeters || 5}m
          </div>
        </div>

        {/* Actions Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
          {visit.photoUrl && (
            <button
              onClick={() => setShowPhotoModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '6px 10px' }}
            >
              <Eye size={13} /> View Photo Proof
            </button>
          )}

          <button
            onClick={openWhatsAppAlert}
            className="btn btn-emerald btn-sm"
            style={{ fontSize: '0.75rem', padding: '6px 10px' }}
          >
            <Share2 size={13} /> WhatsApp Receipt
          </button>
        </div>
      </div>

      {/* Photo View Modal */}
      {showPhotoModal && (
        <div className="modal-overlay" onClick={() => setShowPhotoModal(false)}>
          <div className="modal-card" style={{ maxWidth: '500px', padding: '16px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <strong style={{ fontSize: '1rem', color: '#f8fafc' }}>Visit Photo Proof - {visit.shopName}</strong>
              <button onClick={() => setShowPhotoModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}>
                &times;
              </button>
            </div>

            <img
              src={visit.photoUrl}
              alt="Photo Proof"
              style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.15)' }}
            />

            <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
              Captured via FieldVision Live Device Camera • Verified Timestamp: {new Date(visit.timestamp).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
