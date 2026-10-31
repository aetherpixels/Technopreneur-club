import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Event from '../models/Event.js';
import Festival from '../models/Festival.js';
import Registration from '../models/Registration.js';
import Certificate from '../models/Certificate.js';
import CertificateConfig from '../models/CertificateConfig.js';
import Media from '../models/Media.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const cleanData = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/event-hub';
    console.log(`Connecting to MongoDB at ${mongoURI}...`);
    await mongoose.connect(mongoURI);
    
    console.log('Connected. Starting data cleanup...');

    const eventsResult = await Event.deleteMany({});
    console.log(`Deleted ${eventsResult.deletedCount} Events.`);

    const festivalsResult = await Festival.deleteMany({});
    console.log(`Deleted ${festivalsResult.deletedCount} Festivals.`);

    const regsResult = await Registration.deleteMany({});
    console.log(`Deleted ${regsResult.deletedCount} Registrations.`);

    const certsResult = await Certificate.deleteMany({});
    console.log(`Deleted ${certsResult.deletedCount} Certificates.`);

    const certConfigResult = await CertificateConfig.deleteMany({});
    console.log(`Deleted ${certConfigResult.deletedCount} CertificateConfigs.`);

    const mediaResult = await Media.deleteMany({});
    console.log(`Deleted ${mediaResult.deletedCount} Media items.`);

    console.log('Data cleanup completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning data:', error);
    process.exit(1);
  }
};

cleanData();
