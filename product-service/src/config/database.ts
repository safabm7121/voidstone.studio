import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/voidstone_products?authSource=admin';

console.log(' Connecting to MongoDB...');

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log(' Connected to MongoDB');
    })
    .catch((error) => {
        console.error(' MongoDB connection error:', error.message);
    });

export { mongoose };