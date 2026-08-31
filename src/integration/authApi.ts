// ─────────────────────────────────────────────────────────────────────────────
// Login, cadastro, logout e perfil/estatísticas — a única camada que conhece
// os detalhes de sessão (tokens, canal seguro). As telas usam AuthContext,
// nunca isto diretamente.
// ─────────────────────────────────────────────────────────────────────────────
import { request } from './cloudClient';
import { ROUTES } from '../config/env';
import { randomHex } from '../security/crypto';
import { createLocalSession, adoptServerSession, clearSession } from '../security/session';

export interface AuthResult {
  userId: string;
  username: string;
}

export interface StatsPayload {
  level?: string | number;
  vitorias?: string | number;
  derrotas?: string | number;
}

export interface StatsResponse {
  id: string;
  username: string;
  level: number;
  vitorias: number;
  derrotas: number;
  [key: string]: unknown;
}

interface RawAuthResponse {
  userId?: string;
  id?: string;
  username?: string;
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  refreshTokenExpiresIn?: number;
  secureChannel?: boolean;
  [key: string]: unknown;
}

async function authenticate(path: string, username: string, password: string): Promise<AuthResult> {
  // Chave AES-256 gerada em memória e enviada só nesta chamada. Se o backend
  // confirmar (`secureChannel: true`), ela passa a valer para o resto da
  // sessão; se ele ignorar o campo (caso do backend atual), nada muda.
  const channelKey = await randomHex(32);

  const res = await request<RawAuthResponse>(path, {
    method: 'POST',
    body: JSON.stringify({ username, password, secureChannel: channelKey }),
    auth: false,
    decryptWithKeyHex: channelKey,
  });

  const userId = String(res.userId ?? res.id ?? '');
  const resolvedUsername = String(res.username ?? username);
  const confirmedChannelKey = res.secureChannel === true ? channelKey : undefined;

  if (res.accessToken || res.token) {
    await adoptServerSession(userId, resolvedUsername, res, confirmedChannelKey);
  } else {
    await createLocalSession(userId, resolvedUsername, confirmedChannelKey);
  }

  return { userId, username: resolvedUsername };
}

export async function register(username: string, password: string): Promise<AuthResult> {
  return authenticate(ROUTES.register, username, password);
}

export async function login(username: string, password: string): Promise<AuthResult> {
  return authenticate(ROUTES.login, username, password);
}

export async function logout(): Promise<void> {
  try {
    await request(ROUTES.logout, { method: 'POST' });
  } catch {
    // Best-effort: o backend atual nem tem esse endpoint. O que importa é
    // limpar a sessão localmente de qualquer forma (no finally abaixo).
  } finally {
    await clearSession();
  }
}

export async function getStats(userId: string): Promise<StatsResponse> {
  return request<StatsResponse>(ROUTES.stats(userId));
}

export async function updateStats(userId: string, stats: StatsPayload): Promise<StatsResponse> {
  const payload: StatsPayload = {
    level: String(stats.level ?? 1),
    vitorias: String(stats.vitorias ?? 0),
    derrotas: String(stats.derrotas ?? 0),
  };
  return request<StatsResponse>(ROUTES.stats(userId), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
