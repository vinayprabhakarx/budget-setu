import { createContext, useContext } from 'react';

export interface User {
  userId: string;
  email: string;
  fullName: string;
  createdAt?: string;
  role?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  logout: () => Promise<void>;
  updateUser: (updatedFields: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
