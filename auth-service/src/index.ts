import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import consul from 'consul';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { User } from './models/User';
import { 
    registerSchema, loginSchema, verifyEmailSchema, 
    forgotPasswordSchema, resetPasswordSchema 
} from './utils/validation';
import {
    hashPassword, comparePasswords, generateToken,
    generateRefreshToken, generateVerificationCode, verifyToken
} from './utils/helpers';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI!)
    .then(() => console.log(' Connected to MongoDB'))
    .catch(err => console.error(' MongoDB connection error:', err));

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

transporter.verify((error, success) => {
    if (error) {
        console.error(' Email service error:', error);
    } else {
        console.log(' Email server ready to send messages');
    }
});

// ============= HEALTH CHECK ENDPOINT =============
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
        status: 'OK', 
        service: 'auth-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ============= CONTACT EMAIL ENDPOINT =============
app.post('/api/contact/send', async (req: Request, res: Response) => {
    try {
        const { name, email, message } = req.body;

        console.log(' ===== CONTACT FORM SUBMISSION =====');
        console.log('From:', name);
        console.log('Email:', email);
        console.log('Message:', message);

        // Email to store (voidstonestudio@gmail.com)
        await transporter.sendMail({
            from: '"Voidstone Studio Contact" <voidstonestudio@gmail.com>',
            to: 'voidstonestudio@gmail.com',
            subject: ` New Contact Message from ${name}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
                        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; padding: 20px; }
                        .header { background: black; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
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

        // Optional: Send auto-reply to the user
        await transporter.sendMail({
            from: '"Voidstone Studio" <voidstonestudio@gmail.com>',
            to: email,
            subject: 'Thank you for contacting Voidstone Studio',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
                        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; padding: 20px; }
                        .header { background: black; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
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

        console.log(' Contact emails sent successfully');
        res.json({ success: true, message: 'Message sent successfully' });

    } catch (error) {
        console.error(' Error sending contact email:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Email Templates
const getBuyerEmailTemplate = (data: any) => {
    const { items, shippingInfo, cartTotal, orderId } = data;
    
    const itemsList = items.map((item: any) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <img src="${item.images[0] || 'https://via.placeholder.com/50'}" width="50" height="50" style="border-radius: 4px;">
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
                    
                    <h3> Order Items</h3>
                    <table>
                        <thead>
                            <tr><th>Product</th><th>Name</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                        </thead>
                        <tbody>${itemsList}</tbody>
                    </table>

                    <div class="total">
                        <p>Total: $${cartTotal.toFixed(2)}</p>
                    </div>

                    <h3> Shipping Information</h3>
                    <p>${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.zipCode}, ${shippingInfo.country}</p>
                    
                    <h3> Payment Method</h3>
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
                .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; padding: 20px; }
                .header { background: black; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { background: #f0f0f0; padding: 10px; }
                td { padding: 10px; border-bottom: 1px solid #eee; }
                .highlight { background: #fff3cd; padding: 5px; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1> NEW ORDER ALERT</h1>
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

        console.log(' ===== ORDER EMAIL REQUEST RECEIVED =====');
        console.log('Order ID:', orderId);
        console.log('Buyer email:', shippingInfo.email);
        console.log('Store email: voidstonestudio+store@gmail.com (will appear in inbox)');

        // Email to buyer
        console.log(' Sending confirmation to buyer...');
        await transporter.sendMail({
            from: '"Voidstone Studio" <voidstonestudio@gmail.com>',
            to: shippingInfo.email,
            subject: `Order Confirmation - ${orderId}`,
            html: getBuyerEmailTemplate({ items, shippingInfo, cartTotal, orderId })
        });
        console.log(' Buyer email sent');

        // Short delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Email to store - USING +STORE ALIAS TO APPEAR IN INBOX!
        console.log(' Sending notification to store (will appear in inbox)...');
        await transporter.sendMail({
            from: '"Voidstone Studio" <voidstonestudio@gmail.com>',
            to: 'voidstonestudio+store@gmail.com',
            subject: ` NEW ORDER ALERT - ${orderId}`,
            html: getStoreEmailTemplate({ items, shippingInfo, cartTotal, orderId })
        });
        console.log(' Store notification sent - Check your Gmail inbox!');

        console.log(' ===== ALL EMAILS SENT SUCCESSFULLY =====');
        res.json({ success: true, message: 'Order emails sent successfully' });

    } catch (error) {
        console.error(' Error sending order emails:', error);
        res.status(500).json({ error: 'Failed to send order emails' });
    }
});


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

        console.log(` Verification code for ${email}: ${verificationCode}`);

        res.status(201).json({
            message: 'User created successfully. Please verify your email.',
            email: user.email
        });
    } catch (error) {
        console.error('Registration error:', error);
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
        console.error('Login error:', error);
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
        console.error('Email verification error:', error);
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
            return res.status(404).json({ error: 'User not found' });
        }

        const resetCode = generateVerificationCode();
        user.resetPasswordCode = resetCode;
        user.resetPasswordExpires = new Date(Date.now() + 3600000);
        await user.save();

        console.log(`🔑 Password reset code for ${email}: ${resetCode}`);

        res.json({ message: 'Password reset code sent to email' });
    } catch (error) {
        console.error('Forgot password error:', error);
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
        console.error('Reset password error:', error);
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

// ============= CONSUL REGISTRATION =============
const consulClient = new consul({
    host: process.env.CONSUL_HOST || 'localhost',
    port: parseInt(process.env.CONSUL_PORT || '8500')
});

const serviceId = 'auth-service-1';

const server = app.listen(PORT, () => {
    console.log('\n=================================');
    console.log(' Auth Service');
    console.log('=================================');
    console.log(` Port: ${PORT}`);
    console.log(` Health: http://localhost:${PORT}/health`);
    console.log(` Register: POST /api/auth/register`);
    console.log(` Login: POST /api/auth/login`);
    console.log(` Orders: POST /api/orders/send-emails`);
    console.log(` Contact: POST /api/contact/send`);
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

    try {
        // Register with Consul using local IP
        consulClient.agent.service.register({
            id: serviceId,
            name: 'auth-service',
            address: localIp,
            port: Number(PORT),
            check: {
                http: `http://${localIp}:${PORT}/health`,
                interval: '10s',
                timeout: '5s',
                deregistercriticalserviceafter: '30s'
            },
            tags: ['auth', 'user-service', 'nodejs', 'email']
        } as any);
        
        console.log(` Registered with Consul at http://localhost:8500 (using IP: ${localIp})`);
    } catch (error) {
        console.error(' Failed to register with Consul:', (error as Error).message);
        
        // Fallback to localhost registration
        try {
            consulClient.agent.service.register({
                id: serviceId,
                name: 'auth-service',
                address: 'localhost',
                port: Number(PORT),
                check: {
                    http: `http://localhost:${PORT}/health`,
                    interval: '10s'
                }
            } as any);
            console.log(' Registered with Consul using localhost fallback');
        } catch (fallbackError) {
            console.error(' Fallback registration also failed:', (fallbackError as Error).message);
        }
    }
});

process.on('SIGTERM', () => {
    console.log('Shutting down...');
    try {
        (consulClient.agent.service as any).deregister(serviceId);
    } catch (error) {}
    server.close();
});

process.on('SIGINT', () => {
    console.log('\nShutting down...');
    try {
        (consulClient.agent.service as any).deregister(serviceId);
    } catch (error) {}
    server.close();
});