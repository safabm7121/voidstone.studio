import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';

dotenv.config();

// Mock environment variables
process.env.GATEWAY_PORT = '3000';
process.env.CONSUL_HOST = 'localhost';
process.env.CONSUL_PORT = '8500';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173,http://localhost:3000';
process.env.NODE_ENV = 'test';

// Don't mock console.log completely - we want to see our debug logs
// global.console.log = jest.fn();
// global.console.error = jest.fn();

// Mock consul
jest.mock('consul', () => {
  return jest.fn().mockImplementation(() => ({
    agent: {
      service: {
        register: jest.fn().mockResolvedValue(true),
        deregister: jest.fn().mockResolvedValue(true)
      }
    }
  }));
});

// Mock http-proxy-middleware with proper types and logging
jest.mock('http-proxy-middleware', () => {
  console.log('🔧 Setting up http-proxy-middleware mock');
  
  return {
    createProxyMiddleware: jest.fn().mockImplementation((options: any) => {
      console.log('📋 Mock proxy created for target:', options.target);
      
      // Return an express middleware function
      return (req: Request, res: Response, next: NextFunction) => {
        console.log(`🔄 Mock proxy called for URL: ${req.method} ${req.url}`);
        console.log(`   Path: ${req.path}`);
        console.log(`   Original URL: ${req.originalUrl}`);
        
        // Check each possible route
        if (req.path.startsWith('/api/auth') || req.originalUrl.startsWith('/api/auth')) {
          console.log('✅ Auth service mock matched - responding with 503');
          return res.status(503).json({ error: 'auth-service unavailable' });
        } 
        
        if (req.path.startsWith('/api/products') || req.originalUrl.startsWith('/api/products')) {
          console.log('✅ Product service mock matched - responding with 503');
          return res.status(503).json({ error: 'product-service unavailable' });
        } 
        
        if (req.path.startsWith('/api/appointments') || req.originalUrl.startsWith('/api/appointments')) {
          console.log('✅ Appointment service mock matched - responding with 503');
          return res.status(503).json({ error: 'appointment-service unavailable' });
        } 
        
        if (req.path.startsWith('/api/orders') || req.originalUrl.startsWith('/api/orders')) {
          console.log('✅ Orders mock matched - responding with 503');
          return res.status(503).json({ error: 'auth-service unavailable' });
        } 
        
        if (req.path.startsWith('/api/contact') || req.originalUrl.startsWith('/api/contact')) {
          console.log('✅ Contact mock matched - responding with 503');
          return res.status(503).json({ error: 'auth-service unavailable' });
        }
        
        console.log('➡️ No mock match - calling next()');
        next();
      };
    })
  };
});