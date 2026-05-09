import React, { createContext, useContext, useState, ReactNode } from 'react';

type AuthContextType = {
  loggedIn: boolean;
  username: string;
  login: (u: string, p: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  const login = (u: string, p: string) => {
    if (u === 'ash' && p === 'pikachu') {
      setLoggedIn(true);
      setUsername(u);
      return true;
    }
    return false;
  };

  const logout = () => {
    setLoggedIn(false);
    setUsername('');
  };

  return (
    <AuthContext.Provider value={{ loggedIn, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
