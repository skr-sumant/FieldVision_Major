import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, KeyRound, Mail, Eye, EyeOff, ShieldAlert, ShieldCheck, Sparkles, Database } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onOpenForgotPassword }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleQuickFillAdmin = () => {
    setEmail('admin@fieldvision.in');
    setPassword('Admin@2026');
    setErrorMsg('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)'
            }}>
              <LogIn size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                FieldVision Portal
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#94a3b8' }}>
                <ShieldCheck size={12} color="#10b981" /> Enterprise Cloud Authenticated
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8',
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            &times;
          </button>
        </div>

        {/* Master Admin Credentials Card
        <div style={{
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c084fc', fontSize: '0.82rem', fontWeight: 700 }}>
              <ShieldCheck size={16} /> Initial Master Admin Credentials:
            </div>
            <button
              type="button"
              onClick={handleQuickFillAdmin}
              className="btn btn-purple btn-sm"
              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
            >
              1-Click Auto Fill
            </button>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5, fontFamily: 'var(--font-mono)' }}>
            <div>Email: <span style={{ color: '#22d3ee', fontWeight: 600 }}>admin@fieldvision.in</span></div>
            <div>Password: <span style={{ color: '#a78bfa', fontWeight: 600 }}>Admin@2026</span></div>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px' }}>
            Admin has full access to create Managers with assigned Zone/State. Managers then create Sales Rep credentials.
          </div>
        </div> */}

        {errorMsg && (
          <div style={{
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            fontSize: '0.85rem',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <ShieldAlert size={18} />
            <div>{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <Mail size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px', color: '#06b6d4' }} />
              Registered Email Address
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. admin@fieldvision.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ margin: 0 }}>
                <KeyRound size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px', color: '#8b5cf6' }} />
                Password
              </label>
              <button
                type="button"
                onClick={onOpenForgotPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#06b6d4',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', marginTop: '12px', padding: '12px', fontSize: '0.95rem' }}
          >
            {isSubmitting ? 'Authenticating Securely...' : 'Sign In to Portal'}
          </button>
        </form>
      </div>
    </div>
  );
}
