import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../models/User.js';
import Department from '../models/Department.js';
import Registration from '../models/Registration.js';

// Department mapping from short codes to full names
const deptMap = {
  'CE': 'Computer Engineering',
  'IT': 'Information Technology',
  'CIVIL': 'Civil Engineering',
  'MECH': 'Mechanical Engineering',
  'EC': 'EC Engineering',
  'EE': 'Electrical Engineering',
  'AUTO': 'Automobile Engineering',
  'CHEM': 'Chemical Engineering',
  'BME': 'Biomedical Engineering',
  'S&H': 'Science & Humanities'
};

const validDepartments = [
  'Computer Engineering',
  'Information Technology',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'EC Engineering',
  'Automobile Engineering',
  'Chemical Engineering',
  'Biomedical Engineering',
  'Science & Humanities'
];

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // 1. Seed Department Collection
    for (const deptName of validDepartments) {
      await Department.updateOne(
        { name: deptName },
        { $setOnInsert: { name: deptName } },
        { upsert: true }
      );
    }
    console.log('✅ Department collection seeded.');

    // 2. Delete Invalid Users ("All Department", "All Departments", etc)
    const invalidDepts = ['All Department', 'All Departments', 'Select Department', 'None', '', null];
    
    const usersToDelete = await User.find({ department: { $in: invalidDepts } });
    const userIdsToDelete = usersToDelete.map(u => u._id);

    if (userIdsToDelete.length > 0) {
      const delRegRes = await Registration.deleteMany({ student: { $in: userIdsToDelete } });
      console.log(`✅ Deleted ${delRegRes.deletedCount} orphan registrations related to invalid users.`);

      const delUserRes = await User.deleteMany({ _id: { $in: userIdsToDelete } });
      console.log(`✅ Permanently deleted ${delUserRes.deletedCount} invalid users.`);
    } else {
      console.log('✅ No invalid users found to delete.');
    }

    // 3. Migrate Short Codes to Full Names
    const allUsers = await User.find({});
    let migratedCount = 0;
    
    for (const user of allUsers) {
      let changed = false;
      
      if (deptMap[user.department]) {
        user.department = deptMap[user.department];
        changed = true;
      }
      
      // Some users might have null username or empty strings.
      // Clean up to avoid index collision on sparse fields if necessary.
      if (user.username === '') user.username = undefined;
      if (user.enrollmentNumber === '') user.enrollmentNumber = undefined;
      if (user.employeeId === '') user.employeeId = undefined;

      if (changed) {
        await user.save();
        migratedCount++;
      }
    }
    console.log(`✅ Migrated ${migratedCount} users to full department names.`);

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
