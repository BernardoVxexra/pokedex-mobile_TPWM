import React, { createContext, useContext, useState, useCallback } from 'react';
import { Pokemon } from '../@types';
import { fetchPokemon } from '../integration/pokeapi';

interface PokemonContextType {
  cache: Record<number, Pokemon>;
  fetchAndCache: (id: number) => Promise<Pokemon>;
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

  return (
    <PokemonContext.Provider value={{ cache, fetchAndCache }}>
      {children}
    </PokemonContext.Provider>
  );
};

export const usePokemon = () => useContext(PokemonContext);
