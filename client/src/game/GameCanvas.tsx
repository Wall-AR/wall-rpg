import React, { useEffect, useState, useRef } from 'react';
import { Application, Sprite, Container } from 'pixi.js';
import { useAuthStore } from '../stores/auth';
import { client } from './colyseus';
import { generateTextures } from './textures';
import { LOBBY_MAP, isWalkable } from './map';
import { EncounterContext } from './BattleTransition';
import '../screens/styles/hud.css';

interface GameCanvasProps {
  menuOpen: boolean;
  onTriggerBattle: (roomId: string, context?: Partial<EncounterContext>) => void;
  onToggleMenu?: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ menuOpen, onTriggerBattle, onToggleMenu }) => {
  const { token, username } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<any>(null);
  const gameStateRef = useRef<any>({
    gridX: 14,
    gridY: 10,
    targetGridX: 14,
    targetGridY: 10,
    isMoving: false,
    speed: 4,
    keys: {},
  });

  // HUD states
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [narrationText, setNarrationText] = useState<string | null>(null);
  const [activeQuest, setActiveQuest] = useState<any>(null);
  const [showPortalMenu, setShowPortalMenu] = useState(false);
  
  // NPC Dialogue Box states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLines, setDialogLines] = useState<string[]>([]);
  const [dialogLineIndex, setDialogLineIndex] = useState(0);
  const [dialogDisplayed, setDialogDisplayed] = useState('');
  const dialogOpenRef = useRef(false);

  // MMO Chat states
  const [activeChatTab, setActiveChatTab] = useState<'global' | 'team' | 'guild' | 'system'>('global');
  const [typedMessage, setTypedMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'RavenBR', text: 'Alguém para Fenda Abissal (Lv. 120)?', type: 'global' },
    { sender: 'Nyxara', text: 'Procuro grupo para Memórias Perdidas!', type: 'global' },
    { sender: 'Sistema', text: 'Bem-vindo à Cidade-Portal de Veylar.', type: 'system' },
    { sender: 'Mestre', text: 'Uma nova fenda se abriu perto da torre antiga... Exploradores, preparem-se. O equilíbrio está em risco.', type: 'system' },
    { sender: 'Thoren', text: 'Compro Cristal Dimensional x10, pm!', type: 'global' }
  ]);

  const dialogTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Setup dialog controls
  const triggerNPCConversation = (lines: string[]) => {
    if (lines.length === 0) return;
    setDialogLines(lines);
    setDialogLineIndex(0);
    setDialogOpen(true);
    dialogOpenRef.current = true;
    startTypewriter(lines[0]);
  };

  const startTypewriter = (text: string) => {
    if (dialogTimerRef.current) clearInterval(dialogTimerRef.current);
    let index = 0;
    setDialogDisplayed('');
    
    dialogTimerRef.current = setInterval(() => {
      setDialogDisplayed(prev => prev + text.charAt(index));
      index++;
      if (index >= text.length) {
        if (dialogTimerRef.current) clearInterval(dialogTimerRef.current);
      }
    }, 20);
  };

  const advanceDialog = () => {
    const currentLine = dialogLines[dialogLineIndex];
    if (dialogDisplayed.length < currentLine.length) {
      // Skip typewriter and reveal full line
      if (dialogTimerRef.current) clearInterval(dialogTimerRef.current);
      setDialogDisplayed(currentLine);
      return;
    }

    if (dialogLineIndex < dialogLines.length - 1) {
      const nextIndex = dialogLineIndex + 1;
      setDialogLineIndex(nextIndex);
      startTypewriter(dialogLines[nextIndex]);
    } else {
      // Close dialogue
      setDialogOpen(false);
      dialogOpenRef.current = false;
      if (dialogTimerRef.current) clearInterval(dialogTimerRef.current);
    }
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
    if (!token || !containerRef.current || !canvasContainerRef.current) return;

    let app: Application | null = null;
    let room: any = null;
    let isDestroyed = false;
    let cleanupKeyboard: (() => void) | null = null;
    let animationFrameId: number;

    const initGame = async () => {
      try {
        const spawnX = 14 * LOBBY_MAP.tileSize;
        const spawnY = 10 * LOBBY_MAP.tileSize;
        
        room = await client.joinOrCreate("game", { 
          token,
          x: spawnX,
          y: spawnY
        });
        roomRef.current = room;

        room.onMessage("narration", (data: { text: string }) => {
          setNarrationText(data.text);
        });

        room.onMessage("quest", (data: { name: string; description: string }) => {
          setActiveQuest(data);
        });

        // Setup PIXI Application
        app = new Application();
        await app.init({
          width: 800,
          height: 600,
          backgroundColor: 0x07070f,
          antialias: true
        });

        if (isDestroyed) {
          app.destroy(true);
          return;
        }

        canvasContainerRef.current!.appendChild(app.canvas);

        const textures = await generateTextures();
        const mapContainer = new Container();
        app.stage.addChild(mapContainer);

        // Render Tilemap
        const cols = LOBBY_MAP.width;
        const rows = LOBBY_MAP.height;
        const size = LOBBY_MAP.tileSize;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const tileType = LOBBY_MAP.grid[r][c];
            let tex = textures.grass;
            if (tileType === 1) tex = textures.stone;
            if (tileType === 2) tex = textures.brick;
            if (tileType === 3) tex = textures.portal;
            if (tileType === 4) tex = textures.flowers;
            if (tileType === 5) tex = textures.water;
            if (tileType === 6) tex = textures.woodFloor;
            if (tileType === 7) tex = textures.fence;

            const tileSprite = new Sprite(tex);
            tileSprite.x = c * size;
            tileSprite.y = r * size;
            tileSprite.width = size;
            tileSprite.height = size;
            mapContainer.addChild(tileSprite);
          }
        }

        // Add visual overlays for portals/chests
        const chestSprite = new Sprite(textures.flowers);
        chestSprite.x = 24 * size;
        chestSprite.y = 5 * size;
        chestSprite.width = size;
        chestSprite.height = size;
        mapContainer.addChild(chestSprite);

        // Spawning player sprite
        const playerContainer = new Container();
        app.stage.addChild(playerContainer);

        const playerSprite = new Sprite(textures.playerDown[0]);
        playerSprite.width = size;
        playerSprite.height = size;
        playerContainer.addChild(playerSprite);

        // Sync other players sprites
        const otherPlayersMap = new Map<string, Sprite>();
        
        room.state.players.onAdd = (otherPlayer: any, sessionId: string) => {
          if (sessionId === room.sessionId) return;
          const otherSprite = new Sprite(textures.playerDown[0]);
          otherSprite.width = size;
          otherSprite.height = size;
          otherSprite.x = otherPlayer.x;
          otherSprite.y = otherPlayer.y;
          playerContainer.addChild(otherSprite);
          otherPlayersMap.set(sessionId, otherSprite);

          otherPlayer.onChange = () => {
            otherSprite.x = otherPlayer.x;
            otherSprite.y = otherPlayer.y;
          };
        };

        room.state.players.onRemove = (otherPlayer: any, sessionId: string) => {
          const sprite = otherPlayersMap.get(sessionId);
          if (sprite) {
            playerContainer.removeChild(sprite);
            otherPlayersMap.delete(sessionId);
          }
        };

        // Sync monster spawns
        const monsterSpritesMap = new Map<string, Sprite>();
        room.state.monsters.onAdd = (monster: any, key: string) => {
          const monSprite = new Sprite(textures.monster);
          monSprite.width = size;
          monSprite.height = size;
          monSprite.x = monster.x;
          monSprite.y = monster.y;
          playerContainer.addChild(monSprite);
          monsterSpritesMap.set(key, monSprite);

          monster.onChange = () => {
            monSprite.x = monster.x;
            monSprite.y = monster.y;
          };
        };

        room.state.monsters.onRemove = (monster: any, key: string) => {
          const sprite = monsterSpritesMap.get(key);
          if (sprite) {
            playerContainer.removeChild(sprite);
            monsterSpritesMap.delete(key);
          }
        };

        // Monitor battle room triggers
        room.onMessage("startBattle", (data: { roomId: string; enemyName?: string; enemyLevel?: number; enemyElement?: string }) => {
          setLoading(true);
          onTriggerBattle(data.roomId, {
            type: 'wild',
            enemyName: data.enemyName || 'Lobo Sombrio',
            enemyLevel: data.enemyLevel || 118,
            enemyElement: data.enemyElement || 'none'
          });
        });

        // Input Keyboard handlers
        const keys: Record<string, boolean> = gameStateRef.current.keys;
        const handleKeyDown = (e: KeyboardEvent) => {
          if (menuOpenRef.current) return;
          const isTyping = document.activeElement?.tagName === 'INPUT' || 
                           document.activeElement?.tagName === 'TEXTAREA';
          if (isTyping) return;

          keys[e.key.toLowerCase()] = true;

          // Space to advance dialogs
          if (e.key === ' ' && dialogOpenRef.current) {
            e.preventDefault();
            advanceDialog();
          }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
          keys[e.key.toLowerCase()] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        cleanupKeyboard = () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
        };

        // Main game loop (frame-rate independent simulation)
        let lastTime = performance.now();
        const gameLoop = (time: number) => {
          if (isDestroyed) return;
          animationFrameId = requestAnimationFrame(gameLoop);

          const state = gameStateRef.current;
          const delta = (time - lastTime) / 16.666; // normalizing target 60FPS
          lastTime = time;

          // If menu open, freeze movement
          if (menuOpenRef.current) return;

          if (!state.isMoving) {
            let dx = 0;
            let dy = 0;

            const up = keys['w'] || keys['arrowup'];
            const down = keys['s'] || keys['arrowdown'];
            const left = keys['a'] || keys['arrowleft'];
            const right = keys['d'] || keys['arrowright'];

            if (up) dy = -1;
            if (down) dy = 1;
            if (left) dx = -1;
            if (right) dx = 1;

            // Set sprite texture based on facing direction (with diagonal fallbacks)
            if (up && left) {
              playerSprite.texture = textures.playerLeft[0];
            } else if (up && right) {
              playerSprite.texture = textures.playerRight[0];
            } else if (down && left) {
              playerSprite.texture = textures.playerLeft[0];
            } else if (down && right) {
              playerSprite.texture = textures.playerRight[0];
            } else if (up) {
              playerSprite.texture = textures.playerUp[0];
            } else if (down) {
              playerSprite.texture = textures.playerDown[0];
            } else if (left) {
              playerSprite.texture = textures.playerLeft[0];
            } else if (right) {
              playerSprite.texture = textures.playerRight[0];
            }

            if (dx !== 0 || dy !== 0) {
              const targetX = state.gridX + dx;
              const targetY = state.gridY + dy;

              // Grid limits
              if (targetX >= 0 && targetX < cols && targetY >= 0 && targetY < rows) {
                const targetTile = LOBBY_MAP.grid[targetY][targetX];
                
                // Portal collision menu trigger
                if (targetTile === 3) {
                  setShowPortalMenu(true);
                  keys['w'] = keys['s'] = keys['a'] = keys['d'] = false;
                  keys['arrowup'] = keys['arrowdown'] = keys['arrowleft'] = keys['arrowright'] = false;
                  return;
                }

                // Guide NPC collision
                if (targetX === 12 && targetY === 9) {
                  triggerNPCConversation([
                    "Saudações, Nobre Guerreiro! Bem-vindo à Cidade-Portal de Veylar.",
                    "O Portal Dimensional à esquerda conecta locais de combate por todo o Coliseu.",
                    "Explore o Coliseu, derrote feras e forje sua lenda na Arena Dimensional!"
                  ]);
                  keys['w'] = keys['s'] = keys['a'] = keys['d'] = false;
                  keys['arrowup'] = keys['arrowdown'] = keys['arrowleft'] = keys['arrowright'] = false;
                  return;
                }

                // Chest interaction
                if (targetX === 24 && targetY === 5) {
                  triggerNPCConversation([
                    "Você encontrou o Baú de Memórias da Taverna!",
                    "Consumíveis e Itens Especiais de fusão podem ser resgatados no menu Mochila."
                  ]);
                  keys['w'] = keys['s'] = keys['a'] = keys['d'] = false;
                  keys['arrowup'] = keys['arrowdown'] = keys['arrowleft'] = keys['arrowright'] = false;
                  return;
                }

                // Solid tile collision check (with diagonal corner-cutting prevention)
                const diagonalWalkable = dx !== 0 && dy !== 0
                  ? isWalkable(state.gridX + dx, state.gridY) || isWalkable(state.gridX, state.gridY + dy)
                  : true;

                if (isWalkable(targetX, targetY) && diagonalWalkable) {
                  state.targetGridX = targetX;
                  state.targetGridY = targetY;
                  state.isMoving = true;
                }
              }
            }
          }

          // Move player sprite towards grid target position
          if (state.isMoving) {
            const targetPixelX = state.targetGridX * size;
            const targetPixelY = state.targetGridY * size;

            let step = state.speed * delta;
            
            if (playerSprite.x < targetPixelX) {
              playerSprite.x = Math.min(targetPixelX, playerSprite.x + step);
            } else if (playerSprite.x > targetPixelX) {
              playerSprite.x = Math.max(targetPixelX, playerSprite.x - step);
            }

            if (playerSprite.y < targetPixelY) {
              playerSprite.y = Math.min(targetPixelY, playerSprite.y + step);
            } else if (playerSprite.y > targetPixelY) {
              playerSprite.y = Math.max(targetPixelY, playerSprite.y - step);
            }

            // Target reached
            if (playerSprite.x === targetPixelX && playerSprite.y === targetPixelY) {
              state.gridX = state.targetGridX;
              state.gridY = state.targetGridY;
              state.isMoving = false;

              // Send coordinates updates to Colyseus server
              room.send("move", { x: playerSprite.x, y: playerSprite.y });
            }
          } else {
            // Static position
            playerSprite.x = state.gridX * size;
            playerSprite.y = state.gridY * size;
          }
        };

        // Start render ticker
        animationFrameId = requestAnimationFrame(gameLoop);

      } catch (err: any) {
        console.error("Game loop connection failed:", err);
        setConnectionError("Conexão interrompida com a Cidade de Veylar.");
      }
    };

    initGame();

    return () => {
      isDestroyed = true;
      if (cleanupKeyboard) cleanupKeyboard();
      cancelAnimationFrame(animationFrameId);
      if (app) app.destroy(true);
      if (room) room.leave();
    };
  }, [token]);

  // Send typed chat message to MMO list
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    setChatMessages(prev => [
      ...prev,
      { sender: username || 'Guerreiro', text: typedMessage, type: activeChatTab }
    ]);
    setTypedMessage('');
  };

  if (connectionError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#06060c] text-[#ffe082] p-6 min-h-[400px] border border-indigo-950/40 rounded-3xl">
        <div className="text-center space-y-3">
          <span className="text-4xl block">🔌</span>
          <p className="text-xs uppercase font-extrabold text-rose-400 tracking-widest">{connectionError}</p>
        </div>
      </div>
    );
  }

  // Pre-populate mock activeQuest if empty to fill HUD visual elegance
  const currentQuest = activeQuest || {
    name: "Ecos de Outra Dimensão",
    description: "A Distúrbio Dimensional se intensificou. Investigue a origem das rachaduras e restaure o equilíbrio.",
    objective: "Fale com a Guarda de Veylar: 0/1"
  };

  return (
    <div ref={containerRef} className="w-full h-full min-h-[580px] relative overflow-hidden bg-[#06060c] flex items-center justify-center rounded-3xl border border-[#b59441]/40">
      
      {/* 1. PIXI GAMEPLAY CANVAS CONTAINER */}
      <div ref={canvasContainerRef} className="absolute inset-0 z-0" />

      {/* 2. TOP-LEFT: CHARACTER PROFILE PANEL (Wall) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="hud-profile-frame rounded-2xl p-3 flex gap-3 items-center min-w-[200px]">
          <div className="w-11 h-11 bg-black/40 border border-indigo-900/60 rounded-full flex items-center justify-center text-2xl shadow-inner relative">
            <span className="absolute bottom-0 right-0 text-[8px] bg-[#ffe082] text-black px-1 rounded-full font-black leading-none">L</span>
            👤
          </div>
          <div className="text-left min-w-0">
            <h4 className="font-extrabold text-white text-xs leading-none flex items-center gap-1.5">
              <span>{username || 'Wall'}</span>
              <span className="text-[7px] text-gray-500 font-bold">Lv. 128</span>
            </h4>
            <div className="space-y-1 mt-1.5">
              <div className="w-28 h-1.5 bg-black/60 rounded-full overflow-hidden relative">
                <div className="h-full bg-emerald-500" style={{ width: '100%' }}></div>
              </div>
              <div className="w-28 h-1.5 bg-black/60 rounded-full overflow-hidden relative">
                <div className="h-full bg-blue-500" style={{ width: '100%' }}></div>
              </div>
            </div>
            <span className="text-[7px] text-gray-400 block font-bold mt-1.5">Poder da Equipe: 52.843</span>
          </div>
        </div>

        {/* Companions Mini HUD Cards (Caelum & Lobo) */}
        <div className="flex gap-1.5 items-center pl-1">
          <div className="w-8 h-8 rounded-lg bg-[#121226]/85 border border-[#b59441]/30 flex items-center justify-center text-sm relative">
            <span>🛡️</span>
            <span className="absolute top-0 right-0 text-[6px] px-0.5 bg-purple-950 text-purple-300 font-black rounded-sm border border-purple-800">D</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#121226]/85 border border-[#b59441]/30 flex items-center justify-center text-sm relative">
            <span>🐺</span>
            <span className="absolute top-0 right-0 text-[6px] px-0.5 bg-purple-950 text-purple-300 font-black rounded-sm border border-purple-800">D</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#121226]/40 border border-indigo-950 flex items-center justify-center text-sm">
            <span className="text-gray-600">🐾</span>
          </div>
        </div>
      </div>

      {/* 3. TOP-CENTER: MASTER NARRATION BANNER */}
      {narrationText && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-25 w-full max-w-lg hud-narration-banner rounded-2xl p-4 flex items-center gap-3.5">
          <span className="text-2xl text-blue-400 animate-pulse">✦</span>
          <div className="text-left flex-1">
            <span className="text-[8px] uppercase font-bold text-[#ffe082] tracking-widest block leading-none">Narração do Mestre</span>
            <p className="text-gray-300 text-[10px] leading-relaxed italic mt-1">"{narrationText}"</p>
          </div>
          <button
            onClick={() => setNarrationText(null)}
            className="text-gray-500 hover:text-white font-black text-xs px-1 ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4. TOP-RIGHT: MINIMAP & ACTIVE QUESTS */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-3.5 items-end pointer-events-auto w-56">
        {/* City Info & Time */}
        <div className="flex gap-2.5 items-center text-[8.5px] font-bold text-gray-400 bg-black/60 px-3 py-1 rounded-full border border-indigo-950">
          <span className="text-[#ffe082]">Cidade-Portal de Veylar</span>
          <span>🌅 19:42</span>
          <span className="text-emerald-400">32ms</span>
        </div>

        {/* Minimap Frame (Mockup style streets locator) */}
        <div className="hud-minimap w-full rounded-2xl p-2">
          <div className="minimap-placeholder aspect-[4/3] rounded-lg relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.08)_0%,_transparent_70%)]" />
            
            {/* Visual elements grids of minimap */}
            <div className="absolute w-2 h-2 bg-blue-500 rounded-full blur-[2px] animate-pulse" style={{ left: '50%', top: '50%' }} />
            <div className="absolute w-1.5 h-1.5 bg-yellow-500 rounded-full" style={{ left: '30%', top: '40%' }} />
            <div className="absolute w-1.5 h-1.5 bg-yellow-500 rounded-full" style={{ left: '70%', top: '65%' }} />
            <div className="absolute w-1 h-1 bg-white rounded-full" style={{ left: '48%', top: '52%' }} />

            <span className="text-[7px] text-gray-500 font-extrabold uppercase bg-black/75 px-1 py-0.5 rounded border border-indigo-950/60 shadow">Canal 1</span>
          </div>
        </div>

        {/* Quest Panel */}
        <div className="hud-quest-panel w-full rounded-2xl p-3.5 text-left">
          <span className="text-[8px] uppercase font-bold text-[#ffe082] tracking-widest block leading-none">Missão Atual</span>
          <h5 className="font-extrabold text-[10px] text-white leading-tight mt-1.5">{currentQuest.name}</h5>
          <p className="text-[8px] text-gray-400 leading-normal mt-1">{currentQuest.description}</p>
          <div className="flex gap-2 items-center mt-2.5 pt-2 border-t border-indigo-950/30 text-[8px] font-bold text-indigo-300">
            <span>🔹</span>
            <span>{currentQuest.objective || "Fale com a Guarda de Veylar: 0/1"}</span>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM-LEFT: MMO CHAT BOX */}
      <div className="absolute bottom-4 left-4 z-20 w-72 h-44 flex flex-col justify-between hud-chat-box rounded-2xl p-3.5 pointer-events-auto">
        {/* Tab Headers */}
        <div className="flex gap-2.5 border-b border-indigo-950/40 pb-1.5 text-[8.5px] font-extrabold text-gray-400 uppercase tracking-widest leading-none">
          {(['global', 'team', 'guild', 'system'] as const).map(tab => (
            <span
              key={tab}
              onClick={() => setActiveChatTab(tab)}
              className={`cursor-pointer transition-colors hud-chat-tab ${activeChatTab === tab ? 'active' : ''}`}
            >
              {tab === 'global' ? 'Global' : tab === 'team' ? 'Equipe' : tab === 'guild' ? 'Guilda' : 'Sistema'}
            </span>
          ))}
          <span className="text-gray-600 font-bold ml-auto">+</span>
        </div>

        {/* Chat message logs */}
        <div className="flex-1 overflow-y-auto my-2 space-y-1.5 pr-1 scrollbar-thin">
          {chatMessages
            .filter(m => activeChatTab === 'global' || m.type === activeChatTab)
            .map((msg, idx) => {
              const isSys = msg.type === 'system';
              return (
                <div key={idx} className="text-[8px] text-left leading-snug">
                  <span className={`font-black uppercase tracking-wide mr-1.5 ${isSys ? 'text-blue-400' : 'text-yellow-500'}`}>
                    {isSys ? '[System]' : `[${msg.sender}]`}:
                  </span>
                  <span className="text-gray-300 font-semibold">{msg.text}</span>
                </div>
              );
            })}
        </div>

        {/* Input submission box */}
        <form onSubmit={handleSendChatMessage} className="flex gap-2 border-t border-indigo-950/40 pt-2 shrink-0">
          <input
            type="text"
            value={typedMessage}
            onChange={(e) => setTypedMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-black/40 border border-indigo-950/60 rounded-lg px-2.5 py-1 text-[8.5px] text-[#ffe082] outline-none placeholder-gray-600"
          />
          <button type="submit" className="text-[8px] font-black text-[#ffe082] bg-indigo-950 px-2 py-1 rounded border border-indigo-800 hover:bg-indigo-900 transition-colors uppercase">
            Enviar
          </button>
        </form>
      </div>

      {/* 6. BOTTOM-CENTER: INTERACTIVE ACTION PROMPT & SHORTCUTS */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center gap-3.5 pointer-events-auto">
        
        {/* Dialogue prompt alert box (Falar com a Guarda de Veylar) */}
        {!dialogOpen && (
          <div className="hud-prompt-box px-8 py-2 rounded text-center">
            <span className="text-[9px] font-extrabold text-[#ffe082] uppercase tracking-widest leading-none">
              Enter — Falar com Guarda de Veylar
            </span>
          </div>
        )}

        {/* Action Shortcut round buttons (Personagem, Habilidades, etc.) */}
        <div className="flex gap-2">
          {[
            { label: 'Personagem', key: 'C' },
            { label: 'Habilidades', key: 'K' },
            { label: 'Equipamentos', key: 'B' },
            { label: 'Mochila', key: 'I' },
            { label: 'Grupo', key: 'P' },
            { label: 'Missões', key: 'M' },
            { label: 'Mapa', key: 'N' },
            { label: 'Loja', key: 'V' }
          ].map(btn => (
            <button
              key={btn.key}
              onClick={() => {
                // Mock triggers to start menu tabs
                alert(`Painel de ${btn.label} selecionado [Atalho: ${btn.key}]`);
              }}
              className="hud-action-bar-btn flex flex-col items-center justify-center relative group"
            >
              <span className="text-[9px] font-black leading-none">{btn.key}</span>
              <span className="absolute bottom-full mb-1.5 hidden group-hover:block bg-slate-950/90 text-white border border-indigo-900 px-2 py-0.5 rounded text-[7px] uppercase font-bold tracking-widest shadow whitespace-nowrap">
                {btn.label}
              </span>
            </button>
          ))}
        </div>

        {/* Footer shortcuts guidelines */}
        <div className="text-[7.5px] font-bold text-gray-500 uppercase tracking-widest leading-none">
          Esc: Menu | M: Missões | I: Mochila | P: Grupo | Tab: Jogadores
        </div>
      </div>

      {/* 7. BOTTOM-RIGHT: INV QUICK BAG SHORTCUT */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
        <button
          onClick={() => alert("Inventário Rápido ativado!")}
          className="hud-bag-shortcut w-11 h-11 rounded-xl flex items-center justify-center text-xl relative shrink-0"
        >
          🎒
          <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-black shadow-md border border-rose-400">
            2
          </span>
        </button>
      </div>

      {/* 8. DIALOG BOX OVERLAY (Retro dialogue NPC conversation style) */}
      {dialogOpen && (
        <div
          className="absolute bottom-20 inset-x-0 z-40 p-4 cursor-pointer select-none pointer-events-auto"
          onClick={advanceDialog}
        >
          <div className="bg-[#0a0a18] border-2 border-[#b59441] rounded-2xl p-4.5 mx-auto max-w-xl shadow-[0_4px_25px_rgba(0,0,0,0.85)] relative">
            <div className="absolute -top-3 left-5 bg-indigo-950 px-3 py-0.5 rounded border border-[#b59441]">
              <span className="text-[8px] font-extrabold text-[#ffe082] uppercase tracking-widest font-mono">🗡️ Guarda de Veylar</span>
            </div>

            <p className="text-gray-200 text-xs font-mono leading-relaxed mt-1 min-h-[2.5rem]">
              {dialogDisplayed}
              <span className="animate-pulse text-[#ffe082]">▌</span>
            </p>

            <div className="text-right mt-2">
              <span className="text-[7px] text-[#ffe082] font-mono font-bold uppercase tracking-wider animate-pulse">
                {dialogDisplayed.length >= (dialogLines[dialogLineIndex]?.length || 0)
                  ? (dialogLineIndex < dialogLines.length - 1 ? '▶ PRÓXIMO [ESPAÇO]' : '✖ FECHAR [ESPAÇO]')
                  : '▶▶ PULAR [ESPAÇO]'}
              </span>
            </div>

            <div className="absolute -bottom-2 right-5 bg-slate-950 px-2 py-0.5 rounded border border-indigo-900">
              <span className="text-[7px] font-bold text-indigo-400 font-mono">{dialogLineIndex + 1}/{dialogLines.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* 9. PORTAL SPAWN SELECT MENU */}
      {showPortalMenu && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30 font-sans p-6 pointer-events-auto">
          <div className="bg-[#16162a] border-2 border-[#b59441] rounded-3xl p-6 max-w-sm w-full space-y-6 shadow-2xl relative">
            <div className="text-center space-y-1">
              <span className="text-4xl block">🌀</span>
              <h4 className="font-extrabold text-white text-lg">Portal do Coliseu</h4>
              <p className="text-[9px] text-indigo-300 uppercase tracking-widest font-bold">Selecione o Local de Spawn</p>
            </div>

            <div className="space-y-3">
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
                }}
                className="w-full p-4 bg-indigo-950/40 hover:bg-indigo-900 border border-indigo-850 hover:border-indigo-500 rounded-2xl flex items-center justify-between transition-all group"
              >
                <div className="text-left">
                  <span className="font-bold text-gray-200 group-hover:text-white block text-sm">Campos da Grama</span>
                  <span className="text-[10px] text-gray-400">Área Inicial (Lobby exterior)</span>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-sans">Desbloqueado</span>
              </button>

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
                }}
                className="w-full p-4 bg-indigo-950/40 hover:bg-indigo-900 border border-indigo-850 hover:border-indigo-500 rounded-2xl flex items-center justify-between transition-all group"
              >
                <div className="text-left">
                  <span className="font-bold text-gray-200 group-hover:text-white block text-sm">Masmorra Rústica</span>
                  <span className="text-[10px] text-gray-400">Área de Combate Comum</span>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-sans">Desbloqueado</span>
              </button>
            </div>

            <button
              onClick={() => setShowPortalMenu(false)}
              className="w-full py-3 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 text-xs font-bold rounded-xl transition-colors font-sans"
            >
              Fechar Portal
            </button>
          </div>
        </div>
      )}

      {/* 10. LOADING TRANSITION OVERLAY */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#06060c]/90 text-[#ffe082] z-50">
          <div className="text-center space-y-3">
            <svg className="animate-spin h-8 w-8 mx-auto text-[#ffe082]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-black animate-pulse">Carregando Arena de Combate...</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default GameCanvas;
