import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import { COLORS } from '../../constants';

interface Props {
  size?: number;
  message?: string;
}

export const PokeballLoader: React.FC<Props> = ({ size = 60, message = 'Carregando...' }) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[{ transform: [{ rotate: spin }] }]}>
        <View style={[styles.pokeball, { width: size, height: size, borderRadius: size / 2 }]}>
          <View style={[styles.topHalf, { borderTopLeftRadius: size / 2, borderTopRightRadius: size / 2 }]} />
          <View style={styles.belt} />
          <View style={[styles.bottomHalf, { borderBottomLeftRadius: size / 2, borderBottomRightRadius: size / 2 }]} />
          <View style={[styles.center, { width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14, top: size * 0.36 }]} />
        </View>
      </Animated.View>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  pokeball: {
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 3,
    borderColor: '#222',
  },
  topHalf: {
    height: '50%',
    backgroundColor: COLORS.primary,
  },
  belt: {
    height: 6,
    backgroundColor: '#111',
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    marginTop: -3,
    zIndex: 1,
  },
  bottomHalf: {
    height: '50%',
    backgroundColor: '#EEE',
  },
  center: {
    position: 'absolute',
    backgroundColor: '#EEE',
    borderWidth: 3,
    borderColor: '#111',
    left: '50%',
    zIndex: 2,
    transform: [{ translateX: -10 }],
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
