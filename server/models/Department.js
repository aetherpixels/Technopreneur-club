import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    enum: [
      'COMPUTER ENGINEERING DEPARTMENT',
      'INFORMATION TECHNOLOGY DEPARTMENT',
      'CIVIL DEPARTMENT',
      'MECHANICAL DEPARTMENT',
      'AUTOMOBILE DEPARTMENT',
      'EC DEPARTMENT',
      'ELECTRICAL DEPARTMENT'
    ]
  }
}, { timestamps: true });

const Department = mongoose.model('Department', departmentSchema);
export default Department;
