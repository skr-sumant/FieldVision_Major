import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'sales_rep'],
    required: true
  },
  phone: {
    type: String,
    default: ''
  },
  zone: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  managerId: {
    type: String,
    default: null
  },
  territory: {
    type: String,
    default: ''
  },
  dailyTarget: {
    type: Number,
    default: 15
  },
  avatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  liveLocation: {
    lat: Number,
    lng: Number,
    address: String,
    lastUpdated: String
  },
  assignedRepIds: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Format output id
userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
  }
});

const User = mongoose.model('User', userSchema);
export default User;
