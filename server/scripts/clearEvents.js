import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Media from '../models/Media.js';
import Certificate from '../models/Certificate.js';

// Load Env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const clearEvents = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/event-hub');
    console.log(`Connected to database to clear events: ${conn.connection.host}`);

    // Clear event-related collections, but NOT User
    const deletedEvents = await Event.deleteMany({});
    const deletedRegistrations = await Registration.deleteMany({});
    const deletedMedia = await Media.deleteMany({});
    const deletedCertificates = await Certificate.deleteMany({});

    console.log(`Successfully cleared events data:`);
    console.log(`- Deleted ${deletedEvents.deletedCount} events`);
    console.log(`- Deleted ${deletedRegistrations.deletedCount} registrations`);
    console.log(`- Deleted ${deletedMedia.deletedCount} media files`);
    console.log(`- Deleted ${deletedCertificates.deletedCount} certificates`);
    console.log('All user accounts were kept intact.');

    process.exit(0);
  } catch (error) {
    console.error('Error clearing events:', error);
    process.exit(1);
  }
};

clearEvents();
