import mongoose from 'mongoose';
import { UserProfile } from '../../src/models/UserProfile';
import { User } from '../../src/models/User';

describe('UserProfile Model', () => {
  let userId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    const user = new User({
      email: 'profile@example.com',
      password: 'hashedPassword',
      firstName: 'Profile',
      lastName: 'Test'
    });
    const savedUser = await user.save();
    userId = savedUser._id as mongoose.Types.ObjectId;
  });

  const validProfileData = {
    userId: null as any, // Will be set in tests
    bio: 'Test bio',
    skills: ['JavaScript', 'TypeScript', 'Node.js'],
    experience: [
      {
        title: 'Senior Developer',
        company: 'Tech Corp',
        years: '2020-2023',
        description: 'Worked on various projects'
      }
    ],
    education: [
      {
        degree: 'Computer Science',
        institution: 'University',
        year: '2020'
      }
    ],
    files: [
      {
        name: 'resume.pdf',
        type: 'cv' as const,
        url: 'https://example.com/resume.pdf',
        size: 1024
      }
    ]
  };

  it('should create a valid user profile', async () => {
    const profile = new UserProfile({
      ...validProfileData,
      userId
    });

    const savedProfile = await profile.save();

    expect(savedProfile._id).toBeDefined();
    expect(savedProfile.userId.toString()).toBe(userId.toString());
    expect(savedProfile.bio).toBe(validProfileData.bio);
    expect(savedProfile.skills).toHaveLength(3);
    expect(savedProfile.experience).toHaveLength(1);
    expect(savedProfile.education).toHaveLength(1);
    expect(savedProfile.files).toHaveLength(1);
    expect(savedProfile.createdAt).toBeDefined();
    expect(savedProfile.updatedAt).toBeDefined();
  });

  it('should enforce unique userId', async () => {
    const profile1 = new UserProfile({ userId });
    await profile1.save();

    const profile2 = new UserProfile({ userId });
    await expect(profile2.save()).rejects.toThrow();
  });

  it('should set default values correctly', async () => {
    const profile = new UserProfile({ userId });
    const savedProfile = await profile.save();

    expect(savedProfile.bio).toBe('');
    expect(savedProfile.skills).toEqual([]);
    expect(savedProfile.experience).toEqual([]);
    expect(savedProfile.education).toEqual([]);
    expect(savedProfile.files).toEqual([]);
  });

  it('should validate file type enum', async () => {
    const profile = new UserProfile({
      userId,
      files: [
        {
          name: 'invalid.txt',
          type: 'invalid' as any, // Invalid type
          url: 'https://example.com/invalid.txt',
          size: 1024
        }
      ]
    });

    let error: any = null;
    try {
      await profile.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors['files.0.type']).toBeDefined();
  });
});