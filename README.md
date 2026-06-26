# Wall RPG

RPG multiplayer online em navegador para jogar com amigos.

> Inspirado em **The Legend of Dragoon** (sistema de batalha com Additions/QTE + transformação Dragoon) e **Pokémon GameBoy** (exploração 2D em tempo real, evolução e customização de personagens).

---

## Visão Geral

Cada jogador começa com **1 personagem** e pode expandir sua equipe até **3 personagens**. Para adicionar um novo membro, é necessário **substituir um existente** — decisão irreversível que gera apego e estratégia.

### Modos de Jogo

#### 🌍 Mundo Livre (Free Mode)
- Explorar mapas 2D (cidades, florestas, montanhas, masmorras)
- Spawn automático de monstros para farmar XP e itens
- Duelar contra outros jogadores (com histórico de batalhas)
- Comerciar itens e armas entre jogadores
- Funciona mesmo sem o Mestre online

#### 📜 Campanha (Campaign Mode)
- Requer **Mestre online** conduzindo a história
- Missões com tempo limite definido pelo Mestre
- Ao aceitar uma quest, o jogador fica **travado** nela (sem acesso ao mundo livre)
- Se não concluir no prazo → penalidades
- Se concluir → recompensas

---

## Mecânicas Principais

### ⚔️ Sistema de Batalha (Turn-based + QTE)
- Ordem de turno definida por **Speed**
- **Additions**: QTEs onde o jogador aperta o botão no timing certo para encadear golpes (inspirado em Legend of Dragoon)
- **Counterattack**: inimigo pode contra-atacar — timing diferente (botão alternativo)
- **Transformação**: ao acumular SP, personagem se transforma em Dragoon com stats aumentados e acesso a magias elementais
- **Special**: quando toda a equipe está com SP máximo — ataque combinado devastador
- Tabela de **elementos** com vantagens/desvantagens (Fogo, Água, Vento, Terra, Luz, Trevas, Trovão)

### 🎮 Personagens
- Cada jogador começa com **1 personagem**
- Máximo **3 personagens** na equipe
- Adquirir novo = substituir um existente (irreversível)
- Atributos: HP, AT, DF, MAT, MDF, SP, Level, XP
- Classe/elemento define magias disponíveis

### 🔫 Armas com XP
- Armas sobem de nível com o uso
- Desbloqueiam habilidades conforme evoluem
- **Limite de trocas** entre jogadores (cria raridade e economia)
- Uma arma muito usada e trocada vira item lendário

### 🤝 Amigos & Duels
- Adicionar amigos e ver status online
- Desafiar para duelos
- Histórico completo de batalhas

---

## Stack Tecnológica

| Componente | Tecnologia |
|---|---|
| **Frontend** | React + Vite + TypeScript + TailwindCSS |
| **Renderização do Mundo** | Canvas 2D |
| **Estado** | Zustand |
| **Rede** | WebSocket (socket.io) |
| **Backend** | Node.js + Express |
| **Banco de Dados** | PostgreSQL |
| **Autenticação** | JWT (login/senha) |
| **PWA** | Instalável no celular como app nativo |

---

## Estrutura do Projeto

```
wall-rpg/
├── client/          # React (Vite)
│   ├── src/
│   │   ├── screens/     # Telas (Login, Mapa, Batalha, Equipe, etc)
│   │   ├── game/        # Engine de batalha/QTE
│   │   ├── components/  # UI genérica
│   │   ├── hooks/       # Custom hooks
│   │   ├── stores/      # Zustand stores
│   │   ├── socket/      # Conexão WebSocket
│   │   └── types/       # TypeScript types
│   └── public/
├── server/          # Node.js
│   ├── src/
│   │   ├── game/        # Lógica do jogo (combate, dano, turnos)
│   │   ├── services/    # Auth, GM, Quest, Duel
│   │   ├── socket/      # Event handlers
│   │   ├── db/          # Models + migrations
│   │   └── routes/      # REST (login, etc)
│   └── package.json
└── package.json      # Monorepo (workspaces)
```

---

## Fases de Desenvolvimento

1. **Setup** — monorepo, Vite, servidor, banco, socket.io, auth
2. **Core de Batalha** — turnos, Additions QTE, elementos, dano
3. **Personagens** — stats, level, XP, equipamentos
4. **Armas com XP** — evolução e limite de trocas
5. **Exploração** — mapas, spawn de monstros, drops
6. **Amigos & Duels** — social + histórico
7. **Sistema de Quests** — timer, trava de mundo
8. **Interface do Mestre (GM)** — ferramentas de narração
9. **Modo Campanha** — integração Mestre + jogadores
10. **PWA & Deploy** — instalação mobile + VPS

---

## Licença

Projeto privado para fins recreativos entre amigos.
