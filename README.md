# PokéTrainer

Aplicativo mobile desenvolvido com **Expo + React Native** para a disciplina de Projeto Mobile Fatec 2026.

Permite visualizar uma Pokédex com cards interativos após autenticação, funcionando tanto na **web** quanto no **Android**.

---

## Requisitos

- Node.js instalado
- Expo Go instalado no celular (para testar no Android)

---

## Como rodar

```bash
npm install
npx expo start
```

No terminal que abrir:

- Pressione `w` para abrir no navegador
- Escaneie o QR code com o app **Expo Go** para abrir no celular

---

## Acesso

| Campo   | Valor     |
|---------|-----------|
| Usuário | `ash`     |
| Senha   | `pikachu` |

---

## Funcionalidades

- Tela de login com validação de credenciais
- Dashboard com cards dos Pokémons (nome, tipo, HP, ATK, SPD e imagem oficial)
- Proteção de rota via stack condicional — sem login, a Dashboard é inacessível; após login, não é possível voltar para a tela de login
- Layout responsivo para web e Android/IOS

---

## Estrutura do projeto

```
App.tsx                      → navegação e proteção de rota
src/
  AuthContext.tsx             → estado global de autenticação
  screens/
    LoginScreen.tsx           → tela de login
    DashboardScreen.tsx       → listagem de Pokémons em cards
```

---

## Tecnologias

- [Expo](https://expo.dev)
- [React Native](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
- [PokéAPI](https://pokeapi.co) — imagens oficiais dos Pokémons