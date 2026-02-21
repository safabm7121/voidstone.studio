import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import consul from 'consul';

dotenv.config();

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;


app.use(cors());
app.use(express.json());


app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'api-gateway' });
});

app.get('/test', (req, res) => {
    res.json({ message: 'API Gateway is working!' });
});

app.get('/', (req, res) => {
    res.json({ 
        name: 'Voidstone API Gateway', 
        status: 'running',
        port: PORT
    });
});

const consulClient = new consul({
    host: 'localhost',
    port: 8500
});

const serviceId = 'api-gateway-1';


const server = app.listen(PORT, () => {
    console.log(' Voidstone API Gateway');
    console.log(` Port: ${PORT}`);
    console.log(` Health: http://localhost:${PORT}/health`);
    console.log(` Test: http://localhost:${PORT}/test`);
    
    try {
        consulClient.agent.service.register({
            id: serviceId,
            name: 'api-gateway',
            address: 'host.docker.internal', 
            port: Number(PORT),
            check: {
                http: `http://host.docker.internal:${PORT}/health`, // ← FIXED
                interval: '10s'
            }
        } as any);
        
        console.log(' Registered with Consul at http://localhost:8500');
        console.log('  Note: Using host.docker.internal for health checks');
    } catch (error) {
        console.error(' Failed to register with Consul:', (error as Error).message);
    }
    
    console.log('=================================');
});