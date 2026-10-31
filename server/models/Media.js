import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  event: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: false 
  },
  festival: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Festival',
    default: null
  },
  uploader: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  fileUrl: { 
    type: String, 
    required: true 
  },
  fileType: { 
    type: String, 
    enum: ['Image', 'Video', 'Document'], 
    required: true 
  },
  category: { 
    type: String, 
    required: true,
    trim: true
  },
  isApproved: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

const Media = mongoose.model('Media', mediaSchema);
export default Media;
