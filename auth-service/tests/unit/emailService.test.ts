import { sendVerificationEmail } from '../../src/utils/emailService';
import nodemailer from 'nodemailer';

// Mock nodemailer - do this BEFORE any imports
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn(),
    verify: jest.fn().mockImplementation((callback) => callback(null, true))
  })
}));

describe('Email Service', () => {
  const mockSendMail = require('nodemailer').createTransport().sendMail;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      // Mock successful email send
      mockSendMail.mockResolvedValueOnce({ messageId: 'mock-message-id' });

      const result = await sendVerificationEmail(
        'test@example.com',
        'ABCD1234',
        'John'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('mock-message-id');
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      
      // Check that email was called with correct parameters
      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.to).toBe('test@example.com');
      expect(mailOptions.subject).toContain('Verify Your Voidstone Studio Account');
      expect(mailOptions.html).toContain('ABCD1234');
      expect(mailOptions.html).toContain('John');
    });

    it('should throw error when email sending fails', async () => {
      // Mock email sending failure
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

      await expect(
        sendVerificationEmail('test@example.com', 'ABCD1234', 'John')
      ).rejects.toThrow('SMTP error');
      
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });
  });
});