import React, { createContext, useContext, useState, useCallback } from 'react';
import { Pokemon } from '../@types';
import { fetchPokemon } from '../integration/pokeapi';
import { apiAddCaptured, apiDeleteCaptured } from '../integration/api';

interface PokemonContextType {
  cache: Record<number, Pokemon>;
  fetchAndCache: (id: number) => Promise<Pokemon>;
  syncTeamWithApi: (userId: string, newIds: number[], previousIds: number[]) => Promise<void>;
}

const PokemonContext = createContext<PokemonContextType>({} as PokemonContextType);

export const PokemonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<Record<number, Pokemon>>({});

  const fetchAndCache = useCallback(async (id: number): Promise<Pokemon> => {
    if (cache[id]) return cache[id];
    const pokemon = await fetchPokemon(id);
    setCache((prev) => ({ ...prev, [id]: pokemon }));
    return pokemon;
  }, [cache]);

  const syncTeamWithApi = useCallback(
    async (userId: string, newIds: number[], previousIds: number[]) => {
      const added = newIds.filter((id) => !previousIds.includes(id));
      const removed = previousIds.filter((id) => !newIds.includes(id));

      if (added.length === 0 && removed.length === 0) return;

      const promises = [
        ...added.map((id) =>
          apiAddCaptured(userId, id).catch((err) =>
            console.warn(`[PokemonContext] apiAddCaptured(${id}) falhou:`, err)
          )
        ),
        ...removed.map((id) =>
          apiDeleteCaptured(userId, id).catch((err) =>
            console.warn(`[PokemonContext] apiDeleteCaptured(${id}) falhou:`, err)
          )
        ),
      ];

      await Promise.allSettled(promises);
    },
    []
  );

  return (
    <PokemonContext.Provider value={{ cache, fetchAndCache, syncTeamWithApi }}>
      {children}
    </PokemonContext.Provider>
  );
};

export const usePokemon = () => useContext(PokemonContext);