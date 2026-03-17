import { Response } from 'express';
import mongoose from 'mongoose';
import { Hero } from '../models/Hero';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

// Maximum file size in bytes (200MB for videos, 50MB for images)
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB

// Admin email (only this specific admin can change hero media)
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

  // Helper method to determine media category
  private getMediaCategory(mimeType: string): 'image' | 'video' {
    return mimeType.startsWith('video/') ? 'video' : 'image';
  }

  // Helper method to get max file size based on media type
  private getMaxFileSize(mimeType: string): number {
    return mimeType.startsWith('video/') ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  }

  //  GET ACTIVE HERO MEDIA 
  async getActiveHero(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const hero = await Hero.findOne({ isActive: true });
      
      // If no hero media exists, return null (frontend will use default)
      return res.json({ hero: hero || null });
    } catch (error) {
      console.error('❌ Error fetching hero media:', error);
      return res.status(500).json({ error: 'Failed to fetch hero media' });
    }
  }

  //  UPLOAD HERO MEDIA (Image or Video) - HYBRID APPROACH
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
          error: 'Only Voidstone Studio admin can change the hero media' 
        });
      }

      const { imageData, imageType, fileSize, mediaUrl } = req.body;

      // CASE 1: URL PROVIDED - store directly
      if (mediaUrl) {
        // Validate URL
        if (!mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://')) {
          return res.status(400).json({ 
            error: 'Invalid URL format. Must start with http:// or https://' 
          });
        }

        // Determine media category from URL (check extension)
        const isVideoUrl = /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(mediaUrl);
        const mediaCategory = isVideoUrl ? 'video' : 'image';
        
        // Use provided imageType or default based on extension
        const mediaType = imageType || (isVideoUrl ? 'video/mp4' : 'image/jpeg');

        // Deactivate all existing hero media and delete them
        await Hero.deleteMany({});

        // Create new hero media record with URL
        const hero = new Hero({
          mediaData: mediaUrl, // Store URL directly, NOT base64
          mediaType: mediaType,
          mediaCategory,
          uploadedBy: new mongoose.Types.ObjectId(userId),
          fileSize: 0, // Size unknown for URLs
          isActive: true,
          isUrl: true // Add this field to Hero model
        });

        await hero.save();

        console.log(` Hero ${mediaCategory} URL saved by admin: ${ADMIN_EMAIL}`);
        return res.json({ 
          hero,
          message: `Hero ${mediaCategory} URL saved successfully` 
        });
      }

      // CASE 2: FILE UPLOAD (base64) - existing code
      // Validate required fields
      if (!imageData || !imageType || !fileSize) {
        return res.status(400).json({ 
          error: 'Missing required fields: imageData, imageType, and fileSize are required for file upload' 
        });
      }

      // Validate file type
      if (!imageType.startsWith('image/') && !imageType.startsWith('video/')) {
        return res.status(400).json({ 
          error: 'Invalid file type. Only image and video files are allowed.' 
        });
      }

      // Check file size
      const maxSize = this.getMaxFileSize(imageType);
      if (fileSize > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        return res.status(413).json({ 
          error: `File too large. Maximum size for ${imageType.startsWith('video/') ? 'videos' : 'images'} is ${maxSizeMB}MB.` 
        });
      }

      const mediaCategory = this.getMediaCategory(imageType);

      // Deactivate all existing hero media and delete them
      await Hero.deleteMany({});

      // Create new hero media record with base64
      const hero = new Hero({
        mediaData: imageData,
        mediaType: imageType,
        mediaCategory,
        uploadedBy: new mongoose.Types.ObjectId(userId),
        fileSize,
        isActive: true,
        isUrl: false
      });

      await hero.save();

      console.log(` Hero ${mediaCategory} uploaded by admin: ${ADMIN_EMAIL}`);
      return res.json({ 
        hero,
        message: `Hero ${mediaCategory} uploaded successfully` 
      });

    } catch (error) {
      console.error(' Error uploading hero media:', error);
      return res.status(500).json({ error: 'Failed to upload hero media' });
    }
  }

  // DELETE HERO MEDIA 
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
          error: 'Only Voidstone Studio admin can delete the hero media' 
        });
      }

      // Delete all records from database
      await Hero.deleteMany({});

      console.log(` All hero media deleted by admin: ${ADMIN_EMAIL}`);
      return res.json({ message: 'Hero media deleted successfully' });
    } catch (error) {
      console.error(' Error deleting hero media:', error);
      return res.status(500).json({ error: 'Failed to delete hero media' });
    }
  }

  //  UPDATE HERO TEXT 
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
        return res.status(404).json({ error: 'No active hero media found' });
      }

      if (title) hero.title = title;
      if (subtitle) hero.subtitle = subtitle;
      if (buttonText) hero.buttonText = buttonText;

      await hero.save();

      console.log(`Hero text updated by admin: ${ADMIN_EMAIL}`);
      return res.json({ 
        hero,
        message: 'Hero text updated successfully' 
      });
    } catch (error) {
      console.error(' Error updating hero text:', error);
      return res.status(500).json({ error: 'Failed to update hero text' });
    }
  }
}