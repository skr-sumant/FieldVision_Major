import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginModal from './components/auth/LoginModal';
import ForgotPasswordModal from './components/auth/ForgotPasswordModal';
import AdminDashboard from './components/admin/AdminDashboard';
import ManagerDashboard from './components/manager/ManagerDashboard';
import SalesRepDashboard from './components/sales/SalesRepDashboard';
import { initOfflineSyncListeners } from './services/OfflineSyncService';
import {
  ShieldCheck,
  UserCheck,
  Smartphone,
  Sparkles,
  MapPin,
  Database,
  Layers,
  ArrowRight,
  Server,
  Lock,
  Compass
} from 'lucide-react';

function MainAppContent() {
  const { currentUser, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [currentLang, setLang] = useState('en');

  useEffect(() => {
    initOfflineSyncListeners();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090d16',
        color: '#06b6d4'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Compass size={54} className="spin" style={{ marginBottom: '16px', color: '#06b6d4' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            FieldVision Enterprise Engine
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '6px' }}>
            Connecting to Cloud Telemetry Pipeline...
          </p>
        </div>
      </div>
    );
  }

  const renderDashboardByRole = () => {
    if (!currentUser) {
      return (
        <div style={{ maxWidth: '1100px', margin: '60px auto 40px', padding: '0 24px' }}>
          {/* Hero Welcome Card */}
          <div className="glass-panel" style={{
            padding: '50px 40px',
            textAlign: 'center',
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(6, 182, 212, 0.25)'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 0 30px rgba(6, 182, 212, 0.5)'
            }}>
              <MapPin size={40} color="#ffffff" />
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '6px 14px', borderRadius: '20px', marginBottom: '16px' }}>
              <Database size={14} color="#22d3ee" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#22d3ee' }}>
                ENTERPRISE TELEMETRY PIPELINE & OFFLINE-FIRST PWA
              </span>
            </div>

            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              marginBottom: '16px',
              lineHeight: 1.2
            }}>
              Hierarchical Field Sales & <br />
              <span style={{
                background: 'linear-gradient(135deg, #22d3ee 0%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Telemetry Automation Platform
              </span>
            </h1>

            <p style={{
              fontSize: '1.05rem',
              color: '#94a3b8',
              maxWidth: '700px',
              margin: '0 auto 32px',
              lineHeight: 1.6
            }}>
              Strict multi-tier authority structure. Master Admin initializes Regional Managers and assigns Commercial Zones & States; Managers create and manage on-ground Sales Representatives.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowLoginModal(true)}
                className="btn btn-primary"
                style={{ padding: '14px 34px', fontSize: '1.05rem', borderRadius: '12px' }}
              >
                Sign In to Enterprise Portal <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* 3-Tier Hierarchy Explanation Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {/* Admin Tier */}
            <div className="glass-panel" style={{ padding: '26px', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <ShieldCheck size={24} color="#ffffff" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>Master Admin</h3>
                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>Top Authority</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '14px' }}>
                Has single master credentials out of the box (<code style={{ color: '#c084fc' }}>admin@fieldvision.in</code>). Full access across all functionality, creates Regional Managers, assigns Zones & States, and monitors live field operations.
              </p>
              <div style={{ fontSize: '0.76rem', color: '#c084fc', fontWeight: 600 }}>
                • National Command & Settings<br />
                • Commercial Zone Assignment<br />
                • Real-time Telemetry Inspector
              </div>
            </div>

            {/* Manager Tier */}
            <div className="glass-panel" style={{ padding: '26px', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <UserCheck size={24} color="#ffffff" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>Regional Manager</h3>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Zone Scoped</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '14px' }}>
                Created and assigned a specific Zone & State by Admin. Generates login credentials for on-ground sales persons in their territory, monitors live GPS tracking, and verifies retail visits.
              </p>
              <div style={{ fontSize: '0.76rem', color: '#22d3ee', fontWeight: 600 }}>
                • Creates Sales Person Logins<br />
                • Live Team GPS Telemetry<br />
                • 1-Click Verification & Reports
              </div>
            </div>

            {/* Sales Rep Tier */}
            <div className="glass-panel" style={{ padding: '26px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <Smartphone size={24} color="#ffffff" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>Field Sales Rep</h3>
                <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>On-Ground</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '14px' }}>
                Operates on mobile in their designated territory. Logs verified retail visits with mandatory GPS check-in, shop camera proof, quick retail onboarding, and dynamic UPI QR collections.
              </p>
              <div style={{ fontSize: '0.76rem', color: '#34d399', fontWeight: 600 }}>
                • GPS & Live Camera Proof<br />
                • Offline PWA Background Sync<br />
                • Instant Bharat UPI QR
              </div>
            </div>
          </div>
        </div>
      );
    }

    switch (currentUser.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'sales_rep':
      default:
        return <SalesRepDashboard />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        onOpenLogin={() => setShowLoginModal(true)}
        currentLang={currentLang}
        setLang={setLang}
      />

      <main style={{ flex: 1, paddingBottom: '40px' }}>
        {renderDashboardByRole()}
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '20px 24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#64748b',
        fontSize: '0.8rem',
        background: 'rgba(9, 13, 22, 0.9)'
      }}>
        FieldVision Enterprise Bharat PWA © 2026 | Enterprise Cloud Telemetry Engine | Geolocation Telemetry
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onOpenForgotPassword={() => {
          setShowLoginModal(false);
          setShowForgotPasswordModal(true);
        }}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onBackToLogin={() => {
          setShowForgotPasswordModal(false);
          setShowLoginModal(true);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
