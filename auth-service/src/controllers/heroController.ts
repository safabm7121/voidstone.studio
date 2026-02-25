// controllers/heroController.ts
import { Response } from 'express';
import mongoose from 'mongoose';
import { Hero } from '../models/Hero';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

// Maximum file size in bytes (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Valid file types
const VALID_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// Admin email (only this specific admin can change hero image)
const ADMIN_EMAIL = 'voidstonestudio@gmail.com';

export class HeroController {
  // Helper method to check if user is the specific admin
  private async isVoidstoneAdmin(userId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      return user?.email === ADMIN_EMAIL && user?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // ==================== GET ACTIVE HERO IMAGE ====================
  async getActiveHero(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const hero = await Hero.findOne({ isActive: true });
      
      // If no hero image exists, return null (frontend will use default)
      return res.json({ hero: hero || null });
    } catch (error) {
      console.error('❌ Error fetching hero image:', error);
      return res.status(500).json({ error: 'Failed to fetch hero image' });
    }
  }

  // ==================== UPLOAD HERO IMAGE ====================
  async uploadHeroImage(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Strict check: Only voidstonestudio@gmail.com can upload
      const isVoidstoneAdmin = await this.isVoidstoneAdmin(userId);
      if (!isVoidstoneAdmin) {
        return res.status(403).json({ 
          error: 'Only Voidstone Studio admin can change the hero image' 
        });
      }

      const { imageData, imageType, fileSize } = req.body;

      // Validate required fields
      if (!imageData || !imageType || !fileSize) {
        return res.status(400).json({ 
          error: 'Missing required fields: imageData, imageType, and fileSize are required' 
        });
      }

      // Validate file type
      if (!VALID_MIME_TYPES.includes(imageType)) {
        return res.status(400).json({ 
          error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
        });
      }

      // Validate file size
      if (fileSize > MAX_FILE_SIZE) {
        return res.status(413).json({ 
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` 
        });
      }

      // Deactivate all existing hero images and delete them
      await Hero.deleteMany({});

      // Create new hero image record
      const hero = new Hero({
        imageData,
        imageType,
        uploadedBy: new mongoose.Types.ObjectId(userId),
        fileSize,
        isActive: true
      });

      await hero.save();

      console.log(`✅ Hero image uploaded by admin: ${ADMIN_EMAIL}`);
      return res.json({ 
        hero,
        message: 'Hero image uploaded successfully' 
      });
    } catch (error) {
      console.error('❌ Error uploading hero image:', error);
      return res.status(500).json({ error: 'Failed to upload hero image' });
    }
  }

  // ==================== DELETE HERO IMAGE ====================
  async deleteHeroImage(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Strict check: Only voidstonestudio@gmail.com can delete
      const isVoidstoneAdmin = await this.isVoidstoneAdmin(userId);
      if (!isVoidstoneAdmin) {
        return res.status(403).json({ 
          error: 'Only Voidstone Studio admin can delete the hero image' 
        });
      }

      // Delete all records from database
      await Hero.deleteMany({});

      console.log(`✅ All hero images deleted by admin: ${ADMIN_EMAIL}`);
      return res.json({ message: 'Hero image deleted successfully' });
    } catch (error) {
      console.error('❌ Error deleting hero image:', error);
      return res.status(500).json({ error: 'Failed to delete hero image' });
    }
  }

  // ==================== UPDATE HERO TEXT ====================
  async updateHeroText(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Strict check: Only voidstonestudio@gmail.com can update text
      const isVoidstoneAdmin = await this.isVoidstoneAdmin(userId);
      if (!isVoidstoneAdmin) {
        return res.status(403).json({ 
          error: 'Only Voidstone Studio admin can update hero text' 
        });
      }

      const { title, subtitle, buttonText } = req.body;
      
      const hero = await Hero.findOne({ isActive: true });
      
      if (!hero) {
        return res.status(404).json({ error: 'No active hero image found' });
      }

      if (title) hero.title = title;
      if (subtitle) hero.subtitle = subtitle;
      if (buttonText) hero.buttonText = buttonText;

      await hero.save();

      console.log(`✅ Hero text updated by admin: ${ADMIN_EMAIL}`);
      return res.json({ 
        hero,
        message: 'Hero text updated successfully' 
      });
    } catch (error) {
      console.error('❌ Error updating hero text:', error);
      return res.status(500).json({ error: 'Failed to update hero text' });
    }
  }
}