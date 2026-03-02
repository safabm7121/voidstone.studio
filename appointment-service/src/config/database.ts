import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error(' MONGODB_URI is not defined in environment variables');
    process.exit(1);
}

export const connectDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(' Connected to MongoDB - voidstone_appointments');
  } catch (error) {
    console.error(' MongoDB connection error:', error);
    process.exit(1);
  }
};