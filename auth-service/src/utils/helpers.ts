import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

export const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId: string, email: string, role: string): string => {
    // Use any assertion to bypass type issues
    return (jwt.sign as any)(
        { userId, email, role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRY || '15m' }
    );
};

export const generateRefreshToken = (userId: string): string => {
    return (jwt.sign as any)(
        { userId },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );
};

export const generateVerificationCode = (): string => {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
};

export const verifyToken = (token: string): any => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
        return null;
    }
};