import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, POKEMON_TYPE_COLORS } from '../../src/constants';
import { fetchPokemonList, fetchPokemon, getPokemonId } from '../../src/integration/pokeapi';
import { PokemonCard } from '../../src/components/pokemon/PokemonCard';
import { PokemonDetailModal } from '../../src/components/pokemon/PokemonDetailModal';
import { PokeballLoader } from '../../src/components/common/PokeballLoader';
import { Pokemon, PokemonListItem } from '../../src/@types';

const { width } = Dimensions.get('window');

const TYPE_FILTERS = [
  'todos', 'fire', 'water', 'grass', 'electric', 'psychic',
  'rock', 'ghost', 'dragon', 'dark', 'fighting', 'normal',
];

export default function PokedexScreen() {
  const [allPokemons, setAllPokemons] = useState<Pokemon[]>([]);
  const [filtered, setFiltered] = useState<Pokemon[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<Pokemon | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 40;
  const listRef = useRef<PokemonListItem[]>([]);

  const loadPokemons = useCallback(async (pageNum = 0) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      if (listRef.current.length === 0) {
        const list = await fetchPokemonList(160);
        listRef.current = list;
      }

      const start = pageNum * PAGE_SIZE;
      const end = Math.min(start + PAGE_SIZE, 160);
      const slice = listRef.current.slice(start, end);

      if (slice.length === 0) {
        setHasMore(false);
        return;
      }

      const promises = slice.map((p) => fetchPokemon(getPokemonId(p.url)));
      const results = await Promise.allSettled(promises);
      const pokemons = results
        .filter((r): r is PromiseFulfilledResult<Pokemon> => r.status === 'fulfilled')
        .map((r) => r.value);

      if (pageNum === 0) {
        setAllPokemons(pokemons);
      } else {
        setAllPokemons((prev) => [...prev, ...pokemons]);
      }
      setHasMore(end < 160);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPokemons(0);
  }, []);

  useEffect(() => {
    let result = allPokemons;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) => p.name.includes(q) || String(p.id).includes(q)
      );
    }
    if (typeFilter !== 'todos') {
      result = result.filter((p) =>
        p.types?.some((t) => t.type.name === typeFilter)
      );
    }
    setFiltered(result);
  }, [allPokemons, search, typeFilter]);

  const loadNextPage = () => {
    if (!loadingMore && hasMore && !search && typeFilter === 'todos') {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPokemons(nextPage);
    }
  };

  const openDetail = (pokemon: Pokemon) => {
    setSelected(pokemon);
    setModalVisible(true);
  };

  const renderItem = ({ item, index }: { item: Pokemon; index: number }) => (
    <View style={index % 2 === 0 ? styles.leftCard : styles.rightCard}>
      <PokemonCard pokemon={item} onPress={() => openDetail(item)} />
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>POKÉDEX</Text>
          <Text style={styles.headerSub}>{allPokemons.length} Pokémons encontrados</Text>
        </View>
        <View style={styles.pokeball}>
          <View style={styles.pokeballTop} />
          <View style={styles.pokeballBelt} />
          <View style={styles.pokeballBottom} />
          <View style={styles.pokeballCenter} />
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Pesquisar por nome ou nº..."
            placeholderTextColor={COLORS.textMuted}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.filterRow}>
        <FlatList
          horizontal
          data={TYPE_FILTERS}
          keyExtractor={(i) => i}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                typeFilter === item && styles.filterChipActive,
                item !== 'todos' && { borderColor: POKEMON_TYPE_COLORS[item] + '88' },
                typeFilter === item && item !== 'todos' && { backgroundColor: POKEMON_TYPE_COLORS[item] },
              ]}
              onPress={() => setTypeFilter(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  typeFilter === item && styles.filterTextActive,
                ]}
              >
                {item === 'todos' ? 'Todos' : item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <PokeballLoader message="Capturando Pokémons..." />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>😔</Text>
          <Text style={styles.emptyLabel}>Nenhum Pokémon encontrado</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          renderItem={renderItem}
          onEndReached={loadNextPage}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}

      <PokemonDetailModal
        pokemon={selected}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 4,
  },
  headerSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  pokeball: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#333',
    position: 'relative',
  },
  pokeballTop: { height: '50%', backgroundColor: COLORS.primary },
  pokeballBelt: {
    height: 4,
    backgroundColor: '#111',
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    marginTop: -2,
    zIndex: 1,
  },
  pokeballBottom: { height: '50%', backgroundColor: '#EEE' },
  pokeballCenter: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EEE',
    borderWidth: 2,
    borderColor: '#111',
    top: '50%',
    left: '50%',
    marginTop: -6,
    marginLeft: -6,
    zIndex: 2,
  },
  searchRow: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    paddingVertical: 12,
  },
  clearSearch: {
    color: COLORS.textMuted,
    fontSize: 14,
    padding: 4,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  leftCard: { flex: 1, marginRight: 6 },
  rightCard: { flex: 1, marginLeft: 6 },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: { fontSize: 48 },
  emptyLabel: { color: COLORS.textSecondary, fontSize: 16 },
});
