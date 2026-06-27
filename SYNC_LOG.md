# 🔄 SYNC_LOG — Registro de Sincronização entre Máquinas

> **Este arquivo é o canal de comunicação entre os ambientes de desenvolvimento.**  
> Antes de iniciar qualquer trabalho, peça ao seu assistente: _"se atualize pelo SYNC_LOG"_

---

## Como Usar

1. **Antes de começar**: `git pull` + leia as entradas abaixo
2. **Ao instalar algo novo**: registre aqui com data, o que foi instalado, e os comandos
3. **Ao fazer alterações significativas**: documente resumidamente

---

## 📋 Registro de Alterações

### 2026-06-26 — Setup Inicial (Casa - D:\MEGACOLISEUM)

**Ação:** Repositório clonado do GitHub para `D:\MEGACOLISEUM`

**Dependências globais necessárias:**
- Node.js (v18+)
- npm (v9+)
- Git

**Para configurar em uma nova máquina:**
```bash
git clone https://github.com/Wall-AR/wall-rpg <pasta-destino>
cd <pasta-destino>
npm install
cp .env.example .env
# Editar .env com as variáveis corretas
```

**Para rodar:**
```bash
npm run dev          # Inicia client (porta 3000) + server (porta 3001)
npm run dev:client   # Apenas frontend
npm run dev:server   # Apenas backend
```

**Status:** Projeto na Fase 1 (Setup). Fundação pronta, gameplay ainda não implementado.

### 2026-06-26 — Migração para Colyseus, PixiJS e Drizzle (Casa - D:\MEGACOLISEUM)

**Ações:**
- Migração completa de `socket.io` para `Colyseus` no servidor e `colyseus.js` no client.
- Substituição do Canvas 2D manual pelo `PixiJS` + `@pixi/react` no cliente para renderização 2D.
- Configuração do `drizzle-orm` e `drizzle-kit` no servidor e no root com banco de dados PostgreSQL.
- Estruturação de diretórios (`rooms`, `schemas`, `db` no servidor; `game`, `components`, `screens` no cliente).
- Geração da primeira migration do banco de dados (`server/drizzle/0000_lean_black_knight.sql`).

**Novas Dependências Instaladas:**
- **Server:** `colyseus`, `@colyseus/ws-transport`, `@colyseus/monitor`, `bcryptjs`, `pg`, `drizzle-orm`, `dotenv`, `express`, `cors`, `jsonwebtoken`.
- **Server Dev:** `drizzle-kit`, `@types/bcryptjs`, `@types/pg`.
- **Client:** `colyseus.js`, `pixi.js`, `@pixi/react@7`, `pixi-tiledmap`, `howler`, `easystarjs`.
- **Client Dev:** `@types/howler`.
- **Root Dev:** `drizzle-kit`, `drizzle-orm`.

**Como Atualizar em Outras Máquinas:**
```bash
git pull
npm install --legacy-peer-deps
# Gerar migrations locais (se necessário)
npm run db:generate --workspace=server
# Rodar migrations (requer banco PostgreSQL rodando configurado no .env)
npm run db:migrate --workspace=server
```

### 2026-06-26 — Fase 2: Autenticação, Lobby de Abas e Presença (Casa - D:\MEGACOLISEUM)

**Ações:**
- Implementação das rotas REST de autenticação (`POST /auth/register` e `POST /auth/login`) no backend com criptografia de senha (`bcryptjs`) e geração de tokens JWT.
- Criação automática de personagem com atributos iniciais padrão ao registrar uma nova conta.
- Implementação de um endpoint `/character/me` autenticado com JWT para recuperação dos atributos do personagem.
- Suporte a fallback em memória no backend caso o banco de dados PostgreSQL esteja offline, permitindo desenvolvimento in-memory sem travar.
- Atualização do proxy do cliente Vite para espelhar rotas `/character` para o backend na porta 3001.
- Criação dos componentes de interface do cliente:
  - `LoginScreen.tsx`: Tela de formulário de login/registro estilizada com tratamento de erros.
  - `LobbyScreen.tsx`: Interface completa do lobby com navegação em abas (Início, Perfil, Inventário, Amigos, Batalhas, Missões, Ajustes) com sincronização em tempo real da contagem de jogadores online via salas Colyseus.
  - Integração do Zustand para persistência e armazenamento das credenciais do usuário.

**Como Atualizar em Outras Máquinas:**
```bash
git pull
npm install --legacy-peer-deps
```

### 2026-06-26 — Fase 3: Renderização do Mapa, Movimentação e Câmera (Casa - D:\MEGACOLISEUM)

**Ações:**
- Criação de um gerador programático de texturas retro pixel-art (`textures.ts`) usando HTML5 Canvas no frontend para evitar dependência de arquivos físicos estáticos (Grama, Pedra, Tijolo, Portal, Animação de Jogadores em 4 direções e Monstros).
- Definição estruturada de mapa do lobby (`map.ts`) em matriz binária com dimensões de 24x16, definindo zonas de colisão e check de caminhabilidade (`isWalkable`).
- Refatoração do `GameCanvas.tsx` para inicialização imperativa da `Application` do PixiJS (v8), eliminando erros de compilação de JSX de React-Pixi.
- Implementação de movimentação grid-based clássica em 4 direções (com suavização de movimento por interpolação de ticks).
- Implementação de câmera dinâmica que segue o jogador centralizado e se prende aos limites do mapa.
- Sincronização de movimento em tempo real com o Colyseus, enviando mensagens `"move"` ao servidor e renderizando os outros jogadores ativos no mapa com suas posições corretas e tags de nomes correspondentes.
- Verificação de compilação do cliente com TypeScript (`tsc`) e build de produção para PWA realizadas com 100% de sucesso.

**Como Atualizar em Outras Máquinas:**
```bash
git pull
npm run build --workspace=client
```

---

<!-- NOVAS ENTRADAS DEVEM SER ADICIONADAS ACIMA DESTA LINHA -->
