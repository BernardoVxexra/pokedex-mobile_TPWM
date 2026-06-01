import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { COLORS, POKEMON_TYPE_COLORS, STAT_COLORS, STAT_NAMES } from '../../constants';
import { Pokemon } from '../../@types';

const { width, height } = Dimensions.get('window');

interface Props {
  pokemon: Pokemon | null;
  visible: boolean;
  onClose: () => void;
}

export const PokemonDetailModal: React.FC<Props> = ({ pokemon, visible, onClose }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!pokemon) return null;

  const primaryType = pokemon.types?.[0]?.type?.name || 'normal';
  const typeColor = POKEMON_TYPE_COLORS[primaryType] || COLORS.primary;
  const imageUrl =
    pokemon.sprites?.other?.['official-artwork']?.front_default ||
    pokemon.sprites?.front_default;

  const maxStat = 255;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: typeColor + 'EE' }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.id}>#{String(pokemon.id).padStart(3, '0')}</Text>
          </View>

          <View style={styles.imageSection}>
            {!imageLoaded && (
              <ActivityIndicator color="#fff" size="large" style={StyleSheet.absoluteFill} />
            )}
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              onLoad={() => setImageLoaded(true)}
              resizeMode="contain"
            />
          </View>

          <View style={styles.content}>
            <Text style={styles.name}>
              {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
            </Text>
            <View style={styles.types}>
              {pokemon.types?.map((t) => (
                <View
                  key={t.type.name}
                  style={[styles.typeBadge, { backgroundColor: POKEMON_TYPE_COLORS[t.type.name] }]}
                >
                  <Text style={styles.typeText}>{t.type.name}</Text>
                </View>
              ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Altura</Text>
                  <Text style={styles.statValue}>{(pokemon.height / 10).toFixed(1)}m</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Peso</Text>
                  <Text style={styles.statValue}>{(pokemon.weight / 10).toFixed(1)}kg</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Exp Base</Text>
                  <Text style={styles.statValue}>{pokemon.base_experience || '—'}</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Habilidades</Text>
              <View style={styles.abilities}>
                {pokemon.abilities?.map((a) => (
                  <View key={a.ability.name} style={styles.abilityBadge}>
                    <Text style={styles.abilityText}>
                      {a.ability.name.replace(/-/g, ' ')}
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Estatísticas Base</Text>
              {pokemon.stats?.map((s) => (
                <View key={s.stat.name} style={styles.statRow}>
                  <Text style={styles.statName}>
                    {STAT_NAMES[s.stat.name] || s.stat.name}
                  </Text>
                  <Text style={styles.statNum}>{s.base_stat}</Text>
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.bar,
                        {
                          width: `${(s.base_stat / maxStat) * 100}%`,
                          backgroundColor: STAT_COLORS[s.stat.name] || '#fff',
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    height: height * 0.88,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  id: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '700',
  },
  imageSection: {
    alignItems: 'center',
    height: 180,
    justifyContent: 'center',
  },
  image: {
    width: 180,
    height: 180,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  name: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 1,
  },
  types: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  typeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  abilities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  abilityBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  abilityText: {
    color: COLORS.text,
    fontSize: 13,
    textTransform: 'capitalize',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statName: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    width: 40,
  },
  statNum: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
    marginRight: 10,
  },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
});
