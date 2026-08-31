// ─────────────────────────────────────────────────────────────────────────────
// Portão único de HTTP: nenhuma tela ou serviço chama `fetch` diretamente.
// Garante access token válido, assina a requisição, abre o envelope cifrado
// da resposta (quando presente) e trata 401 com uma renovação + retry.
// ─────────────────────────────────────────────────────────────────────────────
import { API_URL } from '../config/env';
import { ensureValidAccessToken, renewSession, type Session } from '../security/session';
import { signRequest } from '../security/envelope';
import { getOrCreateDeviceKey } from '../security/secureStore';
import { isSealedEnvelope, decryptJson } from '../security/crypto';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface RequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
  /** Se a requisição exige uma sessão válida. Padrão: true. */
  auth?: boolean;
  /**
   * Chave do canal seguro para decifrar esta resposta específica — usada só
   * no login/registro, antes de existir sessão. Depois disso, a chave do
   * canal já negociado na sessão é usada automaticamente.
   */
  decryptWithKeyHex?: string;
}

let onSessionExpired: (() => void) | null = null;

/** Registrado pelo AuthContext para reagir a uma sessão que caiu (ex: refresh vencido). */
export function setOnSessionExpired(callback: (() => void) | null): void {
  onSessionExpired = callback;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, decryptWithKeyHex, headers, ...init } = options;
  return doRequest<T>(path, init, headers, auth, decryptWithKeyHex, true);
}

async function doRequest<T>(
  path: string,
  init: Omit<RequestInit, 'headers'>,
  extraHeaders: Record<string, string> | undefined,
  auth: boolean,
  decryptWithKeyHex: string | undefined,
  allowRetry: boolean
): Promise<T> {
  const session = auth ? await ensureValidAccessToken() : null;
  const bodyString = typeof init.body === 'string' ? init.body : undefined;
  const signingKey = session?.signingKey ?? (await getOrCreateDeviceKey());
  const signedHeaders = await signRequest(init.method ?? 'GET', path, bodyString, signingKey);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
    ...signedHeaders,
  };
  if (session) headers.Authorization = `Bearer ${session.accessToken}`;

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (response.status === 401 && auth && allowRetry && session) {
    const renewed = await renewSession(session);
    if (renewed) {
      return doRequest<T>(path, init, extraHeaders, auth, decryptWithKeyHex, false);
    }
    onSessionExpired?.();
    throw new ApiError(`[cloudClient] sessão expirada ao acessar ${path}`, 401);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new ApiError(
      `[cloudClient] ${init.method ?? 'GET'} ${path} → ${response.status}: ${errorBody}`,
      response.status
    );
  }

  if (response.status === 204) return undefined as unknown as T;

  const json = await response.json();
  const channelKey = decryptWithKeyHex ?? session?.secureChannelKey ?? null;
  if (channelKey && isSealedEnvelope(json)) {
    return decryptJson<T>(channelKey, json);
  }
  return json as T;
}

export type { Session };
