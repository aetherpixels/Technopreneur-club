import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Event from '../models/Event.js';
import Festival from '../models/Festival.js';
import Registration from '../models/Registration.js';
import Certificate from '../models/Certificate.js';
import CertificateConfig from '../models/CertificateConfig.js';
import Media from '../models/Media.js';
import Department from '../models/Department.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DEPARTMENTS = [
  'COMPUTER ENGINEERING DEPARTMENT',
  'INFORMATION TECHNOLOGY DEPARTMENT',
  'CIVIL DEPARTMENT',
  'MECHANICAL DEPARTMENT',
  'AUTOMOBILE DEPARTMENT',
  'EC DEPARTMENT',
  'ELECTRICAL DEPARTMENT'
];

const cleanUploadsFolder = () => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const certsDir = path.join(uploadsDir, 'certificates');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  // Remove files in root uploads
  const uploadFiles = fs.readdirSync(uploadsDir);
  let removedUploadFiles = 0;
  for (const file of uploadFiles) {
    const fullPath = path.join(uploadsDir, file);
    if (fs.statSync(fullPath).isFile() && file !== '.gitkeep') {
      fs.unlinkSync(fullPath);
      removedUploadFiles++;
    }
  }

  // Remove files in uploads/certificates
  const certFiles = fs.readdirSync(certsDir);
  let removedCertFiles = 0;
  for (const file of certFiles) {
    const fullPath = path.join(certsDir, file);
    if (fs.statSync(fullPath).isFile() && file !== '.gitkeep') {
      fs.unlinkSync(fullPath);
      removedCertFiles++;
    }
  }

  console.log(`🧹 Cleaned uploads: deleted ${removedUploadFiles} files from /uploads and ${removedCertFiles} files from /uploads/certificates.`);
};

const resetDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/event-hub';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB connection established successfully.');

    // 1. Wipe all data across all collections
    console.log('Wiping all existing database collections...');
    const userDel = await User.deleteMany({});
    const eventDel = await Event.deleteMany({});
    const festDel = await Festival.deleteMany({});
    const regDel = await Registration.deleteMany({});
    const certDel = await Certificate.deleteMany({});
    const configDel = await CertificateConfig.deleteMany({});
    const mediaDel = await Media.deleteMany({});
    const deptDel = await Department.deleteMany({});

    console.log(`- Users deleted: ${userDel.deletedCount}`);
    console.log(`- Events deleted: ${eventDel.deletedCount}`);
    console.log(`- Festivals deleted: ${festDel.deletedCount}`);
    console.log(`- Registrations deleted: ${regDel.deletedCount}`);
    console.log(`- Certificates deleted: ${certDel.deletedCount}`);
    console.log(`- CertificateConfigs deleted: ${configDel.deletedCount}`);
    console.log(`- Media records deleted: ${mediaDel.deletedCount}`);
    console.log(`- Departments reset: ${deptDel.deletedCount}`);

    // 2. Clean uploads folder
    cleanUploadsFolder();

    // 3. Seed canonical institutional departments
    console.log('Seeding institutional departments...');
    await Department.insertMany(DEPARTMENTS.map(name => ({ name })));
    console.log(`Initialized ${DEPARTMENTS.length} official departments.`);

    // 4. Create the 3 clean users (Admin, Faculty, Student)
    // Note: User.create triggers the userSchema.pre('save') hook which hashes the password using bcrypt
    console.log('Creating fresh users for Admin, Faculty, and Student...');

    // A. System Admin
    const adminUser = await User.create({
      name: 'System Administrator',
      gender: 'Male',
      dob: new Date('1990-01-01'),
      email: 'admin@eventhub.com',
      password: 'AdminPassword123!',
      role: 'Admin',
      department: 'INFORMATION TECHNOLOGY DEPARTMENT',
      contactNumber: '9876543210',
      employeeId: 'ADM-001',
      designation: 'Chief Administrator',
      status: 'Active'
    });
    console.log(`✓ Admin User created: ${adminUser.email} (Password: AdminPassword123!)`);

    // B. Faculty Member
    const facultyUser = await User.create({
      name: 'Prof. John Doe',
      gender: 'Male',
      dob: new Date('1985-05-15'),
      email: 'faculty@eventhub.com',
      password: 'FacultyPassword123!',
      role: 'Faculty',
      department: 'COMPUTER ENGINEERING DEPARTMENT',
      contactNumber: '9876543211',
      employeeId: 'FAC-001',
      designation: 'Assistant Professor',
      status: 'Active'
    });
    console.log(`✓ Faculty User created: ${facultyUser.email} (Password: FacultyPassword123!)`);

    // C. Student
    const studentUser = await User.create({
      name: 'Jane Smith',
      gender: 'Female',
      dob: new Date('2003-08-20'),
      email: 'student@eventhub.com',
      password: 'StudentPassword123!',
      role: 'Student',
      department: 'COMPUTER ENGINEERING DEPARTMENT',
      contactNumber: '9876543212',
      enrollmentNumber: '230160110001',
      status: 'Active'
    });
    console.log(`✓ Student User created: ${studentUser.email} (Password: StudentPassword123!)`);

    console.log('\n======================================================');
    console.log('🎉 DATABASE RESET AND SEEDING COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('New User Credentials:');
    console.log('------------------------------------------------------');
    console.log('1. Admin');
    console.log('   Email:    admin@eventhub.com');
    console.log('   Password: AdminPassword123!');
    console.log('   Role:     Admin');
    console.log('------------------------------------------------------');
    console.log('2. Faculty');
    console.log('   Email:    faculty@eventhub.com');
    console.log('   Password: FacultyPassword123!');
    console.log('   Role:     Faculty');
    console.log('------------------------------------------------------');
    console.log('3. Student');
    console.log('   Email:    student@eventhub.com');
    console.log('   Password: StudentPassword123!');
    console.log('   Role:     Student');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
};

resetDatabase();
