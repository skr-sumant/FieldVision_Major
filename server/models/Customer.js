import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
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
  category: {
    type: String,
    default: 'FMCG / General Store'
  },
  zone: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  isDuplicate: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: String,
    default: 'System'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

customerSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
  }
});

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
