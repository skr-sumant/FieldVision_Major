import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AvatarUpload from '../common/AvatarUpload';
import {
  fetchUsers,
  addUser,
  updateUser,
  deleteUser,
  reassignRepManager,
  getCompanySettings,
  saveCompanySettings,
  getAuditLogs,
  fetchVisits,
  fetchCustomers,
  getDatabaseInspectorData,
  resetDatabaseToSeed,
  clearAllVisitsAndCustomers,
  subscribeToDbUpdates,
  initRealtimeSync
} from '../../services/db';
import { scanDuplicates, executeAiDataCleaning } from '../../services/AiDataCleaningEngine';
import AdminAnalyticsDashboard from './AdminAnalyticsDashboard';
import {
  ShieldCheck,
  Users,
  Sparkles,
  Award,
  Settings,
  Activity,
  UserPlus,
  RefreshCw,
  Trash2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Building,
  KeyRound,
  Database,
  GitFork,
  ArrowRight,
  UserCheck,
  MapPin,
  Layers,
  Map,
  Check,
  Edit2,
  Eye,
  Server,
  BarChart3,
  SlidersHorizontal,
  Bell
} from 'lucide-react';

const INDIA_ZONES_DATA = [
  {
    id: 'zone_north',
    name: 'North Zone',
    states: ['Delhi NCR', 'Punjab', 'Haryana', 'Uttar Pradesh', 'Rajasthan', 'Himachal Pradesh', 'Uttarakhand', 'Jammu & Kashmir']
  },
  {
    id: 'zone_west',
    name: 'West Zone',
    states: ['Maharashtra', 'Gujarat', 'Goa', 'Madhya Pradesh']
  },
  {
    id: 'zone_south',
    name: 'South Zone',
    states: ['Karnataka', 'Tamil Nadu', 'Telangana', 'Andhra Pradesh', 'Kerala']
  },
  {
    id: 'zone_east',
    name: 'East Zone',
    states: ['West Bengal', 'Bihar', 'Odisha', 'Jharkhand', 'Assam & North East']
  },
  {
    id: 'zone_central',
    name: 'Central Zone',
    states: ['Chhattisgarh', 'Madhya Pradesh']
  }
];

export default function AdminDashboard() {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'hierarchy', 'managers', 'users', 'ai_cleaner', 'other'
  const [otherSubTab, setOtherSubTab] = useState('logs'); // 'logs', 'database', 'settings'
  const [realtimeNotice, setRealtimeNotice] = useState(null);
  const [users, setUsers] = useState([]);
  const [visits, setVisits] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState({});
  const [logs, setLogs] = useState([]);
  const [dbInspector, setDbInspector] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // AI Cleaner State
  const [scanResult, setScanResult] = useState(null);
  const [cleanerMsg, setCleanerMsg] = useState('');

  // New Manager Creation Modal State
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  const [mgrName, setMgrName] = useState('');
  const [mgrEmail, setMgrEmail] = useState('');
  const [mgrPassword, setMgrPassword] = useState('Manager@2026');
  const [mgrPhone, setMgrPhone] = useState('');
  const [mgrZone, setMgrZone] = useState('West Zone');
  const [mgrState, setMgrState] = useState('Maharashtra');
  const [mgrAvatar, setMgrAvatar] = useState('');

  // Edit Zone/State Modal State
  const [editingManager, setEditingManager] = useState(null);
  const [editZone, setEditZone] = useState('');
  const [editState, setEditState] = useState('');

  useEffect(() => {
    loadAllData();

    // Listen for real-time manager approval events
    const unsubRealtime = initRealtimeSync(currentUser, (evt) => {
      if (evt.type === 'VISIT_APPROVED') {
        setRealtimeNotice({
          title: 'Live Approval Telemetry',
          message: `Visit for ${evt.shopName || 'Retail Shop'} (₹${evt.orderTotal || 0}) was approved by Manager ${evt.approvedBy || ''}! Executive analytics updated.`
        });
        loadAllData();
        setTimeout(() => setRealtimeNotice(null), 7000);
      }
    });

    return () => {
      unsubRealtime();
    };
  }, [currentUser]);

  const loadAllData = async () => {
    setIsLoading(true);
    const [allUsers, allVisits, allCustomers, insp] = await Promise.all([
      fetchUsers(),
      fetchVisits(),
      fetchCustomers(),
      getDatabaseInspectorData()
    ]);
    setUsers(allUsers || []);
    setVisits(allVisits || []);
    setCustomers(allCustomers || []);
    setSettings(getCompanySettings());
    setLogs(getAuditLogs());
    setDbInspector(insp);
    setScanResult(scanDuplicates());
    setIsLoading(false);
  };

  const managers = users.filter(u => u.role === 'manager');
  const salesReps = users.filter(u => u.role === 'sales_rep');

  // Handle Create Manager
  const handleCreateManager = async (e) => {
    e.preventDefault();
    if (!mgrName || !mgrEmail || !mgrPassword) return;

    await addUser({
      name: mgrName.trim(),
      email: mgrEmail.trim().toLowerCase(),
      password: mgrPassword,
      role: 'manager',
      phone: mgrPhone,
      zone: mgrZone,
      state: mgrState,
      avatar: mgrAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      status: 'Active'
    });

    alert(`Successfully created Regional Manager account for ${mgrName} assigned to ${mgrZone} (${mgrState})!`);
    setShowAddManagerModal(false);
    setMgrName('');
    setMgrEmail('');
    setMgrPhone('');
    setMgrAvatar('');
    loadAllData();
  };

  // Handle Edit Manager Zone/State
  const handleSaveManagerZone = async (e) => {
    e.preventDefault();
    if (!editingManager) return;

    await updateUser(editingManager.id, {
      zone: editZone,
      state: editState
    });

    alert(`Updated zone and state for ${editingManager.name} to ${editZone} (${editState})`);
    setEditingManager(null);
    loadAllData();
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    await updateUser(userId, { status: newStatus });
    loadAllData();
  };

  const handleResetPasswordPrompt = async (userId, userName) => {
    const newPass = prompt(`Enter new password for ${userName}:`, 'Field@2026');
    if (newPass) {
      await updateUser(userId, { password: newPass });
      alert(`Password updated for ${userName}`);
      loadAllData();
    }
  };

  const handleDeleteUserClick = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to permanently delete user ${userName}?`)) {
      await deleteUser(userId);
      loadAllData();
    }
  };

  const handleRunAiCleaner = () => {
    const res = executeAiDataCleaning();
    setCleanerMsg(res.message);
    loadAllData();
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    await saveCompanySettings(settings);
    alert('Enterprise settings saved successfully!');
    loadAllData();
  };

  const handleResetDbClick = async () => {
    if (window.confirm('CAUTION: This will reset all field records and test telemetry, retaining ONLY your Master Admin credentials. Proceed?')) {
      await resetDatabaseToSeed();
      alert('System reset to initial clean state with Master Admin account.');
      loadAllData();
    }
  };

  // Get states for selected zone in Create Manager modal
  const selectedZoneStates = INDIA_ZONES_DATA.find(z => z.name === mgrZone)?.states || [];
  const editZoneStates = INDIA_ZONES_DATA.find(z => z.name === editZone)?.states || [];

  return (
    <div style={{ maxWidth: '1440px', margin: '24px auto', padding: '0 24px' }}>
      {/* Top Banner / Master Control Header */}
      <div className="glass-panel" style={{
        padding: '24px 30px',
        marginBottom: '24px',
        background: 'linear-gradient(135deg, rgba(14, 21, 38, 0.95) 0%, rgba(22, 32, 56, 0.9) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
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
            background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px rgba(139, 92, 246, 0.4)'
          }}>
            <ShieldCheck size={30} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Admin Master Command Center
              </h1>
              <span className="badge badge-purple">
                Full System Access
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: '2px' }}>
              Manage commercial zones & states, authorize Regional Managers, review live analytics, and oversee all enterprise field telemetry.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAddManagerModal(true)}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.9rem' }}
          >
            <UserPlus size={16} /> Create Regional Manager
          </button>
          <button
            onClick={loadAllData}
            className="btn btn-secondary"
            title="Refresh Records"
          >
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Real-time Notification Banner */}
      {realtimeNotice && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '24px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)',
          color: '#ffffff',
          padding: '14px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideInRight 0.3s ease',
          maxWidth: '420px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
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

      {/* Navigation Tabs */}
      <div className="tab-container" style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
        >
          <BarChart3 size={16} /> Executive Dashboard & Analytics
        </button>
        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`tab-button ${activeTab === 'hierarchy' ? 'active' : ''}`}
        >
          <GitFork size={16} /> Commercial Hierarchy & Zones
        </button>
        <button
          onClick={() => setActiveTab('managers')}
          className={`tab-button ${activeTab === 'managers' ? 'active' : ''}`}
        >
          <Building size={16} /> Regional Managers ({managers.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
        >
          <Users size={16} /> All Accounts ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('ai_cleaner')}
          className={`tab-button ${activeTab === 'ai_cleaner' ? 'active' : ''}`}
        >
          <Sparkles size={16} /> AI Data Engine
        </button>
        <button
          onClick={() => setActiveTab('other')}
          className={`tab-button ${activeTab === 'other' ? 'active' : ''}`}
        >
          <SlidersHorizontal size={16} /> Other Options
        </button>
      </div>

      {/* TAB 0: EXECUTIVE ANALYTICS & REPORTS (FLAGSHIP PRIMARY VIEW) */}
      {activeTab === 'analytics' && (
        <AdminAnalyticsDashboard
          visits={visits}
          managers={managers}
          salesReps={salesReps}
          customers={customers}
          zones={INDIA_ZONES_DATA}
          settings={settings}
          onOpenAddManager={() => setShowAddManagerModal(true)}
        />
      )}

      {/* TAB 1: ENTERPRISE HIERARCHY & ZONES */}
      {activeTab === 'hierarchy' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {/* Admin Node */}
          <div className="glass-panel" style={{ padding: '24px', gridColumn: '1 / -1', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShieldCheck size={24} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                    {currentUser?.name} (Master Administrator)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#c084fc' }}>
                    Global Access • {currentUser?.email} • Authority: Assign Zones, Create Managers
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAddManagerModal(true)}
                className="btn btn-primary btn-sm"
              >
                <UserPlus size={14} /> Assign New Manager & Zone
              </button>
            </div>
          </div>

          {/* Zones & Managers Cards */}
          {INDIA_ZONES_DATA.map(zone => {
            const zoneManagers = managers.filter(m => m.zone === zone.name);

            return (
              <div key={zone.id} className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Map size={18} color="#06b6d4" />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                      {zone.name}
                    </h3>
                  </div>
                  <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                    {zoneManagers.length} {zoneManagers.length === 1 ? 'Manager' : 'Managers'}
                  </span>
                </div>

                <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginBottom: '14px' }}>
                  <span style={{ fontWeight: 600, color: '#cbd5e1' }}>Covered States:</span> {zone.states.join(', ')}
                </div>

                {zoneManagers.length === 0 ? (
                  <div style={{
                    padding: '16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '0.82rem'
                  }}>
                    No Manager assigned to {zone.name} yet.
                    <div style={{ marginTop: '8px' }}>
                      <button
                        onClick={() => {
                          setMgrZone(zone.name);
                          setMgrState(zone.states[0]);
                          setShowAddManagerModal(true);
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        <UserPlus size={13} /> Assign Manager
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {zoneManagers.map(mgr => {
                      const mgrReps = salesReps.filter(r => r.managerId === mgr.id);

                      return (
                        <div key={mgr.id} style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          background: 'rgba(22, 32, 56, 0.7)',
                          border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}>
                                {mgr.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#06b6d4' }}>
                                State: <span style={{ fontWeight: 600, color: '#ffffff' }}>{mgr.state || 'All Zone'}</span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                                {mgr.email} • {mgr.phone || 'No phone'}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setEditingManager(mgr);
                                setEditZone(mgr.zone || zone.name);
                                setEditState(mgr.state || zone.states[0]);
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                              title="Edit Zone/State"
                            >
                              <Edit2 size={12} /> Edit Zone
                            </button>
                          </div>

                          {/* Sub-tree: Sales Reps under Manager */}
                          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                              Sales Reps created by {mgr.name} ({mgrReps.length}):
                            </div>
                            {mgrReps.length === 0 ? (
                              <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
                                Manager has not created any Sales Reps yet.
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {mgrReps.map(rep => (
                                  <span key={rep.id} className="badge badge-emerald" style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                                    {rep.name} ({rep.territory || 'Territory'})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: MANAGERS DIRECTORY */}
      {activeTab === 'managers' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                Regional Managers & Jurisdictions
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Managers have authority to recruit and create login credentials for field sales representatives in their assigned Zone & State.
              </p>
            </div>
            <button
              onClick={() => setShowAddManagerModal(true)}
              className="btn btn-primary"
            >
              <UserPlus size={16} /> Create Regional Manager
            </button>
          </div>

          {managers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <Building size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <h3>No Regional Managers Created Yet</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '6px', maxWidth: '500px', margin: '6px auto 16px' }}>
                As Master Admin, you must create at least one Regional Manager and assign them a Zone or State. The Manager will then create their team of Sales Persons.
              </p>
              <button onClick={() => setShowAddManagerModal(true)} className="btn btn-primary">
                <UserPlus size={16} /> Create First Manager
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Manager Name</th>
                    <th>Email Address</th>
                    <th>Assigned Zone</th>
                    <th>Assigned State</th>
                    <th>Sales Reps Under Manager</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {managers.map(mgr => {
                    const repCount = salesReps.filter(r => r.managerId === mgr.id).length;

                    return (
                      <tr key={mgr.id}>
                        <td style={{ fontWeight: 700, color: '#ffffff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={mgr.avatar}
                              alt=""
                              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div>
                              {mgr.name}
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400 }}>{mgr.phone || 'No phone'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{mgr.email}</td>
                        <td>
                          <span className="badge badge-cyan">{mgr.zone || 'Unassigned'}</span>
                        </td>
                        <td>
                          <span className="badge badge-purple">{mgr.state || 'All State'}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#10b981' }}>
                          {repCount} {repCount === 1 ? 'Rep' : 'Reps'}
                        </td>
                        <td>
                          <span className={`badge ${mgr.status === 'Active' ? 'badge-emerald' : 'badge-rose'}`}>
                            {mgr.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => {
                                setEditingManager(mgr);
                                setEditZone(mgr.zone || 'West Zone');
                                setEditState(mgr.state || 'Maharashtra');
                              }}
                              className="btn btn-secondary btn-sm"
                              title="Reassign Zone/State"
                            >
                              <Edit2 size={13} /> Edit Zone
                            </button>
                            <button
                              onClick={() => handleResetPasswordPrompt(mgr.id, mgr.name)}
                              className="btn btn-secondary btn-sm"
                              title="Reset Password"
                            >
                              <KeyRound size={13} />
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(mgr.id, mgr.status)}
                              className="btn btn-secondary btn-sm"
                              title={mgr.status === 'Active' ? 'Deactivate' : 'Activate'}
                            >
                              {mgr.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteUserClick(mgr.id, mgr.name)}
                              className="btn btn-rose btn-sm"
                              title="Delete Account"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
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

      {/* TAB 3: ALL USER ACCOUNTS */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                All Platform User Accounts
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Full directory of Admin, Regional Managers, and Field Sales Representatives.
              </p>
            </div>
            <button
              onClick={() => setShowAddManagerModal(true)}
              className="btn btn-primary"
            >
              <UserPlus size={16} /> Add Regional Manager
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Zone / Territory</th>
                  <th>Assigned Manager</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const mgr = users.find(m => m.id === u.managerId);

                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 700, color: '#ffffff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={u.avatar} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                          {u.name}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-purple' : u.role === 'manager' ? 'badge-cyan' : 'badge-emerald'}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{u.email}</td>
                      <td>
                        {u.role === 'admin' ? 'All India HQ' : (u.zone ? `${u.zone} (${u.state || u.territory})` : u.territory || 'National')}
                      </td>
                      <td>{mgr ? mgr.name : '—'}</td>
                      <td>
                        <span className={`badge ${u.status === 'Active' ? 'badge-emerald' : 'badge-rose'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td>
                        {u.role !== 'admin' && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleResetPasswordPrompt(u.id, u.name)}
                              className="btn btn-secondary btn-sm"
                              title="Reset Password"
                            >
                              <KeyRound size={12} />
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(u.id, u.status)}
                              className="btn btn-secondary btn-sm"
                            >
                              {u.status === 'Active' ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => handleDeleteUserClick(u.id, u.name)}
                              className="btn btn-rose btn-sm"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AI DATA CLEANER */}
      {activeTab === 'ai_cleaner' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                AI Geolocation & Shop Duplicate Cleaner
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Runs string phonetic & GPS distance algorithms across registered retail shops in the database.
              </p>
            </div>
          </div>

          {cleanerMsg && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', marginBottom: '16px', fontSize: '0.85rem' }}>
              {cleanerMsg}
            </div>
          )}

          <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(22, 32, 56, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                Clean Status: {scanResult?.duplicatesFound ? `${scanResult.duplicatesFound} Potential Duplicate(s) Detected` : 'All Clean (0 Duplicates)'}
              </h3>
              <button onClick={handleRunAiCleaner} className="btn btn-emerald">
                <Sparkles size={16} /> Run Automated AI Deduplication
              </button>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6 }}>
              Field sales representatives often register the same kirana/general store under minor spelling variations (e.g. "Ganesh Stores" vs "Shree Ganesh Kirana"). The AI engine merges these into a single master profile and recalculates visit metrics.
            </p>
          </div>
        </div>
      )}

      {/* TAB 6: OTHER OPTIONS (AUDIT LOGS, CLOUD DATA INSPECTOR, SETTINGS) */}
      {activeTab === 'other' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Sub-Tabs Selector inside Other Options */}
          <div style={{
            display: 'flex',
            gap: '8px',
            background: 'rgba(22, 32, 56, 0.7)',
            padding: '6px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            width: 'fit-content',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setOtherSubTab('logs')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.84rem',
                fontWeight: 600,
                background: otherSubTab === 'logs' ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' : 'transparent',
                color: otherSubTab === 'logs' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.2s'
              }}
            >
              <Activity size={15} /> Audit Logs
            </button>
            <button
              onClick={() => setOtherSubTab('database')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.84rem',
                fontWeight: 600,
                background: otherSubTab === 'database' ? 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)' : 'transparent',
                color: otherSubTab === 'database' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.2s'
              }}
            >
              <Layers size={15} /> Cloud Data Inspector
            </button>
            <button
              onClick={() => setOtherSubTab('settings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.84rem',
                fontWeight: 600,
                background: otherSubTab === 'settings' ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'transparent',
                color: otherSubTab === 'settings' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.2s'
              }}
            >
              <Settings size={15} /> Enterprise Settings
            </button>
          </div>

          {/* Sub-View 1: Audit Logs */}
          {otherSubTab === 'logs' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                    Immutable System Audit Logs
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                    Historical log of user authentications, data synchronization, and managerial approvals
                  </p>
                </div>
                <button onClick={loadAllData} className="btn btn-secondary btn-sm">
                  <RefreshCw size={14} /> Refresh Logs
                </button>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Action</th>
                      <th>Initiator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td style={{ fontSize: '0.78rem', color: '#94a3b8', width: '200px' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td style={{ color: '#ffffff', fontWeight: 500 }}>{log.action}</td>
                        <td>
                          <span className="badge badge-purple">{log.user}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-View 2: Cloud Data Inspector */}
          {otherSubTab === 'database' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Server size={20} color="#10b981" />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                      Enterprise Cloud Data Engine
                    </h2>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                    Status: <span style={{ color: '#22d3ee', fontWeight: 600 }}>Active Synchronized</span> • Telemetry Pipeline: <span style={{ color: '#10b981', fontWeight: 600 }}>Online</span> • Collections: users, zones, visits, customers, settings, auditlogs
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={loadAllData} className="btn btn-secondary btn-sm">
                    <RefreshCw size={14} /> Refresh Records
                  </button>
                  <button onClick={handleResetDbClick} className="btn btn-rose btn-sm">
                    Reset System Seed (Admin Only)
                  </button>
                </div>
              </div>

              {/* Database Collections Summary */}
              {dbInspector && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ background: 'rgba(22, 32, 56, 0.7)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>USERS DIRECTORY</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>{dbInspector.stats?.usersCount || 0} records</div>
                  </div>
                  <div style={{ background: 'rgba(22, 32, 56, 0.7)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>FIELD VISITS</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{dbInspector.stats?.visitsCount || 0} records</div>
                  </div>
                  <div style={{ background: 'rgba(22, 32, 56, 0.7)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>CUSTOMERS REGISTERED</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#06b6d4' }}>{dbInspector.stats?.customersCount || 0} records</div>
                  </div>
                  <div style={{ background: 'rgba(22, 32, 56, 0.7)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>AUDIT TRAIL LOGS</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8b5cf6' }}>{dbInspector.stats?.logsCount || 0} records</div>
                  </div>
                </div>
              )}

              {/* Raw Visits Records */}
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
                Latest Synchronized Field Visits ({visits.length} Total)
              </h3>
              {visits.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                  No visit entries recorded yet. Visits logged by Sales Reps will appear here in real-time.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Visit ID</th>
                        <th>Rep</th>
                        <th>Shop / Customer</th>
                        <th>Zone & State</th>
                        <th>Order Value</th>
                        <th>Status</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visits.slice(0, 10).map(v => (
                        <tr key={v.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{v.id}</td>
                          <td style={{ fontWeight: 600 }}>{v.repName}</td>
                          <td>{v.shopName}</td>
                          <td>{v.zone || 'N/A'} ({v.state || 'N/A'})</td>
                          <td style={{ color: '#10b981', fontWeight: 700 }}>₹{v.orderAmount || v.orderTotal || 0}</td>
                          <td>
                            <span className={`badge ${v.status === 'Verified' ? 'badge-emerald' : 'badge-amber'}`}>
                              {v.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{new Date(v.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Sub-View 3: Enterprise Settings */}
          {otherSubTab === 'settings' && (
            <div className="glass-panel" style={{ padding: '24px', maxWidth: '680px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>
                Enterprise Company Settings
              </h2>
              <form onSubmit={handleSaveSettings}>
                <div className="form-group">
                  <label>Company Legal Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.companyName || ''}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>GPS Geofence Tolerance Threshold (Meters)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={settings.gpsToleranceMeters || 150}
                    onChange={(e) => setSettings({ ...settings, gpsToleranceMeters: parseInt(e.target.value, 10) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Company UPI VPA for Dynamic QR</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.upiVpa || 'bharatfmcg@upi'}
                    onChange={(e) => setSettings({ ...settings, upiVpa: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>UPI Merchant Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.upiMerchantName || 'Bharat Traders Pvt Ltd'}
                    onChange={(e) => setSettings({ ...settings, upiMerchantName: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                  Save Enterprise Settings
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* MODAL: CREATE REGIONAL MANAGER */}
      {showAddManagerModal && (
        <div className="modal-overlay" onClick={() => setShowAddManagerModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Building size={20} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                    Create Regional Manager
                  </h3>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Assign Commercial Zone & State jurisdiction
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddManagerModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateManager}>
              <div className="form-group">
                <label>Manager Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Vikram Malhotra"
                  value={mgrName}
                  onChange={(e) => setMgrName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Corporate Email (Used for Sign In) *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. vikram@fieldvision.in"
                  value={mgrEmail}
                  onChange={(e) => setMgrEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Login Password *</label>
                <input
                  type="text"
                  className="form-control"
                  value={mgrPassword}
                  onChange={(e) => setMgrPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+91 98190 22334"
                  value={mgrPhone}
                  onChange={(e) => setMgrPhone(e.target.value)}
                />
              </div>

              {/* Commercial Zone Selection */}
              <div className="form-group">
                <label>Assign Commercial Zone *</label>
                <select
                  className="form-control"
                  value={mgrZone}
                  onChange={(e) => {
                    setMgrZone(e.target.value);
                    const states = INDIA_ZONES_DATA.find(z => z.name === e.target.value)?.states || [];
                    if (states.length > 0) setMgrState(states[0]);
                  }}
                  required
                >
                  {INDIA_ZONES_DATA.map(z => (
                    <option key={z.id} value={z.name}>{z.name}</option>
                  ))}
                </select>
              </div>

              {/* State Selection */}
              <div className="form-group">
                <label>Assign Primary State (Under {mgrZone}) *</label>
                <select
                  className="form-control"
                  value={mgrState}
                  onChange={(e) => setMgrState(e.target.value)}
                  required
                >
                  {selectedZoneStates.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Avatar Upload from Device */}
              <AvatarUpload
                value={mgrAvatar}
                onChange={setMgrAvatar}
                label="Manager Profile Avatar (From Device)"
                description="Click or drag a photo from this device (JPG, PNG) or use default"
                defaultAvatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
              />

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '14px', padding: '12px' }}
              >
                Create Regional Manager Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT MANAGER ZONE / STATE */}
      {editingManager && (
        <div className="modal-overlay" onClick={() => setEditingManager(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                Reassign Zone & State for {editingManager.name}
              </h3>
              <button onClick={() => setEditingManager(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveManagerZone}>
              <div className="form-group">
                <label>Select New Commercial Zone</label>
                <select
                  className="form-control"
                  value={editZone}
                  onChange={(e) => {
                    setEditZone(e.target.value);
                    const states = INDIA_ZONES_DATA.find(z => z.name === e.target.value)?.states || [];
                    if (states.length > 0) setEditState(states[0]);
                  }}
                >
                  {INDIA_ZONES_DATA.map(z => (
                    <option key={z.id} value={z.name}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select State (Under {editZone})</label>
                <select
                  className="form-control"
                  value={editState}
                  onChange={(e) => setEditState(e.target.value)}
                >
                  {editZoneStates.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px', padding: '12px' }}>
                Save Zone & State Reassignment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
