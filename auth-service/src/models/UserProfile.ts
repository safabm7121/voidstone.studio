import mongoose from 'mongoose';

export interface IUserProfile extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  bio: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    years: string;
    description: string;
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  files: {
    _id: mongoose.Types.ObjectId;
    name: string;
    type: 'cv' | 'portfolio' | 'certificate';
    url: string;
    uploadedAt: Date;
    size: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // This creates the index, remove the separate index line below
  },
  bio: {
    type: String,
    default: '',
    maxlength: 1000
  },
  skills: [{
    type: String,
    trim: true
  }],
  experience: [{
    title: { type: String, required: true },
    company: { type: String, required: true },
    years: { type: String, required: true },
    description: { type: String }
  }],
  education: [{
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    year: { type: String, required: true }
  }],
  files: [{
    _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    name: { type: String, required: true },
    type: { type: String, enum: ['cv', 'portfolio', 'certificate'], required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    size: { type: Number, required: true }
  }]
}, {
  timestamps: true
});


export const UserProfile = mongoose.model<IUserProfile>('UserProfile', userProfileSchema);