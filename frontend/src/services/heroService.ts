// services/heroService.ts
import { heroApi } from './heroApi';

export interface HeroImage {
  _id: string;
  imageData: string;
  imageType: string;
  title: string;
  subtitle: string;
  buttonText: string;
  isActive: boolean;
  uploadedBy: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

class HeroService {
  private readonly baseUrl = '/hero';

  async getHeroImage(): Promise<HeroImage | null> {
    try {
      const response = await heroApi.get(`${this.baseUrl}/active`);
      return response.data.hero;
    } catch (error) {
      console.error('Error fetching hero image:', error);
      return null;
    }
  }

  async updateHeroImage(file: File): Promise<HeroImage> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          
          const response = await heroApi.post(`${this.baseUrl}/upload`, {
            imageData: base64Data,
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

  async deleteHeroImage(): Promise<void> {
    await heroApi.delete(`${this.baseUrl}/image`);
  }

  async updateHeroText(data: { title?: string; subtitle?: string; buttonText?: string }): Promise<HeroImage> {
    const response = await heroApi.put(`${this.baseUrl}/text`, data);
    return response.data.hero;
  }
}

export const heroService = new HeroService();