import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  certificateId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  registration: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Registration', 
    required: true 
  },
  event: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  },
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  issuedAt: { 
    type: Date, 
    default: Date.now 
  },
  downloadUrl: { 
    type: String, 
    required: true 
  }
}, { timestamps: true });

const Certificate = mongoose.model('Certificate', certificateSchema);
export default Certificate;
