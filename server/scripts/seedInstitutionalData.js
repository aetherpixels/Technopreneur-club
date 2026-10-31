import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from '../models/User.js';
import Department from '../models/Department.js';

const DEPARTMENTS = [
  'COMPUTER ENGINEERING DEPARTMENT',
  'INFORMATION TECHNOLOGY DEPARTMENT',
  'CIVIL DEPARTMENT',
  'MECHANICAL DEPARTMENT',
  'AUTOMOBILE DEPARTMENT',
  'EC DEPARTMENT',
  'ELECTRICAL DEPARTMENT'
];

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

function getRandomName() {
  const first = indianFirstNames[Math.floor(Math.random() * indianFirstNames.length)];
  const last = indianLastNames[Math.floor(Math.random() * indianLastNames.length)];
  return { first, last, fullName: `${first} ${last}` };
}

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Clean Collections
    await User.deleteMany({});
    console.log('All existing Users deleted.');
    
    await Department.deleteMany({});
    console.log('All existing Departments deleted.');

    // Seed Departments
    const deptDocs = await Department.insertMany(
      DEPARTMENTS.map(d => ({ name: d }))
    );
    console.log('Departments seeded successfully.');

    // Passwords
    const salt = await bcrypt.genSalt(12);
    const adminPass = await bcrypt.hash('admin@123', salt);
    const facultyPass = await bcrypt.hash('faculty@123', salt);
    const studentPass = await bcrypt.hash('student@123', salt);

    let enrollmentCounter = 1000;
    let employeeCounter = 100;

    const usersToInsert = [];

    // For EACH department
    for (const dept of DEPARTMENTS) {
      
      const deptShort = dept.split(' ')[0].substring(0, 4).toUpperCase();

      // 1 Department Admin
      const { first: aFirst, last: aLast, fullName: aFull } = getRandomName();
      const aUsername = `admin_${aFirst.toLowerCase()}_${deptShort.toLowerCase()}`;
      usersToInsert.push({
        firstName: aFirst,
        lastName: aLast,
        name: aFull,
        email: `${aUsername}@institution.edu`,
        username: aUsername,
        password: adminPass, // We bypass pre-save hook using insertMany
        role: 'Admin',
        department: dept,
        contactNumber: `98${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        status: 'Active',
        employeeId: `ADM-${deptShort}-01`
      });

      // 5 Faculty
      for (let i = 1; i <= 5; i++) {
        const { first, last, fullName } = getRandomName();
        const username = `prof_${first.toLowerCase()}_${last.toLowerCase()}_${deptShort.toLowerCase()}`;
        usersToInsert.push({
          firstName: first,
          lastName: last,
          name: fullName,
          email: `${username}@institution.edu`,
          username: username,
          password: facultyPass,
          role: 'Faculty',
          department: dept,
          contactNumber: `98${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
          status: 'Active',
          employeeId: `FAC-${deptShort}-${employeeCounter++}`,
          designation: 'Assistant Professor',
          qualification: 'M.E / M.Tech',
          experience: `${Math.floor(Math.random() * 10) + 1} Years`,
          specialization: deptShort,
          address: 'Ahmedabad, Gujarat',
          city: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380001'
        });
      }

      // 10 Students
      for (let i = 1; i <= 10; i++) {
        const { first, last, fullName } = getRandomName();
        const username = `stu_${first.toLowerCase()}_${last.toLowerCase()}_${enrollmentCounter}`;
        usersToInsert.push({
          firstName: first,
          lastName: last,
          name: fullName,
          email: `${username}@institution.edu`,
          username: username,
          password: studentPass,
          role: 'Student',
          department: dept,
          contactNumber: `99${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
          status: 'Active',
          enrollmentNumber: `23016011${enrollmentCounter++}`,
          semester: `${Math.floor(Math.random() * 8) + 1}`,
          division: 'A',
          gender: Math.random() > 0.5 ? 'Male' : 'Female',
          address: 'Ahmedabad, Gujarat',
          city: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380015',
          guardianName: `${indianFirstNames[Math.floor(Math.random() * indianFirstNames.length)]} ${last}`,
          guardianMobile: `94${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`
        });
      }
    }

    console.log(`Inserting ${usersToInsert.length} institutional records...`);
    await User.insertMany(usersToInsert);
    console.log('Database successfully re-seeded with 112 fresh users (7 Admins, 35 Faculty, 70 Students).');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
