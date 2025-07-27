import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { api } from './api';
import { User } from '@shared/api';

export type UserType = 'creator' | 'coach';

interface AuthContextType {
  user: User | null;
  login: (name: string, type: UserType) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved user session
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
      api.getUserById(savedUserId)
        .then(setUser)
        .catch(() => {
          // If user not found, clear the saved session
          localStorage.removeItem('userId');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (name: string, type: UserType) => {
    try {
      const user = await api.login(name, type);
      setUser(user);
      localStorage.setItem('userId', user.id);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userId');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
