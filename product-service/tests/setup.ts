import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

dotenv.config();

let mongoServer: MongoMemoryServer;

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.AUTH_SERVICE_URL = 'http://localhost:3001/api';
process.env.NODE_ENV = 'test';
process.env.PORT = '3004';

// Mock axios for email service
jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({ data: { success: true } })
}));

beforeAll(async () => {
  // Start in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Set the MongoDB URI for tests
  process.env.MONGODB_URI = mongoUri;
  
  // Connect to in-memory database
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to in-memory test database');
  }
});

afterAll(async () => {
  // Cleanup
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    console.log('✅ Disconnected from test database');
  }
  
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  jest.clearAllMocks();
});

afterEach(async () => {
  // Clear all collections after each test
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
  jest.clearAllMocks();
});