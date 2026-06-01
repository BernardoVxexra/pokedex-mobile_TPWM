import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { COLORS, POKEMON_TYPE_COLORS } from '../../constants';
import { Pokemon } from '../../@types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface Props {
  pokemon: Pokemon;
  onPress: () => void;
  selected?: boolean;
  showCheckbox?: boolean;
}

export const PokemonCard: React.FC<Props> = ({ pokemon, onPress, selected, showCheckbox }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const primaryType = pokemon.types?.[0]?.type?.name || 'normal';
  const typeColor = POKEMON_TYPE_COLORS[primaryType] || COLORS.primary;
  const imageUrl =
    pokemon.sprites?.other?.['official-artwork']?.front_default ||
    pokemon.sprites?.front_default;

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: selected ? COLORS.secondary : 'transparent' }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {showCheckbox && (
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      )}
      <View style={[styles.typeBg, { backgroundColor: typeColor + '33' }]} />
      <View style={styles.idContainer}>
        <Text style={styles.id}>#{String(pokemon.id).padStart(3, '0')}</Text>
      </View>
      <View style={styles.imageContainer}>
        {!imageLoaded && (
          <ActivityIndicator color={typeColor} style={StyleSheet.absoluteFill} />
        )}
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          onLoad={() => setImageLoaded(true)}
          resizeMode="contain"
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
        </Text>
        <View style={styles.types}>
          {pokemon.types?.map((t) => (
            <View
              key={t.type.name}
              style={[styles.typeBadge, { backgroundColor: POKEMON_TYPE_COLORS[t.type.name] || '#999' }]}
            >
              <Text style={styles.typeText}>{t.type.name}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  typeBg: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: CARD_WIDTH * 0.7,
    height: CARD_WIDTH * 0.7,
    borderRadius: CARD_WIDTH * 0.35,
    transform: [{ translateX: CARD_WIDTH * 0.2 }, { translateY: -CARD_WIDTH * 0.2 }],
  },
  idContainer: {
    alignSelf: 'flex-end',
  },
  id: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: CARD_WIDTH * 0.7,
    height: CARD_WIDTH * 0.7,
  },
  info: {
    marginTop: 8,
  },
  name: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  types: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  checkbox: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    backgroundColor: COLORS.surface,
  },
  checkboxSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  checkmark: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
  },
});
