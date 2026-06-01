import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContextType, User } from '../@types';

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const MOCK_USERS = [
  { email: 'ash@pokemon.com', password: '123456', username: 'Ash Ketchum', wins: 47, losses: 12 },
  { email: 'misty@pokemon.com', password: '123456', username: 'Misty', wins: 33, losses: 8 },
  { email: 'brock@pokemon.com', password: '123456', username: 'Brock', wins: 25, losses: 15 },
  { email: 'test@test.com', password: '123456', username: 'Treinador', wins: 10, losses: 5 },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('@pokedex_user');
      if (stored) {
        const userData = JSON.parse(stored);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (e) {}
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const mockUser = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (mockUser) {
      const userData: User = {
        id: Math.random().toString(36).substr(2, 9),
        username: mockUser.username,
        email: mockUser.email,
        avatar: undefined,
        wins: mockUser.wins,
        losses: mockUser.losses,
        team: [],
      };
      setUser(userData);
      setIsAuthenticated(true);
      await AsyncStorage.setItem('@pokedex_user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    await AsyncStorage.removeItem('@pokedex_user');
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    await AsyncStorage.setItem('@pokedex_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
