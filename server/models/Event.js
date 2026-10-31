import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  poster: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['Technical', 'Non-Technical', 'Workshop', 'Webinar', 'Sports', 'Other'], 
    required: true 
  },
  customType: { 
    type: String, 
    default: null 
  },
  eligibleDepartments: [{ 
    type: String,
    enum: ['All Departments', 'Computer Engineering', 'Information Technology', 'Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Electronics & Communication', 'Automobile Engineering'],
    default: ['All Departments']
  }],
  organizedBy: {
    type: String,
    required: true
  },
  venue: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  startTime: { 
    type: String, 
    required: true 
  },
  endTime: { 
    type: String, 
    required: true 
  },
  lastRegistrationDate: { 
    type: Date, 
    required: true 
  },
  capacity: { 
    type: Number, 
    default: null // null means unlimited
  },
  coordinators: {
    faculty: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    student: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Draft', 'Published', 'Registration Open', 'Registration Closed', 'Ongoing', 'Completed', 'Cancelled'], 
    default: 'Published' 
  },
  completionDate: { 
    type: Date, 
    default: null 
  },
  festival: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Festival',
    default: null
  },
  registrationMode: {
    type: String,
    enum: ['Individual', 'Team', 'Both'],
    default: 'Individual'
  },
  registrationConfig: {
    maxIndividualParticipants: { type: Number, default: null },
    minTeamMembers: { type: Number, default: 2 },
    maxTeamMembers: { type: Number, default: 5 },
    maxTeamsCount: { type: Number, default: null },
    requireTeamLeader: { type: Boolean, default: true },
    allowFacultyMentor: { type: Boolean, default: false }
  },
  customQuestions: [{
    questionText: { type: String, required: true },
    questionType: { type: String, enum: ['text', 'dropdown', 'checkbox', 'number', 'email', 'phone', 'radio', 'date', 'time', 'paragraph', 'file'], required: true },
    options: [{ type: String }],
    required: { type: Boolean, default: false }
  }]
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);
export default Event;
