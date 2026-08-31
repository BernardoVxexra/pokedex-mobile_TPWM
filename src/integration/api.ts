// ─────────────────────────────────────────────────────────────────────────────
// src/integration/api.ts
// Endpoints de time/Pokémon capturado. Login, cadastro e estatísticas vivem
// em authApi.ts. Tudo aqui passa pelo cloudClient (sessão, assinatura, 401).
// ─────────────────────────────────────────────────────────────────────────────
import { request } from './cloudClient';
import { ROUTES } from '../config/env';

export interface TeamResponse {
  /** Lista de IDs de Pokémon no time do usuário */
  team: number[];
  [key: string]: unknown;
}

/**
 * Retorna o time atual do usuário.
 * GET /pokemon/v1/team?user-id=:userId
 */
export async function apiGetTeam(userId: string): Promise<TeamResponse> {
  return request<TeamResponse>(ROUTES.team(userId));
}

/**
 * Adiciona um Pokémon capturado à lista do usuário.
 * PUT /pokemon/v1/captured?user-id=:userId&pokemon-id=:pokemonId
 */
export async function apiAddCaptured(userId: string, pokemonId: number): Promise<void> {
  return request<void>(ROUTES.captured(userId, pokemonId), { method: 'PUT' });
}

/**
 * Remove um Pokémon capturado da lista do usuário.
 * DELETE /pokemon/v1/captured?user-id=:userId&pokemon-id=:pokemonId
 */
export async function apiDeleteCaptured(userId: string, pokemonId: number): Promise<void> {
  return request<void>(ROUTES.captured(userId, pokemonId), { method: 'DELETE' });
}
