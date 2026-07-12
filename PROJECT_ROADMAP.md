# MEGACOLISEUM — Project Roadmap & Master Document

> **Última atualização:** 2026-07-12
> **Mantido por:** Antigravity (AI) + Wall (Game Master / Owner)
> **Repositório:** https://github.com/Wall-AR/wall-rpg
> **Diretório local:** `D:\MEGACOLISEUM\`

---

## 📖 1. Visão do Projeto

### O que é o MEGACOLISEUM?
Um **RPG multiplayer online** com sistema de batalha por turnos (inspirado em Final Fantasy, Legend of Dragoon, e Pokémon), exploração de mundo isométrica (estilo Pokémon de Game Boy), e uma forte identidade de **colecionismo** e **progressão infinita de armas**.

### Proposta Central
- **Jogue sozinho:** Explore fendas, farme XP, evolua armas e colete companheiros mesmo quando o grupo não está online.
- **Jogue junto:** O Mestre (GM) pode entrar a qualquer momento para narrar campanhas ao vivo, spawnar bosses, criar quests, e conduzir histórias com os jogadores em tempo real.
- **Colecionismo emocional:** Companheiros descartados vão para o "Livro de Memórias" — nunca são apagados, apenas aposentados com seus legados preservados.

### Para quem é?
- Grupo de amigos que quer jogar RPG online juntos, liderados por um Mestre narrador.
- Jogadores que gostam de farming/grinding assíncrono entre sessões do grupo.
- Fãs de JRPGs clássicos (Final Fantasy, Chrono Trigger, Legend of Dragoon) que apreciam UI ornamentada e progressão satisfatória.

---

## 🏗️ 2. Arquitetura Técnica

### Stack
| Camada | Tecnologia | Notas |
|:---|:---|:---|
| **Frontend** | React 18 + TypeScript + Vite | SPA com PixiJS para o canvas isométrico |
| **Backend** | Node.js + Express + Colyseus | Colyseus gerencia salas multiplayer em tempo real |
| **Banco de Dados** | PostgreSQL + Drizzle ORM | O servidor degrada graciosamente para modo in-memory quando o DB está offline |
| **Canvas/Gráficos** | PixiJS 8 (`pixi.js` 8.19 + `@pixi/react` 8) | Renderização isométrica tile-based para o overworld |
| **Animações** | GSAP | Animações de batalha, transições e efeitos visuais |
| **Auth** | JWT (jsonwebtoken) | Token-based, sem sessões server-side |
| **Build** | TypeScript ESM | Server usa `"type": "module"` — imports precisam de extensão `.js` |
| **Hospedagem/Git** | GitHub | Branch principal: `main` |

### Estrutura de Diretórios
```
D:\MEGACOLISEUM\
├── client/                          # Frontend React + Vite
│   ├── src/
│   │   ├── game/
│   │   │   ├── GameCanvas.tsx       # Canvas PixiJS principal (58KB, precisa refatoração)
│   │   │   ├── BattleTransition.tsx # Animação de transição para batalha
│   │   │   └── colyseus.ts         # Configuração do client Colyseus
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx      # Tela de login/cadastro
│   │   │   ├── LobbyScreen.tsx      # Orquestrador do lobby (tabs)
│   │   │   ├── BattleScreen.tsx     # Re-export do módulo battle/
│   │   │   ├── RecruitmentRevealScreen.tsx  # Recrutamento pós-batalha
│   │   │   ├── CompanionDetailScreen.tsx    # Ficha detalhada de companheiro
│   │   │   ├── battle/             # Módulos refatorados da batalha
│   │   │   │   ├── BattleScreen.tsx       # Orquestrador modular
│   │   │   │   ├── useBattleData.ts       # Hook Colyseus + state
│   │   │   │   ├── battleTypes.ts         # Interfaces e constantes
│   │   │   │   ├── BattleHUD.tsx          # HP bars, timer
│   │   │   │   ├── ConfrontationPrep.tsx  # Seleção de lineup
│   │   │   │   ├── PlanningPhase.tsx      # Comandos táticos
│   │   │   │   ├── QTESystem.tsx          # Quick Time Events
│   │   │   │   └── BattleResults.tsx      # Tela de resultado
│   │   │   ├── lobby/              # Tabs do lobby
│   │   │   │   ├── useLobbyData.ts        # Hook central do lobby
│   │   │   │   ├── HomeTab.tsx
│   │   │   │   ├── ProfileTab.tsx
│   │   │   │   ├── InventoryTab.tsx       # Mochila com XP/Level de armas
│   │   │   │   ├── FriendsTab.tsx
│   │   │   │   ├── BattlesTab.tsx         # Stub
│   │   │   │   ├── QuestsTab.tsx          # Stub
│   │   │   │   ├── MemoriesTab.tsx        # Livro de Memórias
│   │   │   │   ├── GMTab.tsx              # Painel do Mestre
│   │   │   │   └── SettingsTab.tsx
│   │   │   └── menu/               # Menu in-game (Esc)
│   │   │       └── tabs/
│   │   │           ├── TeamTab.tsx
│   │   │           ├── CharactersTab.tsx
│   │   │           └── MapTab.tsx         # Mapa Dimensional
│   │   ├── stores/
│   │   │   └── auth.ts             # Zustand store para autenticação
│   │   └── types/
│   │       └── index.ts            # Interfaces TypeScript globais
│   └── public/
│       └── assets/characters/       # Retratos e bustos de personagens
│
├── server/                          # Backend Colyseus + Express
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts           # Drizzle schema (10 tabelas)
│   │   │   └── index.ts            # Conexão DB com fallback in-memory
│   │   ├── schemas/
│   │   │   ├── MapState.ts          # Schema Colyseus do mapa
│   │   │   └── BattleState.ts       # Schema Colyseus da batalha
│   │   ├── rooms/
│   │   │   ├── GameRoom.ts          # Sala do overworld (exploração)
│   │   │   └── BattleRoom.ts        # Sala de combate por turnos
│   │   ├── routes/
│   │   │   ├── auth.ts              # Login/Register + seed companions
│   │   │   ├── character.ts         # Stats do personagem principal
│   │   │   ├── companions.ts        # CRUD de companheiros
│   │   │   ├── inventory.ts         # Inventário com level/xp de armas
│   │   │   └── friends.ts           # Sistema de amizades
│   │   ├── constants/
│   │   │   └── growth.ts            # Constantes de crescimento compartilhadas
│   │   ├── middleware/
│   │   │   └── auth.ts              # JWT middleware
│   │   ├── data/maps/
│   │   │   └── default_map.json     # Mapa padrão do overworld
│   │   └── index.ts                 # Entry point do servidor
│   └── drizzle/                     # Migrações SQL geradas
│       ├── 0001_*.sql
│       ├── 0002_superb_king_cobra.sql  # Tabela companions
│       └── 0003_first_selene.sql       # Colunas level/xp no inventory
│
├── PROJECT_ROADMAP.md               # Este documento
└── AI_SYNC.md                       # Protocolo de sincronização entre IAs
```

### Banco de Dados (10 tabelas)
| Tabela | Propósito |
|:---|:---|
| `accounts` | Contas de jogador (username, password hash, soulOrbs) |
| `characters` | Personagem principal da conta (stats, level, xp) |
| `companions` | Companheiros colecionáveis (6 ativos, N reservas) |
| `inventory` | Itens e armas (com `level` e `xp` para evolução infinita) |
| `items_base` | Catálogo de tipos de item (sword_1, potion_1, etc.) |
| `friendships` | Relações de amizade entre contas |
| `battle_history` | Log de batalhas passadas |
| `retired_characters` | Livro de Memórias (companheiros aposentados) |
| `quests` | Definições de quests |
| `quest_progress` | Progresso do jogador em cada quest |

---

## 🎮 3. Sistemas de Jogo (Design)

### 3.1 Fluxo do Jogador
```
Login → Seleção de Save → Lobby Central (Cidade-Portal de Veylar)
                                ↓
                    [Portais para diferentes modos de jogo]
                                ↓
                    Portal 1: Mundo RPG (exploração + batalha)
                    Portal 2: Mario Party Board (futuro)
                    Portal 3: Mini-games (futuro)
```

### 3.2 Sistema de Batalha (Turnos - 3v3)
- **Preparação de Confronto:** Escolher 3 de 6 companheiros + runa ativa.
- **Planejamento Tático:** Cada jogador escolhe ações para seus 3 combatentes (atacar, defender, magia).
- **Resolução:** Ações são resolvidas por ordem de velocidade.
- **QTE (Quick Time Events):** Inspirado em Legend of Dragoon — timing perfeito dá combo bonus.
- **Resultado:** XP distribuída para personagem e arma equipada. Drops de loot. Chance de recrutamento.

### 3.3 Progressão (Decisão em Aberto — Proposta A recomendada)

#### Armas (DEFINIDO — Evolução Infinita)
- Armas ganham XP das batalhas e sobem de nível infinitamente.
- Fórmula: `level * 100` XP por nível (sem cap).
- A arma pode ser equipada em qualquer herói da mesma classe.
- Isso permite trocar de companheiro sem perder progresso — a arma carrega o poder.

#### Heróis (EM DISCUSSÃO — 3 propostas)
| Proposta | Conceito |
|:---|:---|
| **A (Recomendada)** | Heróis têm stats fixos por Rank de Raridade. Evoluem via Vínculo (bond) e Habilidades individuais (uso em batalha). Armas carregam o progresso pesado. |
| **B** | Heróis têm nível normal, mas ao serem aposentados, transferem XP para as armas (fusão geracional). |
| **C** | Nível global da conta (Master Level). Heróis e armas herdam o nível da conta. |

### 3.4 Colecionismo
- **Bestiário/Pokédex:** Registro de todos os companheiros que passaram pela equipe.
- **Livro de Memórias:** Companheiros aposentados ficam imortalizados com legado.
- **Armas:** Coleção de armas com níveis visíveis e histórico de evolução.

### 3.5 Ferramentas do Mestre (GM)
- **Pintura de mapa:** DevTool in-game para pintar tiles no canvas PixiJS.
- **Spawn de monstros:** Chat command para materializar NPCs no mapa.
- **Narração:** Comando para enviar texto narrativo a todos os jogadores.
- **Quests ao vivo:** Criar e disparar missões em tempo real.
- **Decisão de abordagem:** Modelo Híbrido (visual para pintura + JSON para quests complexas).

---

## ✅ 4. O que já foi Implementado

### Backend (Servidor)
- [x] Sistema de autenticação JWT (login/register)
- [x] Seed de 6 companheiros ao criar conta
- [x] API REST de Companions (listar, detalhar, swap, disenchant)
- [x] API REST de Inventário (listar com level/xp, transferir, fundir, evoluir raridade)
- [x] API REST de Amigos (solicitar, aceitar, listar)
- [x] API REST de Personagem (stats, dismiss, retired)
- [x] GameRoom Colyseus (overworld com jogadores, monstros, chat, GM tools)
- [x] BattleRoom Colyseus (combate 3v3 por turnos, QTE, resolução de ações)
- [x] Integração da BattleRoom com tabela `companions` (stats reais do DB)
- [x] Evolução infinita de armas no BattleRoom (XP pós-combate)
- [x] Constantes de crescimento compartilhadas (`growth.ts`)
- [x] Correções: spawn em parede, respawn de monstros, validação de amizade
- [x] Migrações Drizzle (0001, 0002, 0003) geradas

### Frontend (Cliente)
- [x] Tela de Login/Cadastro
- [x] Lobby com 9 tabs (Home, Profile, Inventory, Friends, Battles, Quests, Memories, GM, Settings)
- [x] Inventário com exibição de nível e barra de XP para armas
- [x] Integração do Lobby com API de Companions
- [x] Tela de Batalha modularizada (BattleScreen refatorado de 103KB para 8 módulos)
- [x] Sistema de QTE (Legend of Dragoon compass)
- [x] Tela de Resultado de Batalha (XP, loot, MVP, level up)
- [x] Tela de Recrutamento Pós-Batalha
- [x] Tela de Escolha Difícil (substituição quando equipe cheia)
- [x] Livro de Memórias (galeria com ficha completa)
- [x] Ficha de Companheiro (detalhamento completo com abas)
- [x] Mapa Dimensional (Atlas com nós interativos)
- [x] Menu In-Game (Esc) com tabs de equipe, personagens e mapa
- [x] Canvas PixiJS isométrico com sistema de tiles e movimentação
- [x] Editor de mapas DevTool (pintura de tiles pelo GM)

---

## ⏳ 5. O que falta Implementar

### Fase 2: Sistemas Core
- [ ] Remover credencial GM padrão (`gm-master-key`) e exigir `GM_SECRET` seguro em produção
- [ ] Corrigir proxy local de `/companions` no Vite (a rota hoje retorna o HTML da SPA em desenvolvimento)
- [ ] Migrar listeners de presença para `Callbacks.get(room)` do Colyseus 0.17
- [ ] Refatorar `GameCanvas.tsx` (58KB para módulos)
- [ ] Separar HUD/missão mockados do estado real (`Lv. 128`, poder da equipe e quest padrão ainda são visuais estáticos)
- [ ] Conectar `PREP_ROSTER` do client ao endpoint `/companions`
- [ ] Implementar posição no combate (frente/meio/trás) com efeito real
- [ ] Expandir catálogo de magias (8 spells com custos e efeitos)
- [ ] Implementar 5 runas funcionais com efeitos reais
- [ ] Criar endpoints de equipar/desequipar itens
- [ ] Implementar quest system no DB
- [ ] Tela de Seleção de Save (estilo Zelda, antes do lobby)

### Fase 3: Telas e Fluxo
- [ ] Completar Ficha de Companheiro com dados reais do DB
- [ ] Completar Mapa Dimensional com viagem funcional
- [ ] Sistema de recrutamento generalizado (não apenas Thorn hardcoded)
- [ ] Preencher tabs stub (BattlesTab, QuestsTab)
- [ ] Implementar chat in-game no overworld

### Fase 4: Polish e Conteúdo
- [ ] Criar testes automatizados mínimos para auth, rotas core e ciclo de batalha
- [ ] Adicionar smoke test de navegador para cadastro → lobby → mundo
- [ ] Implementar code splitting no client (bundle principal atual: ~887KB minificado / ~262KB gzip)
- [ ] Seed de `items_base` com catálogo completo
- [ ] Dragoon Level system (transformação temporária)
- [ ] Balanceamento de combate
- [ ] Sistema de Party (grupo de jogadores)
- [ ] Sistema de troca de itens entre jogadores (já tem rota, falta UI)

### Fase 5: Multi-Mundo (Futuro)
- [ ] Lobby com portais para diferentes modos de jogo
- [ ] Modo Mario Party (tabuleiro digital com mini-games)
- [ ] Eventos especiais do Mestre com recompensas únicas

---

## ⚠️ 6. Restrições Técnicas Conhecidas

1. **Sem Docker/Postgres local:** O servidor usa fallback in-memory (`db === null`). Migrações são geradas mas não aplicadas localmente.
2. **ESM no Backend:** Imports internos devem usar extensão `.js` (ex: `import { db } from '../db/index.js'`).
3. **TailwindCSS no client:** Classes utilitárias aplicadas diretamente nos componentes.
4. **CHARACTER_DATABASE ainda existe:** Array estático no `BattleRoom.ts` como fallback. Manter até DB estar garantido.
5. **Colyseus rooms:** `GameRoom` é persistente. `BattleRoom` é criada por demanda.
6. **Proxy de desenvolvimento incompleto:** `client/vite.config.ts` ainda não encaminha `/companions` para a porta 3001.
7. **Callbacks Colyseus 0.17:** O lobby ainda usa o padrão legado `state.players.onAdd/onRemove`; migrar para `Callbacks.get(room)`.
8. **Mocks visuais no overworld:** O HUD de `GameCanvas.tsx` ainda mostra nível, poder da equipe e quest padrão estáticos, diferentes do personagem real carregado no lobby.
9. **Cobertura de testes:** A CI executa typecheck e build, mas o repositório ainda não possui testes automatizados.
10. **Credencial GM de desenvolvimento:** `GameRoom.ts` aceita `gm-master-key` quando `GM_SECRET` não está definido. O fallback precisa ser bloqueado em produção antes de qualquer implantação pública.

---

## 🎨 7. Diretrizes de Design Visual

- **Paleta:** `#06060c` (fundo), `#16162a` (painéis), `#1a1a2e` (cards), dourado/amber para destaques
- **Fontes:** Serifadas para títulos (Georgia, serif), sans-serif para corpo (Inter, system)
- **Bordas:** `border-indigo-900/40` para painéis, `border-amber-700` para destaques de armas
- **Gradientes:** `from-indigo-400 to-indigo-500` para texto brilhante, `from-amber-500 to-yellow-400` para XP
- **Animações:** GSAP para batalha, CSS transitions para UI, `animate-pulse` para alertas
- **Tema geral:** Fantasia medieval dimensional, UI ornamentada, elegância de JRPG clássico
