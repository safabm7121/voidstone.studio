import mongoose from 'mongoose';
import { User } from '../../src/models/User';

describe('User Model', () => {
  const validUserData = {
    email: 'test@example.com',
    password: 'hashedPassword123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'client',
    isVerified: false,
    verificationCode: 'ABCD1234'
  };

  it('should create a valid user', async () => {
    const user = new User(validUserData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.email).toBe(validUserData.email);
    expect(savedUser.firstName).toBe(validUserData.firstName);
    expect(savedUser.lastName).toBe(validUserData.lastName);
    expect(savedUser.role).toBe('client');
    expect(savedUser.isVerified).toBe(false);
    expect(savedUser.verificationCode).toBe('ABCD1234');
    expect(savedUser.createdAt).toBeDefined();
    expect(savedUser.updatedAt).toBeDefined();
  });

  it('should enforce unique email', async () => {
    const user1 = new User(validUserData);
    await user1.save();

    const user2 = new User({ ...validUserData, email: 'test@example.com' });
    await expect(user2.save()).rejects.toThrow();
  });

  it('should require required fields', async () => {
    const user = new User({});
    
    let error: any = null;
    try {
      await user.save();
    } catch (err) {
      error = err;
    }
    
    expect(error).toBeDefined();
    expect(error.errors.email).toBeDefined();
    expect(error.errors.password).toBeDefined();
    expect(error.errors.firstName).toBeDefined();
    expect(error.errors.lastName).toBeDefined();
  });

  it('should set default role to client', async () => {
    const user = new User({
      email: 'test2@example.com',
      password: 'hashed',
      firstName: 'Jane',
      lastName: 'Doe'
    });
    
    const savedUser = await user.save();
    expect(savedUser.role).toBe('client');
  });

  it('should allow valid roles', async () => {
    const roles = ['admin', 'manager', 'designer', 'client'];
    
    for (const role of roles) {
      const user = new User({
        ...validUserData,
        email: `${role}@example.com`,
        role
      });
      
      const savedUser = await user.save();
      expect(savedUser.role).toBe(role);
    }
  });
});