import React from 'react';
import { QrCode, CheckCircle2, Copy, X } from 'lucide-react';

export default function UpiQrModal({ isOpen, onClose, amount, shopName, upiTxnId }) {
  if (!isOpen) return null;

  const upiVpa = 'bharatfmcg@upi';
  const merchantName = 'Bharat Traders & FMCG';
  // Standard UPI URI format
  const upiString = `upi://pay?pa=${upiVpa}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('FieldVision Order ' + shopName)}`;
  // Quick QR API image
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiString)}`;

  const copyVpa = () => {
    navigator.clipboard.writeText(upiVpa);
    alert(`UPI VPA "${upiVpa}" copied to clipboard!`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <QrCode size={20} color="#10b981" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>Bharat UPI Payment QR</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.4rem' }}>
            &times;
          </button>
        </div>

        <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '14px' }}>
          Show this QR code to <strong>{shopName}</strong> to collect ₹{Number(amount).toLocaleString('en-IN')} instantly.
        </p>

        {/* QR Code Container */}
        <div style={{
          background: '#ffffff',
          padding: '16px',
          borderRadius: '16px',
          display: 'inline-block',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          marginBottom: '16px'
        }}>
          <img
            src={qrImageUrl}
            alt="UPI QR Code"
            style={{ width: '200px', height: '200px', borderRadius: '8px' }}
          />
          <div style={{ marginTop: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
            SCAN WITH ANY UPI APP (Google Pay, PhonePe, Paytm)
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{ textAlignment: 'left' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Merchant UPI VPA</span>
            <strong style={{ fontSize: '0.9rem', color: '#34d399' }}>{upiVpa}</strong>
          </div>
          <button onClick={copyVpa} className="btn btn-secondary btn-sm">
            <Copy size={13} /> Copy
          </button>
        </div>

        <button onClick={onClose} className="btn btn-emerald" style={{ width: '100%' }}>
          <CheckCircle2 size={16} /> Confirm Payment Received
        </button>
      </div>
    </div>
  );
}
