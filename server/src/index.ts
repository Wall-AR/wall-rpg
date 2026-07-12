import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize dotenv first
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { monitor } from '@colyseus/monitor';

import { GameRoom } from './rooms/GameRoom.js';
import { BattleRoom } from './rooms/BattleRoom.js';
import authRouter from './routes/auth.js';
import characterRouter from './routes/character.js';
import friendsRouter from './routes/friends.js';
import inventoryRouter from './routes/inventory.js';
import companionsRouter from './routes/companions.js';
import { ensureZeroTestAccount } from './testing/zeroAccount.js';

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
app.use('/companions', companionsRouter);

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

// Register basic auth protection for Colyseus monitor
const colyseusMonitorAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Colyseus Monitor"');
    res.sendStatus(401);
    return;
  }

  try {
    const credentials = Buffer.from(authHeader.split(' ')[1] || '', 'base64').toString().split(':');
    const user = credentials[0];
    const pass = credentials[1];

    const expectedUser = process.env.COLYSEUS_MONITOR_USER || 'admin';
    const expectedPass = process.env.COLYSEUS_MONITOR_PASS;

    if (!expectedPass && process.env.NODE_ENV === 'production') {
      res.status(403).send("Monitor disabled: password not configured in production");
      return;
    }

    const checkPass = expectedPass || 'admin-pass';

    if (user === expectedUser && pass === checkPass) {
      next();
    } else {
      res.setHeader('WWW-Authenticate', 'Basic realm="Colyseus Monitor"');
      res.sendStatus(401);
    }
  } catch (_) {
    res.sendStatus(400);
  }
};

// Register Colyseus monitor panel route protected by basic auth
app.use("/colyseus", colyseusMonitorAuth, monitor());

// Serve static client assets in production

if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Start Server via Colyseus to bind matchmaking routes
await ensureZeroTestAccount();

gameServer.listen(port).then(() => {
  console.log(`[server] Colyseus game server running on port ${port}`);
}).catch((err) => {
  console.error("❌ Failed to start Colyseus server:", err);
});
