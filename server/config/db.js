import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Zone from '../models/Zone.js';
import Settings from '../models/Settings.js';
import AuditLog from '../models/AuditLog.js';

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI ;
  console.log(`[FieldVision MongoDB] Connecting to MongoDB at ${mongoUri}...`);

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[FieldVision MongoDB] Successfully connected to MongoDB database: ${mongoose.connection.name}`);
    await seedInitialData();
  } catch (err) {
    console.error(`[FieldVision MongoDB] Connection error to ${mongoUri}:`, err.message);
    console.log('[FieldVision MongoDB] TIP: If using MongoDB Atlas, set MONGODB_URI in server/.env');
    console.log('[FieldVision MongoDB] TIP: If using local MongoDB, ensure MongoDB service (mongod) is running on port 27017');
    throw err;
  }
}

export function getDbInfo() {
  return {
    engine: 'MongoDB (Mongoose ODM)',
    connectionState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    databaseName: mongoose.connection.name || 'fieldvision',
    host: mongoose.connection.host || '127.0.0.1',
    port: mongoose.connection.port || 27017
  };
}

async function seedInitialData() {
  // 1. Seed Zones
  const zoneCount = await Zone.countDocuments();
  if (zoneCount === 0) {
    const seedZones = [
      { name: 'North Zone', states: ['Delhi NCR', 'Punjab', 'Haryana', 'Uttar Pradesh', 'Rajasthan', 'Himachal Pradesh', 'Uttarakhand', 'Jammu & Kashmir'] },
      { name: 'West Zone', states: ['Maharashtra', 'Gujarat', 'Goa', 'Madhya Pradesh'] },
      { name: 'South Zone', states: ['Karnataka', 'Tamil Nadu', 'Telangana', 'Andhra Pradesh', 'Kerala'] },
      { name: 'East Zone', states: ['West Bengal', 'Bihar', 'Odisha', 'Jharkhand', 'Assam & North East'] },
      { name: 'Central Zone', states: ['Chhattisgarh', 'Madhya Pradesh'] }
    ];
    await Zone.insertMany(seedZones);
    console.log('[FieldVision MongoDB] Seeded commercial zones in MongoDB collection: zones');
  }

  // 2. Seed Settings
  const settingsCount = await Settings.countDocuments();
  if (settingsCount === 0) {
    const defaultSettings = [
      { key: 'companyName', value: 'Bharat Enterprise FMCG Pvt Ltd' },
      { key: 'currency', value: 'INR (₹)' },
      { key: 'gpsToleranceMeters', value: 150 },
      { key: 'autoVerifyWithGps', value: true },
      { key: 'requirePhotoProof', value: true },
      { key: 'whatsappNotificationsEnabled', value: true },
      { key: 'upiVpa', value: 'bharatfmcg@upi' },
      { key: 'upiMerchantName', value: 'Bharat Traders Pvt Ltd' }
    ];
    await Settings.insertMany(defaultSettings);
    console.log('[FieldVision MongoDB] Seeded settings in MongoDB collection: settings');
  }

  // 3. Seed or Upgrade Master Admin & Existing Users with Bcrypt Encrypted Passwords
  const existingAdmin = await User.findOne({ email: 'admin@fieldvision.in' });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin@2026', 10);
    const masterAdmin = new User({
      email: 'admin@fieldvision.in',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'admin',
      phone: '+91 98765 43210',
      zone: 'All India',
      state: 'National HQ',
      territory: 'Headquarters',
      dailyTarget: 20,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      status: 'Active',
      liveLocation: {
        lat: 28.6139,
        lng: 77.2090,
        address: 'Central Secretariat, New Delhi',
        lastUpdated: new Date().toISOString()
      },
      assignedRepIds: []
    });
    await masterAdmin.save();

    await AuditLog.create({
      action: 'MongoDB Database initialized with Master Admin (admin@fieldvision.in) with encrypted password',
      user: 'System'
    });
    console.log('[FieldVision MongoDB] Seeded Master Admin in MongoDB collection: users with bcrypt encrypted password');
  } else {
    // If admin password is not yet bcrypt hashed, encrypt it now
    if (!existingAdmin.password.startsWith('$2a$') && !existingAdmin.password.startsWith('$2b$')) {
      existingAdmin.password = await bcrypt.hash(existingAdmin.password, 10);
      await existingAdmin.save();
      console.log('[FieldVision MongoDB] Upgraded Master Admin password in MongoDB to bcrypt encrypted hash');
    }
  }

  // Upgrade any other existing users in MongoDB with unencrypted passwords
  const unencryptedUsers = await User.find({
    password: { $not: /^\$2[ab]\$/ }
  });
  for (const u of unencryptedUsers) {
    u.password = await bcrypt.hash(u.password, 10);
    await u.save();
    console.log(`[FieldVision MongoDB] Upgraded password for user ${u.email} to bcrypt encrypted hash`);
  }
}
