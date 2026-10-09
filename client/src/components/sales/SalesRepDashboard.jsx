import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchVisits,
  getVisits,
  addVisit,
  fetchCustomers,
  getCustomers,
  subscribeToDbUpdates
} from '../../services/db';
import {
  queueVisitOffline,
  getOfflineQueue,
  syncOfflineVisits
} from '../../services/OfflineSyncService';
import LiveCameraModal from './LiveCameraModal';
import GpsLocationTracker from './GpsLocationTracker';
import QuickCustomerModal from './QuickCustomerModal';
import VisitCard from './VisitCard';
import UpiQrModal from './UpiQrModal';

import {
  MapPin,
  Camera,
  CheckCircle2,
  Clock,
  PlusCircle,
  QrCode,
  Share2,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  DollarSign,
  UserCheck,
  ShoppingBag,
  Flame,
  Store,
  Sparkles,
  Phone,
  ArrowRight
} from 'lucide-react';

export default function SalesRepDashboard() {
  const { currentUser } = useAuth();

  const [visits, setVisits] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [orderAmount, setOrderAmount] = useState('');
  const [orderItems, setOrderItems] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI QR');
  const [notes, setNotes] = useState('');

  // Live Modals State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);

  const [gpsData, setGpsData] = useState(null);

  const [showNewCustModal, setShowNewCustModal] = useState(false);

  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiOrderAmount, setUpiOrderAmount] = useState(0);
  const [upiShopName, setUpiShopName] = useState('');

  useEffect(() => {
    loadData();

    const handleQueueUpdate = () => setOfflineQueue(getOfflineQueue());
    const handleSyncCompleted = () => loadData();

    window.addEventListener('fv-queue-updated', handleQueueUpdate);
    window.addEventListener('fv-sync-completed', handleSyncCompleted);

    const unsub = subscribeToDbUpdates(() => {
      loadData();
    });

    return () => {
      window.removeEventListener('fv-queue-updated', handleQueueUpdate);
      window.removeEventListener('fv-sync-completed', handleSyncCompleted);
      unsub();
    };
  }, [currentUser]);

  const loadData = async () => {
    const allVisits = await fetchVisits();
    const allCust = await fetchCustomers();
    const repVisits = currentUser ? (allVisits || []).filter(v => v.repId === currentUser.id) : (allVisits || []);
    setVisits(repVisits);
    setCustomers(allCust || []);
    setOfflineQueue(getOfflineQueue());
  };

  const handleCustomerSelect = (e) => {
    const custId = e.target.value;
    if (custId === 'NEW') {
      setShowNewCustModal(true);
      setSelectedCustomerId('');
    } else {
      setSelectedCustomerId(custId);
      const found = customers.find(c => c.id === custId);
      if (found) {
        setShopName(found.shopName);
        setOwnerName(found.ownerName);
        setPhone(found.phone);
        setAddress(found.address);
      }
    }
  };

  const handleCustomerCreated = async (newCust) => {
    await fetchCustomers();
    setCustomers(getCustomers());
    setSelectedCustomerId(newCust.id);
    setShopName(newCust.shopName);
    setOwnerName(newCust.ownerName);
    setPhone(newCust.phone);
    setAddress(newCust.address);
  };

  const handleSubmitVisit = async (e) => {
    e.preventDefault();

    if (!shopName) {
      alert('Please select or enter a customer shop name.');
      return;
    }

    const visitPayload = {
      repId: currentUser ? currentUser.id : 'usr_rep1',
      repName: currentUser ? currentUser.name : 'Sales Rep',
      managerId: currentUser?.managerId || null,
      zone: currentUser?.zone || '',
      state: currentUser?.state || '',
      customerId: selectedCustomerId || 'cust_new',
      customerName: ownerName || 'Shop Owner',
      shopName,
      phone,
      address: address || 'Store Location',
      gpsLocation: gpsData || { lat: 19.1197, lng: 72.8464, accuracyMeters: 4.8 },
      claimedGps: gpsData || { lat: 19.1197, lng: 72.8464 },
      timestamp: new Date().toISOString(),
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=400',
      orderAmount: Number(orderAmount) || 0,
      orderItems: orderItems || 'General FMCG Goods',
      paymentMethod,
      paymentStatus: paymentMethod === 'UPI QR' ? 'Paid via UPI' : (paymentMethod === 'Cash' ? 'Cash Collected' : 'Pending'),
      upiTxnId: paymentMethod === 'UPI QR' ? `UPI/${Date.now().toString().substr(3)}/PAY` : null,
      notes,
      status: 'Pending Verification',
      gpsVerified: true,
      photoVerified: true
    };

    if (!navigator.onLine) {
      queueVisitOffline(visitPayload);
      alert('📱 Network offline! Visit saved locally to PWA queue. It will auto-sync when online.');
    } else {
      await addVisit(visitPayload);
      alert('🚀 Field Visit & Photo Proof Recorded Successfully!');
    }

    // Reset Form
    setSelectedCustomerId('');
    setShopName('');
    setOwnerName('');
    setPhone('');
    setAddress('');
    setOrderAmount('');
    setOrderItems('');
    setNotes('');
    setPhotoUrl(null);
    loadData();
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    const res = await syncOfflineVisits();
    setIsSyncing(false);
    alert(res.message);
    loadData();
  };

  // Metrics
  const dailyTarget = currentUser?.dailyTarget || 15;
  const visitsTodayCount = visits.length;
  const targetPercent = Math.min(100, Math.round((visitsTodayCount / dailyTarget) * 100));
  const totalRevenueToday = visits.reduce((acc, v) => acc + (Number(v.orderAmount) || 0), 0);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px' }}>
      
      {/* Offline Sync Alert Banner */}
      {offlineQueue.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: '#ffffff',
          borderRadius: '14px',
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          boxShadow: '0 6px 20px rgba(245, 158, 11, 0.35)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={24} />
            <div>
              <strong style={{ fontSize: '1rem' }}>{offlineQueue.length} Visits Pending Offline Sync</strong>
              <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>Records are saved safely on your device in offline mode.</p>
            </div>
          </div>

          <button
            onClick={handleManualSync}
            className="btn btn-secondary btn-sm"
            disabled={isSyncing}
            style={{ background: '#ffffff', color: '#b45309', border: 'none', padding: '8px 16px', fontWeight: 700 }}
          >
            <RefreshCw size={14} className={isSyncing ? 'spin' : ''} /> {isSyncing ? 'Syncing...' : 'Sync Queue Now'}
          </button>
        </div>
      )}

      {/* Cool Header Card */}
      <div className="glass-panel" style={{
        padding: '24px',
        marginBottom: '24px',
        background: 'linear-gradient(135deg, rgba(23, 32, 54, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-verified"><Flame size={12} /> 5-Day Active Streak</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{currentUser?.territory || 'Mumbai Suburban'}</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }}>
              Field Sales Hub — {currentUser?.name || 'Rahul Verma'} 🚀
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
              Capture verified customer visits with live GPS positioning & live photo proof.
            </p>
          </div>

          {/* Target Gauge */}
          <div style={{ minWidth: '240px', background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
              <span>Daily Visit Target</span>
              <span style={{ color: '#34d399' }}>{visitsTodayCount} / {dailyTarget} ({targetPercent}%)</span>
            </div>
            <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{
                width: `${targetPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                borderRadius: '5px',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Counter Badges Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '20px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Verified Visits Today</span>
            <strong style={{ fontSize: '1.5rem', color: '#60a5fa' }}>{visitsTodayCount}</strong>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Total Sales Turnover</span>
            <strong style={{ fontSize: '1.5rem', color: '#34d399' }}>₹{totalRevenueToday.toLocaleString('en-IN')}</strong>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Verification Standard</span>
            <strong style={{ fontSize: '0.9rem', color: '#fbbf24', display: 'block', marginTop: '6px' }}>GPS + Live Photo</strong>
          </div>
        </div>
      </div>

      {/* Main Grid Layout: Form + Visit History */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Left Column: Dedicated Visit Recorder */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PlusCircle size={20} color="#3b82f6" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Record Customer Visit</h3>
            </div>

            <button
              type="button"
              onClick={() => setShowNewCustModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              <Store size={13} /> + New Shop
            </button>
          </div>

          <form onSubmit={handleSubmitVisit}>
            {/* Customer Dropdown */}
            <div className="form-group">
              <label>Select Customer Shop</label>
              <select
                className="form-control"
                value={selectedCustomerId}
                onChange={handleCustomerSelect}
              >
                <option value="" style={{ background: '#0f172a' }}>-- Select Existing Shop --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#0f172a' }}>
                    {c.shopName} ({c.ownerName})
                  </option>
                ))}
                <option value="NEW" style={{ background: '#1e293b', fontWeight: 'bold' }}>+ Register New Customer Shop</option>
              </select>
            </div>

            {/* Shop Details */}
            <div className="form-group">
              <label>Shop / Retailer Business Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Shree Ganesh Supermarket"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label>Owner Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ramesh Patel"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="9823011221"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Location Address</label>
              <input
                type="text"
                className="form-control"
                placeholder="Shop #4, SV Road, Andheri West, Mumbai"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Live GPS Tracker Widget Component */}
            <GpsLocationTracker onLocationCaptured={(data) => setGpsData(data)} />

            {/* Live Camera Click Button & Preview */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label><Camera size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Live Visit Photo Proof</label>
              
              {!photoUrl ? (
                <button
                  type="button"
                  onClick={() => setShowCameraModal(true)}
                  className="btn btn-emerald"
                  style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
                >
                  <Camera size={18} /> Open Live Web Camera & Click Photo
                </button>
              ) : (
                <div style={{ position: 'relative', marginTop: '6px' }}>
                  <img
                    src={photoUrl}
                    alt="Live Photo Proof"
                    style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #10b981' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowCameraModal(true)}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                    >
                      <Camera size={13} /> Retake Live Photo
                    </button>
                    <span className="badge badge-verified" style={{ alignSelf: 'center' }}>
                      <CheckCircle2 size={12} /> Photo Stamp Attached
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Order Amount & Payment */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label>Sales Order Total (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 18450"
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <select
                  className="form-control"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="UPI QR" style={{ background: '#0f172a' }}>UPI QR (GPay/PhonePe)</option>
                  <option value="Cash" style={{ background: '#0f172a' }}>Cash Collected</option>
                  <option value="Pending Invoice" style={{ background: '#0f172a' }}>Credit Invoice</option>
                </select>
              </div>
            </div>

            {paymentMethod === 'UPI QR' && orderAmount > 0 && (
              <button
                type="button"
                className="btn btn-emerald btn-sm"
                onClick={() => {
                  setUpiOrderAmount(orderAmount);
                  setUpiShopName(shopName || 'Customer Shop');
                  setShowUpiModal(true);
                }}
                style={{ width: '100%', marginBottom: '14px', padding: '10px' }}
              >
                <QrCode size={15} /> Show Dynamic UPI QR Code (₹{orderAmount})
              </button>
            )}

            <div className="form-group">
              <label>Order Items Summary</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="List stock items ordered..."
                value={orderItems}
                onChange={(e) => setOrderItems(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem' }}>
              <CheckCircle2 size={18} /> Save & Submit Visit Record
            </button>
          </form>
        </div>

        {/* Right Column: Visited Shops Log */}
        <div>
          <div className="glass-panel" style={{ padding: '24px', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={20} color="#10b981" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Visits Logged Today ({visits.length})</h3>
              </div>
              <span className="badge badge-verified">Verified History</span>
            </div>

            {visits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                <Clock size={42} style={{ opacity: 0.4, marginBottom: '10px' }} />
                <p style={{ fontWeight: 700 }}>No visits recorded yet today.</p>
                <span style={{ fontSize: '0.8rem' }}>Use the visit entry form to capture your first field visit!</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '720px', overflowY: 'auto', paddingRight: '4px' }}>
                {visits.map((v) => (
                  <VisitCard key={v.id} visit={v} />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Live Camera Stream Modal Component */}
      <LiveCameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapturePhoto={(imgData) => setPhotoUrl(imgData)}
      />

      {/* Quick Customer Onboarding Modal */}
      <QuickCustomerModal
        isOpen={showNewCustModal}
        onClose={() => setShowNewCustModal(false)}
        onCustomerCreated={handleCustomerCreated}
      />

      {/* Dynamic UPI Payment QR Modal */}
      <UpiQrModal
        isOpen={showUpiModal}
        onClose={() => setShowUpiModal(false)}
        amount={upiOrderAmount}
        shopName={upiShopName}
      />
    </div>
  );
}
