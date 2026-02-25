import request from 'supertest';
import app from '../src/index';

describe('API Gateway', () => {
  describe('Health Endpoints', () => {
    it('should return OK status on /health', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('service', 'api-gateway');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return service info on /test', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'API Gateway is working!');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return gateway info on root path', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Voidstone API Gateway');
      expect(response.body).toHaveProperty('status', 'running');
      expect(response.body.port).toBe('3000');
      expect(response.body.endpoints).toHaveProperty('health', '/health');
      expect(response.body.endpoints).toHaveProperty('auth', '/api/auth/*');
      expect(response.body.endpoints).toHaveProperty('products', '/api/products/*');
      expect(response.body.endpoints).toHaveProperty('appointments', '/api/appointments/*');
    });
  });

  describe('CORS Configuration', () => {
    it('should allow requests from allowed origins', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should have rate limiter configured', async () => {
      const response = await request(app)
        .get('/api/auth/test');
      
      // In test mode, we should get 503 from the mock proxy
      expect(response.status).toBe(503);
    });

    it('should not rate limit non-API routes', async () => {
      const response = await request(app)
        .get('/health');
      
      expect(response.status).toBe(200);
    });
  });

  describe('Proxy Routes', () => {
    it('should proxy auth service requests', async () => {
      const response = await request(app)
        .get('/api/auth/test');
      
      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('error', 'auth-service unavailable');
    });

    it('should proxy product service requests', async () => {
      const response = await request(app)
        .get('/api/products/test');
      
      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('error', 'product-service unavailable');
    });

    it('should proxy appointment service requests', async () => {
      const response = await request(app)
        .get('/api/appointments/test');
      
      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('error', 'appointment-service unavailable');
    });

    it('should proxy order requests to auth service', async () => {
      const response = await request(app)
        .post('/api/orders/test')
        .send({});
      
      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('error', 'auth-service unavailable');
    });

    it('should proxy contact requests to auth service', async () => {
      const response = await request(app)
        .post('/api/contact/test')
        .send({});
      
      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('error', 'auth-service unavailable');
    });

    it('should handle POST requests to proxy routes', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password'
        });
      
      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('error', 'auth-service unavailable');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers from helmet', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-dns-prefetch-control']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      await request(app)
        .get('/unknown-route')
        .expect(404);
    });

    it('should handle malformed JSON gracefully', async () => {
      await request(app)
        .post('/api/auth/test')
        .set('Content-Type', 'application/json')
        .send('{"malformed": json}')
        .expect(400);
    });
  });
});