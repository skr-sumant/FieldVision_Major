import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  action: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  }
});

auditLogSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
  }
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
