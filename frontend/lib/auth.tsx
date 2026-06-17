'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'ADMIN' | 'SINDICO' | 'PORTEIRO';

interface User {
  id: string;
  name: string;
  role: UserRole;
  condominioId?: string; // Optional for ADMIN, required for others
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole, condominioId?: string) => void;
  logout: () => void;
  isAdmin: boolean;
  isSindico: boolean;
  isPorteiro: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('porteiro_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Default to ADMIN for now
      const defaultUser: User = { id: 'admin-id', name: 'Admin User', role: 'ADMIN' };
      setUser(defaultUser);
      localStorage.setItem('porteiro_user', JSON.stringify(defaultUser));
    }
  }, []);

  const login = (role: UserRole, condominioId?: string) => {
    const newUser: User = {
      id: role.toLowerCase(),
      name: `${role.charAt(0) + role.slice(1).toLowerCase()} User`,
      role,
      condominioId,
    };
    setUser(newUser);
    localStorage.setItem('porteiro_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('porteiro_user');
  };

  const value = {
    user,
    login,
    logout,
    isAdmin: user?.role === 'ADMIN',
    isSindico: user?.role === 'SINDICO',
    isPorteiro: user?.role === 'PORTEIRO',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
