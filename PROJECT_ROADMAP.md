# MEGACOLISEUM — Project Roadmap & Master Document

> **Última atualização:** 2026-07-12
> **Mantido por:** Antigravity (AI) + Wall (Game Master / Owner)
> **Repositório:** https://github.com/Wall-AR/wall-rpg
> **Diretório local:** `D:\MEGACOLISEUM\`
> **Design canônico:** consulte `GAME_DESIGN.md` para visão, loops, batalha e decisões abertas.

---

## 📖 1. Visão do Projeto

### O que é o MEGACOLISEUM?
Um **RPG multiplayer online persistente** com exploração 3D, campanha episódica dirigida por um Mestre, batalha tática por fases, colecionismo de heróis e **progressão duradoura/infinita de armas**. O mundo continua jogável entre capítulos, mesmo quando o Mestre leva meses para preparar a próxima campanha.

### Proposta Central
- **Jogue sozinho:** Explore fendas, farme XP, evolua armas e colete companheiros mesmo quando o grupo não está online.
- **Jogue junto:** Amigos formam grupos, enfrentam conteúdo e evoluem dentro do mesmo universo persistente.
- **Viva uma campanha:** O Mestre pode reunir/transportar participantes, isolar uma área, narrar capítulos ao vivo, controlar eventos e conceder consequências persistentes.
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
| **Frontend** | React 18 + TypeScript + Vite | SPA; React continua responsável por HUD, menus e aplicação |
| **Backend** | Node.js + Express + Colyseus | Colyseus gerencia salas multiplayer em tempo real |
| **Banco de Dados** | PostgreSQL + Drizzle ORM | O servidor degrada graciosamente para modo in-memory quando o DB está offline |
| **Renderer atual** | PixiJS 8 (`pixi.js` 8.19 + `@pixi/react` 8) | Overworld isométrico legado, mantido até a migração atingir paridade |
| **Renderer 3D proposto** | React Three Fiber 8 + Three.js | Compatível com o React 18 atual; exige vertical slice antes da substituição definitiva |
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
| `companions` | Companheiros colecionáveis (até 6 no roster de batalha; máximo de 3 heróis simultaneamente no campo por jogador) |
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
Link → Login/Conta → Primeiro Herói (aleatório ou convite especial)
                         ↓
             Lobby Social / Seleção de Modo
          ↙                 ↓                 ↘
  Mundo RPG             Duelo PvP          Brawl (8)
      ↓                                      ↓
 Cidade inicial / Mundo Persistente 3D   Rodadas até 1 vencedor
                         ↓
      Explorar → Farmar → Batalhar → Coletar/Vender/Aprimorar
                         ↓
       [Quando o Mestre publica um capítulo de campanha]
                         ↓
 Reunir/transportar grupo → Área isolada → Narrativa/Encontros
                         ↓
 Recompensas e consequências → Retorno ao mundo persistente
```

### 3.2 Sistema de Batalha (roster 6, máximo 3 heróis ativos, grade 3×3)
- **Encontro:** O servidor valida o gatilho durante a exploração e abre a transição.
- **Lobby de Batalha:** Escolher 3 titulares entre até 6 heróis e definir posições iniciais na grade 3×3.
- **Mana universal:** Funciona como a economia de turno de Hearthstone e é compartilhada por PvE, PvP, cooperativo e Brawl.
- **Ações gratuitas:** Ataque básico e modo de defesa custam 0 Mana.
- **Preparação:** Planejamento simultâneo com cronômetro; habilidades, itens, ações especiais e substituições competem pelo orçamento de Mana.
- **Campo solo/Brawl:** Cada jogador possui 9 casas em três faixas e no máximo 3 heróis ativos; casas restantes podem receber clones, tokens, barreiras e invocações.
- **Campo cooperativo/PvP em equipes:** Parties de até 3 jogadores compartilham uma grade 3×3 por equipe; cada jogador controla 1 herói e nenhuma entidade pode dividir uma casa.
- **Prioridade:** Ataques comuns acertam o alvo válido mais à frente; Perfurante 1 alcança dois alvos e Perfurante 2 alcança três.
- **Cooperativo:** Cada jogador confirma um herói no lobby (favorito por padrão) e controla sua própria ação; substituir consome Mana e perde a ação do turno. A Resolução começa após todos confirmarem ou o timer acabar.
- **PvP/PvPvE em equipes:** O mesmo contrato suporta 1×1, 2×2 e 3×3, com uma grade compartilhada por equipe.
- **Resolução:** O servidor bloqueia os planos e resolve ações por prioridade, velocidade e modificadores.
- **WO competitivo:** Abandono ou desconexão além da tolerância gera derrota, impacto de ranking e possíveis punições.
- **QTE (Quick Time Events):** Inspirado em Legend of Dragoon — timing perfeito dá combo bonus.
- **Resultado:** XP distribuída para personagem e arma equipada. Drops de loot. Chance de recrutamento.
- **Curva técnica v1:** 1 Mana no turno 1, +1 por turno até 10, renovada a cada Preparação; ataque/defesa 0, reposicionamento 1, item 2 e substituição 3.
- **Decisões abertas:** balanceamento da curva, lacunas/colunas, entidades auxiliares, reconexão, punições de WO, PvPvE e regras completas do Brawl. Não implementar por suposição; consultar `GAME_DESIGN.md`.

### 3.3 Modos Compartilhados
- **Mundo RPG:** exploração persistente, PvE, farming, quests e campanhas cooperativas do Mestre.
- **Duelo:** PvP direto usando a coleção compartilhada.
- **Brawl:** oito jogadores preparam seus tabuleiros simultaneamente, são emparelhados por rodada e retornam à Preparação após a resolução até restar um vencedor.
- **Futuro:** Mario Party, Tetris, Tower Defense e outros runtimes dentro do mesmo universo, conta e metajogo.

### 3.4 Progressão (Decisão em Aberto — Proposta A recomendada)

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

### 3.5 Colecionismo
- **Bestiário/Pokédex:** Registro de todos os companheiros que passaram pela equipe.
- **Livro de Memórias:** Companheiros aposentados ficam imortalizados com legado.
- **Armas:** Coleção de armas com níveis visíveis e histórico de evolução.

### 3.6 Ferramentas do Mestre (GM)
- **Preparação:** Criar capítulos, áreas, cenas, NPCs, encontros, objetivos e recompensas.
- **Reunião:** Selecionar participantes e transportar o grupo para a sessão.
- **Controle de área:** Abrir, fechar ou isolar regiões da campanha e recuperar jogadores presos por falha.
- **Execução ao vivo:** Narrar, controlar NPCs/inimigos, disparar quests, cenas, batalhas e consequências.
- **Auditoria:** Registrar comandos privilegiados e recompensas concedidas.
- **Abordagem:** Ferramentas visuais para operação ao vivo + dados estruturados para conteúdo complexo.

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
- [x] BattleRoom Colyseus (solo 3 heróis; cooperativo e PvP em equipes com 1 herói por jogador, QTE e resolução autoritativa)
- [x] Equipes de 1–3 jogadores com grade 3×3 compartilhada, bloqueio de colisão e confirmação simultânea
- [x] Mana v1 compartilhada entre os modos (curva 1–10, custos por ação e validação no servidor)
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
- [ ] Fechar contratos restantes da batalha: entidades auxiliares, lacunas/colunas, perfuração completa, reconexão e punições de WO
- [ ] Extrair de `GameCanvas.tsx` input, rede, entidades, interação e HUD antes da migração 3D
- [ ] Construir vertical slice R3F: personagem, câmera, chão, colisão, NPC e segundo jogador sincronizado
- [ ] Validar performance e sensação da exploração 3D antes de retirar o renderer PixiJS
- [ ] Separar HUD/missão mockados do estado real (`Lv. 128`, poder da equipe e quest padrão ainda são visuais estáticos)
- [ ] Conectar `PREP_ROSTER` do client ao endpoint `/companions`
- [ ] Completar roster/reserva e entidades auxiliares sobre a grade 3×3 (a base de posições e equipes já existe)
- [ ] Implementar frente/meio/trás com alcance, proteção e efeito real
- [ ] Expandir catálogo de magias (8 spells com custos e efeitos)
- [ ] Implementar 5 runas funcionais com efeitos reais
- [ ] Criar endpoints de equipar/desequipar itens
- [ ] Implementar quest system no DB
- [ ] Tela de Seleção de Save (estilo Zelda, antes do lobby)

### Fase 3: Telas e Fluxo
- [ ] Transformar lobby em espaço social com seleção inicial de Mundo RPG, Duelo e Brawl
- [ ] Persistir herói favorito e conectar o lobby pré-batalha cooperativo à coleção real (a seleção/posição/confirmacão já funcionam com roster temporário)
- [ ] Implementar fundação do Brawl de oito jogadores: pareamento, preparação, resolução, vida e eliminação
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
- [x] Party básica de até 3 jogadores integrada ao encontro cooperativo
- [ ] Completar UX da Party, liderança, expulsão, reconexão e transporte de campanha
- [ ] Sistema de troca de itens entre jogadores (já tem rota, falta UI)

### Fase 5: Modos Futuros
- [ ] Modo Mario Party (tabuleiro digital com mini-games)
- [ ] Modo Tetris com progressão/recompensas compatíveis
- [ ] Modo Tower Defense com progressão/recompensas compatíveis
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
11. **Migração 3D:** PixiJS representa o estado atual, não a arquitetura final da exploração. Não remover o overworld existente antes de uma vertical slice R3F atingir paridade mínima de rede, input, interação e desempenho.
12. **Batalha-alvo diferente da implementação atual:** o backend atual é 3v3 simples. O design canônico agora prevê roster de 6, máximo de 3 heróis ativos por jogador, Mana universal e grade 3×3 ocupável por heróis e entidades auxiliares; a transição exige novo contrato de estado.

---

## 🎨 7. Diretrizes de Design Visual

- **Paleta:** `#06060c` (fundo), `#16162a` (painéis), `#1a1a2e` (cards), dourado/amber para destaques
- **Fontes:** Serifadas para títulos (Georgia, serif), sans-serif para corpo (Inter, system)
- **Bordas:** `border-indigo-900/40` para painéis, `border-amber-700` para destaques de armas
- **Gradientes:** `from-indigo-400 to-indigo-500` para texto brilhante, `from-amber-500 to-yellow-400` para XP
- **Animações:** GSAP para batalha, CSS transitions para UI, `animate-pulse` para alertas
- **Tema geral:** Fantasia medieval dimensional, UI ornamentada, elegância de JRPG clássico
