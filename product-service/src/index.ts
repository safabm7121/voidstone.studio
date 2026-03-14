import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import client from 'prom-client';
import productRoutes from './routes/productRoutes';
import './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Check if running in test environment
const isTestEnvironment = process.env.NODE_ENV === 'test';

// Prometheus metrics setup
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
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'], 
    credentials: true 
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting - more permissive in test mode
if (!isTestEnvironment) {
    const limiter = rateLimit({ 
        windowMs: 15 * 60 * 1000, 
        max: 100, 
        message: { error: 'Too many requests' } 
    });
    app.use('/', limiter);
} else {
    // Test-friendly rate limiting
    const testLimiter = rateLimit({ 
        windowMs: 1 * 1000, 
        max: 1000, 
        message: { error: 'Too many requests' } 
    });
    app.use('/', testLimiter);
}

// Routes - MOUNTED AT ROOT LEVEL
app.use('/', productRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ 
        status: 'OK', 
        service: 'product-service',
        timestamp: new Date().toISOString()
    });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        name: 'Voidstone Product Service',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            metrics: '/metrics',
            products: {
                getAll: 'GET /products',
                getById: 'GET /products/:id',
                create: 'POST /products (auth)',
                update: 'PUT /products/:id (auth)',
                delete: 'DELETE /products/:id (auth)',
                history: 'GET /products/:id/history (auth)'
            }
        }
    });
});

// MODIFIED: Make Consul registration optional
// Always start the server
const server = app.listen(PORT, () => {
    console.log(' Product Service (MongoDB)');
    console.log(` Port: ${PORT}`);
    console.log(` Health: http://localhost:${PORT}/health`);
    console.log(` Metrics: http://localhost:${PORT}/metrics`);
    console.log(` GET /products - List all products`);
    console.log(` POST /products - Create product (auth)`);
    console.log(` PUT /products/:id - Update product (auth)`);
    console.log(` DELETE /products/:id - Delete product (auth)`);
    console.log(` GET /products/:id/history - View product history (auth)`);

    // MODIFIED: Only try Consul if explicitly enabled
    if (!isTestEnvironment && process.env.ENABLE_CONSUL === 'true') {
        try {
            const consul = require('consul');
            
            const consulClient = new consul({ 
                host: process.env.CONSUL_HOST || 'localhost', 
                port: process.env.CONSUL_PORT || '8500'  
            } as any);
            
            const serviceId = 'product-service-1';

            // Service registration expects number for port
            consulClient.agent.service.register({
                id: serviceId,
                name: 'product-service',
                address: 'host.docker.internal',
                port: Number(PORT),
                check: { 
                    http: `http://host.docker.internal:${PORT}/health`, 
                    interval: '10s' 
                }
            } as any);
            console.log(' Registered with Consul');

            // Graceful shutdown
            const shutdown = () => {
                console.log('\n Shutting down...');
                try { 
                    consulClient.agent.service.deregister(serviceId); 
                    console.log(' Deregistered from Consul');
                } catch (error) { 
                    console.error(' Error deregistering from Consul:', error);
                }
                server.close(() => {
                    console.log(' Server closed');
                    process.exit(0);
                });
            };

            process.on('SIGTERM', shutdown);
            process.on('SIGINT', shutdown);
            
        } catch (error: any) {
            console.log(' Consul not available - running without service discovery');
            console.log(' This is fine for Render deployment!');
        }
    } else {
        console.log(' Running without Consul service discovery');
        console.log(' This is normal for Render deployment!');
    }
});

export default app;