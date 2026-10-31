import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from '../models/User.js';

const DEPARTMENTS = ['CE', 'IT', 'CIVIL', 'MECH', 'EC', 'EE', 'AUTO', 'CHEM', 'BME', 'S&H'];

const indianFirstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Kabir', 'Ritvik', 'Aarush', 'Rudra', 'Ansh', 'Aryan',
  'Diya', 'Aanya', 'Kiara', 'Aadhya', 'Ananya', 'Pari', 'Navya', 'Anvi', 'Prisha', 'Riya',
  'Aarohi', 'Avni', 'Myra', 'Saanvi', 'Kavya', 'Ira', 'Meera', 'Sara', 'Neha', 'Pooja',
  'Tanmay', 'Tanvi', 'Tanush', 'Rahul', 'Rohan', 'Karan', 'Priya', 'Sneha', 'Simran'
];

const indianLastNames = [
  'Patel', 'Sharma', 'Singh', 'Desai', 'Shah', 'Mehta', 'Joshi', 'Chauhan', 'Verma', 'Panchal',
  'Yadav', 'Gupta', 'Kumar', 'Reddy', 'Nair', 'Menon', 'Rao', 'Iyer', 'Pillai', 'Mukherjee',
  'Bhatt', 'Trivedi', 'Dave', 'Vyasa', 'Rathod', 'Solanki', 'Chavda', 'Gohil', 'Jadeja', 'Makwana'
];

// Helper to generate a random name ensuring no "Meet"
function getRandomName() {
  let first = '';
  let last = '';
  while (true) {
    first = indianFirstNames[Math.floor(Math.random() * indianFirstNames.length)];
    last = indianLastNames[Math.floor(Math.random() * indianLastNames.length)];
    const fullName = `${first} ${last}`;
    if (!fullName.toLowerCase().includes('meet')) {
      return { first, last, fullName };
    }
  }
}

async function generateData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Pre-hash passwords
    const salt = await bcrypt.genSalt(12);
    const facultyPass = await bcrypt.hash('faculty@123', salt);
    const studentPass = await bcrypt.hash('student@123', salt);
    const adminPass = await bcrypt.hash('admin@123', salt);

    let enrollmentCounter = 1;
    let employeeCounter = 1;

    const usersToInsert = [];

    // 1. Generate 5 Admins
    for (let i = 0; i < 5; i++) {
      const { first, last, fullName } = getRandomName();
      const username = `admin_${first.toLowerCase()}_${last.toLowerCase()}_${Math.floor(Math.random() * 1000)}`;
      usersToInsert.push({
        name: fullName,
        email: `${username}@institution.edu`,
        username: username,
        password: adminPass, // Pre-hashed, bypassing pre-save hook
        role: 'Admin',
        department: 'CE',
        contactNumber: `98${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        status: 'Active'
      });
    }

    // 2. Generate per Department Faculty and Students
    for (const dept of DEPARTMENTS) {
      // 5 Faculty
      for (let i = 0; i < 5; i++) {
        const { first, last, fullName } = getRandomName();
        const username = `prof_${first.toLowerCase()}_${last.toLowerCase()}_${dept.toLowerCase()}_${Math.floor(Math.random() * 1000)}`;
        usersToInsert.push({
          name: fullName,
          email: `${username}@institution.edu`,
          username: username,
          employeeId: `FAC${dept}${employeeCounter.toString().padStart(3, '0')}`,
          password: facultyPass,
          role: 'Faculty',
          department: dept,
          contactNumber: `98${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
          status: 'Active'
        });
        employeeCounter++;
      }

      // 10 Students
      for (let i = 0; i < 10; i++) {
        const { first, last, fullName } = getRandomName();
        const username = `stu_${first.toLowerCase()}_${last.toLowerCase()}_${Math.floor(Math.random() * 10000)}`;
        usersToInsert.push({
          name: fullName,
          email: `${username}@institution.edu`,
          username: username,
          enrollmentNumber: `23016011${enrollmentCounter.toString().padStart(4, '0')}`,
          password: studentPass,
          role: 'Student',
          department: dept,
          contactNumber: `99${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
          status: 'Active'
        });
        enrollmentCounter++;
      }
    }

    console.log(`Generating ${usersToInsert.length} users...`);
    await User.insertMany(usersToInsert);
    console.log('Dummy users generated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error generating dummy users:', error);
    process.exit(1);
  }
}

generateData();
