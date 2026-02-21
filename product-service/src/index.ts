import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import consul from 'consul';
import rateLimit from 'express-rate-limit';
import productRoutes from './routes/productRoutes';
import './config/database'; // This initializes the MongoDB connection

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors({ 
    origin: ['http://localhost:5173', 'http://localhost:3000'], 
    credentials: true 
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const limiter = rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { error: 'Too many requests' } 
});
app.use('/api', limiter);

app.use('/api', productRoutes);

app.get('/health', (req: Request, res: Response) => {
    res.json({ 
        status: 'OK', 
        service: 'product-service',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req: Request, res: Response) => {
    res.json({
        name: 'Voidstone Product Service',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            products: {
                getAll: 'GET /api/products',
                getById: 'GET /api/products/:id',
                create: 'POST /api/products (auth)',
                update: 'PUT /api/products/:id (auth)',
                delete: 'DELETE /api/products/:id (auth)'
            }
        }
    });
});

const consulClient = new consul({ 
    host: process.env.CONSUL_HOST || 'localhost', 
    port: process.env.CONSUL_PORT || '8500'  
} as any);
const serviceId = 'product-service-1';

const server = app.listen(PORT, () => {
    console.log('\n=================================');
    console.log('📦 Product Service (MongoDB)');
    console.log('=================================');
    console.log(`📡 Port: ${PORT}`);
    console.log(`🔗 Health: http://localhost:${PORT}/health`);
    console.log(`📝 GET /api/products - List all products`);
    console.log(`➕ POST /api/products - Create product (auth)`);
    console.log(`📋 PUT /api/products/:id - Update product (auth)`);
    console.log(`🗑️ DELETE /api/products/:id - Delete product (auth)`);
    console.log('=================================\n');

    try {
        // Service registration expects number for port
        consulClient.agent.service.register({
            id: serviceId,
            name: 'product-service',
            address: 'host.docker.internal',
            port: Number(PORT), // Convert to number here
            check: { 
                http: `http://host.docker.internal:${PORT}/health`, 
                interval: '10s' 
            }
        } as any);
        console.log('✅ Registered with Consul at http://localhost:8500');
    } catch (error: any) {
        console.error('❌ Failed to register with Consul:', error.message);
    }
});

process.on('SIGTERM', () => {
    console.log('\nShutting down...');
    try { 
        (consulClient.agent.service as any).deregister(serviceId); 
    } catch (error) { }
    server.close();
});

process.on('SIGINT', () => {
    console.log('\nShutting down...');
    try { 
        (consulClient.agent.service as any).deregister(serviceId); 
    } catch (error) { }
    server.close();
});