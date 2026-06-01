import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../src/constants';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const BADGE_DATA = [
  { name: 'Boulder', emoji: '🪨' },
  { name: 'Cascade', emoji: '💧' },
  { name: 'Thunder', emoji: '⚡' },
  { name: 'Rainbow', emoji: '🌈' },
  { name: 'Soul', emoji: '💜' },
  { name: 'Marsh', emoji: '🌿' },
  { name: 'Volcano', emoji: '🔥' },
  { name: 'Earth', emoji: '🌍' },
];

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(user?.username || '');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à galeria para alterar sua foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      await updateUser({ avatar: result.assets[0].uri });
    }
  };

  const saveName = async () => {
    if (!newName.trim()) {
      Alert.alert('Atenção', 'O nome não pode estar vazio!');
      return;
    }
    await updateUser({ username: newName.trim() });
    setEditing(false);
  };

  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const winRate =
    user && user.wins + user.losses > 0
      ? Math.round((user.wins / (user.wins + user.losses)) * 100)
      : 0;

  const earnedBadges = Math.min(Math.floor((user?.wins || 0) / 6), 8);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerPattern}>
            {[...Array(20)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.bannerDot,
                  {
                    left: (i % 5) * (width / 4.5),
                    top: Math.floor(i / 5) * 28,
                    opacity: 0.1 + (i % 3) * 0.05,
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>TREINADOR</Text>
            <Text style={styles.bannerSub}>Pokémon League Member</Text>
          </View>
        </View>

        {/* Avatar + Name */}
        <View style={styles.profileTop}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditIcon}>📷</Text>
            </View>
          </TouchableOpacity>

          {editing ? (
            <View style={styles.nameEdit}>
              <TextInput
                style={styles.nameInput}
                value={newName}
                onChangeText={setNewName}
                autoFocus
                selectTextOnFocus
                maxLength={20}
              />
              <View style={styles.nameEditBtns}>
                <TouchableOpacity
                  style={[styles.nameBtn, styles.nameBtnCancel]}
                  onPress={() => { setEditing(false); setNewName(user?.username || ''); }}
                >
                  <Text style={styles.nameBtnCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.nameBtn, styles.nameBtnSave]} onPress={saveName}>
                  <Text style={styles.nameBtnSaveText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.nameRow}>
              <Text style={styles.username}>{user?.username || 'Treinador'}</Text>
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.editNameBtn}>
                <Text style={styles.editNameIcon}>✏️</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Battle Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📊 Estatísticas de Batalha</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardWins]}>
              <Text style={styles.statCardEmoji}>🏆</Text>
              <Text style={styles.statCardNum}>{user?.wins || 0}</Text>
              <Text style={styles.statCardLabel}>Vitórias</Text>
            </View>
            <View style={[styles.statCard, styles.statCardLosses]}>
              <Text style={styles.statCardEmoji}>💀</Text>
              <Text style={styles.statCardNum}>{user?.losses || 0}</Text>
              <Text style={styles.statCardLabel}>Derrotas</Text>
            </View>
            <View style={[styles.statCard, styles.statCardRate]}>
              <Text style={styles.statCardEmoji}>📈</Text>
              <Text style={styles.statCardNum}>{winRate}%</Text>
              <Text style={styles.statCardLabel}>Taxa Vitória</Text>
            </View>
          </View>

          {/* Win Rate Bar */}
          <View style={styles.winRateBar}>
            <View style={styles.winRateLabel}>
              <Text style={styles.winRateText}>🏆 {user?.wins || 0}</Text>
              <Text style={styles.winRatePercent}>{winRate}%</Text>
              <Text style={styles.winRateText}>{user?.losses || 0} 💀</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barWin, { width: `${winRate}%` }]} />
              <View style={[styles.barLoss, { width: `${100 - winRate}%` }]} />
            </View>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badgeSection}>
          <Text style={styles.sectionTitle}>🎖️ Insígnias Conquistadas</Text>
          <Text style={styles.badgeSub}>{earnedBadges}/8 insígnias</Text>
          <View style={styles.badgeGrid}>
            {BADGE_DATA.map((badge, i) => (
              <View
                key={badge.name}
                style={[styles.badge, i < earnedBadges ? styles.badgeEarned : styles.badgeLocked]}
              >
                <Text style={[styles.badgeEmoji, i >= earnedBadges && styles.badgeEmojiLocked]}>
                  {i < earnedBadges ? badge.emoji : '🔒'}
                </Text>
                <Text style={[styles.badgeName, i < earnedBadges && styles.badgeNameEarned]}>
                  {badge.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Trainer Level */}
        <View style={styles.levelSection}>
          <View style={styles.levelHeader}>
            <Text style={styles.sectionTitle}>⚡ Nível do Treinador</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelNum}>
                Lv.{Math.floor((user?.wins || 0) / 5) + 1}
              </Text>
            </View>
          </View>
          <View style={styles.levelBarBg}>
            <View
              style={[
                styles.levelBar,
                { width: `${((user?.wins || 0) % 5) * 20}%` },
              ]}
            />
          </View>
          <Text style={styles.levelSub}>
            {5 - ((user?.wins || 0) % 5)} vitórias para o próximo nível
          </Text>
        </View>

        {/* Logout */}
        <TouchableOpacity 
  style={styles.logoutBtn} 
  onPress={logout}
  activeOpacity={0.6}
>
  <Text style={styles.logoutText}>🚪 Sair da Conta</Text>
</TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  banner: {
    height: 120,
    backgroundColor: COLORS.primary,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bannerDot: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  bannerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 6,
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  profileTop: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.surface,
    borderWidth: 3,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 36 },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  avatarEditIcon: { fontSize: 13 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
  },
  editNameBtn: {
    padding: 4,
  },
  editNameIcon: { fontSize: 16 },
  nameEdit: {
    width: '100%',
    gap: 10,
  },
  nameInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    borderWidth: 2,
    borderColor: COLORS.primary,
    textAlign: 'center',
  },
  nameEditBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  nameBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  nameBtnCancel: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nameBtnSave: {
    backgroundColor: COLORS.primary,
  },
  nameBtnCancelText: { color: COLORS.textSecondary, fontWeight: '700' },
  nameBtnSaveText: { color: '#fff', fontWeight: '900' },
  email: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  statsSection: {
    margin: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statCardWins: { backgroundColor: '#1a3a1a' },
  statCardLosses: { backgroundColor: '#3a1a1a' },
  statCardRate: { backgroundColor: '#1a2a3a' },
  statCardEmoji: { fontSize: 20 },
  statCardNum: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
  },
  statCardLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  winRateBar: { gap: 6 },
  winRateLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  winRateText: { color: COLORS.textMuted, fontSize: 12 },
  winRatePercent: { color: COLORS.text, fontSize: 13, fontWeight: '800' },
  barBg: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  barWin: { height: '100%', backgroundColor: '#4CAF50' },
  barLoss: { height: '100%', backgroundColor: COLORS.primary },
  badgeSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 14,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    width: (width - 80) / 4,
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    gap: 4,
  },
  badgeEarned: {
    backgroundColor: COLORS.secondary + '22',
    borderWidth: 1,
    borderColor: COLORS.secondary + '66',
  },
  badgeLocked: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeEmoji: { fontSize: 24 },
  badgeEmojiLocked: { opacity: 0.3 },
  badgeName: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700' },
  badgeNameEarned: { color: COLORS.secondary },
  levelSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  levelBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelNum: { color: '#000', fontWeight: '900', fontSize: 14 },
  levelBarBg: {
    height: 12,
    backgroundColor: COLORS.card,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  levelBar: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 6,
  },
  levelSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  logoutBtn: {
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
  },
  logoutText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});
