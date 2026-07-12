# AI_SYNC — Protocolo de Sincronização entre IAs

> **Propósito:** Coordenar o trabalho simultâneo de duas IAs (Antigravity e Codex) no mesmo repositório sem conflitos.
> **Repositório:** https://github.com/Wall-AR/wall-rpg
> **Branch principal:** `main`
> **Versão do protocolo:** 2.0 — 2026-07-12

---

## 🤝 Regras de Ouro

1. **Uma tarefa, um owner, uma branch e um conjunto explícito de arquivos.** Registrar o assignment antes da primeira alteração funcional.
2. **Nunca assumir que `git pull` é seguro.** Primeiro executar `git status`, depois `git fetch origin` e comparar a branch com `origin/main`. Não atualizar uma árvore com mudanças de outra IA.
3. **Branches não isolam duas IAs dentro da mesma pasta.** Trabalho simultâneo exige worktrees/diretórios separados; nunca trocar de branch numa pasta que outra IA possa estar usando.
4. **Não fazer push direto em `main` durante trabalho paralelo.** Publicar apenas a branch da tarefa; integração em `main` ocorre depois de revisão, validação e autorização do owner.
5. **Não ampliar o escopo silenciosamente.** Se surgir necessidade de tocar arquivo fora do assignment, pausar essa parte, registrar a dependência e coordenar o novo lock.
6. **Estado compartilhado exige cuidado extra.** `AI_SYNC.md`, `package-lock.json`, `App.tsx`, schemas, tipos compartilhados e migrações são hotspots; mudanças neles devem ser declaradas nominalmente.
7. **Typecheck é o piso, não a definição completa de pronto.** Toda entrega deve informar validações executadas, resultado, limitações e o que não foi testado.
8. **Commits e pushes precisam ser intencionais.** Não commitar, publicar, mesclar ou sobrescrever trabalho do outro agente apenas porque uma sessão terminou.

---

## 📋 Zonas de Responsabilidade (File Ownership)

As zonas indicam afinidade e contexto, não autorização permanente. O **assignment ativo e mais específico prevalece** sobre a zona. Ambas podem ler qualquer arquivo, mas só devem escrever nos arquivos declarados na tarefa ativa. `LIVRE` significa “disponível para ser reservado”, não “seguro para editar sem aviso”.

| Zona | Arquivos/Diretórios | Owner Primário |
|:---|:---|:---|
| Sistema de Batalha | `client/src/screens/battle/*` | Antigravity |
| BattleRoom Backend | `server/src/rooms/BattleRoom.ts` | Antigravity |
| GameRoom Backend | `server/src/rooms/GameRoom.ts` | LIVRE |
| Canvas/Overworld | `client/src/game/*` | LIVRE |
| Lobby Tabs | `client/src/screens/lobby/*` | LIVRE |
| Menu Tabs | `client/src/screens/menu/*` | LIVRE |
| DB Schema | `server/src/db/schema.ts` | LIVRE (coordenar migrações) |
| Routes Backend | `server/src/routes/*` | LIVRE |
| Types/Interfaces | `client/src/types/*` | LIVRE |
| Estilos CSS | `client/src/screens/styles/*` | LIVRE |
| Assets | `client/public/assets/*` | LIVRE |
| App.tsx (orquestrador) | `client/src/App.tsx` | Antigravity |
| Login Screen | `client/src/screens/LoginScreen.tsx` | LIVRE |

> **LIVRE** = Qualquer IA pode reservar a área, mas deve registrar o assignment antes de começar.

---

## 🔒 Ciclo de Vida de um Assignment

Cada assignment deve registrar, no mínimo:

- **ID curto e único:** exemplo `GAME-014`.
- **Owner:** `Antigravity`, `Codex` ou `Wall`.
- **Status:** `PENDENTE`, `EM ANDAMENTO`, `BLOQUEADO`, `EM REVISÃO` ou `CONCLUÍDO`.
- **Branch/worktree:** onde a mudança vive.
- **Arquivos reservados:** caminhos ou globs específicos; evitar reservar diretórios inteiros sem necessidade.
- **Dependências:** outro assignment, decisão de design ou recurso externo.
- **Validação esperada:** typecheck, build, teste automatizado ou roteiro manual.

### Claim

1. Sincronizar a visão do remoto com `git fetch origin`.
2. Confirmar que nenhum assignment ativo reserva os mesmos arquivos ou contratos.
3. Alterar a tarefa para `EM ANDAMENTO`, preencher owner, branch e arquivos.
4. Só então iniciar alterações funcionais.

### Handoff / conclusão

Ao entregar, registrar no log:

- resumo do comportamento alterado;
- arquivos criados, modificados ou removidos;
- migrations/contratos/API afetados;
- comandos de validação e resultados;
- testes manuais ainda necessários;
- riscos, mocks/fallbacks mantidos e próximos passos;
- branch e hash do commit, se houver.

Assignments `BLOQUEADOS` devem dizer **por quê** e **o que desbloqueia**. Uma tarefa só vira `CONCLUÍDA` quando código e documentação de handoff refletem o estado real.

---

## 🔄 Modos de Trabalho e Branches

### Modo A — sessão exclusiva/intercalada

Pode usar a pasta `D:\MEGACOLISEUM`, desde que a árvore esteja limpa, nenhuma outra IA esteja ativa nela e o assignment esteja registrado. Mesmo nesse modo, uma branch curta de tarefa é preferível a mudanças diretas em `main`.

### Modo B — trabalho simultâneo

Cada IA usa uma pasta/worktree própria. A pasta principal fica reservada para integração:

```
D:\MEGACOLISEUM                         # integração / main
D:\MEGACOLISEUM-WORKTREES\antigravity  # antigravity/<task-id>-<slug>
D:\MEGACOLISEUM-WORKTREES\codex        # codex/<task-id>-<slug>
```

Exemplo de criação a partir da pasta de integração:

```bash
git fetch origin
git worktree add D:\MEGACOLISEUM-WORKTREES\codex -b codex/GAME-014-save-select origin/main
```

Antes da integração, atualizar a branch da tarefa com `origin/main`, resolver conflitos dentro do worktree da própria IA, executar as validações e apresentar o diff para revisão. Nunca trocar a branch da pasta de outra IA.

### Hotspots e contratos

Mudanças nestes itens exigem coordenação explícita, mesmo quando arquivos diferentes são editados:

- `server/src/db/schema.ts` + `server/drizzle/*`;
- schemas Colyseus + consumidores client-side;
- rotas REST + hooks/types que consomem seus payloads;
- `client/src/App.tsx` e transições entre telas;
- `package.json` + `package-lock.json`;
- constantes de progressão, fórmulas de combate e dados persistidos.

Uma migração Drizzle deve ser gerada **depois** de atualizar a branch com `origin/main`, para evitar números/snapshots concorrentes. Não regenerar ou apagar migração criada por outra tarefa sem coordenação.

---

## 📝 Log de Atividades

### Formato
```
[DATA] [IA] [TASK-ID] [AÇÃO] Descrição breve
  - Arquivos modificados: lista
  - Validação: comandos/roteiro + resultado
  - Handoff: riscos, mocks, pendências, branch/commit
  - Status: CONCLUÍDO | EM ANDAMENTO | BLOQUEADO | EM REVISÃO
```

### Histórico

```
[2026-07-10] [Antigravity] [REFACTOR] Modularizar BattleScreen.tsx (103KB → 8 módulos)
  - Arquivos criados: client/src/screens/battle/* (7 novos arquivos)
  - Arquivos modificados: client/src/screens/BattleScreen.tsx (reduzido a re-export)
  - Status: DONE

[2026-07-10] [Antigravity] [FEAT] Criar sistema de Companions no DB
  - Arquivos criados: server/src/routes/companions.ts, server/src/constants/growth.ts
  - Arquivos modificados: server/src/db/schema.ts, server/src/routes/auth.ts, server/src/index.ts
  - Migrações: 0002_superb_king_cobra.sql
  - Status: DONE

[2026-07-10] [Antigravity] [FIX] Bugs críticos de backend
  - Arquivos modificados: server/src/rooms/GameRoom.ts, server/src/rooms/BattleRoom.ts, server/src/routes/friends.ts
  - Status: DONE

[2026-07-11] [Antigravity] [FEAT] Conectar BattleRoom ao DB de companions
  - Arquivos modificados: server/src/rooms/BattleRoom.ts (choose_lineup agora consulta DB)
  - Status: DONE

[2026-07-11] [Antigravity] [FEAT] Integrar companions no hook do Lobby
  - Arquivos modificados: client/src/screens/lobby/useLobbyData.ts
  - Status: DONE

[2026-07-12] [Antigravity] [FEAT] Sistema de armas com evolução infinita
  - Arquivos modificados: server/src/db/schema.ts (level/xp no inventory), server/src/rooms/BattleRoom.ts, server/src/routes/inventory.ts, client/src/screens/lobby/InventoryTab.tsx
  - Migrações: 0003_first_selene.sql
  - Status: DONE

[2026-07-12] [Codex] [DOCS-001] [AUDIT] Auditar onboarding, build, fluxo inicial e protocolo multi-IA
  - Arquivos modificados: AI_SYNC.md, PROJECT_ROADMAP.md
  - Validação: npm run lint (PASS), npm run build (PASS com aviso de chunk de 886,74 kB), smoke test local de cadastro/lobby/mundo
  - Handoff: encontrados proxy ausente para /companions, callbacks de presença incompatíveis com Colyseus 0.17, HUD do mundo ainda hardcoded e ausência de testes automatizados
  - Status: CONCLUÍDO

[2026-07-12] [Codex] [OPS-001] [OPS] Estruturar base operacional dos agentes
  - Comportamento alterado: regras da raiz, claim/handoff padronizados e preflight seguro antes de cada sessão
  - Arquivos criados: AGENTS.md, .ai/README.md, .ai/TASK_TEMPLATE.md, .ai/HANDOFF_TEMPLATE.md, .ai/preflight.ps1
  - Arquivos modificados: AI_SYNC.md
  - Contratos, APIs ou migrations: nenhum contrato de runtime alterado
  - Validação automatizada: .ai/preflight.ps1 -Fetch (PASS), git diff --check (PASS)
  - Teste manual: preflight confirmou branch, árvore alterada, divergência 0/0 e somente OPS-001 como assignment ativo
  - Não testado: duas sessões simultâneas; worktrees serão criados quando existirem assignments paralelos reais
  - Riscos, mocks e fallbacks mantidos: nenhuma mudança em gameplay, persistência ou fallbacks
  - Próximos passos: todo agente deve ler AGENTS.md e registrar claim/handoff no AI_SYNC.md
  - Branch/commit: codex/ops-001-agent-foundation; commit será criado após este registro
  - Status: CONCLUÍDO

[2026-07-12] [Codex] [DOCS-002] [DESIGN] Consolidar visão macro, batalha e exploração 3D
  - Comportamento alterado: visão canônica separa mundo persistente, campanha instanciada do Mestre, coleção/progressão, exploração 3D e batalha Preparação/Resolução
  - Arquivos criados: GAME_DESIGN.md
  - Arquivos modificados: PROJECT_ROADMAP.md, AGENTS.md, .ai/preflight.ps1, AI_SYNC.md
  - Contratos, APIs ou migrations: nenhum runtime alterado; documentado alvo futuro de 3 titulares, até 6 ativos e grade 3×3 por lado
  - Validação automatizada: .ai/preflight.ps1 (PASS), git diff --check (PASS), busca de contradições 2D/3v3 (PASS)
  - Teste manual: imagem batalha.png inspecionada em resolução original e confrontada com timer, PA, posições, confirmação, ordem e log de ações
  - Não testado: exploração 3D e nova batalha ainda não foram implementadas
  - Riscos, mocks e fallbacks mantidos: PixiJS e BattleRoom 3v3 continuam sendo a implementação atual; nenhuma dependência R3F foi instalada
  - Próximos passos: aprofundar contrato de PA/convocação, cooperação, grid, timeout e desconexão antes da implementação
  - Branch/commit: codex/docs-002-macro-game-design; commit será criado após este registro
  - Status: CONCLUÍDO

[2026-07-12] [Codex] [DOCS-003] [DESIGN] Consolidar Mana universal, ocupação 3×3, cooperativo e modos iniciais
  - Comportamento alterado: PA removido do design-alvo; Mana passa a reger ações, habilidades e substituições em PvE, PvP, cooperativo e Brawl
  - Arquivos modificados: GAME_DESIGN.md, PROJECT_ROADMAP.md, AI_SYNC.md
  - Contratos, APIs ou migrations: nenhum runtime alterado; documentados máximo de 3 heróis por jogador, entidades auxiliares nas casas vagas, prioridade/perfuração, herói individual no coop e WO competitivo
  - Validação automatizada: .ai/preflight.ps1 (PASS), git diff --check (PASS), busca por termos contraditórios PA/6 ativos (PASS)
  - Teste manual: decisões de Wall confrontadas com os fluxos de Mundo RPG, Duelo, Brawl e campanha cooperativa
  - Não testado: regras ainda não implementadas; curva numérica de Mana, grid cooperativo, antistall, matchmaking e punições permanecem abertas
  - Riscos, mocks e fallbacks mantidos: BattleRoom atual continua 3v3 simples; nenhuma alteração de código ou dependência
  - Próximos passos: definir números da Mana e topologia do tabuleiro cooperativo antes de escrever o novo schema de batalha
  - Branch/commit: codex/docs-003-mana-modes-battle-contract; commit será criado após este registro
  - Status: CONCLUÍDO

[2026-07-12] [Codex] [GAME-003] [FEAT] Implementar equipes 1–3, grade compartilhada e Mana autoritativa
  - Comportamento alterado: encontros de parties com até 3 jogadores abrem batalha cooperativa; cada jogador controla 1 herói numa grade 3×3 comum, sem colisão de casas, e a Resolução aguarda todos confirmarem ou o timer de 30s
  - PvP: desafios entre parties de mesmo tamanho agora abrem salas 2×2 ou 3×3; o duelo individual continua 1×1 e as equipes são preservadas por account ID independentemente da ordem de entrada
  - Mana: curva v1 de 1 a 10 renovada por turno; ataque/defesa 0, reposicionamento 1, item 2, substituição 3 e habilidades com custos próprios; o servidor valida orçamento e propriedade das ações
  - Arquivos criados: server/src/battle/teamBattle.ts, server/src/battle/teamBattle.test.ts
  - Arquivos modificados: server/src/rooms/BattleRoom.ts, server/src/rooms/GameRoom.ts, server/src/schemas/BattleState.ts, server/package.json, client/src/screens/battle/BattleHUD.tsx, BattleScreen.tsx, ConfrontationPrep.tsx, PlanningPhase.tsx, battleTypes.ts, useBattleData.ts, GAME_DESIGN.md, PROJECT_ROADMAP.md, AI_SYNC.md
  - Contratos: BattleState ganhou mode, expectedPlayers, maxTeamSize, planningDeadline, winnerTeamId, teamId/owner/gridSlot/entityType e Mana por jogador; mensagens lineup_rejected e plan_rejected informam falhas ao cliente
  - Validação automatizada: npm run test:battle --workspace=server (5/5 PASS), npm run lint (PASS), npm run build (PASS), git diff --check (PASS)
  - Teste manual: cadastro persistido, lobby e mundo carregaram com servidor Colyseus em fallback in-memory; grade e comandos foram inspecionados no navegador
  - Não testado: batalha cooperativa visual com 2–3 navegadores reais e banco PostgreSQL; o atalho B do mundo ainda é placeholder e o encontro visual depende de colisão com monstro
  - Limites mantidos: herói favorito ainda não é persistido e o lobby usa PREP_ROSTER temporário (GAME-002/BUG-001); substituição, entidades auxiliares, perfuração completa, reconexão e PvPvE seguem pendentes; Brawl possui somente o contrato de configuração, não o loop de oito jogadores
  - Branch/commit: codex/game-003-shared-team-battle; este registro integra o commit de handoff da tarefa
  - Status: CONCLUÍDO

[2026-07-12] [Codex] [GAME-004] [FEAT] Entregar caminho dourado da conta zero até a Preparação PvE
  - Comportamento alterado: conta zero/zero pronta no desenvolvimento, lobby e perfil reais, navegação livre lobby↔mundo, menu Esc com retorno, NPC Instrutor Kael, pergunta de confirmação, sala PvE, roster real de 5, seleção de 3, transição e Fase de Preparação
  - Input: mundo aceita WASD/setas, click-to-move, joystick virtual e Gamepad API; NPC aceita Enter/E/click/A; lobby aceita mouse, 1–5, Q/E, Espaço, Enter e controle físico
  - Persistência: server/src/testing/zeroAccount.ts cria/repara conta, personagem e 5 companions no PostgreSQL; no fallback offline, IDs/credenciais/roster são determinísticos, mas progressão entre reinicializações não é durável
  - Contratos: BattleRoomOptions/BattleState ganharam rosterSize e encounterName; startTestBattle cria encontro solo de treinamento; cliente usa /companions em vez de PREP_ROSTER fixo
  - Correções integradas: proxy /companions, Callbacks.get(room), conexão duplicada causada por StrictMode em salas maxClients=1, logs reais da sala e transição que reiniciava a cada atualização do timer
  - Arquivos criados: server/src/testing/zeroAccount.ts
  - Arquivos modificados: server/src/index.ts, routes/auth.ts, routes/companions.ts, rooms/GameRoom.ts, rooms/BattleRoom.ts, schemas/BattleState.ts, battle/teamBattle.ts + teste; client main/App, LoginScreen, LobbyScreen, GameCanvas, BattleTransition, GameMenu, lobby/useLobbyData, batalha e vite.config.ts; GAME_DESIGN.md, PROJECT_ROADMAP.md, AI_SYNC.md
  - Validação automatizada: npm run test:battle --workspace=server (6/6 PASS), npm run lint (PASS), npm run build (PASS; aviso de chunk principal 905,50 kB), git diff --check (PASS)
  - Playtest completo: login zero → Perfil → mundo → movimento por teclado → NPC → diálogo/pergunta → aceitar → cinco heróis reais → teclas 1/2/3 → Enter → transição limpa → Preparação com Mana 1/1 e logs autoritativos; menu Esc → Voltar ao Lobby também validado
  - Não testado: joystick físico real não estava conectado (integração Gamepad API validada por código); PostgreSQL estava indisponível, portanto o seed durável foi compilado mas o playtest usou fallback determinístico
  - Riscos/mocks mantidos: quest/horário/inventário rápido e partes do menu ainda são visuais; battle results/recrutamento ainda contêm textos hardcoded; HMR durante uma BattleRoom ativa pode exigir voltar ao mapa porque a sala solo só aceita um cliente
  - Branch/commit: codex/game-004-zero-pve-golden-path; este registro integra o commit de handoff
  - Status: CONCLUÍDO
```

---

## 🎯 Assignments Atuais

| ID | Tarefa | Owner | Status | Branch/worktree | Arquivos reservados | Validação / dependência |
|:---|:---|:---|:---|:---|:---|:---|
| DOCS-001 | Auditar projeto e fortalecer protocolo multi-IA | Codex | ✅ Concluído | `main` (sessão exclusiva anterior ao protocolo 2.0) | `AI_SYNC.md`, `PROJECT_ROADMAP.md` | lint + build + smoke test: concluídos |
| OPS-001 | Estruturar base operacional dos agentes | Codex | ✅ Concluído | `codex/ops-001-agent-foundation` | `AGENTS.md`, `.ai/*`, `AI_SYNC.md` | Preflight + `git diff --check`: concluídos |
| DOCS-002 | Consolidar visão macro, fluxo de batalha e decisão de exploração 3D | Codex | ✅ Concluído | `codex/docs-002-macro-game-design` | `GAME_DESIGN.md`, `PROJECT_ROADMAP.md`, `AGENTS.md`, `.ai/preflight.ps1`, `AI_SYNC.md` | Visão, imagem e compatibilidade R3F/React validadas |
| DOCS-003 | Consolidar Mana universal, ocupação 3×3, coop e modos iniciais | Codex | ✅ Concluído | `codex/docs-003-mana-modes-battle-contract` | `GAME_DESIGN.md`, `PROJECT_ROADMAP.md`, `AI_SYNC.md` | Mana, modos, ocupação e termos contraditórios validados |
| GAME-003 | Implementar equipes 1–3, grade compartilhada e confirmação simultânea | Codex | ✅ Concluído | `codex/game-003-shared-team-battle` | `server/src/rooms/BattleRoom.ts`, `server/src/rooms/GameRoom.ts`, `server/src/schemas/BattleState.ts`, `server/src/battle/*`, `server/package.json`, `client/src/screens/battle/*`, `GAME_DESIGN.md`, `PROJECT_ROADMAP.md`, `AI_SYNC.md` | 5 testes + lint + build + smoke mundo: concluídos |
| GAME-004 | Criar caminho dourado da conta zero até batalha PvE | Codex | ✅ Concluído | `codex/game-004-zero-pve-golden-path` | `server/src/index.ts`, `server/src/routes/{auth,companions}.ts`, `server/src/rooms/{GameRoom,BattleRoom}.ts`, `server/src/schemas/*`, `server/src/testing/*`, `server/src/battle/*`, `client/src/{main,App}.tsx`, `client/vite.config.ts`, `client/src/game/*`, `client/src/screens/{LoginScreen,LobbyScreen}.tsx`, `client/src/screens/{lobby,battle,menu}/*`, docs | 6 testes + lint + build + playtest completo: concluídos |
| SEC-001 | Exigir `GM_SECRET` seguro e remover fallback em produção | NÃO ATRIBUÍDO | ⏳ Pendente | — | `server/src/rooms/GameRoom.ts`, `.env.example` | Testar dev + falha segura em produção |
| BUG-001 | Corrigir proxy dev de `/companions` | Codex / GAME-004 | ✅ Concluído | `codex/game-004-zero-pve-golden-path` | `client/vite.config.ts` | Roster autenticado de 5 heróis carregado no playtest |
| BUG-002 | Migrar callbacks de presença para API Colyseus 0.17 | Codex / GAME-004 | ✅ Concluído | `codex/game-004-zero-pve-golden-path` | `client/src/screens/lobby/useLobbyData.ts`, `client/src/game/GameCanvas.tsx` | Lobby e mundo validados com Callbacks.get(room) |
| GAME-001 | Refatorar GameCanvas.tsx | NÃO ATRIBUÍDO | ⏳ Pendente | — | `client/src/game/*` | Depende de separar mocks do estado real |
| GAME-002 | Conectar PREP_ROSTER ao `/companions` | Codex / GAME-004 | ✅ Concluído | `codex/game-004-zero-pve-golden-path` | `client/src/screens/battle/battleTypes.ts`, `ConfrontationPrep.tsx`, `useBattleData.ts` | Cinco companions reais exibidos e usados pelo servidor |
| UI-001 | Criar Tela de Save Select | NÃO ATRIBUÍDO | ⏳ Pendente | — | `client/src/screens/SaveSelectScreen.tsx` (novo), `client/src/App.tsx` | Aprovação do fluxo de saves |
| INV-001 | Sistema de equipar/desequipar | NÃO ATRIBUÍDO | ⏳ Pendente | — | `server/src/routes/inventory.ts`, lobby tabs | Definir contrato + fallback |
| QUEST-001 | Quest system no DB | NÃO ATRIBUÍDO | ⏳ Pendente | — | `server/src/routes/quests.ts` (novo), schema, migrations | Lock de schema/migração obrigatório |
| UI-002 | Tabs stub (Battles, Quests) | NÃO ATRIBUÍDO | ⏳ Pendente | — | `client/src/screens/lobby/BattlesTab.tsx`, `QuestsTab.tsx` | Depende dos contratos REST |

---

## 🧪 Comandos de Verificação

Antes de qualquer handoff de código, rodar a partir da raiz:

```bash
# Typecheck dos dois workspaces
npm run lint

# Build de produção dos dois workspaces
npm run build

# Testes unitários do contrato de batalha
npm run test:battle --workspace=server

# Somente quando o assignment inclui schema/migração
npm run db:generate --workspace=server
```

Existe uma suíte unitária inicial para o contrato de equipes, grade e Mana em `server/src/battle/teamBattle.test.ts`. Ela não substitui testes de integração Colyseus nem o roteiro manual curto e reproduzível (login/cadastro, lobby, mundo, batalha ou tela afetada). Erros e warnings do console do navegador fazem parte do resultado.

---

## 💡 Notas para o Codex

1. **O servidor inicia sem banco de dados real.** Quando `db === null`, auth e várias rotas usam fallback in-memory/mock. Isso não garante paridade completa: todo fluxo afetado deve ser testado explicitamente nos dois modos quando possível.
2. **ESM no server:** Todo import relativo no server DEVE ter extensão `.js` (mesmo sendo arquivos `.ts`). Ex: `import { db } from '../db/index.js'`.
3. **TailwindCSS:** O client usa Tailwind. Não instalar outras libs CSS sem consultar o usuário.
4. **Estética JRPG:** A identidade visual é medieval/dimensional com tons de preto, índigo e dourado. Consulte a seção 7 do `PROJECT_ROADMAP.md` para as diretrizes de design.
5. **Colyseus:** O multiplayer usa Colyseus 0.17 (não Socket.io). As salas ficam em `server/src/rooms/` e os schemas em `server/src/schemas/`. No client 0.17, callbacks de estado devem usar a API `Callbacks.get(room)`; não reintroduzir o padrão legado de atribuir `onAdd` diretamente ao `MapSchema`.
6. **Dados reais versus apresentação:** Telas ainda contêm valores e coleções de mockup. Toda alteração deve dizer claramente se usa DB, fallback in-memory ou mock visual, evitando marcar integração como completa apenas porque a tela renderiza.
