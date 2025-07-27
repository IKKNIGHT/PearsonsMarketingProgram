import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { api } from './api';
import { User } from '@shared/api';

export type UserType = 'creator' | 'coach';

interface AuthContextType {
  user: User | null;
  register: (username: string, name: string, password: string, type: UserType) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  updateUser: (updatedUser: User) => void;
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

  const register = async (username: string, name: string, password: string, type: UserType) => {
    try {
      const user = await api.register(username, name, password, type);
      setUser(user);
      localStorage.setItem('userId', user.id);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const user = await api.login(username, password);
      setUser(user);
      localStorage.setItem('userId', user.id);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('userId', updatedUser.id);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userId');
  };

  return (
    <AuthContext.Provider value={{
      user,
      register,
      login,
      updateUser,
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
