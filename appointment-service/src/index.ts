import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import consul from 'consul';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { networkInterfaces } from 'os';
import client from 'prom-client';

import appointmentRoutes from './routes/appointmentRoutes';
import { connectDatabase } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Check if running in test environment
const isTestEnvironment = process.env.NODE_ENV === 'test';

// Prometheus metrics setup - FIXED
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

// Create custom metrics
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Middleware to track metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestCounter.inc({
      method: req.method,
      route: route,
      status: res.statusCode
    });
    
    httpRequestDuration.observe(
      {
        method: req.method,
        route: route,
        status: res.statusCode
      },
      duration
    );
  });
  next();
});

// Middleware
app.use(helmet());
app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'], 
  credentials: true 
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting - adjust for test environment
if (!isTestEnvironment) {
  app.use('/api', rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { error: 'Too many requests' } 
  }));
} else {
  // More permissive rate limiting for tests
  app.use('/api', rateLimit({ 
    windowMs: 1 * 1000, 
    max: 1000, 
    message: { error: 'Too many requests' } 
  }));
}

// Routes
app.use('/api', appointmentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'appointment-service',
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
});

// Test endpoint to check MongoDB connection
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Appointment service is running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mongodbState: mongoose.connection.readyState,
    time: new Date().toISOString()
  });
});

// Get local IP
const getLocalIp = (): string => {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
};

// Connect to database (skip in test mode - tests use in-memory DB)
if (!isTestEnvironment) {
  connectDatabase();
}

// ============= SERVER STARTUP =============
// Only start server if not in test environment, or if this file is being run directly
if (require.main === module || !isTestEnvironment) {
  // Consul registration - only in non-test environment
  if (!isTestEnvironment) {
    const consulClient = new consul({ 
      host: process.env.CONSUL_HOST || 'localhost', 
      port: process.env.CONSUL_PORT || '8500' 
    });

    const serviceId = 'appointment-service-1';
    const localIp = getLocalIp();

    const server = app.listen(PORT, () => {
      console.log('\n=================================');
      console.log('📅 Appointment Service');
      console.log('=================================');
      console.log(`📡 Port: ${PORT}`);
      console.log(`🔗 Health: http://localhost:${PORT}/health`);
      console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
      console.log(`🔧 Test: http://localhost:${PORT}/api/test`);
      console.log(`📡 Local IP: ${localIp}`);
      console.log('=================================\n');

      // Register with Consul
      const addresses = [localIp, 'host.docker.internal', 'localhost'];
      
      const tryRegister = async (index: number) => {
        if (index >= addresses.length) {
          console.log('⚠️ Could not register with Consul');
          return;
        }

        const address = addresses[index];
        try {
          await consulClient.agent.service.register({
            id: serviceId,
            name: 'appointment-service',
            address,
            port: Number(PORT),
            check: { 
              http: `http://${address}:${PORT}/health`, 
              interval: '10s',
              timeout: '5s',
              deregistercriticalserviceafter: '30s'
            },
            tags: ['appointment', 'booking', 'calendar']
          } as any);
          
          console.log(`✅ Registered with Consul using ${address}`);
        } catch (err) {
          console.log(`🔄 Retry ${index + 1}/${addresses.length}...`);
          tryRegister(index + 1);
        }
      };

      tryRegister(0);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down...');
      try {
        await consulClient.agent.service.deregister(serviceId);
        console.log('✅ Deregistered from Consul');
      } catch (error) {
        console.error('❌ Error deregistering from Consul:', error);
      } finally {
        server.close(() => {
          console.log('👋 Server closed');
          process.exit(0);
        });
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } else {
    // In test mode, just make the app available without starting server
    console.log(`📅 Appointment Service configured for test mode`);
  }
}

export default app;