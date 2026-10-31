import mongoose from 'mongoose';

const signatorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  designation: { 
    type: String,
    default: ''
  },
  signatureUrl: { 
    type: String, 
    required: true 
  }
});

const certificateConfigSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    unique: true
  },
  title: {
    type: String,
    default: 'Certificate of Participation'
  },
  description: {
    type: String,
    required: true
  },
  logos: [{
    type: String
  }],
  signatories: [signatorySchema],
  issueDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const CertificateConfig = mongoose.model('CertificateConfig', certificateConfigSchema);
export default CertificateConfig;
