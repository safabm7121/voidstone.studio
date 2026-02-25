import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ProfileData {
  bio: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    years: string;
    description?: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  files: Array<{
    _id: string;
    name: string;
    type: 'cv' | 'portfolio' | 'certificate';
    url: string;
    uploadedAt: string;
    size: number;
  }>;
}

export const profileService = {
  // Get user profile
  getProfile: async (): Promise<{ profile: ProfileData }> => {
    const response = await api.get('/profile');
    return response.data;
  },

  // Update profile (bio, skills, experience, education)
  updateProfile: async (data: Partial<ProfileData>): Promise<{ profile: ProfileData }> => {
    const response = await api.put('/profile', data);
    return response.data;
  },

  // Upload a file (send as base64 JSON)
  uploadFile: async (fileData: {
    name: string;
    type: 'cv' | 'portfolio' | 'certificate';
    url: string; // base64
    size: number;
  }): Promise<{ profile: ProfileData }> => {
    const response = await api.post('/profile/files', fileData);
    return response.data;
  },

  // Delete a file
  deleteFile: async (fileId: string): Promise<{ profile: ProfileData }> => {
    const response = await api.delete(`/profile/files/${fileId}`);
    return response.data;
  }
};