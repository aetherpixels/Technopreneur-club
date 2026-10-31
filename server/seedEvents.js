import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Event from './models/Event.js';
import Festival from './models/Festival.js';
import User from './models/User.js';

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const admin = await User.findOne({ role: 'Admin' });
    if (!admin) {
      console.log('No admin user found. Exiting.');
      process.exit(1);
    }
    
    // Clear old events & festivals to keep it clean, or just add new ones?
    // Let's just add new ones.

    const today = new Date();
    const futureDate1 = new Date(today);
    futureDate1.setDate(futureDate1.getDate() + 10);
    const futureDate2 = new Date(today);
    futureDate2.setDate(futureDate2.getDate() + 15);
    const lastRegDate = new Date(today);
    lastRegDate.setDate(lastRegDate.getDate() + 5);

    // 1. Single Event 1
    const singleEvent1 = await Event.create({
      title: 'CodeCrunch 2026',
      poster: 'event_posters/default_poster1.jpg',
      description: 'A 24-hour coding marathon to solve real-world problems. Great for testing single event flow.',
      type: 'Technical',
      eligibleDepartments: ['All Departments'],
      organizedBy: 'Computer Engineering',
      venue: 'Lab 1',
      date: futureDate1,
      startTime: '09:00',
      endTime: '17:00',
      lastRegistrationDate: lastRegDate,
      capacity: 100,
      createdBy: admin._id,
      status: 'Registration Open',
      registrationMode: 'Individual'
    });
    console.log('Created Single Event 1:', singleEvent1.title);

    // 2. Single Event 2
    const singleEvent2 = await Event.create({
      title: 'RoboWars Alpha',
      poster: 'event_posters/default_poster2.jpg',
      description: 'A robot combat competition. Test team registration flow.',
      type: 'Technical',
      eligibleDepartments: ['Mechanical Engineering', 'Computer Engineering', 'Electronics & Communication'],
      organizedBy: 'Mechanical Engineering',
      venue: 'Main Ground',
      date: futureDate2,
      startTime: '10:00',
      endTime: '18:00',
      lastRegistrationDate: lastRegDate,
      capacity: 50,
      createdBy: admin._id,
      status: 'Registration Open',
      registrationMode: 'Team',
      registrationConfig: {
        minTeamMembers: 2,
        maxTeamMembers: 4,
        requireTeamLeader: true
      }
    });
    console.log('Created Single Event 2:', singleEvent2.title);

    // 3. Multi Event 1 (Festival)
    const fest1 = await Festival.create({
      name: 'TechSymphony 2026',
      theme: 'Innovation Unleashed',
      description: 'The annual technical festival consisting of 3 major events.',
      banner: 'festival_banners/default_banner1.jpg',
      venue: 'University Campus',
      startDate: futureDate1,
      endDate: futureDate2,
      overallFacultyCoordinator: {
        name: 'Dr. John Doe',
        email: 'john.doe@example.com',
        contactNumber: '1234567890'
      },
      participatingDepartments: ['Computer Engineering', 'Information Technology'],
      status: 'Ongoing',
      allowMultipleRegistrations: true,
      createdBy: admin._id
    });
    console.log('Created Festival 1:', fest1.name);

    await Event.insertMany([
      {
        title: 'Hackathon X',
        poster: 'event_posters/default_poster3.jpg',
        description: 'Main hackathon for TechSymphony.',
        type: 'Technical',
        organizedBy: 'Computer Engineering',
        venue: 'Lab 2',
        date: futureDate1,
        startTime: '09:00',
        endTime: '21:00',
        lastRegistrationDate: lastRegDate,
        createdBy: admin._id,
        festival: fest1._id,
        status: 'Registration Open',
        registrationMode: 'Team'
      },
      {
        title: 'Tech Quiz',
        poster: 'event_posters/default_poster4.jpg',
        description: 'Test your technical knowledge.',
        type: 'Technical',
        organizedBy: 'Information Technology',
        venue: 'Auditorium',
        date: futureDate1,
        startTime: '14:00',
        endTime: '16:00',
        lastRegistrationDate: lastRegDate,
        createdBy: admin._id,
        festival: fest1._id,
        status: 'Registration Open',
        registrationMode: 'Individual'
      },
      {
        title: 'Web Dev Workshop',
        poster: 'event_posters/default_poster5.jpg',
        description: 'Learn modern web development.',
        type: 'Workshop',
        organizedBy: 'Computer Engineering',
        venue: 'Lab 3',
        date: futureDate2,
        startTime: '10:00',
        endTime: '13:00',
        lastRegistrationDate: lastRegDate,
        createdBy: admin._id,
        festival: fest1._id,
        status: 'Registration Open',
        registrationMode: 'Individual'
      }
    ]);
    console.log('Created 3 sub-events for Festival 1');

    // 4. Multi Event 2 (Festival)
    const fest2 = await Festival.create({
      name: 'KalaMahotsav 2026',
      theme: 'Cultural Extravaganza',
      description: 'The annual cultural festival with various arts and performances.',
      banner: 'festival_banners/default_banner2.jpg',
      venue: 'Main Auditorium',
      startDate: futureDate1,
      endDate: futureDate2,
      overallFacultyCoordinator: {
        name: 'Prof. Jane Smith',
        email: 'jane.smith@example.com',
        contactNumber: '0987654321'
      },
      participatingDepartments: ['All Departments'],
      status: 'Published',
      allowMultipleRegistrations: true,
      createdBy: admin._id
    });
    console.log('Created Festival 2:', fest2.name);

    await Event.insertMany([
      {
        title: 'Singing Competition',
        poster: 'event_posters/default_poster6.jpg',
        description: 'Solo singing competition.',
        type: 'Non-Technical',
        organizedBy: 'Cultural Club',
        venue: 'Main Auditorium',
        date: futureDate1,
        startTime: '18:00',
        endTime: '21:00',
        lastRegistrationDate: lastRegDate,
        createdBy: admin._id,
        festival: fest2._id,
        status: 'Registration Open',
        registrationMode: 'Individual'
      },
      {
        title: 'Group Dance',
        poster: 'event_posters/default_poster7.jpg',
        description: 'Group dance performances.',
        type: 'Non-Technical',
        organizedBy: 'Cultural Club',
        venue: 'Main Stage',
        date: futureDate2,
        startTime: '19:00',
        endTime: '22:00',
        lastRegistrationDate: lastRegDate,
        createdBy: admin._id,
        festival: fest2._id,
        status: 'Registration Open',
        registrationMode: 'Team'
      },
      {
        title: 'Art Exhibition',
        poster: 'event_posters/default_poster8.jpg',
        description: 'Showcase your artwork.',
        type: 'Non-Technical',
        organizedBy: 'Arts Club',
        venue: 'Gallery Hall',
        date: futureDate1,
        startTime: '10:00',
        endTime: '17:00',
        lastRegistrationDate: lastRegDate,
        createdBy: admin._id,
        festival: fest2._id,
        status: 'Registration Open',
        registrationMode: 'Individual'
      }
    ]);
    console.log('Created 3 sub-events for Festival 2');

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedData();
