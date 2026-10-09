import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
  repId: {
    type: String,
    required: true
  },
  repName: {
    type: String,
    required: true
  },
  managerId: {
    type: String,
    default: null
  },
  customerId: {
    type: String,
    default: null
  },
  customerName: {
    type: String,
    default: ''
  },
  shopName: {
    type: String,
    required: true
  },
  ownerName: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  lat: {
    type: Number,
    default: 0
  },
  lng: {
    type: Number,
    default: 0
  },
  distanceMeters: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Pending Verification', 'Verified', 'Flagged Anomalous'],
    default: 'Pending Verification'
  },
  orderAmount: {
    type: Number,
    default: 0
  },
  orderItems: {
    type: String,
    default: ''
  },
  paymentMethod: {
    type: String,
    default: 'UPI QR'
  },
  paymentStatus: {
    type: String,
    default: 'Pending'
  },
  upiTxnId: {
    type: String,
    default: null
  },
  photoUrl: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  managerNotes: {
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
  timestamp: {
    type: Date,
    default: Date.now
  },
  synced: {
    type: Number,
    default: 1
  }
});

visitSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
  }
});

const Visit = mongoose.model('Visit', visitSchema);
export default Visit;
