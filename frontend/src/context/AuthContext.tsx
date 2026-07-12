import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '../types';
import toast from 'react-hot-toast';
import {
  apiRegister,
  apiLogin,
  apiGetMe,
  apiForgotPassword,
  apiResetPassword,
  apiUpdateProfile,
  setToken,
  clearToken,
  getToken,
} from '../lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Maps the backend's Mongo user shape (_id, no isOnline) onto the frontend's User type
function mapApiUser(apiUser: any): User {
  return {
    id: apiUser._id,
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role,
    avatarUrl:
      apiUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(apiUser.name)}&background=random`,
    bio: apiUser.bio || '',
    isOnline: true,
    createdAt: apiUser.createdAt || new Date().toISOString(),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    apiGetMe()
      .then((res) => setUser(mapApiUser(res.data)))
      .catch(() => clearToken())
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await apiLogin({ email, password });
      if (res.data.role !== role) {
        throw new Error(`This account is registered as ${res.data.role}, not ${role}`);
      }
      setToken(res.data.token);
      setUser(mapApiUser(res.data));
      toast.success('Successfully logged in!');
      return res.data.twoFactorEnabled || false;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await apiRegister({ name, email, password, role });
      setToken(res.data.token);
      setUser(mapApiUser(res.data));
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await apiForgotPassword(email);
      toast.success('If that email is registered, reset instructions have been sent.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not process request');
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      await apiResetPassword(token, newPassword);
      toast.success('Password reset successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Reset failed');
      throw error;
    }
  };

  const logout = (): void => {
    clearToken();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (_userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const res = await apiUpdateProfile(updates);
      setUser(mapApiUser(res.data));
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Update failed');
      throw error;
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
