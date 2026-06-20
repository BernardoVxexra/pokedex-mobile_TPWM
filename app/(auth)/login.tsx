import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/constants';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha todos os campos!');
      return;
    }
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (!success) {
      shake();
      Alert.alert('Erro', 'Usuário ou senha inválidos!');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Background decoration */}
          <View style={styles.bgCircle1} />
          <View style={styles.bgCircle2} />

          <Animated.View style={[styles.content, { opacity: fadeIn }]}>
            {/* Logo area */}
            <View style={styles.logoArea}>
              <View style={styles.pokeball}>
                <View style={styles.pokeballTop} />
                <View style={styles.pokeballBelt} />
                <View style={styles.pokeballBottom} />
                <View style={styles.pokeballCenter} />
              </View>
              <Text style={styles.title}>POKÉDEX</Text>
              <Text style={styles.subtitle}>Entre na sua conta para continuar</Text>
            </View>

            <Animated.View
              style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}
            >
              <Text style={styles.formTitle}>Login</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Usuário</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>👤</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="seu_usuario"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                    <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginBtnText}>ENTRAR</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    minHeight: height,
  },
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primary + '22',
    top: -100,
    right: -80,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.secondary + '15',
    bottom: 50,
    left: -60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  pokeball: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#111',
    marginBottom: 20,
    position: 'relative',
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  pokeballTop: {
    height: '50%',
    backgroundColor: COLORS.primary,
  },
  pokeballBelt: {
    height: 8,
    backgroundColor: '#111',
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    marginTop: -4,
    zIndex: 1,
  },
  pokeballBottom: {
    height: '50%',
    backgroundColor: '#F0F0F0',
  },
  pokeballCenter: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EEE',
    borderWidth: 4,
    borderColor: '#111',
    top: '50%',
    left: '50%',
    marginTop: -13,
    marginLeft: -13,
    zIndex: 2,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 6,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 24,
    letterSpacing: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    paddingVertical: 14,
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 8,
  },
  eyeText: {
    fontSize: 16,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
});