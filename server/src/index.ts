import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { monitor } from '@colyseus/monitor';
import path from 'path';
import { fileURLToPath } from 'url';

import { GameRoom } from './rooms/GameRoom.js';
import { BattleRoom } from './rooms/BattleRoom.js';
import authRouter from './routes/auth.js';
import characterRouter from './routes/character.js';
import friendsRouter from './routes/friends.js';
import inventoryRouter from './routes/inventory.js';

dotenv.config();

const port = Number(process.env.PORT || 3001);
const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use('/auth', authRouter);
app.use('/character', characterRouter);
app.use('/friends', friendsRouter);
app.use('/inventory', inventoryRouter);

// Maintain /health route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const httpServer = createServer(app);

// Initialize Colyseus Server using WebSockets
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: httpServer,
  }),
});

// Register Rooms
gameServer.define("game", GameRoom);
gameServer.define("battle", BattleRoom);

// Register Colyseus monitor panel route
app.use("/colyseus", monitor());

// Serve static client assets in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Start Server via Colyseus to bind matchmaking routes
gameServer.listen(port).then(() => {
  console.log(`[server] Colyseus game server running on port ${port}`);
}).catch((err) => {
  console.error("❌ Failed to start Colyseus server:", err);
});
