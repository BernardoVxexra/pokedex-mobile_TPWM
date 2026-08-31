import Constants from 'expo-constants';

const FALLBACK_API_URL =
  'https://lnh1dhp1mj.execute-api.us-east-1.amazonaws.com/api-pokemon';

/**
 * Ordem de resolução: variável de ambiente (.env) > app.json (expo.extra.apiUrl) > AWS atual.
 * Trocar de backend (ex: para o projeto Spring de referência) é só mudar EXPO_PUBLIC_API_URL.
 */
export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  FALLBACK_API_URL;

/** Access token: curta duração, mantido só em memória. */
export const ACCESS_TOKEN_TTL_MS = 5 * 60 * 1000;

/** Refresh token: validade mais longa, guardado em storage seguro. */
export const REFRESH_TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

/** Margem de segurança para renovar o access token antes dele vencer de fato. */
export const ACCESS_TOKEN_REFRESH_MARGIN_MS = 30 * 1000;

export const ROUTES = {
  register: '/auth/v1/register',
  login: '/auth/v1/login',
  logout: '/auth/v1/logout',
  refresh: '/auth/v1/refresh',
  stats: (userId: string) => `/auth/v1/stats/${userId}`,
  team: (userId: string) => `/pokemon/v1/team?user-id=${userId}`,
  captured: (userId: string, pokemonId: number) =>
    `/pokemon/v1/captured?user-id=${userId}&pokemon-id=${pokemonId}`,
} as const;

export const STORAGE_KEYS = {
  deviceKey: 'pokedex.device_key',
  refreshToken: 'pokedex.refresh_token',
  sessionMeta: 'pokedex.session_meta',
  userRecord: 'pokedex.user_record',
  /** Chave antiga (texto puro), usada só para migração no primeiro login. */
  legacyUserRecord: '@pokedex_user',
} as const;
