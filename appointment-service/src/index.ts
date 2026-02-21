import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import consul from 'consul';
import axios from 'axios';

import appointmentRoutes from './routes/appointmentRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/appointments', appointmentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'appointment-service' });
});

// FIX: Convert port to string for Consul
const consulClient = new consul({
  host: process.env.CONSUL_HOST || 'localhost',
  port: (process.env.CONSUL_PORT || '8500') as any // Cast to any to avoid type issue
});

const serviceId = 'appointment-service-1';

const server = app.listen(PORT, () => {
  console.log('\n=================================');
  console.log('📅 Appointment Service');
  console.log('=================================');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log('=================================\n');

  // FIX: Register with Consul using proper typing
  consulClient.agent.service.register({
    id: serviceId,
    name: 'appointment-service',
    address: 'localhost',
    port: Number(PORT),
    check: {
      http: `http://localhost:${PORT}/health`,
      interval: '10s',
      timeout: '5s',
      deregistercriticalserviceafter: '30s'
    } as any
  } as any, (err: any) => {
    if (err) {
      console.error('❌ Failed to register with Consul:', err);
    } else {
      console.log('✅ Registered with Consul');
    }
  });
});

process.on('SIGTERM', () => {
  consulClient.agent.service.deregister(serviceId);
  server.close();
});

process.on('SIGINT', () => {
  consulClient.agent.service.deregister(serviceId);
  server.close();
});