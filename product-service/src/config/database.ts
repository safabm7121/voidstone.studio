import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/voidstone_products?authSource=admin';

// Check if running in test environment
const isTestEnvironment = process.env.NODE_ENV === 'test';

// Only connect to real MongoDB if not in test environment
if (!isTestEnvironment) {
    console.log('🔌 Connecting to MongoDB...');
    
    mongoose.connect(MONGODB_URI)
        .then(() => {
            console.log('✅ Connected to MongoDB');
        })
        .catch((error) => {
            console.error('❌ MongoDB connection error:', error.message);
        });
} else {
    console.log('🧪 Test environment detected - skipping real MongoDB connection');
}

export { mongoose };