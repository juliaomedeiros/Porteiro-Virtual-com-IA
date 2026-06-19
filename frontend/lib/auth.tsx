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

  useEffect(() => {
    // Read from cookies instead of localStorage
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const role = getCookie('user_role') as UserRole;
    const id = getCookie('user_id');
    const condominioId = getCookie('condominio_id') || undefined;

    if (role && id) {
      setUser({
        id,
        name: role === 'ADMIN' ? 'Administrador' : role === 'SINDICO' ? 'Síndico' : 'Porteiro',
        role,
        condominioId
      });
    }
  }, []);

  const login = (role: UserRole, condominioId?: string) => {
    // This login function in the context is now only for the UserSwitcher mock switching of context
    // The actual login happens in the LoginPage using Server Actions.
    // However, if we want the UserSwitcher to work, we can update the cookies.
    document.cookie = `user_role=${role}; path=/`;
    if (condominioId) {
      document.cookie = `condominio_id=${condominioId}; path=/`;
    } else {
      document.cookie = `condominio_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
    window.location.reload();
  };

  const logoutAction = async () => {
    setUser(null);
    const { logout } = await import('@/app/actions/auth');
    await logout();
  };

  const value = {
    user,
    login,
    logout: logoutAction,
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
