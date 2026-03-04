
import { heroApi } from './heroApi';

export interface HeroMedia {
  _id: string;
  mediaData: string;
  mediaType: string;
  mediaCategory: 'image' | 'video';
  title: string;
  subtitle: string;
  buttonText: string;
  isActive: boolean;
  uploadedBy: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

// Keep backward compatibility with existing code
export interface HeroImage {
  _id: string;
  imageData: string;  // This will be the same as mediaData
  imageType: string;   // This will be the same as mediaType
  title: string;
  subtitle: string;
  buttonText: string;
  isActive: boolean;
  uploadedBy: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
  mediaCategory?: 'image' | 'video'; 
}

class HeroService {
  private readonly baseUrl = '/hero';

  async getHeroMedia(): Promise<HeroMedia | null> {
    try {
      const response = await heroApi.get(`${this.baseUrl}/active`);
      return response.data.hero;
    } catch (error) {
      console.error('Error fetching hero media:', error);
      return null;
    }
  }

  // Keep for backward compatibility
  async getHeroImage(): Promise<HeroImage | null> {
    try {
      const media = await this.getHeroMedia();
      if (!media) return null;
      
      // Convert HeroMedia to HeroImage format
      return {
        _id: media._id,
        imageData: media.mediaData,
        imageType: media.mediaType,
        title: media.title,
        subtitle: media.subtitle,
        buttonText: media.buttonText,
        isActive: media.isActive,
        uploadedBy: media.uploadedBy,
        fileSize: media.fileSize,
        createdAt: media.createdAt,
        updatedAt: media.updatedAt,
        mediaCategory: media.mediaCategory
      };
    } catch (error) {
      console.error('Error fetching hero image:', error);
      return null;
    }
  }

  async updateHeroMedia(file: File): Promise<HeroMedia> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          // Remove the data URL prefix (e.g., "data:image/png;base64,")
          const imageData = base64Data.split(',')[1];
          
          const response = await heroApi.post(`${this.baseUrl}/upload`, {
            imageData: imageData,
            imageType: file.type,
            fileSize: file.size
          });
          
          resolve(response.data.hero);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  // Keep for backward compatibility
  async updateHeroImage(file: File): Promise<HeroImage> {
    const media = await this.updateHeroMedia(file);
    
    // Convert HeroMedia to HeroImage format
    return {
      _id: media._id,
      imageData: media.mediaData,
      imageType: media.mediaType,
      title: media.title,
      subtitle: media.subtitle,
      buttonText: media.buttonText,
      isActive: media.isActive,
      uploadedBy: media.uploadedBy,
      fileSize: media.fileSize,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
      mediaCategory: media.mediaCategory
    };
  }

  async deleteHeroImage(): Promise<void> {
    await heroApi.delete(`${this.baseUrl}/image`);
  }

  async updateHeroText(data: { title?: string; subtitle?: string; buttonText?: string }): Promise<HeroMedia> {
    const response = await heroApi.put(`${this.baseUrl}/text`, data);
    return response.data.hero;
  }
}

export const heroService = new HeroService();