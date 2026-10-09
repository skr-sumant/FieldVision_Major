import React, { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  Phone,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Package,
  CreditCard,
  User,
  Store,
  FileText,
  Navigation,
  Copy,
  Check,
  Maximize2
} from 'lucide-react';

export default function TelemetryDetailModal({ visit, onClose, onUpdateStatus }) {
  const [managerNotes, setManagerNotes] = useState(visit?.managerNotes || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [showFullPhoto, setShowFullPhoto] = useState(false);

  if (!visit) return null;

  const lat = visit.lat || visit.gpsLocation?.lat || 19.0760;
  const lng = visit.lng || visit.gpsLocation?.lng || 72.8777;
  const distanceMeters = visit.distanceMeters ?? (visit.gpsLocation?.accuracyMeters ? Math.round(visit.gpsLocation.accuracyMeters) : 5);
  const orderAmount = Number(visit.orderAmount) || 0;
  const isGeofenceAccurate = distanceMeters <= 50;

  const handleAction = async (status) => {
    setIsUpdating(true);
    await onUpdateStatus(visit.id, status, managerNotes);
    setIsUpdating(false);
  };

  const copyCoordinates = () => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const cleanPhone = (visit.phone || '').replace(/[^0-9]/g, '');

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '920px',
          width: '94%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(135deg, rgba(14, 21, 38, 0.98) 0%, rgba(20, 29, 51, 0.97) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(6, 182, 212, 0.15)',
          borderRadius: '20px',
          padding: '28px'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '18px',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span className={`badge ${
                visit.status === 'Verified'
                  ? 'badge-emerald'
                  : visit.status === 'Flagged Anomalous'
                  ? 'badge-rose'
                  : 'badge-amber'
              }`}>
                {visit.status === 'Verified' ? '✓ Verified by Manager' : visit.status}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Visit Telemetry ID: <span style={{ fontFamily: 'var(--font-mono)', color: '#22d3ee' }}>{visit.id}</span>
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', marginTop: '6px', letterSpacing: '-0.02em' }}>
              {visit.shopName || 'Retail Outlet'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <User size={14} color="#06b6d4" /> Collected by: <strong style={{ color: '#ffffff' }}>{visit.repName || 'Field Agent'}</strong>
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={14} color="#06b6d4" /> {new Date(visit.timestamp).toLocaleString('en-IN', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 2-Column Responsive Body */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '22px' }}>
          
          {/* LEFT COLUMN: Retailer, Location & Order Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Store & Owner Card */}
            <div style={{
              background: 'rgba(22, 32, 56, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#22d3ee', fontWeight: 700, fontSize: '0.85rem' }}>
                <Store size={18} /> RETAIL STORE & OWNER IDENTITY
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.82rem' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Shop Name</div>
                  <div style={{ color: '#ffffff', fontWeight: 700, marginTop: '2px' }}>{visit.shopName}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Owner / Contact</div>
                  <div style={{ color: '#ffffff', fontWeight: 700, marginTop: '2px' }}>{visit.ownerName || visit.customerName || 'Store Proprietor'}</div>
                </div>
              </div>

              <div style={{ marginTop: '12px', fontSize: '0.82rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Address / Territory</div>
                <div style={{ color: '#cbd5e1', marginTop: '2px', lineHeight: 1.4 }}>
                  📍 {visit.address || 'Field Location Registered On Device'}
                </div>
              </div>

              {/* Phone & Direct Communications */}
              {visit.phone && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={15} color="#10b981" />
                    <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.84rem' }}>{visit.phone}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={`tel:${cleanPhone}`}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                    >
                      <Phone size={12} /> Call
                    </a>
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-emerald btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                      >
                        <MessageCircle size={12} /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* GPS Telemetry & Geofence Verification */}
            <div style={{
              background: 'rgba(22, 32, 56, 0.7)',
              border: isGeofenceAccurate ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '14px',
              padding: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isGeofenceAccurate ? '#34d399' : '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>
                  <Navigation size={18} /> GPS TELEMETRY & GEOFENCE AUDIT
                </div>
                <span className={`badge ${isGeofenceAccurate ? 'badge-emerald' : 'badge-amber'}`}>
                  {isGeofenceAccurate ? '✓ Geofence Verified' : '⚠ Tolerance Alert'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem', marginBottom: '12px' }}>
                <div style={{ background: 'rgba(10, 16, 29, 0.6)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>LATITUDE</div>
                  <div style={{ color: '#ffffff', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {typeof lat === 'number' ? lat.toFixed(6) : lat}
                  </div>
                </div>
                <div style={{ background: 'rgba(10, 16, 29, 0.6)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>LONGITUDE</div>
                  <div style={{ color: '#ffffff', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {typeof lng === 'number' ? lng.toFixed(6) : lng}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#94a3b8', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  Geofence Deviation: <strong style={{ color: isGeofenceAccurate ? '#34d399' : '#fbbf24' }}>{distanceMeters}m</strong> (Tolerance: &lt;50m)
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={copyCoordinates}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                    title="Copy Coordinates"
                  >
                    {copiedCoords ? <Check size={12} color="#10b981" /> : <Copy size={12} />} {copiedCoords ? 'Copied' : 'Copy'}
                  </button>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                  >
                    <ExternalLink size={12} /> View On Map
                  </a>
                </div>
              </div>
            </div>

            {/* Financial & Order Telemetry */}
            <div style={{
              background: 'rgba(22, 32, 56, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#c084fc', fontWeight: 700, fontSize: '0.85rem' }}>
                <DollarSign size={18} /> ORDER & PAYMENT TELEMETRY
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(10, 16, 29, 0.6)', padding: '14px 16px', borderRadius: '10px', marginBottom: '14px' }}>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>TOTAL ORDER VALUE</div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981' }}>
                    ₹{orderAmount.toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${
                    visit.paymentStatus === 'Paid via UPI' || visit.paymentStatus === 'Cash Collected'
                      ? 'badge-emerald'
                      : 'badge-amber'
                  }`}>
                    {visit.paymentStatus || 'Payment Logged'}
                  </span>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
                    Mode: <strong style={{ color: '#ffffff' }}>{visit.paymentMethod || 'UPI QR'}</strong>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div style={{ fontSize: '0.82rem', marginBottom: '10px' }}>
                <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={13} /> Order Line Items / SKU Details
                </div>
                <div style={{ background: 'rgba(10, 16, 29, 0.4)', padding: '10px 12px', borderRadius: '8px', color: '#e2e8f0', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                  {visit.orderItems || 'Standard FMCG Assortment (Beverages, Snacks & Packaged Staples)'}
                </div>
              </div>

              {visit.upiTxnId && (
                <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '6px' }}>
                  UPI Ref ID: <span style={{ fontFamily: 'var(--font-mono)', color: '#22d3ee' }}>{visit.upiTxnId}</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Live Photo Proof, Notes, & Manager Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Live Camera Photo Proof */}
            <div style={{
              background: 'rgba(22, 32, 56, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 700, fontSize: '0.85rem' }}>
                  <ShieldCheck size={18} color="#10b981" /> LIVE CAMERA PHOTO PROOF
                </div>
                {visit.photoUrl && (
                  <button
                    onClick={() => setShowFullPhoto(!showFullPhoto)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                  >
                    <Maximize2 size={12} /> {showFullPhoto ? 'Shrink' : 'Zoom'}
                  </button>
                )}
              </div>

              {visit.photoUrl ? (
                <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                  <img
                    src={visit.photoUrl}
                    alt="Live Store Proof"
                    style={{
                      width: '100%',
                      height: showFullPhoto ? '320px' : '200px',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'height 0.3s ease'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                    padding: '8px 12px',
                    fontSize: '0.72rem',
                    color: '#ffffff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Device Camera Geotagged</span>
                    <span style={{ color: '#34d399' }}>● Live Captured</span>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '30px',
                  textAlign: 'center',
                  background: 'rgba(10, 16, 29, 0.5)',
                  borderRadius: '10px',
                  color: '#64748b',
                  fontSize: '0.82rem'
                }}>
                  No photo proof attached for this visit record
                </div>
              )}
            </div>

            {/* Rep Field Observations */}
            <div style={{
              background: 'rgba(22, 32, 56, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem' }}>
                <FileText size={18} /> SALES PERSON FIELD OBSERVATIONS
              </div>
              <div style={{
                background: 'rgba(10, 16, 29, 0.5)',
                padding: '12px 14px',
                borderRadius: '8px',
                color: visit.notes ? '#f1f5f9' : '#64748b',
                fontStyle: visit.notes ? 'italic' : 'normal',
                fontSize: '0.82rem',
                lineHeight: 1.5
              }}>
                {visit.notes ? `"${visit.notes}"` : 'No additional field notes entered by sales representative.'}
              </div>
            </div>

            {/* Manager Verification & Action Control */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(2, 132, 199, 0.06) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '14px',
              padding: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#22d3ee', fontWeight: 800, fontSize: '0.9rem' }}>
                <ShieldCheck size={18} /> MANAGER AUDIT & VERIFICATION
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>Manager Audit Notes / Instructions</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="e.g. Geofence verified. Store confirmed regular stock reorder."
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  style={{ fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleAction('Verified')}
                  disabled={isUpdating}
                  className="btn btn-emerald"
                  style={{ flex: '1 1 140px', padding: '10px 14px', fontSize: '0.84rem' }}
                >
                  <CheckCircle2 size={16} /> Approve & Verify
                </button>
                <button
                  onClick={() => handleAction('Flagged Anomalous')}
                  disabled={isUpdating}
                  className="btn btn-rose"
                  style={{ flex: '1 1 140px', padding: '10px 14px', fontSize: '0.84rem' }}
                >
                  <AlertTriangle size={16} /> Flag Anomaly
                </button>
              </div>

              {visit.managerNotes && (
                <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#94a3b8' }}>
                  Last manager note: <span style={{ color: '#ffffff' }}>"{visit.managerNotes}"</span>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
