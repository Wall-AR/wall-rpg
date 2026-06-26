import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { monitor } from '@colyseus/monitor';

import { GameRoom } from './rooms/GameRoom.js';
import { BattleRoom } from './rooms/BattleRoom.js';

dotenv.config();

const port = Number(process.env.PORT || 3001);
const app = express();

app.use(cors());
app.use(express.json());

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

// Start Server
httpServer.listen(port, () => {
  console.log(`[server] Colyseus game server running on port ${port}`);
});
