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

---

<!-- NOVAS ENTRADAS DEVEM SER ADICIONADAS ACIMA DESTA LINHA -->
