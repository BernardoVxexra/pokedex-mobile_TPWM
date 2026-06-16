// ─────────────────────────────────────────────────────────────────────────────
// src/integration/api.ts
// Camada centralizada de acesso à API Pokémon (AWS API Gateway)
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL =
  "https://lnh1dhp1mj.execute-api.us-east-1.amazonaws.com/api-pokemon";

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface AuthPayload {
  username: string;
  password: string;
}

export interface AuthResponse {
  /** UUID do usuário retornado pelo backend */
  id: string;
  username: string;
  token?: string;
  [key: string]: unknown;
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

export interface TeamResponse {
  /** Lista de IDs de Pokémon no time do usuário */
  team: number[];
  [key: string]: unknown;
}

// ── Helper interno ────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `[API] ${options.method ?? "GET"} ${path} → ${response.status}: ${errorBody}`
    );
  }

  // 204 No Content — sem body
  if (response.status === 204) return undefined as unknown as T;

  return response.json() as Promise<T>;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Registra um novo usuário.
 * POST /auth/v1/register
 */
export async function apiRegister(
  username: string,
  password: string
): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/v1/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

/**
 * Autentica o usuário e retorna seu id (UUID).
 * POST /auth/v1/login
 */
export async function apiLogin(
  username: string,
  password: string
): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/v1/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

// ── Stats ─────────────────────────────────────────────────────────────────────

/**
 * Retorna o perfil/estatísticas de um usuário.
 * GET /auth/v1/stats/:userId
 */
export async function apiGetStats(userId: string): Promise<StatsResponse> {
  return request<StatsResponse>(`/auth/v1/stats/${userId}`);
}

/**
 * Atualiza level, vitórias e/ou derrotas do usuário.
 * PUT /auth/v1/stats/:userId
 */
export async function apiUpdateStats(
  userId: string,
  stats: StatsPayload
): Promise<StatsResponse> {
  // A API espera strings, mas aceitamos number por conveniência
  const payload: StatsPayload = {
    level: String(stats.level ?? 1),
    vitorias: String(stats.vitorias ?? 0),
    derrotas: String(stats.derrotas ?? 0),
  };

  return request<StatsResponse>(`/auth/v1/stats/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ── Time / Pokémon ────────────────────────────────────────────────────────────

/**
 * Retorna o time atual do usuário.
 * GET /pokemon/v1/team?user-id=:userId
 */
export async function apiGetTeam(userId: string): Promise<TeamResponse> {
  return request<TeamResponse>(`/pokemon/v1/team?user-id=${userId}`);
}

/**
 * Adiciona um Pokémon capturado à lista do usuário.
 * PUT /pokemon/v1/captured?user-id=:userId&pokemon-id=:pokemonId
 */
export async function apiAddCaptured(
  userId: string,
  pokemonId: number
): Promise<void> {
  return request<void>(
    `/pokemon/v1/captured?user-id=${userId}&pokemon-id=${pokemonId}`,
    { method: "PUT" }
  );
}

/**
 * Remove um Pokémon capturado da lista do usuário.
 * DELETE /pokemon/v1/captured?user-id=:userId&pokemon-id=:pokemonId
 */
export async function apiDeleteCaptured(
  userId: string,
  pokemonId: number
): Promise<void> {
  return request<void>(
    `/pokemon/v1/captured?user-id=${userId}&pokemon-id=${pokemonId}`,
    { method: "DELETE" }
  );
}
