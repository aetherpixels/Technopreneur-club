import mongoose from 'mongoose';

const festivalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  theme: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  banner: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  overallFacultyCoordinator: {
    name: { type: String, required: true },
    email: { type: String },
    contactNumber: { type: String }
  },
  participatingDepartments: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Published'
  },
  allowMultipleRegistrations: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const Festival = mongoose.model('Festival', festivalSchema);
export default Festival;
