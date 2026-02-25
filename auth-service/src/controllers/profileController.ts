import { Response } from 'express';
import mongoose from 'mongoose';
import { UserProfile } from '../models/UserProfile';
import { AuthRequest } from '../middleware/auth';

// Maximum file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_PROFILE = 20;

// Valid file types
const VALID_FILE_TYPES = ['cv', 'portfolio', 'certificate'] as const;
type ValidFileType = typeof VALID_FILE_TYPES[number];

export class ProfileController {
  // ==================== GET PROFILE ====================
  async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validate userId format
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      let profile = await UserProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      
      // If no profile exists, create an empty one
      if (!profile) {
        profile = new UserProfile({ 
          userId: new mongoose.Types.ObjectId(userId),
          bio: '',
          skills: [],
          experience: [],
          education: [],
          files: []
        });
        await profile.save();
      }

      res.json({ profile });
    } catch (error) {
      console.error('❌ Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== UPDATE PROFILE ====================
  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validate userId format
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      const { bio, skills, experience, education } = req.body;

      // Validate input types
      if (bio !== undefined && typeof bio !== 'string') {
        return res.status(400).json({ error: 'Bio must be a string' });
      }

      if (skills !== undefined && !Array.isArray(skills)) {
        return res.status(400).json({ error: 'Skills must be an array' });
      }

      if (experience !== undefined && !Array.isArray(experience)) {
        return res.status(400).json({ error: 'Experience must be an array' });
      }

      if (education !== undefined && !Array.isArray(education)) {
        return res.status(400).json({ error: 'Education must be an array' });
      }

      // Validate experience items if provided
      if (experience) {
        for (const exp of experience) {
          if (!exp.title || !exp.company || !exp.years) {
            return res.status(400).json({ 
              error: 'Each experience must have title, company, and years' 
            });
          }
        }
      }

      // Validate education items if provided
      if (education) {
        for (const edu of education) {
          if (!edu.degree || !edu.institution || !edu.year) {
            return res.status(400).json({ 
              error: 'Each education must have degree, institution, and year' 
            });
          }
        }
      }

      const profile = await UserProfile.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { 
          bio: bio || '',
          skills: skills || [],
          experience: experience || [],
          education: education || []
        },
        { 
          new: true, 
          upsert: true,
          runValidators: true
        }
      );

      res.json({ profile });
    } catch (error) {
      console.error('❌ Update profile error:', error);
      
      // Handle validation errors
      if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== UPLOAD FILE ====================
  async uploadFile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validate userId format
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      const { name, type, url, size } = req.body;

      // Validate required fields
      if (!name || !type || !url || size === undefined) {
        return res.status(400).json({ 
          error: 'Missing required fields: name, type, url, and size are required' 
        });
      }

      // Validate file type
      if (!VALID_FILE_TYPES.includes(type as ValidFileType)) {
        return res.status(400).json({ 
          error: `Invalid file type. Must be one of: ${VALID_FILE_TYPES.join(', ')}` 
        });
      }

      // Validate file name
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'File name must be a non-empty string' });
      }

      // Validate URL format (basic check)
      if (typeof url !== 'string' || !url.startsWith('http')) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      // Validate file size
      if (typeof size !== 'number' || size <= 0) {
        return res.status(400).json({ error: 'File size must be a positive number' });
      }

      if (size > MAX_FILE_SIZE) {
        return res.status(413).json({ 
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` 
        });
      }

      // Check total files count
      const currentProfile = await UserProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      if (currentProfile && currentProfile.files.length >= MAX_FILES_PER_PROFILE) {
        return res.status(400).json({ 
          error: `Maximum number of files reached (${MAX_FILES_PER_PROFILE}).` 
        });
      }

      // Create new file object
      const newFile = {
        _id: new mongoose.Types.ObjectId(),
        name: name.trim(),
        type,
        url,
        size,
        uploadedAt: new Date()
      };

      // Add file to profile
      const profile = await UserProfile.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $push: { files: newFile } },
        { 
          new: true, 
          upsert: true,
          runValidators: true
        }
      );

      res.json({ profile });
    } catch (error) {
      console.error('❌ Upload file error:', error);
      
      // Handle validation errors
      if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== DELETE FILE ====================
  async deleteFile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validate userId format
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      const { fileId } = req.params;

      // Validate fileId
      if (!fileId) {
        return res.status(400).json({ error: 'File ID is required' });
      }

      // Check if fileId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(fileId)) {
        return res.status(400).json({ error: 'Invalid file ID format' });
      }

      const profile = await UserProfile.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $pull: { files: { _id: new mongoose.Types.ObjectId(fileId) } } },
        { new: true }
      );

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json({ profile });
    } catch (error) {
      console.error('❌ Delete file error:', error);
      
      // Check if error is related to invalid ObjectId
      if (error instanceof Error && error.name === 'BSONError') {
        return res.status(400).json({ error: 'Invalid file ID format' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== GET SINGLE FILE ====================
  async getFile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validate userId format
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      const { fileId } = req.params;

      // Validate fileId
      if (!fileId) {
        return res.status(400).json({ error: 'File ID is required' });
      }

      if (!mongoose.Types.ObjectId.isValid(fileId)) {
        return res.status(400).json({ error: 'Invalid file ID format' });
      }

      const profile = await UserProfile.findOne({ 
        userId: new mongoose.Types.ObjectId(userId),
        'files._id': new mongoose.Types.ObjectId(fileId)
      });

      if (!profile) {
        return res.status(404).json({ error: 'File not found' });
      }

      const file = profile.files.find(f => f._id.toString() === fileId);
      res.json({ file });
    } catch (error) {
      console.error('❌ Get file error:', error);
      
      if (error instanceof Error && error.name === 'BSONError') {
        return res.status(400).json({ error: 'Invalid file ID format' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}