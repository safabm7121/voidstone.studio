// This is just a reference - actual users are in auth-service
export interface UserReference {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'designer' | 'client';
}