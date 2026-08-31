# Pokédex App 🎮

Aplicativo móvel de Pokédex completo, construído com React Native + Expo Router.

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Expo Go instalado no celular (iOS/Android)

### Instalação

```bash
cd PokedexApp
npm install
npx expo start
```

Escaneie o QR code com o aplicativo **Expo Go** no seu celular.

---

## 🔐 Login

Use uma das contas de teste:

Usuário   Senha
test    | 123456

---

## 🔒 Segurança da sessão

O login não guarda mais usuário/senha nem token em texto puro. O fluxo agora é baseado em sessão temporária:

- **Access token**: validade de 5 min, mantido só em memória (nunca é salvo em disco).
- **Refresh token**: validade de 8h, guardado no Keychain/Keystore do aparelho (via `expo-secure-store`), ou cifrado no navegador quando rodando na web. Vencido, a sessão cai sozinha e o app volta pro login sem precisar de ação nenhuma.
- Se o backend devolver `accessToken`/`token`, esses passam a ser os tokens oficiais da sessão. Se devolver só `userId` — caso do backend atual (AWS) —, o app emite localmente um ticket assinado por uma chave que nasce no aparelho e nunca sai dele.
- Toda requisição sai assinada (`X-Poke-Timestamp`, `X-Poke-Nonce`, `X-Poke-Signature`), dificultando repetir uma requisição capturada. Se o backend confirmar um canal seguro no login, as respostas trafegam num envelope cifrado com AES-256-GCM.
- O perfil salvo localmente (time, vitórias/derrotas) é selado com HMAC no celular e cifrado com AES-256-GCM na web — um save editado à mão é descartado automaticamente. Saves antigos em texto puro são migrados no primeiro login.

Nada disso substitui HTTPS nem validação no servidor — é uma camada extra que dificulta bisbilhotar/adulterar/repetir tráfego do lado do cliente. Quem decide de fato é o backend. Trocar de backend é só mudar `EXPO_PUBLIC_API_URL` (veja `.env.example`).

Onde está cada coisa:

| Arquivo | Responsabilidade |
| --- | --- |
| `src/config/env.ts` | URL da nuvem, rotas e validade dos tokens |
| `src/security/crypto.ts` | AES-256-GCM, HMAC-SHA256, hash, bytes aleatórios |
| `src/security/secureStore.ts` | chave de dispositivo, segredos e dados protegidos |
| `src/security/session.ts` | ciclo de vida da sessão e emissão dos tickets |
| `src/security/envelope.ts` | assinatura de requisições e abertura do envelope cifrado |
| `src/integration/cloudClient.ts` | portão único de HTTP: sessão, assinatura, 401 |
| `src/integration/authApi.ts` | login, cadastro, logout, perfil/estatísticas |
| `src/context/AuthContext.tsx` | estado de autenticação para as telas |

---

## 📱 Telas

### 1. Login (`/login`)
- Tela inicial obrigatória
- Validação de credenciais
- Redirecionamento automático após login
- Proteção de rotas: não é possível acessar outras telas sem autenticar

### 2. Pokédex (`/pokedex`)
- 160 Pokémons carregados da PokeAPI
- Cards com imagem, nome, número e tipos
- Barra de busca por nome ou número
- Filtros por tipo (fogo, água, grama, etc.)
- Paginação automática (carrega mais ao rolar)
- Modal com detalhes completos: stats, habilidades, altura, peso

### 3. Time (`/team`)
- **Time Surpresa**: 5 Pokémons aleatórios com botão de recarregar
- **Time Personalizado**: escolha até 25 Pokémons de uma lista interativa
- Seleção salva localmente (persiste entre sessões)
- Toque nos Pokémons para ver detalhes

### 4. Perfil (`/profile`)
- Avatar personalizável (da galeria do celular)
- Nome editável
- Estatísticas de batalha fictícias (vitórias, derrotas, taxa de vitória)
- Sistema de insígnias baseado em vitórias
- Nível do treinador progressivo
- Botão de logout

---

## 🛠️ Estrutura do Projeto

```
PokedexApp/
├── app/                        # Rotas (Expo Router)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx           # Tela de login
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Tab bar
│   │   ├── pokedex.tsx         # Dashboard Pokédex
│   │   ├── team.tsx            # Time
│   │   └── profile.tsx         # Perfil
│   ├── _layout.tsx             # Root layout + proteção de rotas
│   └── index.tsx               # Redirect para login
└── src/
    ├── @types/                 # TypeScript types
    ├── components/
    │   ├── common/             # PokeballLoader
    │   └── pokemon/            # PokemonCard, PokemonDetailModal
    ├── constants/              # Cores, temas, tipos
    ├── context/                # AuthContext, PokemonContext
    └── integration/            # PokeAPI client
```

---

## 🎨 Design

- Tema escuro com vermelho Pokébola (#CC0000) e amarelo Pokémon (#FFCB05)
- Cards com cores dinâmicas baseadas no tipo do Pokémon
- Animações de loading com Pokébola giratória
- Interface responsiva para celular
