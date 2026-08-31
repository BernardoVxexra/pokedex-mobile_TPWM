import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AuthContextType, User } from '../@types';
import * as authApi from '../integration/authApi';
import { STORAGE_KEYS } from '../config/env';
import { getSealed, saveSealed, migrateLegacyUserRecord } from '../security/secureStore';
import { ensureValidAccessToken, subscribeToSession } from '../security/session';
import { setOnSessionExpired } from '../integration/cloudClient';

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    bootstrap();

    setOnSessionExpired(() => {
      forceLogoutLocally();
    });

    const unsubscribe = subscribeToSession((session) => {
      setSessionExpiresAt(session?.refreshTokenExpiresAt ?? null);
      if (!session) forceLogoutLocally();
    });

    return () => {
      setOnSessionExpired(null);
      unsubscribe();
    };
  }, []);

  // Faz a sessão "cair sozinha" quando o refresh token vence, mesmo sem
  // nenhuma requisição em andamento (usuário parado numa tela, por exemplo).
  useEffect(() => {
    if (!sessionExpiresAt) return;
    const delay = sessionExpiresAt - Date.now();
    if (delay <= 0) {
      forceLogoutLocally();
      return;
    }
    const timer = setTimeout(async () => {
      const stillValid = await ensureValidAccessToken();
      if (!stillValid) forceLogoutLocally();
    }, delay + 500);
    return () => clearTimeout(timer);
  }, [sessionExpiresAt]);

  const bootstrap = async () => {
    // Sem sessão válida (nunca logou com o novo modelo, ou o refresh token
    // venceu): fica deslogado. O save local continua protegido e será
    // recuperado (com time/avatar preservados) no próximo login.
    const session = await ensureValidAccessToken();
    if (!session) return;

    const storedUser = await getSealed<User>(STORAGE_KEYS.userRecord);
    if (storedUser) applyUser(storedUser);
  };

  const applyUser = (userData: User) => {
    userRef.current = userData;
    setUser(userData);
    setIsAuthenticated(true);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // A API usa username — extrai a parte antes do "@" se vier email
      const username = email.includes('@') ? email.split('@')[0] : email;
      const auth = await authApi.login(username, password);
      const stats = await authApi.getStats(auth.userId);

      // Migra um save antigo em texto puro (se existir) para o formato
      // protegido, ou reaproveita um save já protegido de um login anterior
      // — só quando é da mesma conta, pra não vazar time/avatar de outro
      // usuário num aparelho compartilhado.
      const resolvedUsername = auth.username ?? username;
      const legacyUser = await migrateLegacyUserRecord<User>(STORAGE_KEYS.userRecord);
      const candidateUser = legacyUser ?? (await getSealed<User>(STORAGE_KEYS.userRecord));
      const previousUser =
        candidateUser && (candidateUser.id === auth.userId || candidateUser.username === resolvedUsername)
          ? candidateUser
          : null;

      const userData: User = {
        id: auth.userId,
        username: resolvedUsername,
        email,
        avatar: previousUser?.avatar,
        wins: Number(stats.vitorias ?? 0),
        losses: Number(stats.derrotas ?? 0),
        team: previousUser?.team ?? [],
      };

      await saveSealed(STORAGE_KEYS.userRecord, userData);
      applyUser(userData);
      return true;
    } catch (e) {
      console.warn('[AuthContext] login error:', e);
      return false;
    }
  };

  const logout = async () => {
    await authApi.logout();
    await forceLogoutLocally();
  };

  const forceLogoutLocally = async () => {
    // Só limpa o estado em memória/tela — o save local protegido continua no
    // aparelho para ser reaproveitado (time, avatar) no próximo login da
    // mesma conta.
    userRef.current = null;
    setUser(null);
    setIsAuthenticated(false);
    setSessionExpiresAt(null);
  };

  const updateUser = async (data: Partial<User>) => {
    if (!userRef.current) return;
    const updated = { ...userRef.current, ...data };
    userRef.current = updated;
    setUser(updated);
    await saveSealed(STORAGE_KEYS.userRecord, updated);

    // Sincroniza wins/losses com a API em background
    if (data.wins !== undefined || data.losses !== undefined) {
      authApi
        .updateStats(updated.id, {
          level: 1,
          vitorias: updated.wins,
          derrotas: updated.losses,
        })
        .catch((err) => console.warn('[AuthContext] updateUser sync error:', err));
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, sessionExpiresAt, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
