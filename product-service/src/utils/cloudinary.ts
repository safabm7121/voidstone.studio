import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';


dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export interface CloudinaryResult {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
}

export class CloudinaryService {
  /**
   * Upload a base64 image to Cloudinary
   */
  static async uploadBase64(base64String: string): Promise<CloudinaryResult> {
    try {
      console.log('☁️ Uploading to Cloudinary...');
      
      const result = await cloudinary.uploader.upload(base64String, {
        folder: 'voidstone/products',
        use_filename: true,
        unique_filename: true,
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });

      console.log(`✅ Uploaded: ${result.secure_url}`);
      console.log(`   Size: ${(result.bytes / 1024).toFixed(2)}KB`);

      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        created_at: result.created_at
      };
    } catch (error) {
      console.error('❌ Cloudinary upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload multiple images
   */
  static async uploadMultiple(base64Images: string[]): Promise<CloudinaryResult[]> {
    const uploadPromises = base64Images.map(img => this.uploadBase64(img));
    return await Promise.all(uploadPromises);
  }

  /**
   * Delete an image from Cloudinary
   */
  static async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('❌ Delete failed:', error);
      return false;
    }
  }

  /**
   * Delete multiple images
   */
  static async deleteMultipleImages(publicIds: string[]): Promise<void> {
    for (const publicId of publicIds) {
      await this.deleteImage(publicId);
    }
  }
}