import React, { useEffect, useRef, useState } from 'react';
import { Application, Container, Sprite, Text, TextStyle, Graphics } from 'pixi.js';
import { useAuthStore } from '../stores/auth';
import { client } from './colyseus';
import { generateTextures } from './textures';
import { LOBBY_MAP, isWalkable } from './map';
import * as EasyStar from 'easystarjs';

import { EncounterContext } from './BattleTransition';

export interface GameCanvasProps {
  onTriggerBattle: (roomId: string, context?: Partial<EncounterContext>) => void;
  menuOpen?: boolean;
  onToggleMenu?: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onTriggerBattle, menuOpen, onToggleMenu }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { token } = useAuthStore();
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [narrationText, setNarrationText] = useState<string | null>(null);
  const [activeQuest, setActiveQuest] = useState<any | null>(null);
  const [showPortalMenu, setShowPortalMenu] = useState(false);
  const roomRef = useRef<any>(null);
  const gameStateRef = useRef<any>(null);

  // NPC Dialog System
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialogOpenRef = useRef(false);
  const [dialogLines, setDialogLines] = useState<string[]>([]);
  const [dialogLineIndex, setDialogLineIndex] = useState(0);
  const [dialogDisplayed, setDialogDisplayed] = useState('');
  const dialogTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const npcStateRef = useRef<any>(null);

  // Typewriter effect for dialog
  useEffect(() => {
    if (!dialogOpen || dialogLines.length === 0) return;
    const fullText = dialogLines[dialogLineIndex] || '';
    let charIdx = 0;
    setDialogDisplayed('');
    dialogTimerRef.current = setInterval(() => {
      charIdx++;
      setDialogDisplayed(fullText.slice(0, charIdx));
      if (charIdx >= fullText.length) {
        if (dialogTimerRef.current) clearInterval(dialogTimerRef.current);
      }
    }, 30);
    return () => {
      if (dialogTimerRef.current) clearInterval(dialogTimerRef.current);
    };
  }, [dialogOpen, dialogLineIndex, dialogLines]);

  const advanceDialog = () => {
    const fullText = dialogLines[dialogLineIndex] || '';
    if (dialogDisplayed.length < fullText.length) {
      // Skip typewriter — show full text immediately
      if (dialogTimerRef.current) clearInterval(dialogTimerRef.current);
      setDialogDisplayed(fullText);
    } else if (dialogLineIndex < dialogLines.length - 1) {
      setDialogLineIndex(prev => prev + 1);
    } else {
      // Close dialog
      setDialogOpen(false);
      dialogOpenRef.current = false;
      setDialogLines([]);
      setDialogLineIndex(0);
      setDialogDisplayed('');
    }
  };

  const openNpcDialog = () => {
    if (dialogOpenRef.current) return;
    setDialogLines([
      'Bem-vindo ao Mega Coliseum, jovem guerreiro!',
      'Eu sou o Guia da Arena. Posso lhe ajudar a encontrar batalhas e missões.',
      'Use o Portal Mágico ao norte para viajar entre os mundos.',
      'Distribua seus pontos de atributo no Menu [ESC] para ficar mais forte!',
      'Boa sorte nas suas batalhas, aventureiro!'
    ]);
    setDialogLineIndex(0);
    setDialogDisplayed('');
    setDialogOpen(true);
    dialogOpenRef.current = true;
  };

  // Game Menu state from props
  const menuOpenRef = useRef(false);
  useEffect(() => {
    menuOpenRef.current = !!menuOpen;
    if (menuOpen && gameStateRef.current) {
      gameStateRef.current.keys = {};
    }
  }, [menuOpen]);

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
        const spawnX = 14 * LOBBY_MAP.tileSize;
        const spawnY = 10 * LOBBY_MAP.tileSize;
        
        room = await client.joinOrCreate("game", { 
          token,
          x: spawnX,
          y: spawnY
        });
        roomRef.current = room;

        // GM events listeners
        room.onMessage("narration", (data: { text: string }) => {
          setNarrationText(data.text);
        });

        room.onMessage("newQuest", (data: { id: string, name: string, description: string }) => {
          setActiveQuest(data);
        });

        // Listen to room startBattle redirect (com contexto de encontro)
        room.onMessage("startBattle", (data: { roomId: string; type?: string; enemyName?: string; enemyElement?: string }) => {
          onTriggerBattle(data.roomId, {
            type: (data.type as any) || 'wild',
            enemyName: data.enemyName || 'Inimigo',
            enemyElement: data.enemyElement,
          });
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

        const textures = await generateTextures();
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
            if (tileType === 4) texture = textures.flowers;
            if (tileType === 5) texture = textures.water;
            if (tileType === 6) texture = textures.woodFloor;
            if (tileType === 7) texture = textures.fence;

            const tileSprite = new Sprite(texture);
            tileSprite.x = x * tileSize;
            tileSprite.y = y * tileSize;
            tileSprite.width = tileSize;
            tileSprite.height = tileSize;
            mainContainer.addChild(tileSprite);
          }
        }

        // 5. Create Local Player Sprite
        const localPlayerSprite = new Sprite(textures.playerDown[0]);
        localPlayerSprite.anchor.set(0.5);
        localPlayerSprite.width = tileSize;
        localPlayerSprite.height = tileSize;
        mainContainer.addChild(localPlayerSprite);

        // Group container for other players
        const otherPlayersContainer = new Container();
        mainContainer.addChild(otherPlayersContainer);

        // Group container for monsters
        const monstersContainer = new Container();
        mainContainer.addChild(monstersContainer);

        // Sprite pools — cria uma vez, reutiliza a cada frame (evita GC thrashing)
        type SpritePoolEntry = { sprite: Sprite; nameText: Text };
        const playerSpritePool = new Map<string, SpritePoolEntry>();
        const monsterSpritePool = new Map<string, SpritePoolEntry>();

        // Initialize EasyStar.js pathfinding
        const easystar = new EasyStar.js();
        easystar.setGrid(LOBBY_MAP.grid);
        easystar.setAcceptableTiles([0, 1, 3, 4, 6]);

        // Group container for NPCs
        const npcsContainer = new Container();
        mainContainer.addChild(npcsContainer);

        // NPC State
        const npcState = {
          gridX: 14,
          gridY: 6,
          targetGridX: 14,
          targetGridY: 6,
          moveProgress: 1,
          path: [] as { x: number; y: number }[],
          lastPatrolTime: Date.now(),
        };
        npcStateRef.current = npcState;

        // Create NPC Sprite and Name Tag
        const npcSprite = new Sprite(textures.playerUp[0]);
        npcSprite.anchor.set(0.5);
        npcSprite.width = tileSize;
        npcSprite.height = tileSize;
        npcsContainer.addChild(npcSprite);

        const npcStyle = new TextStyle({
          fontFamily: 'Arial',
          fontSize: 9,
          fill: '#a78bfa',
          align: 'center',
          stroke: { color: '#000000', width: 2 }
        });
        const npcNameText = new Text({ text: 'Guia da Arena (NPC)', style: npcStyle });
        npcNameText.anchor.set(0.5);
        npcsContainer.addChild(npcNameText);

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
          gridX: 14,
          gridY: 10,
          targetGridX: 14,
          targetGridY: 10,
          direction: 'down' as 'up' | 'down' | 'left' | 'right',
          moveProgress: 1,
          keys: {} as Record<string, boolean>,
          animFrame: 0,
          animCounter: 0,
        };
        gameStateRef.current = state;

        // Keyboard listeners
        const handleKeyDown = (e: KeyboardEvent) => {
          // If dialog is open, Space/Enter/Escape advances it
          if (dialogOpenRef.current) {
            if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
              advanceDialog();
            }
            return;
          }
          // Space or Enter near NPC triggers dialog
          if (e.key === ' ' || e.key === 'Enter') {
            const ns = npcStateRef.current;
            if (ns) {
              const dx = Math.abs(state.gridX - ns.gridX);
              const dy = Math.abs(state.gridY - ns.gridY);
              if (dx + dy <= 1) {
                openNpcDialog();
                state.keys = {};
                return;
              }
            }
          }
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

          // 2. Portal Check
          if (state.moveProgress === 1 && !showPortalMenu) {
            const currentTileType = LOBBY_MAP.grid[state.gridY][state.gridX];
            if (currentTileType === 3) {
              setShowPortalMenu(true);
              state.keys = {};
            }
          }

          // 3. Poll Keys
          if (state.moveProgress === 1 && !showPortalMenu && !menuOpenRef.current && !dialogOpenRef.current) {
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

          // 3. Update Textures with Walk Animation
          const dirFrames = state.direction === 'up' ? textures.playerUp
            : state.direction === 'down' ? textures.playerDown
            : state.direction === 'left' ? textures.playerLeft
            : textures.playerRight;

          if (state.moveProgress < 1) {
            // Cycle animation frames while moving
            state.animCounter++;
            if (state.animCounter >= 6) { // Change frame every 6 ticks
              state.animCounter = 0;
              state.animFrame = (state.animFrame + 1) % dirFrames.length;
            }
            localPlayerSprite.texture = dirFrames[state.animFrame];
          } else {
            // Standing still — use idle frame (frame 0)
            state.animFrame = 0;
            state.animCounter = 0;
            localPlayerSprite.texture = dirFrames[0];
          }

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

          // 6. Draw Other Players (Sprite Pool — reutiliza sprites existentes)
          const activePlayerIds = new Set<string>();

          room.state.players.forEach((player: any, sessionId: string) => {
            if (sessionId === room.sessionId) return;
            activePlayerIds.add(sessionId);

            let entry = playerSpritePool.get(sessionId);
            if (!entry) {
              // Criar sprite apenas uma vez por jogador
              const sprite = new Sprite(textures.playerDown[0]);
              sprite.anchor.set(0.5);
              sprite.width = tileSize;
              sprite.height = tileSize;
              otherPlayersContainer.addChild(sprite);

              const nameText = new Text({ text: player.username || sessionId.substring(0, 5), style: textStyle });
              nameText.anchor.set(0.5);
              otherPlayersContainer.addChild(nameText);

              entry = { sprite, nameText };
              playerSpritePool.set(sessionId, entry);
            }

            // Atualizar posição (barato — sem alocação)
            entry.sprite.x = player.x + tileSize / 2;
            entry.sprite.y = player.y + tileSize / 2;
            entry.sprite.visible = true;
            entry.nameText.x = player.x + tileSize / 2;
            entry.nameText.y = player.y - 6;
            entry.nameText.visible = true;
          });

          // Esconder sprites de jogadores que saíram (sem destruir)
          playerSpritePool.forEach((entry, sessionId) => {
            if (!activePlayerIds.has(sessionId)) {
              entry.sprite.visible = false;
              entry.nameText.visible = false;
            }
          });

          // 7. Draw Monsters & Check Collision (Sprite Pool)
          const activeMonsterId = new Set<string>();

          if (room.state.monsters) {
            room.state.monsters.forEach((monster: any) => {
              if (!monster.active) {
                // Esconder monstro inativo
                const entry = monsterSpritePool.get(monster.id);
                if (entry) {
                  entry.sprite.visible = false;
                  entry.nameText.visible = false;
                }
                return;
              }
              activeMonsterId.add(monster.id);

              let entry = monsterSpritePool.get(monster.id);
              if (!entry) {
                // Criar sprite apenas uma vez por monstro
                const sprite = new Sprite(textures.monster);
                sprite.anchor.set(0.5);
                sprite.width = tileSize;
                sprite.height = tileSize;
                monstersContainer.addChild(sprite);

                const nameText = new Text({ text: monster.name, style: textStyle });
                nameText.anchor.set(0.5);
                monstersContainer.addChild(nameText);

                entry = { sprite, nameText };
                monsterSpritePool.set(monster.id, entry);
              }

              // Atualizar posição
              entry.sprite.x = monster.x + tileSize / 2;
              entry.sprite.y = monster.y + tileSize / 2;
              entry.sprite.visible = true;
              entry.nameText.x = monster.x + tileSize / 2;
              entry.nameText.y = monster.y - 6;
              entry.nameText.visible = true;

              // Collision check com jogador local (proximidade em vez de exato)
              const playerPixelX = state.gridX * tileSize;
              const playerPixelY = state.gridY * tileSize;
              const distX = Math.abs(monster.x - playerPixelX);
              const distY = Math.abs(monster.y - playerPixelY);
              if (distX <= tileSize / 2 && distY <= tileSize / 2 && state.moveProgress === 1) {
                console.log(`💥 Requesting battle trigger against ${monster.name}!`);
                room.send("triggerBattle", { monsterId: monster.id });
              }
            });
          }

          // 8. Update NPC Patrolling (Pathfinding)
          if (npcState.moveProgress < 1) {
            npcState.moveProgress += 0.05; // Make NPC move slower than player
            if (npcState.moveProgress >= 1) {
              npcState.moveProgress = 1;
              npcState.gridX = npcState.targetGridX;
              npcState.gridY = npcState.targetGridY;
            }
          }

          // If NPC is idle and has no path, periodically find a new path
          if (npcState.moveProgress === 1 && npcState.path.length === 0) {
            const now = Date.now();
            if (now - npcState.lastPatrolTime > 3000) {
              npcState.lastPatrolTime = now;
              // Choose a random walkable target cell in the village plaza
              let targetX = 4 + Math.floor(Math.random() * 22);
              let targetY = 4 + Math.floor(Math.random() * 15);

              if (isWalkable(targetX, targetY)) {
                easystar.findPath(npcState.gridX, npcState.gridY, targetX, targetY, (path) => {
                  if (path && path.length > 1) {
                    npcState.path = path.slice(1);
                  }
                });
                easystar.calculate();
              }
            }
          }

          // If NPC has a path, take the next step
          if (npcState.moveProgress === 1 && npcState.path.length > 0) {
            const nextNode = npcState.path.shift();
            if (nextNode) {
              npcState.targetGridX = nextNode.x;
              npcState.targetGridY = nextNode.y;
              npcState.moveProgress = 0;
            }
          }

          // Interpolate NPC visual position
          const npcVisualX = (npcState.gridX + (npcState.targetGridX - npcState.gridX) * npcState.moveProgress) * tileSize + tileSize / 2;
          const npcVisualY = (npcState.gridY + (npcState.targetGridY - npcState.gridY) * npcState.moveProgress) * tileSize + tileSize / 2;

          npcSprite.x = npcVisualX;
          npcSprite.y = npcVisualY;
          npcNameText.x = npcVisualX;
          npcNameText.y = npcVisualY - 22;

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
      {/* 💬 NPC DIALOG BOX (Retro RPG Style) */}
      {dialogOpen && (
        <div
          className="absolute bottom-0 inset-x-0 z-40 p-4 cursor-pointer select-none"
          onClick={advanceDialog}
        >
          <div className="bg-[#0a0a18] border-4 border-indigo-700 rounded-lg p-5 mx-auto max-w-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.7)] relative">
            {/* NPC Name Badge */}
            <div className="absolute -top-3 left-5 bg-indigo-800 px-3 py-0.5 rounded-sm border-2 border-indigo-600">
              <span className="text-[9px] font-extrabold text-indigo-200 uppercase tracking-widest font-mono">🗡️ Guia da Arena</span>
            </div>

            {/* Dialog Text with Typewriter */}
            <p className="text-indigo-100 text-sm font-mono leading-relaxed mt-1 min-h-[2.5rem]">
              {dialogDisplayed}
              <span className="animate-pulse text-indigo-400">▌</span>
            </p>

            {/* Advance Indicator */}
            <div className="text-right mt-2">
              <span className="text-[8px] text-indigo-500 font-mono font-bold uppercase tracking-wider animate-pulse">
                {dialogDisplayed.length >= (dialogLines[dialogLineIndex]?.length || 0)
                  ? (dialogLineIndex < dialogLines.length - 1 ? '▶ PRÓXIMO [ESPAÇO]' : '✖ FECHAR [ESPAÇO]')
                  : '▶▶ PULAR [ESPAÇO]'}
              </span>
            </div>

            {/* Page indicator */}
            <div className="absolute -bottom-2 right-5 bg-slate-900 px-2 py-0.5 rounded-sm border border-indigo-800">
              <span className="text-[8px] font-bold text-indigo-400 font-mono">{dialogLineIndex + 1}/{dialogLines.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Real-time GM Narration Overlay */}
      {narrationText && (
        <div className="absolute bottom-6 inset-x-6 bg-black/90 border border-yellow-500/80 rounded-2xl p-5 shadow-2xl z-30 font-sans flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-yellow-500 block">✦ Narração do Mestre ✦</span>
            <p className="text-yellow-100 text-sm leading-relaxed italic">"{narrationText}"</p>
          </div>
          <button
            onClick={() => setNarrationText(null)}
            className="px-4 py-1.5 bg-yellow-950/65 hover:bg-yellow-900 border border-yellow-800 text-yellow-300 text-xs font-bold rounded-lg transition-colors shrink-0"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Real-time GM Quest Overlay */}
      {activeQuest && (
        <div className="absolute top-4 left-4 bg-slate-950/85 border border-indigo-950 rounded-xl p-3.5 shadow-lg z-25 max-w-xs font-sans text-xs space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[9px] uppercase font-bold text-indigo-400">Missão Ativa</span>
            <button
              onClick={() => setActiveQuest(null)}
              className="text-gray-500 hover:text-gray-300 font-bold px-1"
            >
              ×
            </button>
          </div>
          <h5 className="font-bold text-gray-200 text-sm">{activeQuest.name}</h5>
          <p className="text-gray-400 leading-normal">{activeQuest.description}</p>
        </div>
      )}

      {/* 🌀 Lobby Portal Spawn Selection Overlay 🌀 */}
      {showPortalMenu && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30 font-sans p-6">
          <div className="bg-[#16162a] border-2 border-indigo-500 rounded-3xl p-6 max-w-sm w-full space-y-6 shadow-2xl relative">
            <div className="text-center space-y-1">
              <span className="text-4xl block">🌀</span>
              <h4 className="font-extrabold text-white text-lg">Portal do Coliseu</h4>
              <p className="text-[10px] text-indigo-300 uppercase tracking-widest font-bold">Selecione o Local de Spawn</p>
            </div>

            <div className="space-y-3">
              {/* Destination 1 */}
              <button
                onClick={() => {
                  setShowPortalMenu(false);
                  if (gameStateRef.current && roomRef.current) {
                    gameStateRef.current.gridX = 14;
                    gameStateRef.current.gridY = 10;
                    gameStateRef.current.targetGridX = 14;
                    gameStateRef.current.targetGridY = 10;
                    roomRef.current.send('move', { x: 14 * 32, y: 10 * 32 });
                  }
                  alert("Teleportado para: Campos da Grama (Lobby Spawn)!");
                }}
                className="w-full p-4 bg-indigo-950/40 hover:bg-indigo-900 border border-indigo-850 hover:border-indigo-500 rounded-2xl flex items-center justify-between transition-all group"
              >
                <div className="text-left">
                  <span className="font-bold text-gray-200 group-hover:text-white block text-sm">Campos da Grama</span>
                  <span className="text-[10px] text-gray-400">Área Inicial (Lobby exterior)</span>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-sans">Desbloqueado</span>
              </button>

              {/* Destination 2 */}
              <button
                onClick={() => {
                  setShowPortalMenu(false);
                  if (gameStateRef.current && roomRef.current) {
                    gameStateRef.current.gridX = 1;
                    gameStateRef.current.gridY = 19;
                    gameStateRef.current.targetGridX = 1;
                    gameStateRef.current.targetGridY = 19;
                    roomRef.current.send('move', { x: 1 * 32, y: 19 * 32 });
                  }
                  alert("Teleportado para: Masmorra Rústica (Spawn Sul)!");
                }}
                className="w-full p-4 bg-indigo-950/40 hover:bg-indigo-900 border border-indigo-850 hover:border-indigo-500 rounded-2xl flex items-center justify-between transition-all group"
              >
                <div className="text-left">
                  <span className="font-bold text-gray-200 group-hover:text-white block text-sm">Masmorra Rústica</span>
                  <span className="text-[10px] text-gray-400">Área de Combate Comum</span>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-sans">Desbloqueado</span>
              </button>

              {/* Destination 3 */}
              <button
                onClick={() => {
                  alert("Esta área de spawn está bloqueada! Mestre exige nível 3.");
                }}
                className="w-full p-4 bg-slate-950/60 border border-slate-905 rounded-2xl flex items-center justify-between opacity-50 cursor-not-allowed text-left"
              >
                <div>
                  <span className="font-bold text-gray-400 block text-sm font-sans">Pântano Sombrio</span>
                  <span className="text-[10px] text-gray-500">Mundo 2 (Requer Nível 3)</span>
                </div>
                <span className="text-xs font-bold text-rose-400 font-sans">Bloqueado</span>
              </button>

              {/* Destination 4 */}
              <button
                onClick={() => {
                  alert("Esta área de spawn está bloqueada! Mestre exige nível 5.");
                }}
                className="w-full p-4 bg-slate-950/60 border border-slate-905 rounded-2xl flex items-center justify-between opacity-50 cursor-not-allowed text-left"
              >
                <div>
                  <span className="font-bold text-gray-400 block text-sm font-sans">Pico do Dragão Congelado</span>
                  <span className="text-[10px] text-gray-500">Mundo 3 (Requer Nível 5)</span>
                </div>
                <span className="text-xs font-bold text-rose-400 font-sans">Bloqueado</span>
              </button>
            </div>

            <button
              onClick={() => {
                setShowPortalMenu(false);
                if (gameStateRef.current && roomRef.current) {
                  gameStateRef.current.gridY = 1;
                  gameStateRef.current.targetGridY = 1;
                  roomRef.current.send('move', { x: gameStateRef.current.gridX * 32, y: 1 * 32 });
                }
              }}
              className="w-full py-3 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 text-xs font-bold rounded-xl transition-colors font-sans"
            >
              Fechar Portal
            </button>
          </div>
        </div>
      )}


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
