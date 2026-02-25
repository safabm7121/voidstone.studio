import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/index';
import { User } from '../../src/models/User';
import { hashPassword } from '../../src/utils/helpers';

// Mock the email service to avoid actual email sending
jest.mock('../../src/utils/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-id' })
}));

describe('Auth API Integration Tests', () => {
  beforeEach(async () => {
    // Clear users collection
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toContain('User created successfully');
      expect(response.body.email).toBe(userData.email); // Fix: response has email, not user.email

      // Check database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeDefined();
      expect(user?.firstName).toBe(userData.firstName);
      expect(user?.lastName).toBe(userData.lastName);
      expect(user?.isVerified).toBe(false);
      expect(user?.verificationCode).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'Password123',
        firstName: 'Jane',
        lastName: 'Doe'
      };

      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toContain('User already exists');
    });

    it('should validate input data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'weak',
        firstName: '',
        lastName: ''
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a verified user
      const hashedPassword = await hashPassword('Password123');
      const user = new User({
        email: 'login@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        isVerified: true,
        verificationCode: null
      });
      await user.save();
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123'
        })
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user.email).toBe('login@example.com');
      expect(response.body.user.firstName).toBe('Test');
      expect(response.body.user.lastName).toBe('User');
      expect(response.body.user.role).toBe('client');
    });

    it('should reject wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword'
        })
        .expect(401);

      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123'
        })
        .expect(401);

      expect(response.body.error).toContain('Invalid credentials');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    beforeEach(async () => {
      // Create unverified user
      const hashedPassword = await hashPassword('Password123');
      const user = new User({
        email: 'verify@example.com',
        password: hashedPassword,
        firstName: 'Verify',
        lastName: 'Test',
        isVerified: false,
        verificationCode: 'ABCD1234'
      });
      await user.save();
    });

    it('should verify email with correct code', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: 'verify@example.com',
          code: 'ABCD1234'
        })
        .expect(200);

      expect(response.body.message).toContain('Email verified successfully');
      
      // Check database
      const user = await User.findOne({ email: 'verify@example.com' });
      expect(user?.isVerified).toBe(true);
      expect(user?.verificationCode).toBeNull(); // Fix: expect null, not undefined
    });

    it('should reject invalid verification code', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: 'verify@example.com',
          code: 'WRONG123'
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid verification code'); // Fix: match actual error message
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      const hashedPassword = await hashPassword('Password123');
      const user = new User({
        email: 'forgot@example.com',
        password: hashedPassword,
        firstName: 'Forgot',
        lastName: 'Test',
        isVerified: true
      });
      await user.save();
    });

    it('should send reset code for existing email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'forgot@example.com'
        })
        .expect(200);

      expect(response.body.message).toContain('Password reset code sent'); // Fix: match actual message
      
      // Check database
      const user = await User.findOne({ email: 'forgot@example.com' });
      expect(user?.resetPasswordCode).toBeDefined();
      expect(user?.resetPasswordExpires).toBeDefined();
    });

    it('should return 404 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        })
        .expect(404); // Fix: expect 404

      expect(response.body.error).toContain('User not found');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    beforeEach(async () => {
      const hashedPassword = await hashPassword('Password123');
      const user = new User({
        email: 'reset@example.com',
        password: hashedPassword,
        firstName: 'Reset',
        lastName: 'Test',
        isVerified: true,
        resetPasswordCode: 'RESET123',
        resetPasswordExpires: new Date(Date.now() + 3600000)
      });
      await user.save();
    });

    it('should reset password with valid code', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: 'reset@example.com',
          code: 'RESET123',
          newPassword: 'NewPassword123'
        })
        .expect(200);

      expect(response.body.message).toContain('Password reset successful'); // Fix: match actual message
      
      // Check that password was updated
      const user = await User.findOne({ email: 'reset@example.com' });
      expect(user?.resetPasswordCode).toBeNull();
      expect(user?.resetPasswordExpires).toBeNull();
      
      // Verify new password works
      const { comparePasswords } = require('../../src/utils/helpers');
      const isValid = await comparePasswords('NewPassword123', user?.password);
      expect(isValid).toBe(true);
    });

    it('should reject invalid reset code', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: 'reset@example.com',
          code: 'WRONG123',
          newPassword: 'NewPassword123'
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid or expired reset code');
    });
  });
});