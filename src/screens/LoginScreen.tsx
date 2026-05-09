import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Platform, Animated,
} from 'react-native';
import { useAuth } from '../AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!user.trim() || !pass) {
      setError('Preencha todos os campos, Treinador!');
      return;
    }
    const ok = login(user.trim(), pass);
    if (!ok) setError('Usuário ou senha incorretos!');
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        {/* Pokébola */}
        <View style={s.ball}>
          <View style={s.ballTop} />
          <View style={s.ballBot} />
          <View style={s.ballBand} />
          <View style={s.ballCenter} />
        </View>

        <Text style={s.title}>POKÉDEX</Text>
        <Text style={s.sub}>ÁREA DO TREINADOR</Text>

        <View style={s.card}>
          <Text style={s.cardTitle}>Faça seu Login</Text>
          <Text style={s.hint}>
            Usuário: <Text style={s.yellow}>ash</Text>  ·  Senha: <Text style={s.yellow}>pikachu</Text>
          </Text>

          <Text style={s.label}>TREINADOR</Text>
          <TextInput
            style={s.input}
            placeholder="Nome do treinador..."
            placeholderTextColor="#ffffff40"
            value={user}
            onChangeText={setUser}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={s.label}>SENHA</Text>
          <TextInput
            style={s.input}
            placeholder="••••••••"
            placeholderTextColor="#ffffff40"
            value={pass}
            onChangeText={setPass}
            secureTextEntry
            onSubmitEditing={handleLogin}
          />

          {!!error && <View style={s.errBox}><Text style={s.errTxt}>{error}</Text></View>}

          <TouchableOpacity style={s.btn} onPress={handleLogin} activeOpacity={0.85}>
            <Text style={s.btnTxt}>ENTRAR NA POKÉDEX</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>© 2026 PokéTrainer · Catch 'em all!</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0e0e1c' },
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, backgroundColor: '#0e0e1c',
  },

  ball: {
    width: 80, height: 80, borderRadius: 40,
    overflow: 'hidden', borderWidth: 4, borderColor: '#222',
    marginBottom: 18, position: 'relative',
  },
  ballTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: '#e63346' },
  ballBot: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', backgroundColor: '#f5f5f5' },
  ballBand: {
    position: 'absolute', top: '46%', left: 0, right: 0,
    height: 8, backgroundColor: '#111', zIndex: 2,
  },
  ballCenter: {
    position: 'absolute', top: '50%', left: '50%',
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#fff', borderWidth: 4, borderColor: '#111',
    marginTop: -11, marginLeft: -11, zIndex: 3,
  },

  title: {
    fontSize: Platform.OS === 'web' ? 36 : 28,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 8,
    textShadowColor: '#c8960c',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  sub: { color: '#888', fontSize: 11, letterSpacing: 4, marginTop: 4, marginBottom: 32 },

  card: {
    width: '100%', maxWidth: 400,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20, padding: 28,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)',
  },
  cardTitle: { color: '#FFD700', fontSize: 17, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  hint: { color: '#888', fontSize: 12, textAlign: 'center', marginBottom: 22 },
  yellow: { color: '#FFD700', fontWeight: '800' },

  label: { color: '#FFD700', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: '#fff', fontSize: 15,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },

  errBox: {
    backgroundColor: 'rgba(230,51,70,0.15)',
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: 'rgba(230,51,70,0.3)',
    marginBottom: 14,
  },
  errTxt: { color: '#ff7080', fontSize: 13, textAlign: 'center' },

  btn: {
    backgroundColor: '#e63346',
    borderRadius: 13, paddingVertical: 15,
    alignItems: 'center', marginTop: 4,
  },
  btnTxt: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 2 },

  footer: { color: '#ffffff20', fontSize: 11, marginTop: 28, letterSpacing: 1 },
});
