// FieldVision - Enterprise Cloud Data & Offline Engine
// Synchronized real-time with backend cloud records via /api

// In-memory active cache synchronized with cloud records
let cachedUsers = [];
let cachedVisits = [];
let cachedCustomers = [];
let cachedSettings = {
  companyName: 'Bharat Enterprise FMCG Pvt Ltd',
  currency: 'INR (₹)',
  gpsToleranceMeters: 150,
  autoVerifyWithGps: true,
  requirePhotoProof: true,
  whatsappNotificationsEnabled: true,
  upiVpa: 'bharatfmcg@upi',
  upiMerchantName: 'Bharat Traders Pvt Ltd'
};
let cachedLogs = [];
let cachedZones = [];
let isDbInitialized = false;
let dbListeners = [];

export function subscribeToDbUpdates(fn) {
  dbListeners.push(fn);
  return () => {
    dbListeners = dbListeners.filter(l => l !== fn);
  };
}

export function notifyDbListeners() {
  dbListeners.forEach(fn => {
    try { fn(); } catch (err) { console.error('DB listener error:', err); }
  });
}

/**
 * Real-time SSE Connection Pipeline
 * Listens for live visit creations (routed specifically to the manager)
 * and live visit approvals (routed to admin and relevant manager)
 */
export function initRealtimeSync(currentUser, onRealtimeEvent) {
  if (!currentUser || typeof window === 'undefined') return () => {};

  const streamUrl = `/api/realtime/stream?role=${encodeURIComponent(currentUser.role)}&userId=${encodeURIComponent(currentUser.id || '')}`;
  let eventSource = null;
  let isClosed = false;

  try {
    eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (e) => {
      if (isClosed) return;
      try {
        const data = JSON.parse(e.data);

        if (data.type === 'VISIT_CREATED') {
          const idx = cachedVisits.findIndex(v => v.id === data.visit.id);
          if (idx === -1) {
            cachedVisits.unshift(data.visit);
          } else {
            cachedVisits[idx] = data.visit;
          }
          notifyDbListeners();
          if (onRealtimeEvent) onRealtimeEvent(data);
        } else if (data.type === 'VISIT_APPROVED' || data.type === 'VISIT_STATUS_CHANGED') {
          const idx = cachedVisits.findIndex(v => v.id === data.visit.id);
          if (idx === -1) {
            cachedVisits.unshift(data.visit);
          } else {
            cachedVisits[idx] = data.visit;
          }
          notifyDbListeners();
          if (onRealtimeEvent) onRealtimeEvent(data);
        }
      } catch (err) {
        console.warn('[Realtime SSE] Parse error:', err);
      }
    };
  } catch (err) {
    console.warn('[Realtime SSE] Connection error:', err);
  }

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
    }
  };
}

// Initial hydration from SQLite Database
export async function initDb() {
  try {
    const [usersRes, visitsRes, custRes, settingsRes, logsRes, zonesRes] = await Promise.all([
      fetch('/api/users').then(r => r.ok ? r.json() : []),
      fetch('/api/visits').then(r => r.ok ? r.json() : []),
      fetch('/api/customers').then(r => r.ok ? r.json() : []),
      fetch('/api/settings').then(r => r.ok ? r.json() : {}),
      fetch('/api/audit-logs').then(r => r.ok ? r.json() : []),
      fetch('/api/zones').then(r => r.ok ? r.json() : [])
    ]);

    cachedUsers = usersRes || [];
    cachedVisits = visitsRes || [];
    cachedCustomers = custRes || [];
    if (settingsRes && Object.keys(settingsRes).length > 0) {
      cachedSettings = settingsRes;
    }
    cachedLogs = logsRes || [];
    cachedZones = zonesRes || [];
    isDbInitialized = true;
    return true;
  } catch (err) {
    console.warn('[FieldVision DB] Initial SQLite sync deferred or offline:', err.message);
    return false;
  }
}

// Auto-run init once module is loaded in browser
if (typeof window !== 'undefined') {
  initDb();
}

// ================= USER & HIERARCHY =================

export function getUsers() {
  return cachedUsers;
}

export async function fetchUsers() {
  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      cachedUsers = await res.json();
      return cachedUsers;
    }
  } catch (err) {
    console.error('Failed to fetch users from database:', err);
  }
  return cachedUsers;
}

export async function addUser(userData) {
  const optimisticUser = {
    ...userData,
    id: `usr_${Date.now()}`,
    status: userData.status || 'Active',
    createdAt: new Date().toISOString()
  };
  cachedUsers.unshift(optimisticUser);
  notifyDbListeners();

  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (res.ok) {
      const data = await res.json();
      // Replace optimistic entry with server response
      cachedUsers = cachedUsers.map(u => u.id === optimisticUser.id ? data.user : u);
      notifyDbListeners();
      return data.user;
    }
  } catch (err) {
    console.error('Failed to persist user to SQLite database:', err);
  }
  return optimisticUser;
}

export async function updateUser(id, updates) {
  cachedUsers = cachedUsers.map(u => u.id === id ? { ...u, ...updates } : u);
  notifyDbListeners();

  try {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const data = await res.json();
      cachedUsers = cachedUsers.map(u => u.id === id ? data.user : u);
      notifyDbListeners();
      return data.user;
    }
  } catch (err) {
    console.error('Failed to update user in SQLite database:', err);
  }
  return cachedUsers.find(u => u.id === id);
}

export async function deleteUser(id) {
  const target = cachedUsers.find(u => u.id === id);
  cachedUsers = cachedUsers.filter(u => u.id !== id);
  notifyDbListeners();

  try {
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.error('Failed to delete user in SQLite database:', err);
  }
  return target;
}

export async function reassignRepManager(repId, newManagerId) {
  try {
    const res = await fetch(`/api/users/${repId}/reassign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newManagerId })
    });
    if (res.ok) {
      const data = await res.json();
      await fetchUsers();
      return data.user;
    }
  } catch (err) {
    console.error('Failed to reassign rep:', err);
  }
  return null;
}

export function getSalesRepsByManager(managerId) {
  return cachedUsers.filter(u => u.role === 'sales_rep' && u.managerId === managerId);
}

// ================= VISITS =================

export function getVisits() {
  return cachedVisits;
}

export async function fetchVisits() {
  try {
    const res = await fetch('/api/visits');
    if (res.ok) {
      cachedVisits = await res.json();
      return cachedVisits;
    }
  } catch (err) {
    console.error('Failed to fetch visits from database:', err);
  }
  return cachedVisits;
}

export async function addVisit(visitData) {
  const optimisticVisit = {
    ...visitData,
    id: visitData.id || `vst_${Date.now()}`,
    timestamp: visitData.timestamp || new Date().toISOString(),
    status: visitData.status || 'Pending Verification',
    synced: 1
  };
  cachedVisits.unshift(optimisticVisit);
  notifyDbListeners();

  try {
    const res = await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(optimisticVisit)
    });
    if (res.ok) {
      const data = await res.json();
      cachedVisits = cachedVisits.map(v => v.id === optimisticVisit.id ? data.visit : v);
      notifyDbListeners();
      return data.visit;
    }
  } catch (err) {
    console.warn('Network issue saving visit to SQLite, cached in memory:', err);
  }
  return optimisticVisit;
}

export async function updateVisitStatus(visitId, status, notes = '', user = 'Manager') {
  cachedVisits = cachedVisits.map(v => {
    if (v.id === visitId) {
      return { ...v, status, managerNotes: notes || v.managerNotes };
    }
    return v;
  });
  notifyDbListeners();

  try {
    const res = await fetch(`/api/visits/${visitId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, managerNotes: notes, user })
    });
    if (res.ok) {
      const data = await res.json();
      cachedVisits = cachedVisits.map(v => v.id === visitId ? data.visit : v);
      notifyDbListeners();
      return data.visit;
    }
  } catch (err) {
    console.error('Failed to update visit status in SQLite database:', err);
  }
  return cachedVisits.find(v => v.id === visitId);
}

export function saveVisits(visits) {
  cachedVisits = visits;
  notifyDbListeners();
}

export function saveCustomers(customers) {
  cachedCustomers = customers;
  notifyDbListeners();
}


// ================= CUSTOMERS =================

export function getCustomers() {
  return cachedCustomers;
}

export async function fetchCustomers() {
  try {
    const res = await fetch('/api/customers');
    if (res.ok) {
      cachedCustomers = await res.json();
      return cachedCustomers;
    }
  } catch (err) {
    console.error('Failed to fetch customers:', err);
  }
  return cachedCustomers;
}

export async function addCustomer(customerData) {
  const optimisticCust = {
    ...customerData,
    id: `cust_${Date.now()}`,
    isDuplicate: 0,
    createdAt: new Date().toISOString()
  };
  cachedCustomers.push(optimisticCust);
  notifyDbListeners();

  try {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    if (res.ok) {
      const data = await res.json();
      cachedCustomers = cachedCustomers.map(c => c.id === optimisticCust.id ? data.customer : c);
      notifyDbListeners();
      return data.customer;
    }
  } catch (err) {
    console.error('Failed to add customer in SQLite:', err);
  }
  return optimisticCust;
}

// ================= ZONES & STATES =================

export function getZones() {
  return cachedZones;
}

export async function fetchZones() {
  try {
    const res = await fetch('/api/zones');
    if (res.ok) {
      cachedZones = await res.json();
      return cachedZones;
    }
  } catch (err) {
    console.error('Failed to fetch zones:', err);
  }
  return cachedZones;
}

// ================= SETTINGS & AUDIT =================

export function getCompanySettings() {
  return cachedSettings;
}

export async function saveCompanySettings(settings) {
  cachedSettings = { ...cachedSettings, ...settings };
  notifyDbListeners();

  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
  } catch (err) {
    console.error('Failed to save settings to SQLite:', err);
  }
}

export function getAuditLogs() {
  return cachedLogs;
}

export async function logAuditAction(action, user = 'System') {
  const logItem = {
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action,
    user
  };
  cachedLogs.unshift(logItem);
  notifyDbListeners();
}

// ================= DATABASE INSPECTOR =================

export async function getDatabaseInspectorData() {
  try {
    const res = await fetch('/api/db/inspector');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Failed to inspect database:', err);
  }
  return null;
}

export async function resetDatabaseToSeed() {
  try {
    await fetch('/api/db/reset', { method: 'POST' });
    await initDb();
    return true;
  } catch (err) {
    console.error('Failed to reset SQLite database:', err);
    return false;
  }
}

export async function clearAllVisitsAndCustomers() {
  try {
    await fetch('/api/db/reset', { method: 'POST' });
    await initDb();
  } catch (err) {
    console.error('Failed to clear database:', err);
  }
}

// CSV Export Utility
export function exportToCsv(filename, rows) {
  if (!rows || !rows.length) {
    alert('No visit records found to export for selected filter period.');
    return;
  }

  const keys = Object.keys(rows[0]);
  const csvContent = [
    keys.join(','),
    ...rows.map(row => keys.map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
