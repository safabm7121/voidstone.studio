import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import consul from 'consul';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import client from 'prom-client';
import path from 'path';
import { User } from './models/User';
import profileRoutes from './routes/profileRoutes';
import heroRoutes from './routes/heroRoutes';
import { 
    registerSchema, loginSchema, verifyEmailSchema, 
    forgotPasswordSchema, resetPasswordSchema 
} from './utils/validation';
import {
    hashPassword, comparePasswords, generateToken,
    generateRefreshToken, generateVerificationCode, verifyToken
} from './utils/helpers';
import { sendVerificationEmail, sendPasswordResetEmail } from './utils/emailService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// ============= MIDDLEWARE ORDER IS IMPORTANT! =============
// 1. Basic middleware first
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin for images
}));
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3003'],
    credentials: true,
    exposedHeaders: ['Cross-Origin-Resource-Policy']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// REMOVED: Static file serving from uploads directory (no longer needed)

// 2. Metrics middleware AFTER body parsing but BEFORE routes
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

// Connect to MongoDB (skip in test environment)
if (!isTestEnvironment) {
    mongoose.connect(process.env.MONGODB_URI!)
        .then(() => console.log('✅ Connected to MongoDB'))
        .catch(err => console.error('❌ MongoDB connection error:', err));
}

// Email Transporter Setup
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Verify email transporter (skip in test environment)
if (!isTestEnvironment) {
    transporter.verify((error, success) => {
        if (error) {
            console.error('❌ Email service error:', error);
        } else {
            console.log('✅ Email server ready to send messages');
        }
    });
}

// ============= HEALTH CHECK ENDPOINT =============
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
        status: 'OK', 
        service: 'auth-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
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

// ============= USER MANAGEMENT ENDPOINTS =============
app.get('/api/users', async (req: Request, res: Response) => {
    try {
        const { role } = req.query;
        let query: any = { isVerified: true };
        
        if (role) {
            query.role = role;
        }
        
        const users = await User.find(query).select('-password -verificationCode -resetPasswordCode -resetPasswordExpires');
        res.json({ users });
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/users/:id', async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id).select('-password -verificationCode -resetPasswordCode -resetPasswordExpires');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        console.error('❌ Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============= AUTH ENDPOINTS =============
app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
        const { error } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { email, password, firstName, lastName } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await hashPassword(password);
        const verificationCode = generateVerificationCode();

        const user = new User({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            verificationCode,
            role: 'client'
        });

        await user.save();

        // Log the code to console (for development)
        console.log(`🔑 Verification code for ${email}: ${verificationCode}`);

        // Send verification email (don't block registration if email fails)
        try {
            await sendVerificationEmail(email, verificationCode, firstName);
            console.log(`✅ Verification email sent to ${email}`);
        } catch (emailError) {
            console.error(`❌ Failed to send verification email to ${email}:`, emailError);
            // Continue anyway - user can still use the code from console
        }

        res.status(201).json({
            message: 'User created successfully. Please verify your email.',
            email: user.email
        });
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
        const { error } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await comparePasswords(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(401).json({ error: 'Please verify your email first' });
        }

        const token = generateToken(user._id.toString(), user.email, user.role);
        const refreshToken = generateRefreshToken(user._id.toString());

        res.json({
            message: 'Login successful',
            token,
            refreshToken,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/verify-email', async (req: Request, res: Response) => {
    try {
        const { error } = verifyEmailSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { email, code } = req.body;

        const user = await User.findOne({ email, verificationCode: code });
        if (!user) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        user.isVerified = true;
        user.verificationCode = null;
        await user.save();

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('❌ Email verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
    try {
        const { error } = forgotPasswordSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            // Return success even if user doesn't exist (security best practice)
            return res.json({ message: 'If an account exists with this email, a password reset code has been sent' });
        }

        const resetCode = generateVerificationCode();
        user.resetPasswordCode = resetCode;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
        await user.save();

        console.log(`🔑 Password reset code for ${email}: ${resetCode}`);

        // Send reset code via email
        try {
            await sendPasswordResetEmail(email, resetCode, user.firstName);
            console.log(`✅ Password reset email sent to ${email}`);
        } catch (emailError) {
            console.error(`❌ Failed to send password reset email:`, emailError);
            // Still return success to prevent email enumeration
        }

        res.json({ message: 'If an account exists with this email, a password reset code has been sent' });
    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    try {
        const { error } = resetPasswordSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { email, code, newPassword } = req.body;

        const user = await User.findOne({
            email,
            resetPasswordCode: code,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset code' });
        }

        const hashedPassword = await hashPassword(newPassword);
        user.password = hashedPassword;
        user.resetPasswordCode = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('❌ Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/refresh-token', async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const decoded: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const newToken = generateToken(user._id.toString(), user.email, user.role);
        const newRefreshToken = generateRefreshToken(user._id.toString());

        res.json({
            token: newToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        return res.status(401).json({ error: 'Invalid refresh token' });
    }
});

app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        
        const user = await User.findById(decoded.userId).select('-password -verificationCode -resetPasswordCode -resetPasswordExpires');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
});

// ============= CONTACT EMAIL ENDPOINT =============
app.post('/api/contact/send', async (req: Request, res: Response) => {
    try {
        const { name, email, message } = req.body;

        console.log('📬 ===== CONTACT FORM SUBMISSION =====');
        console.log('From:', name);
        console.log('Email:', email);
        console.log('Message:', message);

        // Email to store
        await transporter.sendMail({
            from: '"Voidstone Studio Contact" <voidstonestudio@gmail.com>',
            to: 'voidstonestudio@gmail.com',
            subject: `📬 New Contact Message from ${name}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
                        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; }
                        .header { background: black; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; }
                        .field { margin-bottom: 15px; }
                        .label { font-weight: 600; color: #666; }
                        .value { padding: 8px; background: #f9f9f9; border-radius: 4px; margin-top: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>📬 New Contact Message</h1>
                        </div>
                        <div class="content">
                            <div class="field">
                                <div class="label">Name:</div>
                                <div class="value">${name}</div>
                            </div>
                            <div class="field">
                                <div class="label">Email:</div>
                                <div class="value">${email}</div>
                            </div>
                            <div class="field">
                                <div class="label">Message:</div>
                                <div class="value">${message}</div>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        // Auto-reply to user
        await transporter.sendMail({
            from: '"Voidstone Studio" <voidstonestudio@gmail.com>',
            to: email,
            subject: 'Thank you for contacting Voidstone Studio',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
                        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; }
                        .header { background: black; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Thank You for Contacting Us</h1>
                        </div>
                        <div class="content">
                            <p>Dear ${name},</p>
                            <p>Thank you for reaching out to Voidstone Studio. We have received your message and will get back to you as soon as possible.</p>
                            <p>Best regards,<br>The Voidstone Studio Team</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        console.log('✅ Contact emails sent successfully');
        res.json({ success: true, message: 'Message sent successfully' });

    } catch (error) {
        console.error('❌ Error sending contact email:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Email Templates
const getBuyerEmailTemplate = (data: any) => {
    const { items, shippingInfo, cartTotal, orderId } = data;
    
    const itemsList = items.map((item: any) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <img src="${item.images?.[0] || 'https://via.placeholder.com/50'}" width="50" height="50" style="border-radius: 4px;">
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">x${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">$${item.price}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .header { background: black; padding: 30px; text-align: center; }
                .header h1 { color: white; margin: 0; }
                .content { padding: 40px 30px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { background: #f0f0f0; padding: 12px; text-align: left; }
                .total { font-size: 18px; font-weight: 600; text-align: right; margin-top: 20px; }
                .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>VOIDSTONE STUDIO</h1>
                </div>
                <div class="content">
                    <h2>Thank you for your order, ${shippingInfo.firstName}!</h2>
                    <p><strong>Order ID:</strong> ${orderId}</p>
                    
                    <h3>📦 Order Items</h3>
                    <table>
                        <thead>
                            <tr><th>Product</th><th>Name</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                        </thead>
                        <tbody>${itemsList}</tbody>
                    </table>

                    <div class="total">
                        <p>Total: $${cartTotal.toFixed(2)}</p>
                    </div>

                    <h3>🚚 Shipping Information</h3>
                    <p>${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.zipCode}, ${shippingInfo.country}</p>
                    
                    <h3>💳 Payment Method</h3>
                    <p>${shippingInfo.paymentMethod}</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Voidstone Studio</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

const getStoreEmailTemplate = (data: any) => {
    const { items, shippingInfo, cartTotal, orderId } = data;
    
    const itemsList = items.map((item: any) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">$${item.price}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; }
                .header { background: black; color: white; padding: 20px; text-align: center; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { background: #f0f0f0; padding: 10px; }
                td { padding: 10px; border-bottom: 1px solid #eee; }
                .highlight { background: #fff3cd; padding: 5px; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛍️ NEW ORDER ALERT</h1>
                </div>
                <h2>Order Details</h2>
                <p><strong>Order ID:</strong> <span class="highlight">${orderId}</span></p>
                
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${shippingInfo.firstName} ${shippingInfo.lastName}</p>
                <p><strong>Email:</strong> ${shippingInfo.email}</p>
                
                <h3>Order Items</h3>
                <table>
                    <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                    ${itemsList}
                </table>
                
                <h3>Total Amount: $${cartTotal.toFixed(2)}</h3>
                
                <h3>Shipping Address</h3>
                <p>${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.zipCode}, ${shippingInfo.country}</p>
                
                <h3>Payment Method</h3>
                <p>${shippingInfo.paymentMethod}</p>
            </div>
        </body>
        </html>
    `;
};

// ============= ORDER EMAIL ENDPOINT =============
app.post('/api/orders/send-emails', async (req: Request, res: Response) => {
    try {
        const { items, shippingInfo, cartTotal, orderId } = req.body;

        console.log('📧 ===== ORDER EMAIL REQUEST RECEIVED =====');
        console.log('Order ID:', orderId);
        console.log('Buyer email:', shippingInfo.email);

        // Email to buyer
        await transporter.sendMail({
            from: '"Voidstone Studio" <voidstonestudio@gmail.com>',
            to: shippingInfo.email,
            subject: `Order Confirmation - ${orderId}`,
            html: getBuyerEmailTemplate({ items, shippingInfo, cartTotal, orderId })
        });
        console.log(' Buyer email sent');

        // Short delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Email to store
        await transporter.sendMail({
            from: '"Voidstone Studio" <voidstonestudio@gmail.com>',
            to: 'voidstonestudio+store@gmail.com',
            subject: ` NEW ORDER ALERT - ${orderId}`,
            html: getStoreEmailTemplate({ items, shippingInfo, cartTotal, orderId })
        });
        console.log(' Store notification sent');

        console.log(' ===== ALL EMAILS SENT SUCCESSFULLY =====');
        res.json({ success: true, message: 'Order emails sent successfully' });

    } catch (error) {
        console.error(' Error sending order emails:', error);
        res.status(500).json({ error: 'Failed to send order emails' });
    }
});

// ============= APPOINTMENT EMAIL ENDPOINT =============
app.post('/api/appointment-email', async (req: Request, res: Response) => {
  try {
    const { to, subject, html } = req.body;

    console.log(` Sending appointment email to: ${to}`);
    
    await transporter.sendMail({
      from: '"Voidstone Studio" <voidstonestudio@gmail.com>',
      to,
      subject,
      html
    });

    console.log(' Appointment email sent successfully');
    res.json({ success: true });
  } catch (error) {
    console.error(' Error sending appointment email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Profile routes
app.use('/api', profileRoutes);

// Hero routes
app.use('/api', heroRoutes);

// ============= CONSUL REGISTRATION =============
const consulClient = new consul({
    host: process.env.CONSUL_HOST || 'localhost',
    port: process.env.CONSUL_PORT || '8500'  
});

const serviceId = 'auth-service-1';

// Start server and register with Consul (skip in test environment)
if (!isTestEnvironment) {
    const server = app.listen(PORT, () => {
        console.log('\n=================================');
        console.log(' Auth Service');
        console.log('=================================');
        console.log(` Port: ${PORT}`);
        console.log(` Health: http://localhost:${PORT}/health`);
        console.log(` Metrics: http://localhost:${PORT}/metrics`);
        console.log(` GET /api/users - List users (by role)`);
        console.log(` POST /api/auth/register - Register`);
        console.log(` POST /api/auth/login - Login`);
        console.log(` POST /api/appointment-email - Send appointment emails`);
        console.log(` POST /api/contact/send - Contact form`);
        console.log(` POST /api/orders/send-emails - Order emails`);
        console.log(` /api/profile - Profile management`);
        console.log(`/api/hero - Hero image management (stored in MongoDB)`);
        console.log('=================================\n');

        // Get local IP address
        const { networkInterfaces } = require('os');
        const nets = networkInterfaces();
        let localIp = 'localhost';
        
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                if (net.family === 'IPv4' && !net.internal) {
                    localIp = net.address;
                    break;
                }
            }
        }

        console.log(` Local IP detected: ${localIp}`);

        // Register with Consul using Promises (no callback)
        const registerWithAddress = async (address: string) => {
            try {
                await consulClient.agent.service.register({
                    id: serviceId,
                    name: 'auth-service',
                    address: address,
                    port: Number(PORT),
                    check: {
                        http: `http://${address}:${PORT}/health`,
                        interval: '10s',
                        timeout: '5s',
                        deregistercriticalserviceafter: '30s'
                    },
                    tags: ['auth', 'user-service', 'nodejs', 'email', 'profile', 'hero']
                } as any);
                
                console.log(` Registered with Consul using ${address}`);
                return true;
            } catch (error: any) {
                console.error(` Failed to register with Consul using ${address}:`, error.message);
                return false;
            }
        };

        // Try local IP first, then localhost as fallback
        registerWithAddress(localIp).then(success => {
            if (!success) {
                registerWithAddress('localhost');
            }
        });
    });

    // Graceful shutdown
    const shutdown = async () => {
        console.log('\n Shutting down...');
        try {
            await consulClient.agent.service.deregister(serviceId);
            console.log(' Deregistered from Consul');
        } catch (error: any) {
            console.error('❌ Error deregistering:', error.message);
        } finally {
            server.close(() => {
                console.log(' Server closed');
                process.exit(0);
            });
        }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

export default app;