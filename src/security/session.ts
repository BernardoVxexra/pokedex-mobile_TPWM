
import { API_URL, ACCESS_TOKEN_TTL_MS, REFRESH_TOKEN_TTL_MS, ACCESS_TOKEN_REFRESH_MARGIN_MS, ROUTES, STORAGE_KEYS } from '../config/env';
import { randomHex, toHex, fromHex, hmacSha256Hex, timingSafeEqual } from './crypto';
import { getOrCreateDeviceKey, saveSecret, getSecret, deleteSecret, saveSealed, getSealed, removeSealed } from './secureStore';
import { signRequest } from './envelope';

export type SessionMode = 'server' | 'local';

export interface Session {
  mode: SessionMode;
  userId: string;
  username: string;
  /** Curta duração, só em memória — nunca é persistido. */
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
  refreshTokenExpiresAt: number;
  /** Chave usada para assinar requisições (device key em modo local, o próprio access token em modo servidor). */
  signingKey: string;
  /** Chave do canal seguro negociada no login, se o backend confirmou o uso. Só em memória. */
  secureChannelKey?: string;
}

interface PersistedSessionMeta {
  mode: SessionMode;
  userId: string;
  username: string;
  refreshTokenExpiresAt: number;
}

type SessionListener = (session: Session | null) => void;

let currentSession: Session | null = null;
const listeners = new Set<SessionListener>();

function setSession(session: Session | null): void {
  currentSession = session;
  listeners.forEach((listener) => listener(session));
}

export function getSession(): Session | null {
  return currentSession;
}

/** Notifica apenas mudanças subsequentes — não dispara com o valor atual ao inscrever. */
export function subscribeToSession(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function issueTicket(keyHex: string, payload: Record<string, unknown>): string {
  const payloadHex = toHex(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = hmacSha256Hex(keyHex, payloadHex);
  return `${payloadHex}.${signature}`;
}

function verifyTicket(keyHex: string, ticket: string): Record<string, unknown> | null {
  const [payloadHex, signature] = ticket.split('.');
  if (!payloadHex || !signature) return null;
  const expected = hmacSha256Hex(keyHex, payloadHex);
  if (!timingSafeEqual(expected, signature)) return null;
  try {
    return JSON.parse(new TextDecoder().decode(fromHex(payloadHex)));
  } catch {
    return null;
  }
}

async function persistSession(session: Session): Promise<void> {
  await saveSecret(STORAGE_KEYS.refreshToken, session.refreshToken);
  const meta: PersistedSessionMeta = {
    mode: session.mode,
    userId: session.userId,
    username: session.username,
    refreshTokenExpiresAt: session.refreshTokenExpiresAt,
  };
  await saveSealed(STORAGE_KEYS.sessionMeta, meta);
}

export async function clearSession(): Promise<void> {
  await deleteSecret(STORAGE_KEYS.refreshToken);
  await removeSealed(STORAGE_KEYS.sessionMeta);
  setSession(null);
}

export async function createLocalSession(
  userId: string,
  username: string,
  secureChannelKey?: string
): Promise<Session> {
  const deviceKey = await getOrCreateDeviceKey();
  const now = Date.now();
  const accessToken = issueTicket(deviceKey, {
    sub: userId,
    username,
    iat: now,
    exp: now + ACCESS_TOKEN_TTL_MS,
  });

  const session: Session = {
    mode: 'local',
    userId,
    username,
    accessToken,
    accessTokenExpiresAt: now + ACCESS_TOKEN_TTL_MS,
    refreshToken: await randomHex(32),
    refreshTokenExpiresAt: now + REFRESH_TOKEN_TTL_MS,
    signingKey: deviceKey,
    secureChannelKey,
  };

  await persistSession(session);
  setSession(session);
  return session;
}

export async function adoptServerSession(
  userId: string,
  username: string,
  response: Record<string, unknown>,
  secureChannelKey?: string
): Promise<Session> {
  const now = Date.now();
  const accessToken = String(response.accessToken ?? response.token);
  const refreshToken = response.refreshToken ? String(response.refreshToken) : await randomHex(32);
  const refreshTokenExpiresAt =
    typeof response.refreshTokenExpiresIn === 'number'
      ? now + response.refreshTokenExpiresIn * 1000
      : now + REFRESH_TOKEN_TTL_MS;

  const session: Session = {
    mode: 'server',
    userId,
    username,
    accessToken,
    accessTokenExpiresAt: now + ACCESS_TOKEN_TTL_MS,
    refreshToken,
    refreshTokenExpiresAt,
    // Chave de assinatura própria da sessão: o access token é conhecido pelo
    // servidor que o emitiu, então ele pode validar X-Poke-Signature de fato.
    signingKey: accessToken,
    secureChannelKey,
  };

  await persistSession(session);
  setSession(session);
  return session;
}


export async function renewSession(session: Session): Promise<Session | null> {
  if (Date.now() > session.refreshTokenExpiresAt) {
    await clearSession();
    return null;
  }

  if (session.mode === 'local') {
    const deviceKey = await getOrCreateDeviceKey();
    const now = Date.now();
    const accessToken = issueTicket(deviceKey, {
      sub: session.userId,
      username: session.username,
      iat: now,
      exp: now + ACCESS_TOKEN_TTL_MS,
    });
    const renewed: Session = { ...session, accessToken, accessTokenExpiresAt: now + ACCESS_TOKEN_TTL_MS };
    setSession(renewed);
    return renewed;
  }

  try {
    const now = Date.now();
    const body = JSON.stringify({ refreshToken: session.refreshToken });
    const signedHeaders = await signRequest('POST', ROUTES.refresh, body, session.signingKey);
    const response = await fetch(`${API_URL}${ROUTES.refresh}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...signedHeaders },
      body,
    });
    if (!response.ok) throw new Error(`refresh respondeu ${response.status}`);

    const json = await response.json();
    const accessToken = json.accessToken ?? json.token;
    if (!accessToken) throw new Error('resposta de refresh sem accessToken');

    const renewed: Session = {
      ...session,
      accessToken: String(accessToken),
      accessTokenExpiresAt: now + ACCESS_TOKEN_TTL_MS,
      refreshToken: json.refreshToken ? String(json.refreshToken) : session.refreshToken,
      signingKey: String(accessToken),
    };
    await persistSession(renewed);
    setSession(renewed);
    return renewed;
  } catch (e) {
    console.warn('[session] não foi possível renovar a sessão, encerrando:', e);
    await clearSession();
    return null;
  }
}

async function restoreSession(): Promise<Session | null> {
  const meta = await getSealed<PersistedSessionMeta>(STORAGE_KEYS.sessionMeta);
  const refreshToken = await getSecret(STORAGE_KEYS.refreshToken);
  if (!meta || !refreshToken) return null;

  if (Date.now() > meta.refreshTokenExpiresAt) {
    await clearSession();
    return null;
  }

  const deviceKey = await getOrCreateDeviceKey();
  const draft: Session = {
    mode: meta.mode,
    userId: meta.userId,
    username: meta.username,
    accessToken: '',
    accessTokenExpiresAt: 0,
    refreshToken,
    refreshTokenExpiresAt: meta.refreshTokenExpiresAt,
    signingKey: meta.mode === 'local' ? deviceKey : refreshToken,
  };

  return renewSession(draft);
}


export async function ensureValidAccessToken(): Promise<Session | null> {
  let session = currentSession ?? (await restoreSession());
  if (!session) return null;

  if (Date.now() > session.accessTokenExpiresAt - ACCESS_TOKEN_REFRESH_MARGIN_MS) {
    session = await renewSession(session);
  }

  return session;
}

// Exposto só para uso interno de session.ts em outros módulos de segurança/testes.
export const __internal = { issueTicket, verifyTicket };
