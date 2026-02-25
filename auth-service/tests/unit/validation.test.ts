import { 
  registerSchema, 
  loginSchema, 
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema 
} from '../../src/utils/validation';

describe('Validation Schemas', () => {
  describe('Register Schema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      const { error } = registerSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid email');
    });

    it('should reject weak password', () => {
      const testCases = [
        { password: 'weak', expectedError: 'at least 8 characters' },
        { password: 'password123', expectedError: 'uppercase letter' },
        { password: 'PASSWORD123', expectedError: 'lowercase letter' },
        { password: 'Password', expectedError: 'one number' },
      ];

      testCases.forEach(({ password, expectedError }) => {
        const invalidData = {
          email: 'test@example.com',
          password,
          firstName: 'John',
          lastName: 'Doe'
        };
        
        const { error } = registerSchema.validate(invalidData);
        expect(error).toBeDefined();
        const errorMessages = error?.details.map(d => d.message).join(' ');
        expect(errorMessages).toContain(expectedError);
      });
    });

    it('should reject short first/last name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'J',
        lastName: 'D'
      };
      
      const { error } = registerSchema.validate(invalidData, { abortEarly: false });
      expect(error).toBeDefined();
      
      const errorMessages = error?.details.map(d => d.message).join(' ');
      // Fix: Use the actual error messages from your validation schema
      expect(errorMessages).toContain('First name must be at least 2 characters long');
      expect(errorMessages).toContain('Last name must be at least 2 characters long');
    });

    it('should require all fields', () => {
      const { error } = registerSchema.validate({}, { abortEarly: false });
      expect(error).toBeDefined();
      
      const errorMessages = error?.details.map(d => d.message);
      expect(errorMessages).toContain('Email is required');
      expect(errorMessages).toContain('Password is required');
      expect(errorMessages).toContain('First name is required');
      expect(errorMessages).toContain('Last name is required');
      
      expect(error?.details).toHaveLength(4);
    });

    it('should handle missing single field', () => {
      const missingEmail = {
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      const emailError = registerSchema.validate(missingEmail);
      expect(emailError.error).toBeDefined();
      expect(emailError.error?.details[0].message).toBe('Email is required');
      
      const missingPassword = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      const passwordError = registerSchema.validate(missingPassword);
      expect(passwordError.error).toBeDefined();
      expect(passwordError.error?.details[0].message).toBe('Password is required');
    });
  });

  describe('Login Schema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123'
      };
      
      const { error } = loginSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'Password123'
      };
      
      const { error } = loginSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid email');
    });

    it('should require both fields', () => {
      const missingPassword = { email: 'test@example.com' };
      const passwordError = loginSchema.validate(missingPassword);
      expect(passwordError.error).toBeDefined();
      expect(passwordError.error?.details[0].message).toBe('Password is required');
      
      const missingEmail = { password: 'Password123' };
      const emailError = loginSchema.validate(missingEmail);
      expect(emailError.error).toBeDefined();
      expect(emailError.error?.details[0].message).toBe('Email is required');
      
      const { error } = loginSchema.validate({}, { abortEarly: false });
      expect(error).toBeDefined();
      expect(error?.details).toHaveLength(2);
    });
  });

  describe('Verify Email Schema', () => {
    it('should validate correct verification data', () => {
      const validData = {
        email: 'test@example.com',
        code: 'ABCD1234'
      };
      
      const { error } = verifyEmailSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject code with wrong length', () => {
      const invalidData = {
        email: 'test@example.com',
        code: 'ABC123'
      };
      
      const { error } = verifyEmailSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('length must be 8 characters');
    });

    it('should reject missing fields', () => {
      const missingCode = { email: 'test@example.com' };
      const codeError = verifyEmailSchema.validate(missingCode);
      expect(codeError.error).toBeDefined();
      
      const missingEmail = { code: 'ABCD1234' };
      const emailError = verifyEmailSchema.validate(missingEmail);
      expect(emailError.error).toBeDefined();
    });
  });

  describe('Forgot Password Schema', () => {
    it('should validate correct email', () => {
      const validData = { email: 'test@example.com' };
      const { error } = forgotPasswordSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const invalidData = { email: 'not-an-email' };
      const { error } = forgotPasswordSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid email');
    });

    it('should require email', () => {
      const { error } = forgotPasswordSchema.validate({});
      expect(error).toBeDefined();
      // Fix: Joi returns the field name in quotes by default
      expect(error?.details[0].message).toBe('"email" is required');
    });
  });

  describe('Reset Password Schema', () => {
    it('should validate correct reset data', () => {
      const validData = {
        email: 'test@example.com',
        code: 'ABCD1234',
        newPassword: 'NewPassword123'
      };
      
      const { error } = resetPasswordSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject weak new password', () => {
      const testCases = [
        { password: 'weak', expectedError: 'at least 8 characters' },
        { password: 'password123', expectedError: 'uppercase letter' },
        { password: 'PASSWORD123', expectedError: 'lowercase letter' },
        { password: 'Password', expectedError: 'one number' },
      ];

      testCases.forEach(({ password, expectedError }) => {
        const invalidData = {
          email: 'test@example.com',
          code: 'ABCD1234',
          newPassword: password
        };
        
        const { error } = resetPasswordSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain(expectedError);
      });
    });

    it('should reject invalid code length', () => {
      const invalidData = {
        email: 'test@example.com',
        code: 'ABC123',
        newPassword: 'NewPassword123'
      };
      
      const { error } = resetPasswordSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('length must be 8 characters');
    });

  it('should require all fields', () => {
  const { error } = resetPasswordSchema.validate({}, { abortEarly: false });
  expect(error).toBeDefined();
  
  const errorMessages = error?.details.map(d => d.message);
  expect(errorMessages).toContain('"email" is required');
  expect(errorMessages).toContain('"code" is required');
  
  
  expect(errorMessages).toContain('"newPassword" is required');
  
  expect(error?.details.length).toBeGreaterThanOrEqual(3);
});
  });
});