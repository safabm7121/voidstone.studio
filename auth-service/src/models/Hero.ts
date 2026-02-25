// models/Hero.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IHero extends Document {
  imageData: string;  // Base64 image data
  imageType: string;  // MIME type
  title: string;
  subtitle: string;
  buttonText: string;
  isActive: boolean;
  uploadedBy: mongoose.Types.ObjectId;
  fileSize: number;
  createdAt: Date;
  updatedAt: Date;
}

const heroSchema = new Schema<IHero>({
  imageData: {
    type: String,
    required: [true, 'Image data is required']
  },
  imageType: {
    type: String,
    required: [true, 'Image type is required']
  },
  title: {
    type: String,
    default: 'Voidstone Studio'
  },
  subtitle: {
    type: String,
    default: 'Luxury fashion with a dark aesthetic. Handcrafted pieces for the modern individual.'
  },
  buttonText: {
    type: String,
    default: 'Explore Collection'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required']
  }
}, {
  timestamps: true
});

// Ensure only one active hero image
heroSchema.pre('save', async function(this: IHero, next) {
  if (this.isActive) {
    await (this.constructor as any).updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { isActive: false }
    );
  }
  next();
});

export const Hero = mongoose.model<IHero>('Hero', heroSchema);