"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth as useAuthHook } from '@/hooks/useAuth';

// 为了保持向后兼容性，我们保留原有的接口
interface User {
  id?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: any) => void;
  register: (username: string, password: string, email: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuthHook();

  // 为了保持向后兼容性，包装register函数
  const register = async (username: string, password: string, email: string): Promise<boolean> => {
    // 这里可以调用实际的注册API
    console.log(`尝试注册用户: ${username}, 邮箱: ${email}`);
    // 模拟注册逻辑
    try {
      // 这里应该是实际的API调用
      return true;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    login: auth.login, // 注意：这里的login现在接收userData而不是username/password
    register,
    logout: auth.logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};