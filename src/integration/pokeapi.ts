import { Pokemon, PokemonListItem } from '../@types';

const BASE_URL = 'https://pokeapi.co/api/v2';

export const fetchPokemonList = async (limit = 160, offset = 0): Promise<PokemonListItem[]> => {
  const response = await fetch(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
  const data = await response.json();
  return data.results;
};

export const fetchPokemon = async (nameOrId: string | number): Promise<Pokemon> => {
  const response = await fetch(`${BASE_URL}/pokemon/${nameOrId}`);
  if (!response.ok) throw new Error(`Pokemon not found: ${nameOrId}`);
  return response.json();
};

export const fetchMultiplePokemon = async (ids: number[]): Promise<Pokemon[]> => {
  const promises = ids.map((id) => fetchPokemon(id));
  return Promise.all(promises);
};

export const getRandomPokemonIds = (count: number, max = 160): number[] => {
  const ids: number[] = [];
  while (ids.length < count) {
    const id = Math.floor(Math.random() * max) + 1;
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
};

export const getPokemonImageUrl = (id: number): string => {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
};

export const getPokemonId = (url: string): number => {
  const parts = url.split('/').filter(Boolean);
  return parseInt(parts[parts.length - 1]);
};
