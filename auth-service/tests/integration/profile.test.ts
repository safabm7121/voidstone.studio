import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/index';
import { User } from '../../src/models/User';
import { UserProfile } from '../../src/models/UserProfile';
import { generateToken } from '../../src/utils/helpers';

describe('Profile API Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    // Create a test user
    const user = new User({
      email: 'profile@example.com',
      password: 'hashedPassword123',
      firstName: 'Profile',
      lastName: 'Test',
      isVerified: true
    });
    await user.save();
    userId = user._id.toString();
    authToken = generateToken(userId, user.email, user.role);
  });

  describe('GET /api/profile', () => {
    it('should get user profile', async () => {
      // Create profile first
      await UserProfile.create({
        userId: new mongoose.Types.ObjectId(userId),
        bio: 'Test bio',
        skills: ['JavaScript', 'TypeScript']
      });

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.bio).toBe('Test bio');
      expect(response.body.profile.skills).toEqual(['JavaScript', 'TypeScript']);
    });

    it('should create empty profile if none exists', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.bio).toBe('');
      expect(response.body.profile.skills).toEqual([]);
    });

    it('should reject unauthorized request', async () => {
      await request(app)
        .get('/api/profile')
        .expect(401);
    });
  });

  describe('PUT /api/profile', () => {
    it('should update profile', async () => {
      const updateData = {
        bio: 'Updated bio',
        skills: ['Node.js', 'React', 'MongoDB'],
        experience: [
          {
            title: 'Developer',
            company: 'Tech Co',
            years: '2020-2023',
            description: 'Full stack development'
          }
        ],
        education: [
          {
            degree: 'BS Computer Science',
            institution: 'University',
            year: '2020'
          }
        ]
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.profile.bio).toBe(updateData.bio);
      expect(response.body.profile.skills).toEqual(updateData.skills);
      expect(response.body.profile.experience).toHaveLength(1);
      expect(response.body.profile.education).toHaveLength(1);

      // Check database
      const profile = await UserProfile.findOne({ userId });
      expect(profile?.bio).toBe(updateData.bio);
    });
  });

  describe('POST /api/profile/files', () => {
    it('should upload file reference', async () => {
      const fileData = {
        name: 'resume.pdf',
        type: 'cv',
        url: 'https://example.com/resume.pdf',
        size: 1024 * 1024 // 1MB
      };

      const response = await request(app)
        .post('/api/profile/files')
        .set('Authorization', `Bearer ${authToken}`)
        .send(fileData)
        .expect(200);

      expect(response.body.profile.files).toHaveLength(1);
      expect(response.body.profile.files[0].name).toBe(fileData.name);
      expect(response.body.profile.files[0].type).toBe(fileData.type);

      // Check database
      const profile = await UserProfile.findOne({ userId });
      expect(profile?.files).toHaveLength(1);
    });

    it('should reject file too large', async () => {
      const fileData = {
        name: 'large.pdf',
        type: 'cv',
        url: 'https://example.com/large.pdf',
        size: 20 * 1024 * 1024 // 20MB (over 10MB limit)
      };

      const response = await request(app)
        .post('/api/profile/files')
        .set('Authorization', `Bearer ${authToken}`)
        .send(fileData)
        .expect(413);

      expect(response.body.error).toContain('File too large');
    });

    it('should enforce file type enum', async () => {
      const fileData = {
        name: 'invalid.txt',
        type: 'invalid',
        url: 'https://example.com/invalid.txt',
        size: 1024
      };

      const response = await request(app)
        .post('/api/profile/files')
        .set('Authorization', `Bearer ${authToken}`)
        .send(fileData)
        .expect(400);
    });
  });

  describe('DELETE /api/profile/files/:fileId', () => {
    it('should delete file', async () => {
      // First upload a file
      const fileData = {
        name: 'resume.pdf',
        type: 'cv',
        url: 'https://example.com/resume.pdf',
        size: 1024
      };

      const uploadResponse = await request(app)
        .post('/api/profile/files')
        .set('Authorization', `Bearer ${authToken}`)
        .send(fileData)
        .expect(200);

      const fileId = uploadResponse.body.profile.files[0]._id;

      // Delete the file
      const deleteResponse = await request(app)
        .delete(`/api/profile/files/${fileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteResponse.body.profile.files).toHaveLength(0);

      // Check database
      const profile = await UserProfile.findOne({ userId });
      expect(profile?.files).toHaveLength(0);
    });

    it('should handle invalid file id', async () => {
      const response = await request(app)
        .delete('/api/profile/files/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400); // Fix: expect 400, not 500

      expect(response.body.error).toBeDefined();
    });
  });
});