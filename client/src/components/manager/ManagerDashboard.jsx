import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import AvatarUpload from '../common/AvatarUpload';
import {
  fetchVisits,
  fetchUsers,
  updateVisitStatus,
  addUser,
  deleteUser,
  exportToCsv,
  initRealtimeSync
} from '../../services/db';

import TelemetryDetailModal from './TelemetryDetailModal';
import ManagerAnalyticsCharts from './ManagerAnalyticsCharts';
import ManagerAiAnalytics from './ManagerAiAnalytics';
import LiveMap from './LiveMap';

// Export Libraries
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportVisitExcelTemplate, exportVisitCsvTemplate } from '../../utils/reportExportUtils';

import {
  Radio,
  Building,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Calendar,
  Sparkles,
  UserPlus,
  Trash2,
  RefreshCw,
  Bell,
  Search,
  Filter,
  Eye,
  FileSpreadsheet,
  FileText,
  Download,
  CheckSquare,
  BarChart3,
  BrainCircuit,
  Map,
  ShieldCheck,
  Smartphone,
  Phone,
  DollarSign,
  Package,
  Layers
} from 'lucide-react';

export default function ManagerDashboard() {
  const { currentUser } = useAuth();

  // Primary Tabs: 'telemetry', 'analytics', 'ai_analytics', 'verification', 'team', 'map', 'reports'
  const [activeTab, setActiveTab] = useState('telemetry');
  const [visits, setVisits] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Field Telemetry Filter Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepFilter, setSelectedRepFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState('ALL');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState('ALL'); // 'ALL', 'TODAY', '7D', '30D'

  // Selected Visit for Inspection Modal
  const [inspectingVisit, setInspectingVisit] = useState(null);

  // New Sales Rep Modal State
  const [showAddRepModal, setShowAddRepModal] = useState(false);
  const [repName, setRepName] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [repPassword, setRepPassword] = useState('Rep@2026');
  const [repPhone, setRepPhone] = useState('');
  const [repTerritory, setRepTerritory] = useState('');
  const [repDailyTarget, setRepDailyTarget] = useState(15);
  const [repAvatar, setRepAvatar] = useState('');
  const [realtimeNotice, setRealtimeNotice] = useState(null);

  useEffect(() => {
    loadManagerData();

    // Listen for live visit creations from reps assigned to this manager
    const unsubRealtime = initRealtimeSync(currentUser, (evt) => {
      if (evt.type === 'VISIT_CREATED') {
        setRealtimeNotice({
          title: 'Live Field Visit Recorded',
          message: `${evt.repName || 'Sales Rep'} recorded a visit at ${evt.shopName || 'Retail Outlet'} (₹${evt.orderTotal || 0})!`
        });
        loadManagerData();
        setTimeout(() => setRealtimeNotice(null), 8000);
      }
    });

    return () => {
      unsubRealtime();
    };
  }, [currentUser]);

  const loadManagerData = async () => {
    setIsLoading(true);
    const [allVisits, allUsers] = await Promise.all([
      fetchVisits(),
      fetchUsers()
    ]);

    // Scoped strictly to reps belonging to this manager
    const myReps = (allUsers || []).filter(u => u.role === 'sales_rep' && u.managerId === currentUser?.id);
    const repIds = myReps.map(r => r.id);

    // Filter visits: either directly tagged with managerId or done by one of my reps
    const myVisits = (allVisits || []).filter(v =>
      v.managerId === currentUser?.id || repIds.includes(v.repId)
    );

    setSalesReps(myReps);
    setVisits(myVisits);
    setIsLoading(false);
  };

  // Create Sales Person Credentials
  const handleCreateSalesRep = async (e) => {
    e.preventDefault();
    if (!repName || !repEmail || !repPassword) return;

    await addUser({
      name: repName.trim(),
      email: repEmail.trim().toLowerCase(),
      password: repPassword,
      role: 'sales_rep',
      phone: repPhone,
      territory: repTerritory || `${currentUser?.state || 'District'} Field Area`,
      zone: currentUser?.zone || '',
      state: currentUser?.state || '',
      managerId: currentUser?.id,
      dailyTarget: repDailyTarget,
      avatar: repAvatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
      status: 'Active'
    });

    alert(`Successfully generated Sales Person credentials for ${repName} under ${currentUser?.zone}!`);
    setShowAddRepModal(false);
    setRepName('');
    setRepEmail('');
    setRepPhone('');
    setRepTerritory('');
    setRepAvatar('');
    loadManagerData();
  };

  // Update Status from row or modal
  const handleUpdateVisitStatus = async (visitId, status, notes = '') => {
    await updateVisitStatus(visitId, status, notes, currentUser?.name);
    loadManagerData();
    if (inspectingVisit && inspectingVisit.id === visitId) {
      setInspectingVisit(prev => ({ ...prev, status, managerNotes: notes }));
    }
  };

  const handleDeleteRep = async (repId, name) => {
    if (window.confirm(`Are you sure you want to remove Sales Rep ${name}?`)) {
      await deleteUser(repId);
      loadManagerData();
    }
  };

  // Export handlers
  const handleExportCsv = () => {
    exportToCsv(`FieldVision_${currentUser?.zone || 'Zone'}_Visits.csv`, visits);
  };

  const handleExportExcel = () => {
    const exportRows = visits.map(v => ({
      'Visit ID': v.id,
      'Timestamp': new Date(v.timestamp).toLocaleString(),
      'Sales Person': v.repName,
      'Shop Name': v.shopName,
      'Owner Name': v.ownerName || v.customerName || 'N/A',
      'Contact Phone': v.phone || 'N/A',
      'Address': v.address || 'N/A',
      'Order Amount (₹)': Number(v.orderAmount) || 0,
      'Ordered Items': v.orderItems || 'N/A',
      'Payment Mode': v.paymentMethod || 'UPI QR',
      'Payment Status': v.paymentStatus || 'N/A',
      'Latitude': v.lat || (v.gpsLocation && v.gpsLocation.lat) || 0,
      'Longitude': v.lng || (v.gpsLocation && v.gpsLocation.lng) || 0,
      'Geofence Deviation (m)': v.distanceMeters || 0,
      'Verification Status': v.status,
      'Manager Notes': v.managerNotes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Field Telemetry');
    XLSX.writeFile(workbook, `FieldVision_${currentUser?.zone || 'Zone'}_Telemetry_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportPdf = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      doc.setFontSize(16);
      doc.text(`FieldVision Regional Telemetry Dossier - ${currentUser?.zone || 'Zone'}`, 40, 40);
      doc.setFontSize(10);
      doc.text(`Jurisdiction: ${currentUser?.state || 'Regional'} | Manager: ${currentUser?.name || 'Manager'} | Date: ${new Date().toLocaleString()}`, 40, 58);

      const tableRows = visits.slice(0, 60).map(v => [
        new Date(v.timestamp).toLocaleDateString(),
        v.repName || 'Rep',
        v.shopName || 'Shop',
        v.ownerName || 'Owner',
        v.phone || '-',
        `INR ${(Number(v.orderAmount) || 0).toLocaleString('en-IN')}`,
        v.paymentMethod || 'UPI',
        v.status || 'Pending'
      ]);

      autoTable(doc, {
        head: [['Date', 'Sales Person', 'Store Name', 'Owner', 'Phone', 'Order Value', 'Payment', 'Status']],
        body: tableRows.length ? tableRows : [['No visits recorded', '-', '-', '-', '-', 'INR 0', '-', '-']],
        startY: 75,
        theme: 'grid',
        headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255] },
        styles: { fontSize: 8, font: 'helvetica' }
      });

      doc.save(`FieldVision_${currentUser?.zone || 'Zone'}_Telemetry_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to generate PDF: ' + err.message);
    }
  };

  // Filtered visits for the Field Telemetry Explorer Table
  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      // Rep filter
      if (selectedRepFilter !== 'ALL' && v.repId !== selectedRepFilter) return false;
      // Status filter
      if (selectedStatusFilter !== 'ALL' && v.status !== selectedStatusFilter) return false;
      // Payment filter
      if (selectedPaymentFilter !== 'ALL') {
        if (!v.paymentMethod || !v.paymentMethod.includes(selectedPaymentFilter)) return false;
      }
      // Period filter
      if (selectedPeriodFilter !== 'ALL') {
        const now = new Date();
        const vDate = new Date(v.timestamp);
        if (selectedPeriodFilter === 'TODAY' && vDate.toDateString() !== now.toDateString()) return false;
        if (selectedPeriodFilter === '7D' && vDate < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) return false;
        if (selectedPeriodFilter === '30D' && vDate < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) return false;
      }
      // Free text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchShop = v.shopName && v.shopName.toLowerCase().includes(q);
        const matchOwner = (v.ownerName && v.ownerName.toLowerCase().includes(q)) || (v.customerName && v.customerName.toLowerCase().includes(q));
        const matchRep = v.repName && v.repName.toLowerCase().includes(q);
        const matchAddress = v.address && v.address.toLowerCase().includes(q);
        const matchPhone = v.phone && v.phone.includes(q);
        const matchItems = v.orderItems && v.orderItems.toLowerCase().includes(q);
        if (!matchShop && !matchOwner && !matchRep && !matchAddress && !matchPhone && !matchItems) return false;
      }
      return true;
    });
  }, [visits, selectedRepFilter, selectedStatusFilter, selectedPaymentFilter, selectedPeriodFilter, searchQuery]);

  const pendingVisits = visits.filter(v => v.status === 'Pending Verification');
  const verifiedVisits = visits.filter(v => v.status === 'Verified');
  const totalRevenue = visits.reduce((acc, v) => acc + (parseFloat(v.orderAmount) || 0), 0);

  return (
    <div style={{ maxWidth: '1480px', margin: '24px auto', padding: '0 24px' }}>
      
      {/* Regional Manager Header Banner */}
      <div className="glass-panel" style={{
        padding: '24px 30px',
        marginBottom: '24px',
        background: 'linear-gradient(135deg, rgba(14, 21, 38, 0.95) 0%, rgba(22, 32, 56, 0.9) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px rgba(6, 182, 212, 0.4)'
          }}>
            <Building size={28} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Regional Manager Command Hub
              </h1>
              <span className="badge badge-cyan">
                {currentUser?.zone || 'Zone Ops'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#10b981', fontWeight: 700 }}>
                <span className="pulse-beacon online" /> Live Telemetry Synced
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: '2px' }}>
              Jurisdiction: <strong style={{ color: '#22d3ee' }}>{currentUser?.zone || 'All Zones'}</strong> • Primary State: <strong style={{ color: '#ffffff' }}>{currentUser?.state || 'Regional'}</strong> • Managing <strong style={{ color: '#10b981' }}>{salesReps.length} Sales Persons</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAddRepModal(true)}
            className="btn btn-emerald"
            style={{ padding: '10px 18px', fontSize: '0.88rem' }}
          >
            <UserPlus size={16} /> Create Sales Person
          </button>
          <button
            onClick={() => setActiveTab('ai_analytics')}
            className="btn btn-purple"
            style={{ padding: '10px 18px', fontSize: '0.88rem' }}
          >
            <Sparkles size={16} /> AI Regional Diagnostics
          </button>
          <button onClick={loadManagerData} className="btn btn-secondary">
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Real-time Notification Banner for Manager */}
      {realtimeNotice && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '24px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.95) 0%, rgba(2, 132, 199, 0.95) 100%)',
          color: '#ffffff',
          padding: '14px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideInRight 0.3s ease',
          maxWidth: '440px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bell size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{realtimeNotice.title}</div>
            <div style={{ fontSize: '0.78rem', opacity: 0.95, marginTop: '2px' }}>{realtimeNotice.message}</div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="glass-panel kpi-card emerald">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700 }}>
            <span>FIELD SALES REPS</span>
            <Users size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: '8px 0 4px' }}>
            {salesReps.length}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#34d399' }}>
            Active in {currentUser?.zone || 'Zone'}
          </div>
        </div>

        <div className="glass-panel kpi-card amber">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700 }}>
            <span>PENDING VERIFICATION</span>
            <Clock size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: '8px 0 4px' }}>
            {pendingVisits.length}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#fbbf24' }}>
            Awaiting your audit approval
          </div>
        </div>

        <div className="glass-panel kpi-card cyan">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700 }}>
            <span>VERIFIED VISITS</span>
            <CheckCircle2 size={16} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: '8px 0 4px' }}>
            {verifiedVisits.length}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#22d3ee' }}>
            GPS & Photo confirmed
          </div>
        </div>

        <div className="glass-panel kpi-card purple">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700 }}>
            <span>ZONE SALES REVENUE</span>
            <TrendingUp size={16} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: '8px 0 4px' }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#c084fc' }}>
            Live field orders booked
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tab-container" style={{ marginBottom: '22px' }}>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`tab-button ${activeTab === 'telemetry' ? 'active' : ''}`}
        >
          <Radio size={16} /> Field Telemetry Explorer ({visits.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
        >
          <BarChart3 size={16} /> Data Analytics & Plots
        </button>
        <button
          onClick={() => setActiveTab('ai_analytics')}
          className={`tab-button ${activeTab === 'ai_analytics' ? 'active' : ''}`}
        >
          <BrainCircuit size={16} /> AI Predictive Analytics
        </button>
        <button
          onClick={() => setActiveTab('verification')}
          className={`tab-button ${activeTab === 'verification' ? 'active' : ''}`}
        >
          <CheckSquare size={16} /> Verification Queue ({pendingVisits.length})
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`tab-button ${activeTab === 'team' ? 'active' : ''}`}
        >
          <Users size={16} /> My Sales Team ({salesReps.length})
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`tab-button ${activeTab === 'map' ? 'active' : ''}`}
        >
          <Map size={16} /> Live GPS Tracking Map
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
        >
          <FileSpreadsheet size={16} /> Reports & Exports
        </button>
      </div>

      {/* TAB 1: FIELD TELEMETRY EXPLORER (View all details collected by any sales person) */}
      {activeTab === 'telemetry' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Deep Field Telemetry Explorer
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0 0' }}>
                Inspect complete field visit records collected by any sales representative in your zone: store details, live camera photos, exact GPS coordinates, itemized orders, and verification status.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={handleExportExcel} className="btn btn-secondary btn-sm" title="Download Excel Report">
                <FileSpreadsheet size={14} color="#10b981" /> Export Excel
              </button>
              <button onClick={handleExportPdf} className="btn btn-secondary btn-sm" title="Download PDF Dossier">
                <FileText size={14} color="#f43f5e" /> Export PDF
              </button>
              <button onClick={exportVisitExcelTemplate} className="btn btn-secondary btn-sm" title="Download Standardized Excel Import Template">
                <Download size={14} color="#22d3ee" /> Excel Template
              </button>
              <button onClick={exportVisitCsvTemplate} className="btn btn-secondary btn-sm" title="Download Standardized CSV Import Template">
                <Download size={14} color="#f59e0b" /> CSV Template
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{
            background: 'rgba(10, 16, 29, 0.6)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            alignItems: 'center'
          }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search shop, owner, rep, or items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', fontSize: '0.84rem' }}
              />
            </div>

            {/* Sales Rep Filter */}
            <div>
              <select
                className="form-control"
                value={selectedRepFilter}
                onChange={(e) => setSelectedRepFilter(e.target.value)}
                style={{ fontSize: '0.84rem' }}
              >
                <option value="ALL">All Sales Persons ({salesReps.length})</option>
                {salesReps.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.territory || 'Field Rep'})</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                className="form-control"
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                style={{ fontSize: '0.84rem' }}
              >
                <option value="ALL">All Verification Statuses</option>
                <option value="Verified">Verified Only</option>
                <option value="Pending Verification">Pending Verification</option>
                <option value="Flagged Anomalous">Flagged Anomalous</option>
              </select>
            </div>

            {/* Payment Filter */}
            <div>
              <select
                className="form-control"
                value={selectedPaymentFilter}
                onChange={(e) => setSelectedPaymentFilter(e.target.value)}
                style={{ fontSize: '0.84rem' }}
              >
                <option value="ALL">All Payment Modes</option>
                <option value="UPI">UPI QR / Digital</option>
                <option value="Cash">Cash Collected</option>
              </select>
            </div>

            {/* Period Filter */}
            <div>
              <select
                className="form-control"
                value={selectedPeriodFilter}
                onChange={(e) => setSelectedPeriodFilter(e.target.value)}
                style={{ fontSize: '0.84rem' }}
              >
                <option value="ALL">All Recorded Dates</option>
                <option value="TODAY">Today's Visits</option>
                <option value="7D">Past 7 Days</option>
                <option value="30D">Past 30 Days</option>
              </select>
            </div>
          </div>

          {/* Results Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '12px' }}>
            <span>Showing <strong style={{ color: '#ffffff' }}>{filteredVisits.length}</strong> of {visits.length} field visit records</span>
            {(searchQuery || selectedRepFilter !== 'ALL' || selectedStatusFilter !== 'ALL' || selectedPaymentFilter !== 'ALL' || selectedPeriodFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRepFilter('ALL');
                  setSelectedStatusFilter('ALL');
                  setSelectedPaymentFilter('ALL');
                  setSelectedPeriodFilter('ALL');
                }}
                style={{ background: 'none', border: 'none', color: '#22d3ee', cursor: 'pointer', fontSize: '0.78rem' }}
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Telemetry Table */}
          {filteredVisits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
              <Smartphone size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <h3>No Visit Records Match Your Criteria</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                Adjust your filters above or wait for sales reps to record shop visits.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Store & Owner</th>
                    <th>Sales Person</th>
                    <th>Check-in Time</th>
                    <th>Order Value</th>
                    <th>Payment Mode</th>
                    <th>GPS Telemetry</th>
                    <th>Photo Proof</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.map(v => {
                    const lat = v.lat || v.gpsLocation?.lat;
                    const lng = v.lng || v.gpsLocation?.lng;
                    const dist = v.distanceMeters ?? (v.gpsLocation?.accuracyMeters ? Math.round(v.gpsLocation.accuracyMeters) : 5);
                    const isGpsOk = dist <= 50;

                    return (
                      <tr key={v.id}>
                        <td>
                          <div style={{ fontWeight: 800, color: '#ffffff' }}>{v.shopName}</div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                            👤 {v.ownerName || v.customerName || 'Store Owner'} • {v.phone || 'No phone'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                            📍 {v.address ? (v.address.length > 32 ? v.address.slice(0, 32) + '...' : v.address) : 'Field Area'}
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: 'rgba(6, 182, 212, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              color: '#22d3ee',
                              fontWeight: 700
                            }}>
                              {(v.repName || 'R')[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.84rem' }}>{v.repName}</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Field Agent</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                          <div>{new Date(v.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {new Date(v.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td>
                          <div style={{ color: '#10b981', fontWeight: 800, fontSize: '0.92rem' }}>
                            ₹{(Number(v.orderAmount) || 0).toLocaleString('en-IN')}
                          </div>
                          {v.orderItems && (
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {v.orderItems}
                            </div>
                          )}
                        </td>

                        <td>
                          <span style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: '#cbd5e1'
                          }}>
                            {v.paymentMethod || 'UPI QR'}
                          </span>
                        </td>

                        <td>
                          <div style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}>
                            <span style={{ color: isGpsOk ? '#34d399' : '#fbbf24', fontWeight: 700 }}>
                              {isGpsOk ? '✓ Within 50m' : `⚠ ${dist}m dev`}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {lat ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : 'Node GPS'}
                          </div>
                        </td>

                        <td>
                          {v.photoUrl ? (
                            <div
                              onClick={() => setInspectingVisit(v)}
                              style={{ cursor: 'pointer', position: 'relative', width: '38px', height: '38px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                              title="Click to inspect photo"
                            >
                              <img src={v.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>None</span>
                          )}
                        </td>

                        <td>
                          <span className={`badge ${
                            v.status === 'Verified'
                              ? 'badge-emerald'
                              : v.status === 'Flagged Anomalous'
                              ? 'badge-rose'
                              : 'badge-amber'
                          }`}>
                            {v.status === 'Verified' ? 'Verified' : (v.status === 'Flagged Anomalous' ? 'Flagged' : 'Pending')}
                          </span>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => setInspectingVisit(v)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '5px 12px', fontSize: '0.76rem' }}
                          >
                            <Eye size={13} /> Inspect All
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DATA ANALYTICS & PLOTS */}
      {activeTab === 'analytics' && (
        <ManagerAnalyticsCharts visits={visits} salesReps={salesReps} />
      )}

      {/* TAB 3: AI PREDICTIVE ANALYTICS */}
      {activeTab === 'ai_analytics' && (
        <ManagerAiAnalytics visits={visits} salesReps={salesReps} zone={currentUser?.zone || 'Zone'} />
      )}

      {/* TAB 4: VISIT VERIFICATION QUEUE */}
      {activeTab === 'verification' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Visit Verification & Audit Queue
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0 0' }}>
                Review, approve, or flag shop visits logged by your team. Approving a visit synchronizes it live with Executive Admin.
              </p>
            </div>
            <span className="badge badge-amber">
              {pendingVisits.length} Awaiting Audit
            </span>
          </div>

          {pendingVisits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
              <CheckCircle2 size={42} color="#10b981" style={{ margin: '0 auto 12px' }} />
              <h3>All Caught Up!</h3>
              <p style={{ fontSize: '0.84rem', marginTop: '6px' }}>
                There are currently no pending visit records requiring verification in your zone.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
              {pendingVisits.map(v => (
                <div key={v.id} style={{
                  padding: '18px',
                  borderRadius: '14px',
                  background: 'rgba(22, 32, 56, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>{v.shopName}</div>
                        <div style={{ fontSize: '0.76rem', color: '#06b6d4', marginTop: '2px' }}>
                          Rep: <strong>{v.repName}</strong> • {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span className="badge badge-amber">Pending</span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '12px', lineHeight: 1.5 }}>
                      <div>📍 {v.address || 'Field Location Registered'}</div>
                      <div style={{ marginTop: '4px' }}>
                        💰 Order: <strong style={{ color: '#10b981' }}>₹{(Number(v.orderAmount) || 0).toLocaleString('en-IN')}</strong> ({v.paymentMethod || 'UPI'})
                      </div>
                      {v.notes && (
                        <div style={{ fontStyle: 'italic', color: '#94a3b8', marginTop: '6px', fontSize: '0.76rem' }}>
                          "{v.notes}"
                        </div>
                      )}
                    </div>

                    {v.photoUrl && (
                      <div style={{ marginBottom: '14px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <img
                          src={v.photoUrl}
                          alt="Store Proof"
                          style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      onClick={() => handleUpdateVisitStatus(v.id, 'Verified', 'Approved by Regional Manager')}
                      className="btn btn-emerald btn-sm"
                      style={{ flex: 1 }}
                    >
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button
                      onClick={() => handleUpdateVisitStatus(v.id, 'Flagged Anomalous', 'GPS tolerance check anomaly flagged by Manager')}
                      className="btn btn-rose btn-sm"
                      style={{ flex: 1 }}
                    >
                      <AlertTriangle size={14} /> Flag Anomaly
                    </button>
                    <button
                      onClick={() => setInspectingVisit(v)}
                      className="btn btn-secondary btn-sm"
                      title="Inspect All Details"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SALES TEAM MANAGEMENT */}
      {activeTab === 'team' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                Sales Persons in {currentUser?.zone || 'Your Zone'}
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                As Regional Manager, you generate login credentials and assign territories for your on-ground sales force.
              </p>
            </div>
            <button
              onClick={() => setShowAddRepModal(true)}
              className="btn btn-emerald"
            >
              <UserPlus size={16} /> Create New Sales Person
            </button>
          </div>

          {salesReps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <Smartphone size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <h3>No Sales Persons Created Yet</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '6px', maxWidth: '480px', margin: '6px auto 16px' }}>
                Click below to create your first sales representative account. They will use their email and password to log in and record shop visits.
              </p>
              <button onClick={() => setShowAddRepModal(true)} className="btn btn-emerald">
                <UserPlus size={16} /> Create Sales Person
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sales Person</th>
                    <th>Email (Login ID)</th>
                    <th>Assigned Territory</th>
                    <th>Daily Target</th>
                    <th>Visits Logged</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salesReps.map(rep => {
                    const repVisitsCount = visits.filter(v => v.repId === rep.id).length;

                    return (
                      <tr key={rep.id}>
                        <td style={{ fontWeight: 700, color: '#ffffff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={rep.avatar} alt="" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} />
                            <div>
                              {rep.name}
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400 }}>{rep.phone || 'No phone'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{rep.email}</td>
                        <td>
                          <span className="badge badge-cyan">{rep.territory || currentUser?.state}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#ffffff' }}>{rep.dailyTarget || 15} / day</td>
                        <td style={{ color: '#10b981', fontWeight: 700 }}>{repVisitsCount} visits</td>
                        <td>
                          <span className={`badge ${rep.status === 'Active' ? 'badge-emerald' : 'badge-rose'}`}>
                            {rep.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeleteRep(rep.id, rep.name)}
                            className="btn btn-rose btn-sm"
                            title="Delete Rep"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: LIVE GPS MAP */}
      {activeTab === 'map' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>
            Live Regional GPS Telemetry Map
          </h2>
          <LiveMap salesReps={salesReps} />
        </div>
      )}

      {/* TAB 7: REPORTS & EXPORTS */}
      {activeTab === 'reports' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                Regional Telemetry Reports & Exports
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Download audit-ready Excel, CSV, and PDF reports of all field visits and collected telemetry.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={handleExportExcel} className="btn btn-emerald">
                <FileSpreadsheet size={15} /> Export Excel (.xlsx)
              </button>
              <button onClick={handleExportPdf} className="btn btn-rose">
                <FileText size={15} /> Export PDF (.pdf)
              </button>
              <button onClick={handleExportCsv} className="btn btn-primary">
                <Download size={15} /> Export CSV
              </button>
              <button onClick={exportVisitExcelTemplate} className="btn btn-secondary" title="Download Excel Import Template">
                <FileSpreadsheet size={15} color="#22d3ee" /> Excel Template
              </button>
              <button onClick={exportVisitCsvTemplate} className="btn btn-secondary" title="Download CSV Import Template">
                <Download size={15} color="#f59e0b" /> CSV Template
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Rep Name</th>
                  <th>Shop Name</th>
                  <th>Address</th>
                  <th>Order Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visits.slice(0, 20).map(v => (
                  <tr key={v.id}>
                    <td style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{new Date(v.timestamp).toLocaleString()}</td>
                    <td style={{ fontWeight: 600, color: '#ffffff' }}>{v.repName}</td>
                    <td>{v.shopName}</td>
                    <td style={{ fontSize: '0.8rem' }}>{v.address || 'Field area'}</td>
                    <td style={{ color: '#10b981', fontWeight: 700 }}>₹{(Number(v.orderAmount) || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge ${v.status === 'Verified' ? 'badge-emerald' : 'badge-amber'}`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INSPECTION MODAL: All details collected by any sales person */}
      {inspectingVisit && (
        <TelemetryDetailModal
          visit={inspectingVisit}
          onClose={() => setInspectingVisit(null)}
          onUpdateStatus={handleUpdateVisitStatus}
        />
      )}

      {/* MODAL: CREATE SALES PERSON */}
      {showAddRepModal && (
        <div className="modal-overlay" onClick={() => setShowAddRepModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Smartphone size={20} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                    Create Sales Person Credentials
                  </h3>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Assigned under {currentUser?.zone || 'Zone'} ({currentUser?.state || 'State'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddRepModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSalesRep}>
              <div className="form-group">
                <label>Sales Rep Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Rahul Verma"
                  value={repName}
                  onChange={(e) => setRepName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Login Email (Sign In ID) *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. rahul@fieldvision.in"
                  value={repEmail}
                  onChange={(e) => setRepEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Login Password *</label>
                <input
                  type="text"
                  className="form-control"
                  value={repPassword}
                  onChange={(e) => setRepPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+91 98200 11223"
                  value={repPhone}
                  onChange={(e) => setRepPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Assigned Territory / District (In {currentUser?.state || 'State'}) *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Mumbai Suburban (Andheri - Bandra)"
                  value={repTerritory}
                  onChange={(e) => setRepTerritory(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Daily Visit Target</label>
                <input
                  type="number"
                  className="form-control"
                  value={repDailyTarget}
                  onChange={(e) => setRepDailyTarget(e.target.value)}
                  required
                />
              </div>

              {/* Avatar Upload from Device */}
              <AvatarUpload
                value={repAvatar}
                onChange={setRepAvatar}
                label="Sales Rep Photo (From Device)"
                description="Upload photo from device (JPG, PNG) or use default"
                defaultAvatar="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150"
              />

              <button
                type="submit"
                className="btn btn-emerald"
                style={{ width: '100%', marginTop: '14px', padding: '12px' }}
              >
                Create Sales Person Credentials
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
