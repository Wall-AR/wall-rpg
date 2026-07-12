# AI_SYNC — Protocolo de Sincronização entre IAs

> **Propósito:** Coordenar o trabalho simultâneo de duas IAs (Antigravity e Codex) no mesmo repositório sem conflitos.
> **Repositório:** https://github.com/Wall-AR/wall-rpg
> **Branch principal:** `main`

---

## 🤝 Regras de Ouro

1. **Nunca editar o mesmo arquivo ao mesmo tempo.** Antes de modificar um arquivo, verifique o log de assignments abaixo.
2. **Sempre fazer `git pull origin main` antes de começar qualquer sessão de trabalho.**
3. **Sempre fazer `git push origin main` ao terminar uma sessão de trabalho.**
4. **Atualizar este arquivo** (`AI_SYNC.md`) com o que foi feito e o que está sendo feito.
5. **Rodar `npx tsc --noEmit`** no client E no server antes de commitar para garantir zero erros.

---

## 📋 Zonas de Responsabilidade (File Ownership)

Para evitar conflitos, cada IA tem zonas primárias. Ambas podem ler qualquer arquivo, mas só devem **escrever** nas suas zonas designadas, a menos que a zona esteja marcada como `LIVRE`.

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

> **LIVRE** = Qualquer IA pode editar, mas deve registrar no log abaixo antes de começar.

---

## 🔄 Protocolo de Branches (Opcional)

Se ambas as IAs estiverem trabalhando simultaneamente em tarefas diferentes:

```
main (branch principal, sempre funcional)
  ├── antigravity/feature-name   (branch de trabalho do Antigravity)
  └── codex/feature-name         (branch de trabalho do Codex)
```

**Workflow:**
1. Criar branch: `git checkout -b antigravity/nome-da-feature`
2. Trabalhar e commitar na branch
3. Quando terminar: `git checkout main && git pull origin main && git merge antigravity/nome-da-feature`
4. Resolver conflitos se houver, rodar tsc, e push

**Se o usuário estiver intercalando (um de cada vez):** Podem ambos trabalhar direto em `main`, desde que façam pull antes de começar.

---

## 📝 Log de Atividades

### Formato
```
[DATA] [IA] [AÇÃO] Descrição breve
  - Arquivos modificados: lista
  - Status: DONE | IN PROGRESS | BLOCKED
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
```

---

## 🎯 Assignments Atuais

| Tarefa | Atribuída a | Status | Arquivos Envolvidos |
|:---|:---|:---|:---|
| Refatorar GameCanvas.tsx | NÃO ATRIBUÍDA | ⏳ Pendente | `client/src/game/*` |
| Conectar PREP_ROSTER ao /companions | NÃO ATRIBUÍDA | ⏳ Pendente | `client/src/screens/battle/battleTypes.ts`, `ConfrontationPrep.tsx` |
| Criar Tela de Save Select | NÃO ATRIBUÍDA | ⏳ Pendente | `client/src/screens/SaveSelectScreen.tsx` (novo), `client/src/App.tsx` |
| Sistema de equipar/desequipar | NÃO ATRIBUÍDA | ⏳ Pendente | `server/src/routes/inventory.ts`, lobby tabs |
| Quest system no DB | NÃO ATRIBUÍDA | ⏳ Pendente | `server/src/routes/quests.ts` (novo), schema |
| Tabs stub (Battles, Quests) | NÃO ATRIBUÍDA | ⏳ Pendente | `client/src/screens/lobby/BattlesTab.tsx`, `QuestsTab.tsx` |

---

## 🧪 Comandos de Verificação

Antes de qualquer commit, rodar:

```bash
# Verificar compilação do client
cd D:\MEGACOLISEUM\client && npx tsc --noEmit

# Verificar compilação do server
cd D:\MEGACOLISEUM\server && npx tsc --noEmit

# Gerar migração após alterar schema.ts
cd D:\MEGACOLISEUM\server && npx drizzle-kit generate
```

---

## 💡 Notas para o Codex

1. **O projeto roda sem banco de dados real.** O server faz fallback para mock data quando `db === null`. Não tente rodar migrações — elas serão aplicadas quando o Postgres estiver disponível.
2. **ESM no server:** Todo import relativo no server DEVE ter extensão `.js` (mesmo sendo arquivos `.ts`). Ex: `import { db } from '../db/index.js'`.
3. **TailwindCSS:** O client usa Tailwind. Não instalar outras libs CSS sem consultar o usuário.
4. **Estética JRPG:** A identidade visual é medieval/dimensional com tons de preto, índigo e dourado. Consulte a seção 7 do `PROJECT_ROADMAP.md` para as diretrizes de design.
5. **Colyseus:** O multiplayer usa Colyseus (não Socket.io). As salas são definidas em `server/src/rooms/` e os schemas de estado em `server/src/schemas/`.
