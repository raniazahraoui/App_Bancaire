import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, mockUsers } from '../utils/mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  verifyOTP: (otp: string) => boolean;
  isAuthenticated: boolean;
  needsOTP: boolean;
  setNeedsOTP: (value: boolean) => void;
  pendingUser: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [needsOTP, setNeedsOTP] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication - in real app, this would call an API
    const foundUser = mockUsers.find(u => u.email === email);
    
    if (foundUser && password.length > 0) {
      setPendingUser(foundUser);
      setNeedsOTP(true);
      return true;
    }
    
    return false;
  };

  const verifyOTP = (otp: string): boolean => {
    // Mock OTP verification - accept any 6-digit code
    if (otp === '123456' && pendingUser) {
      setUser(pendingUser);
      setPendingUser(null);
      setNeedsOTP(false);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setPendingUser(null);
    setNeedsOTP(false);
  };

  const value = {
    user,
    login,
    logout,
    verifyOTP,
    isAuthenticated: !!user,
    needsOTP,
    setNeedsOTP,
    pendingUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
