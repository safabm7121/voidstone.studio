import { 
  hashPassword, 
  comparePasswords, 
  generateToken,
  generateRefreshToken,
  generateVerificationCode,
  verifyToken 
} from '../../src/utils/helpers';
import jwt from 'jsonwebtoken';

// Mock jwt
jest.mock('jsonwebtoken');

describe('Helper Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'TestPassword123';
      const hashed = await hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash format
    });

    it('should verify correct password', async () => {
      const password = 'TestPassword123';
      const hashed = await hashPassword(password);
      
      const isValid = await comparePasswords(password, hashed);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123';
      const wrongPassword = 'WrongPassword123';
      const hashed = await hashPassword(password);
      
      const isValid = await comparePasswords(wrongPassword, hashed);
      expect(isValid).toBe(false);
    });
  });

  describe('Token Generation', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...OLD_ENV };
      process.env.JWT_SECRET = 'test-secret';
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    });

    afterAll(() => {
      process.env = OLD_ENV;
    });

    it('should generate JWT token', () => {
      const userId = '123456789';
      const email = 'test@example.com';
      const role = 'client';
      
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const token = generateToken(userId, email, role);
      
      expect(token).toBe('mock-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId, email, role },
        'test-secret',
        { expiresIn: process.env.JWT_EXPIRY || '15m' }
      );
    });

    it('should generate refresh token', () => {
      const userId = '123456789';
      
      (jwt.sign as jest.Mock).mockReturnValue('mock-refresh-token');

      const token = generateRefreshToken(userId);
      
      expect(token).toBe('mock-refresh-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId },
        'test-refresh-secret',
        { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
      );
    });

    it('should verify token', () => {
      const mockDecoded = { userId: '123', email: 'test@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const result = verifyToken('valid-token');
      
      expect(result).toEqual(mockDecoded);
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
    });

    it('should return null for invalid token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = verifyToken('invalid-token');
      
      expect(result).toBeNull();
    });
  });

  describe('Verification Code', () => {
    it('should generate 8-character uppercase code', () => {
      const code = generateVerificationCode();
      
      expect(code).toBeDefined();
      expect(code.length).toBe(8);
      expect(code).toMatch(/^[A-F0-9]{8}$/); // Hexadecimal uppercase
    });

    it('should generate different codes each time', () => {
      const code1 = generateVerificationCode();
      const code2 = generateVerificationCode();
      
      expect(code1).not.toBe(code2);
    });
  });
});