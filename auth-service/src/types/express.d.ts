import { AuthRequest } from '../middleware/auth';

export interface HeroUploadRequest extends AuthRequest {
  file?: Express.Multer.File;
}