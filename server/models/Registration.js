import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
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
  registrationDate: { 
    type: Date, 
    default: Date.now 
  },
  registrationType: {
    type: String,
    enum: ['Individual', 'Team'],
    default: 'Individual'
  },
  teamName: {
    type: String,
    default: null
  },
  teamLeader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  teamMembers: [{
    name: { type: String, required: true },
    email: { type: String },
    department: { type: String },
    enrollmentNumber: { type: String },
    contactNumber: { type: String }
  }],
  contactNumber: {
    type: String,
    default: null
  },
  department: {
    type: String,
    default: null
  },
  facultyMentor: {
    name: { type: String },
    department: { type: String },
    contactNumber: { type: String }
  },
  status: { 
    type: String, 
    enum: ['Registered', 'Approved', 'Rejected', 'Waitlisted', 'Cancelled'], 
    default: 'Registered' 
  },
  attendanceStatus: { 
    type: String, 
    enum: ['Present', 'Absent', 'Pending'], 
    default: 'Pending' 
  },
  certificateStatus: { 
    type: String, 
    enum: ['Not Available', 'Available', 'Downloaded'], 
    default: 'Not Available' 
  },
  customResponses: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, required: false },
    questionText: { type: String, required: true },
    questionType: { type: String, required: false },
    answer: { type: mongoose.Schema.Types.Mixed }
  }]
}, { timestamps: true });

// Compound index to prevent duplicate registrations per event
registrationSchema.index({ event: 1, student: 1 }, { unique: true });

const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;
