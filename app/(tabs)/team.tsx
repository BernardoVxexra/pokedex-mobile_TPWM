import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, POKEMON_TYPE_COLORS } from '../../src/constants';
import {
  fetchPokemonList,
  fetchPokemon,
  getPokemonId,
  getRandomPokemonIds,
} from '../../src/integration/pokeapi';
import { PokemonDetailModal } from '../../src/components/pokemon/PokemonDetailModal';
import { PokeballLoader } from '../../src/components/common/PokeballLoader';
import { Pokemon } from '../../src/@types';
import { useAuth } from '../../src/context/AuthContext';

const { width } = Dimensions.get('window');
const SLOT_SIZE = (width - 80) / 5;
const MAX_USER_PICKS = 25;

export default function TeamScreen() {
  const { user, updateUser } = useAuth();
  const [randomTeam, setRandomTeam] = useState<Pokemon[]>([]);
  const [userTeam, setUserTeam] = useState<Pokemon[]>([]);
  const [allPokemons, setAllPokemons] = useState<Pokemon[]>([]);
  const [loadingRandom, setLoadingRandom] = useState(true);
  const [loadingAll, setLoadingAll] = useState(false);
  const [selected, setSelected] = useState<Pokemon | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadRandomTeam();
    if (user?.team && user.team.length > 0) {
      loadUserTeam(user.team);
    }
  }, []);

  const loadRandomTeam = async () => {
    setLoadingRandom(true);
    try {
      const ids = getRandomPokemonIds(5, 160);
      const pokemons = await Promise.all(ids.map((id) => fetchPokemon(id)));
      setRandomTeam(pokemons);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRandom(false);
    }
  };

  const loadUserTeam = async (ids: number[]) => {
    try {
      const pokemons = await Promise.all(ids.map((id) => fetchPokemon(id)));
      setUserTeam(pokemons);
      setSelectedIds(new Set(ids));
    } catch (e) {}
  };

  const loadAllForPicker = async () => {
    if (allPokemons.length > 0) {
      setShowPicker(true);
      return;
    }
    setLoadingAll(true);
    try {
      const list = await fetchPokemonList(160);
      const batch = list.slice(0, 80);
      const results = await Promise.allSettled(
        batch.map((p) => fetchPokemon(getPokemonId(p.url)))
      );
      const pokemons = results
        .filter((r): r is PromiseFulfilledResult<Pokemon> => r.status === 'fulfilled')
        .map((r) => r.value);
      setAllPokemons(pokemons);
      setShowPicker(true);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar Pokémons');
    } finally {
      setLoadingAll(false);
    }
  };

  const toggleSelect = (pokemon: Pokemon) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(pokemon.id)) {
      newSet.delete(pokemon.id);
    } else {
      if (newSet.size >= MAX_USER_PICKS) {
        Alert.alert('Limite atingido', `Você pode escolher no máximo ${MAX_USER_PICKS} Pokémons!`);
        return;
      }
      newSet.add(pokemon.id);
    }
    setSelectedIds(newSet);
  };

  const confirmTeam = async () => {
    const ids = Array.from(selectedIds);
    await updateUser({ team: ids });
    await loadUserTeam(ids);
    setShowPicker(false);
  };

  const openDetail = (pokemon: Pokemon) => {
    setSelected(pokemon);
    setModalVisible(true);
  };

  const renderSlot = (pokemon: Pokemon | null, index: number, label?: string) => {
    const typeColor = pokemon?.types?.[0]?.type?.name
      ? POKEMON_TYPE_COLORS[pokemon.types[0].type.name]
      : COLORS.border;

    return (
      <TouchableOpacity
        key={index}
        style={[styles.slot, pokemon && { borderColor: typeColor }]}
        onPress={() => pokemon && openDetail(pokemon)}
        activeOpacity={pokemon ? 0.7 : 1}
      >
        {pokemon ? (
          <>
            <Image
              source={{
                uri:
                  pokemon.sprites?.other?.['official-artwork']?.front_default ||
                  pokemon.sprites?.front_default,
              }}
              style={styles.slotImage}
              resizeMode="contain"
            />
          </>
        ) : (
          <Text style={styles.slotEmpty}>?</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (showPicker) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pickerHeader}>
          <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Voltar</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.pickerTitle}>Escolha seu Time</Text>
            <Text style={styles.pickerSub}>
              {selectedIds.size}/{MAX_USER_PICKS} selecionados
            </Text>
          </View>
          <TouchableOpacity style={styles.confirmBtn} onPress={confirmTeam}>
            <Text style={styles.confirmBtnText}>Salvar</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={allPokemons}
          keyExtractor={(item) => String(item.id)}
          numColumns={3}
          contentContainerStyle={styles.pickerList}
          renderItem={({ item }) => {
            const isSelected = selectedIds.has(item.id);
            const primaryType = item.types?.[0]?.type?.name || 'normal';
            const typeColor = POKEMON_TYPE_COLORS[primaryType] || '#999';
            const imageUrl =
              item.sprites?.other?.['official-artwork']?.front_default ||
              item.sprites?.front_default;

            return (
              <TouchableOpacity
                style={[
                  styles.pickerCard,
                  { borderColor: isSelected ? COLORS.secondary : COLORS.border },
                  isSelected && styles.pickerCardSelected,
                ]}
                onPress={() => toggleSelect(item)}
                activeOpacity={0.7}
              >
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedCheck}>✓</Text>
                  </View>
                )}
                <View style={[styles.pickerTypeBg, { backgroundColor: typeColor + '22' }]} />
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.pickerImage}
                  resizeMode="contain"
                />
                <Text style={styles.pickerName} numberOfLines={1}>
                  {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                </Text>
                <Text style={styles.pickerId}>#{String(item.id).padStart(3, '0')}</Text>
              </TouchableOpacity>
            );
          }}
        />

        <PokemonDetailModal
          pokemon={selected}
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MEU TIME</Text>
          <Text style={styles.headerSub}>Gerencie seus Pokémons favoritos</Text>
        </View>

        {/* Random Team */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>🎲 Time Surpresa</Text>
              <Text style={styles.sectionSub}>5 Pokémons aleatórios</Text>
            </View>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={loadRandomTeam}
              disabled={loadingRandom}
            >
              <Text style={styles.refreshBtnText}>🔄 Novo</Text>
            </TouchableOpacity>
          </View>

          {loadingRandom ? (
            <View style={styles.sectionLoader}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : (
            <View style={styles.teamRow}>
              {randomTeam.map((p, i) => renderSlot(p, i))}
            </View>
          )}

          <View style={styles.randomNames}>
            {randomTeam.map((p) => (
              <TouchableOpacity key={p.id} onPress={() => openDetail(p)}>
                <View style={styles.randomNameItem}>
                  <View
                    style={[
                      styles.randomNameDot,
                      { backgroundColor: POKEMON_TYPE_COLORS[p.types?.[0]?.type?.name || 'normal'] },
                    ]}
                  />
                  <Text style={styles.randomNameText}>
                    {p.name.charAt(0).toUpperCase() + p.name.slice(1)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* User Team */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>⭐ Meu Time Personalizado</Text>
              <Text style={styles.sectionSub}>
                {userTeam.length}/{MAX_USER_PICKS} escolhidos
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={loadAllForPicker}
              disabled={loadingAll}
            >
              {loadingAll ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.editBtnText}>✏️ Editar</Text>
              )}
            </TouchableOpacity>
          </View>

          {userTeam.length === 0 ? (
            <View style={styles.emptyTeam}>
              <Text style={styles.emptyTeamEmoji}>🎯</Text>
              <Text style={styles.emptyTeamText}>Nenhum Pokémon selecionado</Text>
              <TouchableOpacity style={styles.pickBtn} onPress={loadAllForPicker}>
                <Text style={styles.pickBtnText}>Escolher Pokémons</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={userTeam}
              keyExtractor={(item) => String(item.id)}
              numColumns={5}
              scrollEnabled={false}
              contentContainerStyle={styles.userTeamGrid}
              renderItem={({ item, index }) => renderSlot(item, index)}
            />
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
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
  section: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  sectionLoader: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slotImage: {
    width: SLOT_SIZE - 8,
    height: SLOT_SIZE - 8,
  },
  slotEmpty: {
    color: COLORS.textMuted,
    fontSize: 18,
    fontWeight: '700',
  },
  randomNames: {
    gap: 6,
  },
  randomNameItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  randomNameDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  randomNameText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  refreshBtn: {
    backgroundColor: COLORS.primary + '33',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  refreshBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  editBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  editBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyTeam: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  emptyTeamEmoji: { fontSize: 40 },
  emptyTeamText: { color: COLORS.textMuted, fontSize: 14 },
  pickBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  pickBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  userTeamGrid: {
    gap: 6,
  },
  // Picker styles
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: 8,
  },
  backBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  pickerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  pickerSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  confirmBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  confirmBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '900',
  },
  pickerList: {
    padding: 12,
    gap: 8,
  },
  pickerCard: {
    flex: 1,
    margin: 4,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  pickerCardSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondary + '15',
  },
  pickerTypeBg: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    borderRadius: 30,
    transform: [{ translateX: 20 }, { translateY: -20 }],
  },
  selectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  selectedCheck: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
  },
  pickerImage: {
    width: 64,
    height: 64,
  },
  pickerName: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  pickerId: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
});
