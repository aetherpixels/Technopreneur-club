import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  // Full Name
  name: { type: String, required: true, trim: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  
  // Core Auth
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, unique: true, sparse: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Faculty', 'Student'], required: true },
  department: { type: String, required: true, trim: true },
  contactNumber: { type: String, required: true, trim: true },
  
  // Personal Info
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  dob: { type: Date },
  profilePhoto: { type: String, default: null },
  
  // Student Specific
  enrollmentNumber: { type: String, unique: true, sparse: true, trim: true },
  
  // Faculty/Admin Specific
  designation: { type: String, default: '', trim: true },
  employeeId: { type: String, unique: true, sparse: true, trim: true },
  
  // Status and Security
  status: { type: String, enum: ['Active', 'Suspended', 'Blocked'], default: 'Active' },
  lastLogin: { type: Date, default: null },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null }
}, { timestamps: true });

// Pre-save hook to hash passwords and sync names
userSchema.pre('save', async function (next) {
  // Sync name with firstName and lastName
  if (this.name) {
    const parts = this.name.trim().split(/\s+/);
    if (!this.firstName) this.firstName = parts[0] || '';
    if (!this.lastName) this.lastName = parts.slice(1).join(' ') || '';
  } else if (this.firstName || this.lastName) {
    this.name = [this.firstName, this.lastName].filter(Boolean).join(' ');
  }

  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to verify password on login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
