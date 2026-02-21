import mongoose from 'mongoose';


export interface IUser extends mongoose.Document {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'manager' | 'designer' | 'client';
    isVerified: boolean;
    verificationCode: string | null;
    resetPasswordCode: string | null;
    resetPasswordExpires: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'designer', 'client'],
        default: 'client'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String,
        default: null
    },
    resetPasswordCode: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

export const User = mongoose.model<IUser>('User', userSchema);
