import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import consul from 'consul';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { networkInterfaces } from 'os';
import client from 'prom-client';

dotenv.config();

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

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
app.use(express.json());

// ============= PROXY ROUTES =============
// IMPORTANT: Proxy routes must come BEFORE rate limiting in test mode
// so the mock can be called

// Helper to create proxy options with error handling
const createProxyWithErrorHandling = (serviceName: string, targetUrl: string, pathRewrite?: Record<string, string>): Options => {
    const options: Options = {
        target: targetUrl,
        changeOrigin: true,
        on: {
            proxyReq: (proxyReq, req: any) => {
                console.log(`[Gateway] Proxying ${req.method} ${req.path} → ${serviceName}`);
            },
            error: (err, req: any, res: any) => {
                console.error(`[Gateway] ${serviceName} proxy error:`, err.message);
                res.status(503).json({ error: `${serviceName} unavailable` });
            }
        }
    };

    if (pathRewrite) {
        options.pathRewrite = pathRewrite;
    }

    return options;
};

// Auth Service Proxy (port 3001)
app.use('/api/auth', createProxyMiddleware(
    createProxyWithErrorHandling('auth-service', 'http://auth-service:3001', {
        '^/api/auth': '/api/auth'
    })
));

// Product Service Proxy (port 3004)
app.use('/api/products', createProxyMiddleware(
    createProxyWithErrorHandling('product-service', 'http://product-service:3004', {
        '^/api/products': '/api/products'
    })
));

// Appointment Service Proxy (port 3003)
app.use('/api/appointments', createProxyMiddleware(
    createProxyWithErrorHandling('appointment-service', 'http://appointment-service:3003', {
        '^/api/appointments': '/api/appointments'
    })
));

// Orders route (handled by auth-service)
app.use('/api/orders', createProxyMiddleware(
    createProxyWithErrorHandling('auth-service', 'http://auth-service:3001')
));

// Contact route (handled by auth-service)
app.use('/api/contact', createProxyMiddleware(
    createProxyWithErrorHandling('auth-service', 'http://auth-service:3001')
));

// Rate limiting - applied AFTER proxy routes in test mode
if (!isTestEnvironment) {
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: { error: 'Too many requests, please try again later.' }
    });
    app.use('/api', limiter);
} else {
    // In test mode, use a more permissive rate limiter or skip it
    const testLimiter = rateLimit({
        windowMs: 1 * 1000, // 1 second
        max: 1000, // Very high limit
        message: { error: 'Too many requests, please try again later.' },
        skip: (req) => req.path.includes('/api/') // Skip rate limiting for API routes in test mode
    });
    app.use('/api', testLimiter);
}

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ 
        status: 'OK', 
        service: 'api-gateway',
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

// Test endpoint
app.get('/test', (req: Request, res: Response) => {
    res.json({ 
        message: 'API Gateway is working!',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({ 
        name: 'Voidstone API Gateway', 
        status: 'running',
        port: PORT,
        endpoints: {
            health: '/health',
            test: '/test',
            metrics: '/metrics',
            auth: '/api/auth/*',
            products: '/api/products/*',
            appointments: '/api/appointments/*'
        }
    });
});

// ============= CONSUL REGISTRATION =============

// Only register with Consul if not in test environment
if (!isTestEnvironment) {
    // Get local IP address for Consul registration
    const getLocalIp = (): string => {
        const nets = networkInterfaces();
        for (const name of Object.keys(nets)) {
            for (const net of nets[name] || []) {
                if (net.family === 'IPv4' && !net.internal) {
                    return net.address;
                }
            }
        }
        return 'api-gateway'; // fallback to service name
    };

    const consulClient = new consul({
        host: process.env.CONSUL_HOST || 'consul',
        port: parseInt(process.env.CONSUL_PORT || '8500', 10)
    });

    const serviceId = 'api-gateway-1';
    const localIp = getLocalIp();

    const server = app.listen(Number(PORT), () => {
        console.log('\n=================================');
        console.log('🚪 Voidstone API Gateway');
        console.log('=================================');
        console.log(`📡 Port: ${PORT}`);
        console.log(`🔗 Health: http://localhost:${PORT}/health`);
        console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
        console.log(`🔗 Test: http://localhost:${PORT}/test`);
        console.log(`📡 Local IP: ${localIp}`);
        console.log('\n📋 Proxy Routes:');
        console.log(`   POST/GET  /api/auth/*     → auth-service (port 3001)`);
        console.log(`   POST/GET  /api/products/* → product-service (port 3004)`);
        console.log(`   POST/GET  /api/appointments/* → appointment-service (port 3003)`);
        console.log(`   POST      /api/orders/*   → auth-service (port 3001)`);
        console.log(`   POST      /api/contact/*  → auth-service (port 3001)`);
        console.log('=================================\n');

        // Try different addresses for Consul registration
        const addresses = [localIp, 'api-gateway', 'host.docker.internal', 'localhost'];
        
        const tryRegister = async (index: number) => {
            if (index >= addresses.length) {
                console.log('⚠️ Could not register with Consul');
                return;
            }

            const address = addresses[index];
            try {
                await consulClient.agent.service.register({
                    id: serviceId,
                    name: 'api-gateway',
                    address: address,
                    port: Number(PORT),
                    check: {
                        http: `http://${address}:${PORT}/health`,
                        interval: '10s',
                        timeout: '5s',
                        deregistercriticalserviceafter: '30s'
                    },
                    tags: ['gateway', 'api', 'nodejs', 'edge-service']
                } as any);
                
                console.log(`✅ Registered with Consul using ${address}`);
                console.log(`🔍 View at: http://localhost:8500/ui/dc1/services/api-gateway`);
            } catch (err) {
                console.log(`🔄 Retry ${index + 1}/${addresses.length}...`);
                tryRegister(index + 1);
            }
        };

        tryRegister(0);
    });

    // Graceful shutdown
    const shutdown = async () => {
        console.log('\n🛑 Shutting down gracefully...');
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
    // In test mode, just make sure the app is listening
    console.log(` API Gateway configured for test mode on port ${PORT}`);
}

export default app;