import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  states: {
    type: [String],
    required: true,
    default: []
  }
});

zoneSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
  }
});

const Zone = mongoose.model('Zone', zoneSchema);
export default Zone;
