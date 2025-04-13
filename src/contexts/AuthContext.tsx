import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthUser } from '../types';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.vercel.app'  // Replace with your actual backend URL
  : 'http://localhost:3000';

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string, role: 'admin' | 'employee') => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string, role: 'admin' | 'employee') => {
    try {
      // First check if server is reachable
      try {
        await axios.get(`${API_BASE_URL}/health`);
      } catch (error) {
        throw new Error('Unable to connect to server. Please make sure the server is running.');
      }

      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username,
        password,
        role
      });

      if (response.data.success) {
        const user = response.data.user;
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        throw new Error(response.data.message || 'Invalid credentials');
      }
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.message.includes('connect to server')) {
        throw new Error('Server is not running. Please start the backend server.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 