import React, { useEffect, useRef, useState } from 'react';
import { Application, Container, Sprite, Text, TextStyle, Graphics } from 'pixi.js';
import { useAuthStore } from '../stores/auth';
import { client } from './colyseus';
import { generateTextures } from './textures';
import { LOBBY_MAP, isWalkable } from './map';

export const GameCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { token } = useAuthStore();
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !containerRef.current) return;

    let app: Application | null = null;
    let room: any = null;
    let isDestroyed = false;
    let cleanupKeyboard: (() => void) | null = null;
    let animationFrameId: number;

    const initGame = async () => {
      try {
        // 1. Connect to Colyseus GameRoom
        const spawnX = 11 * LOBBY_MAP.tileSize;
        const spawnY = 8 * LOBBY_MAP.tileSize;
        
        room = await client.joinOrCreate("game", { 
          token,
          x: spawnX,
          y: spawnY
        });

        if (isDestroyed) {
          room.leave();
          return;
        }

        // 2. Initialize PixiJS Application (v8 syntax)
        app = new Application();
        await app.init({
          resizeTo: containerRef.current!,
          background: '#1a1a2e',
          antialias: false,
        });

        if (isDestroyed) {
          app.destroy(true, { children: true });
          room.leave();
          return;
        }

        // Append canvas element
        containerRef.current!.appendChild(app.canvas);
        setLoading(false);

        const textures = generateTextures();
        const tileSize = LOBBY_MAP.tileSize;

        // 3. Create Scene Container
        const mainContainer = new Container();
        app.stage.addChild(mainContainer);

        // 4. Render Map Background
        for (let y = 0; y < LOBBY_MAP.height; y++) {
          for (let x = 0; x < LOBBY_MAP.width; x++) {
            const tileType = LOBBY_MAP.grid[y][x];
            let texture = textures.grass;
            if (tileType === 1) texture = textures.stone;
            if (tileType === 2) texture = textures.brick;
            if (tileType === 3) texture = textures.portal;

            const tileSprite = new Sprite(texture);
            tileSprite.x = x * tileSize;
            tileSprite.y = y * tileSize;
            tileSprite.width = tileSize;
            tileSprite.height = tileSize;
            mainContainer.addChild(tileSprite);
          }
        }

        // 5. Create Local Player Sprite
        const localPlayerSprite = new Sprite(textures.playerDown);
        localPlayerSprite.anchor.set(0.5);
        localPlayerSprite.width = tileSize;
        localPlayerSprite.height = tileSize;
        mainContainer.addChild(localPlayerSprite);

        // Group container for other players
        const otherPlayersContainer = new Container();
        mainContainer.addChild(otherPlayersContainer);

        // Nameplate text style
        const textStyle = new TextStyle({
          fontFamily: 'Arial',
          fontSize: 10,
          fill: '#ffffff',
          align: 'center',
          stroke: { color: '#000000', width: 2 }
        });

        // Local player name tag
        const localNameText = new Text({ text: room.sessionId.substring(0, 5), style: textStyle });
        localNameText.anchor.set(0.5);
        mainContainer.addChild(localNameText);

        // Game state variables
        const state = {
          gridX: 11,
          gridY: 8,
          targetGridX: 11,
          targetGridY: 8,
          direction: 'down' as 'up' | 'down' | 'left' | 'right',
          moveProgress: 1,
          keys: {} as Record<string, boolean>,
        };

        // Keyboard listeners
        const handleKeyDown = (e: KeyboardEvent) => {
          state.keys[e.key.toLowerCase()] = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => {
          state.keys[e.key.toLowerCase()] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        cleanupKeyboard = () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
        };

        // Animation frame tick
        const tick = () => {
          if (isDestroyed || !app) return;

          const moveSpeed = 0.15;

          // 1. Position Interpolation
          if (state.moveProgress < 1) {
            state.moveProgress += moveSpeed;
            if (state.moveProgress >= 1) {
              state.moveProgress = 1;
              state.gridX = state.targetGridX;
              state.gridY = state.targetGridY;
            }
          }

          // 2. Poll Keys
          if (state.moveProgress === 1) {
            let dx = 0;
            let dy = 0;

            if (state.keys['arrowup'] || state.keys['w']) {
              dy = -1;
              state.direction = 'up';
            } else if (state.keys['arrowdown'] || state.keys['s']) {
              dy = 1;
              state.direction = 'down';
            } else if (state.keys['arrowleft'] || state.keys['a']) {
              dx = -1;
              state.direction = 'left';
            } else if (state.keys['arrowright'] || state.keys['d']) {
              dx = 1;
              state.direction = 'right';
            }

            if (dx !== 0 || dy !== 0) {
              const nextX = state.gridX + dx;
              const nextY = state.gridY + dy;

              if (isWalkable(nextX, nextY)) {
                state.targetGridX = nextX;
                state.targetGridY = nextY;
                state.moveProgress = 0;

                room.send('move', { x: nextX * tileSize, y: nextY * tileSize });
              }
            }
          }

          // 3. Update Textures
          if (state.direction === 'up') localPlayerSprite.texture = textures.playerUp;
          else if (state.direction === 'down') localPlayerSprite.texture = textures.playerDown;
          else if (state.direction === 'left') localPlayerSprite.texture = textures.playerLeft;
          else if (state.direction === 'right') localPlayerSprite.texture = textures.playerRight;

          // 4. Calculate Visual Positions
          const visualX = (state.gridX + (state.targetGridX - state.gridX) * state.moveProgress) * tileSize + tileSize / 2;
          const visualY = (state.gridY + (state.targetGridY - state.gridY) * state.moveProgress) * tileSize + tileSize / 2;

          localPlayerSprite.x = visualX;
          localPlayerSprite.y = visualY;

          localNameText.x = visualX;
          localNameText.y = visualY - 22;

          // 5. Camera Follow
          const screenWidth = app.screen.width;
          const screenHeight = app.screen.height;

          let targetCamX = screenWidth / 2 - visualX;
          let targetCamY = screenHeight / 2 - visualY;

          const minCamX = screenWidth - LOBBY_MAP.width * tileSize;
          const minCamY = screenHeight - LOBBY_MAP.height * tileSize;

          mainContainer.x = Math.max(minCamX, Math.min(0, targetCamX));
          mainContainer.y = Math.max(minCamY, Math.min(0, targetCamY));

          // 6. Draw Other Players
          otherPlayersContainer.removeChildren();

          room.state.players.forEach((player: any, sessionId: string) => {
            if (sessionId === room.sessionId) return;

            const otherSprite = new Sprite(textures.playerDown);
            otherSprite.anchor.set(0.5);
            otherSprite.x = player.x + tileSize / 2;
            otherSprite.y = player.y + tileSize / 2;
            otherSprite.width = tileSize;
            otherSprite.height = tileSize;
            otherPlayersContainer.addChild(otherSprite);

            const otherNameText = new Text({ text: player.username || sessionId.substring(0, 5), style: textStyle });
            otherNameText.anchor.set(0.5);
            otherNameText.x = player.x + tileSize / 2;
            otherNameText.y = player.y - 6;
            otherPlayersContainer.addChild(otherNameText);
          });

          animationFrameId = requestAnimationFrame(tick);
        };

        animationFrameId = requestAnimationFrame(tick);
      } catch (err: any) {
        console.error("Game canvas init error:", err);
        setConnectionError("Falha na inicialização do jogo.");
      }
    };

    initGame();

    return () => {
      isDestroyed = true;
      cancelAnimationFrame(animationFrameId);
      if (cleanupKeyboard) cleanupKeyboard();
      if (app) {
        app.destroy(true, { children: true });
      }
      if (room) {
        room.leave();
      }
    };
  }, [token]);

  if (connectionError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#1a1a2e] text-rose-400 p-6">
        <div className="text-center space-y-3">
          <span className="text-4xl">🔌</span>
          <p className="text-sm font-semibold">{connectionError}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] relative overflow-hidden bg-[#1a1a2e] flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e]/90 text-indigo-400 z-10">
          <div className="text-center space-y-3">
            <svg className="animate-spin h-8 w-8 mx-auto text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-xs text-gray-400">Entrando na arena de batalha...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
