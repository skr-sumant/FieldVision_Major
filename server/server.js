import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB, getDbInfo } from './config/db.js';
import User from './models/User.js';
import Zone from './models/Zone.js';
import Visit from './models/Visit.js';
import Customer from './models/Customer.js';
import Settings from './models/Settings.js';
import AuditLog from './models/AuditLog.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '12mb' }));

// Real-Time SSE Stream Architecture
const sseClients = new Set();

app.get('/api/realtime/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const role = req.query.role || 'guest';
  const userId = req.query.userId || '';
  const clientObj = { id: Date.now() + Math.random(), role, userId, res };
  sseClients.add(clientObj);

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', role, userId, timestamp: Date.now() })}\n\n`);

  req.on('close', () => {
    sseClients.delete(clientObj);
  });
});

function broadcastRealtimeEvent(event) {
  for (const client of sseClients) {
    try {
      // 1. If visit was CREATED by a Sales Person:
      // "it will automatically update the manager of that sales person only"
      if (event.type === 'VISIT_CREATED') {
        const isTargetManager = client.role === 'manager' && String(client.userId) === String(event.managerId);
        const isCreatingRep = String(client.userId) === String(event.repId);
        if (isTargetManager || isCreatingRep) {
          client.res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
      }
      // 2. If visit was APPROVED / UPDATED by a Manager:
      // "and also update with the admin if the manager approved the sales and visit"
      else if (event.type === 'VISIT_APPROVED' || event.type === 'VISIT_STATUS_CHANGED') {
        const isAdmin = client.role === 'admin';
        const isManager = client.role === 'manager' && String(client.userId) === String(event.managerId);
        const isRep = String(client.userId) === String(event.repId);
        if (isAdmin || isManager || isRep) {
          client.res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
      } else {
        if (client.role === 'admin') {
          client.res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
      }
    } catch (err) {
      console.error('[Realtime SSE] Error broadcasting to client:', err.message);
    }
  }
}

// Health Check
app.get('/api/health', (req, res) => {
  const info = getDbInfo();
  res.json({
    status: info.connectionState,
    engine: info.engine,
    database: info.databaseName,
    host: info.host,
    port: info.port
  });
});

// MongoDB NoSQL Database Inspector
app.get('/api/db/inspector', async (req, res) => {
  try {
    const info = getDbInfo();
    const [usersCount, visitsCount, customersCount, logsCount, zonesCount] = await Promise.all([
      User.countDocuments(),
      Visit.countDocuments(),
      Customer.countDocuments(),
      AuditLog.countDocuments(),
      Zone.countDocuments()
    ]);

    const latestUsers = await User.find().select('-password').sort({ createdAt: -1 }).limit(20);
    const latestVisits = await Visit.find().sort({ timestamp: -1 }).limit(20);
    const latestCustomers = await Customer.find().limit(20);
    const latestLogs = await AuditLog.find().sort({ timestamp: -1 }).limit(30);

    res.json({
      engine: 'Enterprise Cloud Data Engine',
      databaseType: 'Cloud Document Store',
      databaseName: info.databaseName,
      host: info.host,
      port: info.port,
      collections: ['users', 'zones', 'visits', 'customers', 'settings', 'auditlogs'],
      stats: {
        usersCount,
        visitsCount,
        customersCount,
        logsCount,
        zonesCount
      },
      tablesData: {
        users: latestUsers,
        visits: latestVisits,
        customers: latestCustomers,
        auditLogs: latestLogs
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Zones
app.get('/api/zones', async (req, res) => {
  try {
    const zones = await Zone.find();
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'No registered user account found with this email address.' });
    }

    const isBcrypt = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
    let isMatch = false;

    if (isBcrypt) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // Legacy plaintext check
      isMatch = (user.password === password);
      // Auto upgrade plaintext to bcrypt hash upon successful login
      if (isMatch) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
        console.log(`[FieldVision MongoDB] Auto-upgraded password for ${user.email} to bcrypt hash`);
      }
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated by Company Admin.' });
    }

    await AuditLog.create({
      action: `User logged in as ${user.role.toUpperCase()}`,
      user: user.name
    });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Users Management
app.get('/api/users', async (req, res) => {
  try {
    const { role, managerId, zone } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (managerId) filter.managerId = managerId;
    if (zone) filter.zone = zone;

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create User (Admin creates Manager with Zone/State; Manager creates Sales Rep)
app.post('/api/users', async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      role,
      phone,
      zone,
      state,
      managerId,
      territory,
      dailyTarget,
      avatar,
      status
    } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ success: false, message: 'Missing required user fields' });
    }

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User with this email already exists in system records' });
    }

    // Encrypt password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const defaultAvatar = avatar || (role === 'manager'
      ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'
      : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150');

    const liveLoc = role === 'sales_rep' ? {
      lat: 19.0760 + (Math.random() - 0.5) * 0.1,
      lng: 72.8777 + (Math.random() - 0.5) * 0.1,
      address: `${territory || state || 'Field Area'}, Live Telemetry Node`,
      lastUpdated: new Date().toISOString()
    } : null;

    const newUser = new User({
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      role,
      phone: phone || '',
      zone: zone || '',
      state: state || '',
      managerId: managerId || null,
      territory: territory || '',
      dailyTarget: dailyTarget ? parseInt(dailyTarget, 10) : 15,
      avatar: defaultAvatar,
      status: status || 'Active',
      liveLocation: liveLoc,
      assignedRepIds: []
    });

    const savedUser = await newUser.save();

    // If Sales Rep created by Manager, append repId to manager's assignedRepIds
    if (role === 'sales_rep' && managerId) {
      await User.findByIdAndUpdate(managerId, {
        $addToSet: { assignedRepIds: savedUser.id }
      });
    }

    await AuditLog.create({
      action: `Created user ${name} (${role.toUpperCase()}) with encrypted credentials. Zone: ${zone || 'N/A'}, State: ${state || 'N/A'}`,
      user: 'Admin/Manager'
    });

    res.status(201).json({ success: true, user: savedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update User
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // If password is being updated, encrypt it
    if (updates.password && !updates.password.startsWith('$2a$') && !updates.password.startsWith('$2b$')) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updated = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reassign Rep
app.post('/api/users/:repId/reassign', async (req, res) => {
  try {
    const { repId } = req.params;
    const { newManagerId } = req.body;

    const rep = await User.findById(repId);
    const newMgr = await User.findById(newManagerId);

    if (!rep || !newMgr) {
      return res.status(404).json({ success: false, message: 'Rep or Manager not found' });
    }

    const oldManagerId = rep.managerId;
    rep.managerId = newManagerId;
    rep.zone = newMgr.zone || rep.zone;
    rep.state = newMgr.state || rep.state;
    await rep.save();

    if (oldManagerId) {
      await User.findByIdAndUpdate(oldManagerId, {
        $pull: { assignedRepIds: repId }
      });
    }
    await User.findByIdAndUpdate(newManagerId, {
      $addToSet: { assignedRepIds: repId }
    });

    await AuditLog.create({
      action: `Reassigned Sales Rep ${rep.name} to Manager ${newMgr.name}`,
      user: 'Admin'
    });

    res.json({ success: true, user: rep });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete User
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const target = await User.findByIdAndDelete(id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (target.managerId) {
      await User.findByIdAndUpdate(target.managerId, {
        $pull: { assignedRepIds: id }
      });
    }

    await AuditLog.create({
      action: `Deleted user ${target.name} (${target.role}) from MongoDB`,
      user: 'Admin'
    });

    res.json({ success: true, message: 'User deleted successfully from MongoDB' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Visits Management
app.get('/api/visits', async (req, res) => {
  try {
    const { repId, managerId, zone, state } = req.query;
    const filter = {};
    if (repId) filter.repId = repId;
    if (managerId) filter.managerId = managerId;
    if (zone) filter.zone = zone;
    if (state) filter.state = state;

    const visits = await Visit.find(filter).sort({ timestamp: -1 });
    res.json(visits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/visits', async (req, res) => {
  try {
    const visitData = req.body;

    // Ensure managerId is populated from rep if not directly provided
    let managerId = visitData.managerId;
    if (!managerId && visitData.repId) {
      const rep = await User.findById(visitData.repId);
      if (rep && rep.managerId) {
        managerId = rep.managerId;
      }
    }

    const lat = visitData.lat || (visitData.gpsLocation && visitData.gpsLocation.lat) || 19.0760;
    const lng = visitData.lng || (visitData.gpsLocation && visitData.gpsLocation.lng) || 72.8777;
    const distanceMeters = visitData.distanceMeters || (visitData.gpsLocation && Math.round(visitData.gpsLocation.accuracyMeters)) || 4;
    const orderAmount = Number(visitData.orderAmount) || 0;

    const visit = new Visit({
      ...visitData,
      lat,
      lng,
      distanceMeters,
      orderAmount,
      managerId,
      timestamp: visitData.timestamp || new Date()
    });
    const saved = await visit.save();

    await AuditLog.create({
      action: `Recorded visit for ${saved.shopName} by ${saved.repName} (₹${orderAmount})`,
      user: saved.repName || 'Sales Rep'
    });

    // Real-time broadcast to the specific manager of this sales person only!
    broadcastRealtimeEvent({
      type: 'VISIT_CREATED',
      visit: saved,
      managerId: saved.managerId,
      repId: saved.repId,
      repName: saved.repName,
      shopName: saved.shopName,
      orderTotal: saved.orderAmount || saved.orderTotal || 0
    });

    res.status(201).json({ success: true, visit: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Visit Status
app.put('/api/visits/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, managerNotes, user } = req.body;

    const visit = await Visit.findByIdAndUpdate(
      id,
      { status, managerNotes },
      { new: true }
    );

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    await AuditLog.create({
      action: `Updated visit status to ${status} for ${visit.shopName}`,
      user: user || 'Manager'
    });

    // Real-time broadcast to Admin (and relevant parties) when manager approves sales/visit
    broadcastRealtimeEvent({
      type: status === 'Verified' ? 'VISIT_APPROVED' : 'VISIT_STATUS_CHANGED',
      visit,
      managerId: visit.managerId,
      repId: visit.repId,
      status,
      approvedBy: user || 'Manager',
      shopName: visit.shopName,
      orderTotal: visit.orderTotal
    });

    res.json({ success: true, visit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Customers
app.get('/api/customers', async (req, res) => {
  try {
    const { zone, state } = req.query;
    const filter = {};
    if (zone) filter.zone = zone;
    if (state) filter.state = state;
    const customers = await Customer.find(filter).sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const customer = new Customer(req.body);
    const saved = await customer.save();
    res.status(201).json({ success: true, customer: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Settings
app.get('/api/settings', async (req, res) => {
  try {
    const items = await Settings.find();
    const settingsObj = {};
    items.forEach(item => { settingsObj[item.key] = item.value; });
    res.json(settingsObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const newSettings = req.body;
    for (const [key, value] of Object.entries(newSettings)) {
      await Settings.findOneAndUpdate({ key }, { key, value }, { upsert: true });
    }

    await AuditLog.create({
      action: 'Updated enterprise company settings in MongoDB',
      user: 'Admin'
    });

    res.json({ success: true, settings: newSettings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Audit Logs
app.get('/api/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Database (Admin Only)
app.post('/api/db/reset', async (req, res) => {
  try {
    await Visit.deleteMany({});
    await Customer.deleteMany({});
    await User.deleteMany({ role: { $ne: 'admin' } });
    await AuditLog.deleteMany({});

    await AuditLog.create({
      action: 'MongoDB database reset: only master Admin retained',
      user: 'Admin'
    });

    res.json({ success: true, message: 'MongoDB reset to clean state with only master Admin.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Start Server
app.listen(PORT, async () => {
  console.log(`[FieldVision Server] Listening on http://localhost:${PORT}`);
  try {
    await connectDB();
  } catch (err) {
    console.error('[FieldVision Server] MongoDB startup error:', err.message);
  }
});
