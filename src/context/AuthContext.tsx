import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContextType, User } from '../@types';
import { apiLogin, apiGetStats, apiUpdateStats } from '../integration/api';

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

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
    try {
      // A API usa username — extrai a parte antes do "@" se vier email
      const username = email.includes('@') ? email.split('@')[0] : email;
      const authData = await apiLogin(username, password);

      // Busca wins/losses
      const statsData = await apiGetStats(authData.userId);

      const userData: User = {
        id: authData.userId,
        username: authData.username ?? username,
        email: email,
        avatar: undefined,
        wins: Number(statsData.vitorias ?? 0),
        losses: Number(statsData.derrotas ?? 0),
        team: [],
      };

      setUser(userData);
      setIsAuthenticated(true);
      await AsyncStorage.setItem('@pokedex_user', JSON.stringify(userData));
      return true;
    } catch (e) {
      console.warn('[AuthContext] login error:', e);
      return false;
    }
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

    // Sincroniza wins/losses com a API em background
    if (data.wins !== undefined || data.losses !== undefined) {
      apiUpdateStats(user.id, {
        level: 1,
        vitorias: updated.wins,
        derrotas: updated.losses,
      }).catch((err) => console.warn('[AuthContext] updateUser sync error:', err));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);