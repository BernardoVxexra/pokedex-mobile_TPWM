import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../AuthContext';

const POKEMON_IDS = [6, 7, 3, 25, 150]; // Charizard, Squirtle, Venusaur, Pikachu, Mewtwo

const TYPE_COLORS: Record<string, { bg: string; bg2: string }> = {
  fire:     { bg: '#e63346', bg2: '#9b1c2a' },
  water:    { bg: '#2196f3', bg2: '#0d47a1' },
  grass:    { bg: '#4caf50', bg2: '#1b5e20' },
  poison:   { bg: '#4caf50', bg2: '#1b5e20' },
  electric: { bg: '#fdd835', bg2: '#f57f17' },
  psychic:  { bg: '#7c4dff', bg2: '#311b92' },
  flying:   { bg: '#e63346', bg2: '#9b1c2a' },
  default:  { bg: '#607d8b', bg2: '#263238' },
};

const TYPE_LABELS: Record<string, string> = {
  fire: 'Fogo', water: 'Água', grass: 'Planta',
  poison: 'Veneno', electric: 'Elétrico', psychic: 'Psíquico',
  flying: 'Voador', normal: 'Normal', fighting: 'Lutador',
  ground: 'Terra', rock: 'Pedra', bug: 'Inseto',
  ghost: 'Fantasma', steel: 'Aço', ice: 'Gelo',
  dragon: 'Dragão', dark: 'Sombrio', fairy: 'Fada',
};

interface Pokemon {
  id: string;
  name: string;
  image: string;
  types: string[];
  hp: number;
  atk: number;
  spd: number;
  bg: string;
  bg2: string;
}

export default function DashboardScreen() {
  const { username, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPokemons() {
      try {
        const results = await Promise.all(
          POKEMON_IDS.map(id =>
            fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json())
          )
        );

        const parsed: Pokemon[] = results.map(data => {
          const primaryType = data.types[0].type.name;
          const colors = TYPE_COLORS[primaryType] ?? TYPE_COLORS.default;
          const hp  = data.stats.find((s: any) => s.stat.name === 'hp')?.base_stat ?? 0;
          const atk = data.stats.find((s: any) => s.stat.name === 'attack')?.base_stat ?? 0;
          const spd = data.stats.find((s: any) => s.stat.name === 'speed')?.base_stat ?? 0;
          const types = data.types.map((t: any) => TYPE_LABELS[t.type.name] ?? t.type.name);
          const image =
            data.sprites.other?.['official-artwork']?.front_default ??
            data.sprites.front_default;

          return {
            id: String(data.id).padStart(3, '0'),
            name: data.name,
            image,
            types,
            hp,
            atk,
            spd,
            bg: colors.bg,
            bg2: colors.bg2,
          };
        });

        setPokemons(parsed);
      } catch (err) {
        console.error('Erro ao buscar Pokémons:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPokemons();
  }, []);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0e0e1c" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.logo}>POKÉDEX</Text>
        <View style={s.headerRight}>
          <Text style={s.greet}>
            Olá, <Text style={s.greetName}>{username.toUpperCase()}</Text>!
          </Text>
          <TouchableOpacity style={s.logoutBtn} onPress={logout}>
            <Text style={s.logoutTxt}>SAIR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={s.loadingText}>Carregando Pokémons...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.sectionTitle}>Pokémons <Text style={s.yellow}>Disponíveis</Text></Text>

          {pokemons.map((p) => (
            <View key={p.id} style={[s.card, { backgroundColor: p.bg }]}>
              <View style={[s.cardCircle, { backgroundColor: p.bg2 }]} />

              <View style={s.cardLeft}>
                <View style={[s.emojiWrap, { backgroundColor: p.bg2 + '99' }]}>
                  <Image
                    source={{ uri: p.image }}
                    style={{ width: 70, height: 70 }}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <View style={s.cardRight}>
                <Text style={s.cardId}>#{p.id}</Text>
                <Text style={s.cardName}>{p.name.toUpperCase()}</Text>

                <View style={s.types}>
                  {p.types.map((t) => (
                    <View key={t} style={s.typePill}>
                      <Text style={s.typeText}>{t}</Text>
                    </View>
                  ))}
                </View>

                <View style={s.stats}>
                  <View style={s.stat}>
                    <Text style={s.statVal}>{p.hp}</Text>
                    <Text style={s.statLbl}>HP</Text>
                  </View>
                  <View style={s.statDiv} />
                  <View style={s.stat}>
                    <Text style={s.statVal}>{p.atk}</Text>
                    <Text style={s.statLbl}>ATK</Text>
                  </View>
                  <View style={s.statDiv} />
                  <View style={s.stat}>
                    <Text style={s.statVal}>{p.spd}</Text>
                    <Text style={s.statLbl}>SPD</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e1c',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#aaa',
    fontSize: 14,
  },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,215,0,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  logo: {
    color: '#FFD700', fontWeight: '900',
    fontSize: 16, letterSpacing: 4,
    textShadowColor: '#c8960c',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greet: { color: '#aaa', fontSize: 13 },
  greetName: { color: '#FFD700', fontWeight: '800' },
  logoutBtn: {
    backgroundColor: 'rgba(230,51,70,0.15)',
    borderWidth: 1, borderColor: '#e63346',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  logoutTxt: { color: '#e63346', fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  scroll: { paddingHorizontal: 16, paddingTop: 24 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '900', marginBottom: 20, letterSpacing: 0.5 },
  yellow: { color: '#FFD700' },

  card: {
    borderRadius: 20, padding: 20, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden', position: 'relative',
    minHeight: 120,
  },
  cardCircle: {
    position: 'absolute', width: 130, height: 130,
    borderRadius: 65, right: -20, top: -20, opacity: 0.5,
  },

  cardLeft: { marginRight: 18 },
  emojiWrap: {
    width: 82, height: 82, borderRadius: 41,
    alignItems: 'center', justifyContent: 'center',
  },

  cardRight: { flex: 1 },
  cardId: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 1 },
  cardName: {
    color: '#fff', fontSize: 22, fontWeight: '900',
    letterSpacing: 1, marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3,
  },

  types: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  typePill: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  typeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  stats: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14,
    alignSelf: 'flex-start', gap: 12,
  },
  stat: { alignItems: 'center' },
  statVal: { color: '#fff', fontSize: 16, fontWeight: '900' },
  statLbl: { color: 'rgba(255,255,255,0.7)', fontSize: 9, letterSpacing: 0.5 },
  statDiv: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },
});