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

| Email | Senha | Usuário |
|-------|-------|---------|
| test@test.com | 123456 | Treinador |
| ash@pokemon.com | 123456 | Ash Ketchum |
| misty@pokemon.com | 123456 | Misty |
| brock@pokemon.com | 123456 | Brock |

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
