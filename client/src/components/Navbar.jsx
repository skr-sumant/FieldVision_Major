import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { processAvatarImage } from '../utils/imageUtils';
import {
  MapPin,
  ShieldCheck,
  UserCheck,
  Smartphone,
  LogOut,
  LogIn,
  Database,
  Wifi,
  WifiOff,
  Download,
  Sparkles,
  Layers,
  Map,
  Camera
} from 'lucide-react';

export default function Navbar({ onOpenLogin, currentLang, setLang }) {
  const { currentUser, logout, updateCurrentUserAvatar } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [dbStatus, setDbStatus] = useState({ connected: false, engine: 'Cloud Engine' });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const base64 = await processAvatarImage(file, 256, 0.85);
      await updateCurrentUserAvatar(base64);
    } catch (err) {
      alert(err.message || 'Failed to upload photo');
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check DB status
    fetch('/api/health')
      .then(r => r.json())
      .then(d => {
        if (d.status === 'connected') {
          setDbStatus({ connected: true, engine: d.engine || 'Cloud Data Engine' });
        }
      })
      .catch(() => setDbStatus({ connected: false, engine: 'Offline' }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then(() => setInstallPrompt(null));
    } else {
      alert('FieldVision is PWA ready! Select "Add to Home Screen" or "Install App" in your mobile browser menu.');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="badge badge-purple" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
            <ShieldCheck size={14} /> Master Admin
          </span>
        );
      case 'manager':
        return (
          <span className="badge badge-cyan" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
            <UserCheck size={14} /> Manager ({currentUser?.zone || 'Assigned Zone'})
          </span>
        );
      case 'sales_rep':
        return (
          <span className="badge badge-emerald" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
            <Smartphone size={14} /> Sales Rep ({currentUser?.territory || currentUser?.state || 'Field'})
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header style={{
      background: 'rgba(10, 15, 28, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '12px 28px',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
          }}>
            <MapPin size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                lineHeight: 1.1
              }}>
                Field<span style={{ color: '#06b6d4', textShadow: '0 0 12px rgba(6, 182, 212, 0.5)' }}>Vision</span>
              </h1>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                background: 'rgba(6, 182, 212, 0.12)',
                color: '#22d3ee',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                letterSpacing: '0.05em'
              }}>
                ENTERPRISE
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
              Hierarchical Field Sales & Telemetry Engine
            </p>
          </div>
        </div>

        {/* Status Indicators & Navigation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* Cloud Engine Connected Beacon */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(14, 21, 38, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.78rem',
            color: '#cbd5e1'
          }}>
            <div className={`pulse-beacon ${dbStatus.connected ? 'online' : ''}`} style={{
              background: dbStatus.connected ? '#10b981' : '#f43f5e',
              boxShadow: dbStatus.connected ? '0 0 8px #10b981' : '0 0 8px #f43f5e'
            }} />
            <Database size={13} color={dbStatus.connected ? '#10b981' : '#f43f5e'} />
            <span style={{ fontWeight: 600 }}>
              {dbStatus.connected ? 'Cloud Engine Live' : 'Connecting Engine...'}
            </span>
          </div>

          {/* Network Telemetry */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(14, 21, 38, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.78rem',
            color: isOnline ? '#34d399' : '#fb7185'
          }}>
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span style={{ fontWeight: 600 }}>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Authenticated Role & User Actions */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {getRoleBadge(currentUser.role)}

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(22, 32, 56, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '4px 12px 4px 6px',
                borderRadius: '30px'
              }}>
                {/* Clickable Avatar with Camera Overlay to Upload from Device */}
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  style={{
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  title="Click to upload profile photo from your device"
                >
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                    alt={currentUser.name}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #06b6d4',
                      display: 'block',
                      opacity: isUploadingAvatar ? 0.6 : 1
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    background: '#0ea5e9',
                    borderRadius: '50%',
                    width: '14px',
                    height: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid #0f172a'
                  }}>
                    <Camera size={8} color="#ffffff" />
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarUpload}
                  />
                </div>

                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                    {currentUser.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: isUploadingAvatar ? '#38bdf8' : '#94a3b8' }}>
                    {isUploadingAvatar ? 'Updating avatar...' : currentUser.email}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="btn btn-secondary btn-sm"
                title="Sign Out"
                style={{ borderRadius: '8px', padding: '8px 12px' }}
              >
                <LogOut size={15} />
                <span style={{ display: 'none', md: 'inline' }}>Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="btn btn-primary"
              style={{ padding: '8px 20px' }}
            >
              <LogIn size={16} /> Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
