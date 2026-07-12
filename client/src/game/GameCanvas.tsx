import React, { useEffect, useState, useRef } from 'react';
import { Application, Sprite, Container, Graphics } from 'pixi.js';
import { useAuthStore } from '../stores/auth';
import { client } from './colyseus';
import { generateTextures } from './textures';
import { LOBBY_MAP, isWalkable } from './map';
import { EncounterContext } from './BattleTransition';
import { Callbacks } from '@colyseus/sdk';
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
    flatX: 14 * 32,
    flatY: 10 * 32,
    targetFlatX: 14 * 32,
    targetFlatY: 10 * 32,
    isMoving: false,
    speed: 180, // pixels per second (speed adjusted for smooth feel)
    keys: {},
    animTimer: 0,
    animFrame: 0,
    lastSentX: 14 * 32,
    lastSentY: 10 * 32,
    lastSentTime: 0,
  });

  // HUD states
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [narrationText, setNarrationText] = useState<string | null>(null);
  const [activeQuest, setActiveQuest] = useState<any>(null);
  const [showPortalMenu, setShowPortalMenu] = useState(false);
  const [worldCharacter, setWorldCharacter] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    fetch('/character/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.ok ? response.json() : null)
      .then(character => character && setWorldCharacter(character))
      .catch(() => undefined);
  }, [token]);

  // GM DevTool states
  const [isGm, setIsGm] = useState(false);
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [selectedTile, setSelectedTile] = useState<number>(0);
  const [showGmLogin, setShowGmLogin] = useState(false);
  const [gmPassphrase, setGmPassphrase] = useState("");
  const [gmAuthError, setGmAuthError] = useState<string | null>(null);

  const handleGmAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomRef.current) return;
    roomRef.current.send("authenticateGM", { secret: gmPassphrase });
  };

  // League of Legends Mobile style Virtual Joystick states & handlers
  const [joystickActive, setJoystickActive] = useState(false);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const joystickBaseRef = useRef<HTMLDivElement>(null);

  const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setJoystickActive(true);
  };

  const handleJoystickMove = (e: any) => {
    if (!joystickActive || !joystickBaseRef.current) return;

    const baseRect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = baseRect.left + baseRect.width / 2;
    const centerY = baseRect.top + baseRect.height / 2;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const maxRadius = 36; // max knob drag distance in px
    const angle = Math.atan2(dy, dx);
    let knobX = dx;
    let knobY = dy;

    if (distance > maxRadius) {
      knobX = Math.cos(angle) * maxRadius;
      knobY = Math.sin(angle) * maxRadius;
    }

    setKnobOffset({ x: knobX, y: knobY });

    if (gameStateRef.current) {
      const normalizedMagnitude = Math.min(1.0, distance / maxRadius);
      gameStateRef.current.joystickDx = Math.cos(angle) * normalizedMagnitude;
      gameStateRef.current.joystickDy = Math.sin(angle) * normalizedMagnitude;
    }
  };

  const handleJoystickEnd = () => {
    setJoystickActive(false);
    setKnobOffset({ x: 0, y: 0 });
    if (gameStateRef.current) {
      gameStateRef.current.joystickDx = 0;
      gameStateRef.current.joystickDy = 0;
    }
  };

  useEffect(() => {
    if (joystickActive) {
      const onMove = (e: any) => handleJoystickMove(e);
      const onEnd = () => handleJoystickEnd();

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onEnd);

      return () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onEnd);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onEnd);
      };
    }
  }, [joystickActive]);
  
  // NPC Dialogue Box states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLines, setDialogLines] = useState<string[]>([]);
  const [dialogLineIndex, setDialogLineIndex] = useState(0);
  const [dialogDisplayed, setDialogDisplayed] = useState('');
  const dialogOpenRef = useRef(false);
  const dialogLinesRef = useRef<string[]>([]);
  const dialogLineIndexRef = useRef(0);
  const dialogDisplayedRef = useRef('');
  const dialogOnCompleteRef = useRef<(() => void) | null>(null);
  const [isNearTrainingNpc, setIsNearTrainingNpc] = useState(false);
  const isNearTrainingNpcRef = useRef(false);
  const [showTrainingChoice, setShowTrainingChoice] = useState(false);
  const showTrainingChoiceRef = useRef(false);

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
  const triggerNPCConversation = (lines: string[], onComplete?: () => void) => {
    if (lines.length === 0) return;
    dialogLinesRef.current = lines;
    dialogLineIndexRef.current = 0;
    dialogOnCompleteRef.current = onComplete || null;
    setDialogLines(lines);
    setDialogLineIndex(0);
    setDialogOpen(true);
    dialogOpenRef.current = true;
    startTypewriter(lines[0]);
  };

  const startTypewriter = (text: string) => {
    if (dialogTimerRef.current) clearInterval(dialogTimerRef.current);
    let index = 0;
    dialogDisplayedRef.current = '';
    setDialogDisplayed('');
    
    dialogTimerRef.current = setInterval(() => {
      dialogDisplayedRef.current += text.charAt(index);
      setDialogDisplayed(dialogDisplayedRef.current);
      index++;
      if (index >= text.length) {
        if (dialogTimerRef.current) clearInterval(dialogTimerRef.current);
      }
    }, 20);
  };

  const advanceDialog = () => {
    const currentLine = dialogLinesRef.current[dialogLineIndexRef.current] || '';
    if (dialogDisplayedRef.current.length < currentLine.length) {
      // Skip typewriter and reveal full line
      if (dialogTimerRef.current) clearInterval(dialogTimerRef.current);
      dialogDisplayedRef.current = currentLine;
      setDialogDisplayed(currentLine);
      return;
    }

    if (dialogLineIndexRef.current < dialogLinesRef.current.length - 1) {
      const nextIndex = dialogLineIndexRef.current + 1;
      dialogLineIndexRef.current = nextIndex;
      setDialogLineIndex(nextIndex);
      startTypewriter(dialogLinesRef.current[nextIndex]);
    } else {
      // Close dialogue
      setDialogOpen(false);
      dialogOpenRef.current = false;
      if (dialogTimerRef.current) clearInterval(dialogTimerRef.current);
      const onComplete = dialogOnCompleteRef.current;
      dialogOnCompleteRef.current = null;
      onComplete?.();
    }
  };

  const startTrainingConversation = () => {
    if (dialogOpenRef.current || showTrainingChoiceRef.current) return;
    triggerNPCConversation([
      'Saudações. Eu sou Kael, instrutor do Coliseu.',
      'Antes de enfrentar as fendas, quero testar sua formação e suas decisões.',
      'Você terá cinco heróis disponíveis e deverá escolher três para o duelo.',
      'Deseja iniciar agora um duelo de treinamento PvE?'
    ], () => {
      showTrainingChoiceRef.current = true;
      setShowTrainingChoice(true);
    });
  };

  const closeTrainingChoice = () => {
    showTrainingChoiceRef.current = false;
    setShowTrainingChoice(false);
  };

  const acceptTrainingBattle = () => {
    closeTrainingChoice();
    setLoading(true);
    roomRef.current?.send('startTestBattle');
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
        const callbacks: any = Callbacks.get(room);

        room.onMessage("narration", (data: { text: string }) => {
          setNarrationText(data.text);
        });

        room.onMessage("quest", (data: { name: string; description: string }) => {
          setActiveQuest(data);
        });

        room.onMessage("gmAuthenticated", (data: { success: boolean }) => {
          if (data.success) {
            setIsGm(true);
            setShowGmLogin(false);
            setGmAuthError(null);
          }
        });

        room.onMessage("error", (msg: string) => {
          if (msg.includes("passphrase") || msg.includes("GM")) {
            setGmAuthError(msg);
          } else {
            alert(msg);
          }
        });

        // Setup PIXI Application
        app = new Application();
        const rect = canvasContainerRef.current!.getBoundingClientRect();
        await app.init({
          width: rect.width || 800,
          height: rect.height || 600,
          backgroundColor: 0x07070f,
          antialias: true,
          resizeTo: canvasContainerRef.current!
        });

        if (isDestroyed) {
          app.destroy(true);
          return;
        }

        canvasContainerRef.current!.appendChild(app.canvas);
        const textures = await generateTextures();
        const size = LOBBY_MAP.tileSize;

        // 2.5D Isometric projection helper
        const toIsometric = (flatX: number, flatY: number) => {
          const col = flatX / size;
          const row = flatY / size;
          // Scale size is doubled for isometric diamond widths (64x32)
          const isoX = (col - row) * 32;
          const isoY = (col + row) * 16;
          return { x: isoX, y: isoY };
        };

        // World container to allow dynamic camera follow
        const worldContainer = new Container();
        app.stage.addChild(worldContainer);

        const mapContainer = new Container();
        worldContainer.addChild(mapContainer);

        const playerContainer = new Container();
        worldContainer.addChild(playerContainer);

        // Render Tilemap dynamically using server state grid
        const obstacleSprites = new Set<Sprite>();
        const addObstacle = (sprite: Sprite) => {
          playerContainer.addChild(sprite);
          obstacleSprites.add(sprite);
        };
        const clearObstacles = () => {
          obstacleSprites.forEach(sprite => {
            playerContainer.removeChild(sprite);
          });
          obstacleSprites.clear();
        };

        const gridGraphics = new Graphics();
        worldContainer.addChild(gridGraphics);

        const drawGridLines = () => {
          gridGraphics.clear();
          if (!(window as any).__editorModeActive) return;

          const cols = room.state.width || 32;
          const rows = room.state.height || 24;

          gridGraphics.lineStyle(1, 0x4f46e5, 0.35);

          for (let r = 0; r <= rows; r++) {
            const p1 = toIsometric(0, r * size);
            const p2 = toIsometric(cols * size, r * size);
            gridGraphics.moveTo(p1.x, p1.y);
            gridGraphics.lineTo(p2.x, p2.y);
          }

          for (let c = 0; c <= cols; c++) {
            const p1 = toIsometric(c * size, 0);
            const p2 = toIsometric(c * size, rows * size);
            gridGraphics.moveTo(p1.x, p1.y);
            gridGraphics.lineTo(p2.x, p2.y);
          }
        };

        (window as any).__reDrawGridLines = drawGridLines;

        const drawMap = () => {
          mapContainer.removeChildren();
          clearObstacles();

          const cols = room.state.width || 32;
          const rows = room.state.height || 24;

          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const tileIndex = r * cols + c;
              const tileType = room.state.grid[tileIndex];
              if (tileType === undefined) continue;

              const iso = toIsometric(c * size, r * size);

              if (tileType === 2 || tileType === 7) {
                // Obstacle (Brick wall / Fence)
                // Draw ground underneath first
                const groundSprite = new Sprite(textures.grass);
                groundSprite.x = iso.x;
                groundSprite.y = iso.y;
                groundSprite.anchor.set(0.5, 0.0);
                groundSprite.width = 64;
                groundSprite.height = 32;
                mapContainer.addChild(groundSprite);

                // Spawn vertical sprite on sorted container
                const obstacleSprite = new Sprite(tileType === 2 ? textures.brick : textures.fence);
                obstacleSprite.x = iso.x;
                obstacleSprite.y = iso.y + 16;
                obstacleSprite.anchor.set(0.5, 1.0);
                obstacleSprite.width = 32;
                obstacleSprite.height = tileType === 2 ? 64 : 40;
                addObstacle(obstacleSprite);
              } else if (tileType === 3) {
                // Portal
                // Draw stone tile underneath first
                const groundSprite = new Sprite(textures.stone);
                groundSprite.x = iso.x;
                groundSprite.y = iso.y;
                groundSprite.anchor.set(0.5, 0.0);
                groundSprite.width = 64;
                groundSprite.height = 32;
                mapContainer.addChild(groundSprite);

                // Add cyan glow underneath the portal
                const glow = new Sprite(textures.lightCyan);
                glow.anchor.set(0.5, 0.5);
                glow.x = iso.x;
                glow.y = iso.y + 16;
                glow.blendMode = 'add';
                glow.alpha = 0.85;
                mapContainer.addChild(glow);

                // Large vertical portal arch on sorted container
                const portalSprite = new Sprite(textures.portal);
                portalSprite.x = iso.x;
                portalSprite.y = iso.y + 16;
                portalSprite.anchor.set(0.5, 1.0);
                portalSprite.width = 64;
                portalSprite.height = 96;
                addObstacle(portalSprite);
              } else {
                // Flat ground tile
                let tex = textures.grass;
                if (tileType === 1) tex = textures.stone;
                if (tileType === 4) tex = textures.flowers;
                if (tileType === 5) tex = textures.water;
                if (tileType === 6) tex = textures.woodFloor;

                const tileSprite = new Sprite(tex);
                tileSprite.x = iso.x;
                tileSprite.y = iso.y;
                tileSprite.anchor.set(0.5, 0.0);
                tileSprite.width = 64;
                tileSprite.height = 32;
                mapContainer.addChild(tileSprite);
              }
            }
          }

          // Render lanterns & chests on top of flat map tiles
          drawGridLines();
        };

        // Initialize and listen to room state grid updates
        drawMap();
        callbacks.onChange("grid", drawMap);

        // Add visual overlays for portals/chests
        const chestSprite = new Sprite(textures.flowers);
        const chestIso = toIsometric(24 * size, 5 * size);
        chestSprite.x = chestIso.x;
        chestSprite.y = chestIso.y;
        chestSprite.anchor.set(0.5, 1.0);
        chestSprite.width = size;
        chestSprite.height = size;
        playerContainer.addChild(chestSprite);

        // Helper to spawn a lamppost prop and its light glow
        const spawnLamppost = (gridX: number, gridY: number) => {
          const iso = toIsometric(gridX * size, gridY * size);
          
          // Add light yellow glow on the floor (behind player, inside mapContainer)
          const glow = new Sprite(textures.lightYellow);
          glow.anchor.set(0.5, 0.5);
          glow.x = iso.x;
          glow.y = iso.y + 16;
          glow.blendMode = 'add';
          glow.alpha = 0.65;
          mapContainer.addChild(glow);

          // Add vertical lamppost on sorted playerContainer
          const post = new Sprite(textures.fence);
          post.x = iso.x;
          post.y = iso.y + 16;
          post.anchor.set(0.5, 1.0);
          post.width = 12;
          post.height = 44;
          playerContainer.addChild(post);

          // Glowing lantern dot at the top of the post
          const lightDot = new Sprite(textures.lightYellow);
          lightDot.anchor.set(0.5, 0.5);
          lightDot.x = iso.x;
          lightDot.y = iso.y - 28;
          lightDot.width = 16;
          lightDot.height = 16;
          lightDot.blendMode = 'add';
          playerContainer.addChild(lightDot);
        };

        // Spawn 4 lanterns framing the central plaza
        spawnLamppost(9, 8);
        spawnLamppost(22, 8);
        spawnLamppost(9, 13);
        spawnLamppost(22, 13);

        // Instrutor Kael: NPC fixo do caminho dourado de batalha PvE.
        const trainingNpcSprite = new Sprite(textures.playerDown[0]);
        const trainingNpcIso = toIsometric(12 * size, 9 * size);
        trainingNpcSprite.x = trainingNpcIso.x;
        trainingNpcSprite.y = trainingNpcIso.y;
        trainingNpcSprite.width = size;
        trainingNpcSprite.height = size;
        trainingNpcSprite.anchor.set(0.5, 1.0);
        trainingNpcSprite.tint = 0x8b5cf6;
        trainingNpcSprite.eventMode = 'static';
        trainingNpcSprite.cursor = 'pointer';
        trainingNpcSprite.on('pointerdown', () => {
          const state = gameStateRef.current;
          const distance = Math.abs(Math.floor(state.flatX / size) - 12) + Math.abs(Math.floor(state.flatY / size) - 9);
          if (distance <= 2) startTrainingConversation();
        });
        playerContainer.addChild(trainingNpcSprite);

        // Spawning player sprite
        const playerSprite = new Sprite(textures.playerDown[0]);
        playerSprite.width = size;
        playerSprite.height = size;
        playerSprite.anchor.set(0.5, 1.0);
        playerContainer.addChild(playerSprite);

        // Click-to-Move input listener (League of Legends PC style)
        if (app) {
          app.stage.eventMode = 'static';
          app.stage.hitArea = app.screen;
          app.stage.on('pointerdown', (e) => {
            if (!app) return;
            const target = e.target;
            if (target && target !== app.stage) return;
            
            const clickPos = e.getLocalPosition(worldContainer);
            
            // If in editor mode, paint tile!
            if ((window as any).__editorModeActive) {
              const flatX = (2 * clickPos.y + clickPos.x) / 2;
              const flatY = (2 * clickPos.y - clickPos.x) / 2;
              const colIdx = Math.floor(flatX / size);
              const rowIdx = Math.floor(flatY / size);
              const cols = room.state.width || 32;
              const rows = room.state.height || 24;
              
              if (colIdx >= 0 && colIdx < cols && rowIdx >= 0 && rowIdx < rows) {
                const tileType = (window as any).__editorSelectedTile || 0;
                room.send("paint_tile", { x: colIdx, y: rowIdx, tileType });
              }
              return;
            }

            const state = gameStateRef.current;
            state.mouseTargetX = (2 * clickPos.y + clickPos.x) / 2;
            state.mouseTargetY = (2 * clickPos.y - clickPos.x) / 2;
            state.isMovingByMouse = true;
          });
        }

        // Sync other players sprites
        const otherPlayersMap = new Map<string, Sprite>();
        
        callbacks.onAdd("players", (otherPlayer: any, sessionId: string) => {
          if (sessionId === room.sessionId) return;
          const otherSprite = new Sprite(textures.playerDown[0]);
          otherSprite.width = size;
          otherSprite.height = size;
          otherSprite.anchor.set(0.5, 1.0);
          
          const iso = toIsometric(otherPlayer.x, otherPlayer.y);
          otherSprite.x = iso.x;
          otherSprite.y = iso.y;
          
          playerContainer.addChild(otherSprite);
          otherPlayersMap.set(sessionId, otherSprite);

        }, true);

        callbacks.onRemove("players", (otherPlayer: any, sessionId: string) => {
          const sprite = otherPlayersMap.get(sessionId);
          if (sprite) {
            playerContainer.removeChild(sprite);
            otherPlayersMap.delete(sessionId);
          }
        });

        // Sync monster spawns
        const monsterSpritesMap = new Map<string, Sprite>();
        callbacks.onAdd("monsters", (monster: any, key: string) => {
          const monSprite = new Sprite(textures.monster);
          monSprite.width = size;
          monSprite.height = size;
          monSprite.anchor.set(0.5, 1.0);
          
          const iso = toIsometric(monster.x, monster.y);
          monSprite.x = iso.x;
          monSprite.y = iso.y;
          
          playerContainer.addChild(monSprite);
          monsterSpritesMap.set(key, monSprite);

        }, true);

        callbacks.onRemove("monsters", (monster: any, key: string) => {
          const sprite = monsterSpritesMap.get(key);
          if (sprite) {
            playerContainer.removeChild(sprite);
            monsterSpritesMap.delete(key);
          }
        });

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
          const isTyping = document.activeElement?.tagName === 'INPUT' || 
                           document.activeElement?.tagName === 'TEXTAREA';
          if (isTyping) return;

          if (showTrainingChoiceRef.current) {
            if (e.key === 'Enter' || e.key.toLowerCase() === 'y') {
              e.preventDefault();
              acceptTrainingBattle();
            } else if (e.key === 'Escape' || e.key.toLowerCase() === 'n') {
              e.preventDefault();
              closeTrainingChoice();
            }
            return;
          }

          if (dialogOpenRef.current && (e.key === ' ' || e.key === 'Enter' || e.key.toLowerCase() === 'e')) {
            e.preventDefault();
            advanceDialog();
            return;
          }

          if (!menuOpenRef.current && isNearTrainingNpcRef.current && (e.key === 'Enter' || e.key.toLowerCase() === 'e')) {
            e.preventDefault();
            startTrainingConversation();
            return;
          }

          if (menuOpenRef.current) return;

          keys[e.key.toLowerCase()] = true;
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
          const dt = Math.min(0.1, (time - lastTime) / 1000); // normalized time step in seconds
          lastTime = time;

          const gamepad = navigator.getGamepads?.()[0];
          const gamepadConfirm = Boolean(gamepad?.buttons[0]?.pressed);
          if (gamepadConfirm && !state.gamepadConfirmPressed) {
            if (showTrainingChoiceRef.current) acceptTrainingBattle();
            else if (dialogOpenRef.current) advanceDialog();
            else if (isNearTrainingNpcRef.current) startTrainingConversation();
          }
          state.gamepadConfirmPressed = gamepadConfirm;

          // If menu open, freeze movement
          if (menuOpenRef.current) return;
          if (dialogOpenRef.current || showTrainingChoiceRef.current) return;
          const isTyping = document.activeElement?.tagName === 'INPUT' || 
                           document.activeElement?.tagName === 'TEXTAREA';
          if (isTyping) return;

          let dx = 0;
          let dy = 0;

          // 1. Check Keyboard Inputs
          const up = keys['w'] || keys['arrowup'];
          const down = keys['s'] || keys['arrowdown'];
          const left = keys['a'] || keys['arrowleft'];
          const right = keys['d'] || keys['arrowright'];

          if (up) dy = -1;
          if (down) dy = 1;
          if (left) dx = -1;
          if (right) dx = 1;

          // Controle físico: analógico esquerdo e direcional digital usam o mesmo vetor.
          if (gamepad) {
            const axisX = Math.abs(gamepad.axes[0] || 0) >= 0.18 ? gamepad.axes[0] : 0;
            const axisY = Math.abs(gamepad.axes[1] || 0) >= 0.18 ? gamepad.axes[1] : 0;
            const dpadX = (gamepad.buttons[15]?.pressed ? 1 : 0) - (gamepad.buttons[14]?.pressed ? 1 : 0);
            const dpadY = (gamepad.buttons[13]?.pressed ? 1 : 0) - (gamepad.buttons[12]?.pressed ? 1 : 0);
            if (axisX || axisY || dpadX || dpadY) {
              dx = dpadX || axisX;
              dy = dpadY || axisY;
            }
          }

          // Normalize diagonal vector to prevent moving faster diagonally
          if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
          }

          // 2. Check Virtual Joystick Input (League of Legends Mobile style)
          // If joystick is active, it overrides keyboard/mouse click navigation
          const hasJoystickInput = state.joystickDx !== undefined && state.joystickDy !== undefined && (state.joystickDx !== 0 || state.joystickDy !== 0);
          if (hasJoystickInput) {
            dx = state.joystickDx;
            dy = state.joystickDy;
            state.isMovingByMouse = false;
            state.mouseTargetX = null;
            state.mouseTargetY = null;
          }

          // If keyboard is pressed, clear mouse click destination target
          const hasKeyboardInput = up || down || left || right;
          if (hasKeyboardInput) {
            state.isMovingByMouse = false;
            state.mouseTargetX = null;
            state.mouseTargetY = null;
          }

          // 3. Check Mouse Click-to-Move (League of Legends PC style)
          if (!hasKeyboardInput && !hasJoystickInput && state.isMovingByMouse && state.mouseTargetX !== null && state.mouseTargetY !== null) {
            const mdx = state.mouseTargetX - state.flatX;
            const mdy = state.mouseTargetY - state.flatY;
            const dist = Math.sqrt(mdx * mdx + mdy * mdy);

            if (dist > 4) {
              dx = mdx / dist;
              dy = mdy / dist;
            } else {
              // Target reached
              state.isMovingByMouse = false;
              state.mouseTargetX = null;
              state.mouseTargetY = null;
            }
          }

          const isMovingInput = dx !== 0 || dy !== 0;

          if (isMovingInput) {
            // Determine direction based on movement vector
            let targetDir = 'down';
            const absX = Math.abs(dx);
            const absY = Math.abs(dy);
            if (absX > absY) {
              targetDir = dx > 0 ? 'right' : 'left';
            } else {
              targetDir = dy > 0 ? 'down' : 'up';
            }

            // Walk animation frame update
            state.animTimer = (state.animTimer || 0) + dt;
            if (state.animTimer > 0.12) {
              state.animFrame = ((state.animFrame || 0) + 1) % 4;
              state.animTimer = 0;
            }

            let texs = textures.playerDown;
            if (targetDir === 'up') texs = textures.playerUp;
            else if (targetDir === 'left') texs = textures.playerLeft;
            else if (targetDir === 'right') texs = textures.playerRight;

            playerSprite.texture = texs[state.animFrame || 0];

            // Free pixel movement with sliding collision check
            const moveStepX = dx * state.speed * dt;
            const moveStepY = dy * state.speed * dt;

            // Bounding collision helpers
            const isPixelWalkable = (px: number, py: number) => {
              const colIdx = Math.floor(px / size);
              const rowIdx = Math.floor(py / size);
              const currentCols = room.state.width || 32;
              const currentRows = room.state.height || 24;
              if (colIdx < 0 || colIdx >= currentCols || rowIdx < 0 || rowIdx >= currentRows) return false;
              
              const tileIndex = rowIdx * currentCols + colIdx;
              const tileType = room.state.grid[tileIndex];
              return tileType !== 2 && tileType !== 5 && tileType !== 7;
            };

            const isPositionValid = (x: number, y: number) => {
              const r = 8; // Bounding radius
              return isPixelWalkable(x - r, y - r) &&
                     isPixelWalkable(x + r, y - r) &&
                     isPixelWalkable(x - r, y + r) &&
                     isPixelWalkable(x + r, y + r);
            };

            // Slide collision check: try moving horizontally and vertically separately
            let finalX = state.flatX;
            let finalY = state.flatY;

            if (isPositionValid(state.flatX + moveStepX, state.flatY)) {
              finalX += moveStepX;
            }
            if (isPositionValid(state.flatX, state.flatY + moveStepY)) {
              finalY += moveStepY;
            }

            const positionChanged = finalX !== state.flatX || finalY !== state.flatY;
            if (positionChanged) {
              state.flatX = finalX;
              state.flatY = finalY;
              state.gridX = Math.floor(state.flatX / size);
              state.gridY = Math.floor(state.flatY / size);

              // Throttled Netcode: Send coordinate updates to server
              const distanceMoved = Math.abs(state.flatX - (state.lastSentX || 0)) + Math.abs(state.flatY - (state.lastSentY || 0));
              const now = performance.now();
              if (distanceMoved > 4 || now - (state.lastSentTime || 0) > 100) {
                room.send("move", { x: state.flatX, y: state.flatY });
                state.lastSentX = state.flatX;
                state.lastSentY = state.flatY;
                state.lastSentTime = now;
              }
            }

            // Special checks for NPC/Portal triggers (calculated at grid coordinate)
            const playerGridX = Math.floor(state.flatX / size);
            const playerGridY = Math.floor(state.flatY / size);
            const currentTile = room.state.grid[playerGridY * (room.state.width || 32) + playerGridX];
            const nearTrainingNpc = Math.abs(playerGridX - 12) + Math.abs(playerGridY - 9) <= 2;
            if (nearTrainingNpc !== isNearTrainingNpcRef.current) {
              isNearTrainingNpcRef.current = nearTrainingNpc;
              setIsNearTrainingNpc(nearTrainingNpc);
            }

            if (currentTile === 3) {
              setShowPortalMenu(true);
              keys['w'] = keys['s'] = keys['a'] = keys['d'] = false;
              keys['arrowup'] = keys['arrowdown'] = keys['arrowleft'] = keys['arrowright'] = false;
            } else if (playerGridX === 24 && playerGridY === 5) {
              triggerNPCConversation([
                "Você encontrou o Baú de Memórias da Taverna!",
                "Consumíveis e Itens Especiais de fusão podem ser resgatados no menu Mochila."
              ]);
              keys['w'] = keys['s'] = keys['a'] = keys['d'] = false;
              keys['arrowup'] = keys['arrowdown'] = keys['arrowleft'] = keys['arrowright'] = false;
            }
          } else {
            // Idle stance
            playerSprite.texture = textures.playerDown[0];
          }

          // Update player sprite visual isometric position
          const playerIsoPos = toIsometric(state.flatX, state.flatY);
          playerSprite.x = playerIsoPos.x;
          playerSprite.y = playerIsoPos.y;

          // Camera follow: offset worldContainer to center local player
          if (app) {
            worldContainer.x = app.screen.width / 2 - playerSprite.x;
            worldContainer.y = app.screen.height / 2 - playerSprite.y;
          }

          // Smooth glide/lerp for other players sprites
          otherPlayersMap.forEach((sprite, sessionId) => {
            const pState = room.state.players.get(sessionId);
            if (pState) {
              const targetIso = toIsometric(pState.x, pState.y);
              sprite.x += (targetIso.x - sprite.x) * 0.12;
              sprite.y += (targetIso.y - sprite.y) * 0.12;
            }
          });

          // Smooth glide/lerp for roaming monsters sprites
          monsterSpritesMap.forEach((sprite, key) => {
            const mState = room.state.monsters.get(key);
            if (mState) {
              const targetIso = toIsometric(mState.x, mState.y);
              sprite.x += (targetIso.x - sprite.x) * 0.08;
              sprite.y += (targetIso.y - sprite.y) * 0.08;
              sprite.visible = mState.active;
            }
          });

          // 2.5D depth sorting (Y-Sorting) for all vertical sprites
          playerContainer.children.sort((a, b) => a.y - b.y);
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
              <span className="text-[7px] text-gray-500 font-bold">Lv. {worldCharacter?.level ?? 1}</span>
            </h4>
            <div className="space-y-1 mt-1.5">
              <div className="w-28 h-1.5 bg-black/60 rounded-full overflow-hidden relative">
                <div className="h-full bg-emerald-500" style={{ width: '100%' }}></div>
              </div>
              <div className="w-28 h-1.5 bg-black/60 rounded-full overflow-hidden relative">
                <div className="h-full bg-blue-500" style={{ width: '100%' }}></div>
              </div>
            </div>
            <span className="text-[7px] text-gray-400 block font-bold mt-1.5">Poder pessoal: {(worldCharacter?.stats?.strength ?? 15) + (worldCharacter?.stats?.defense ?? 10) + (worldCharacter?.stats?.speed ?? 8)}</span>
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
          <button 
            onClick={() => {
              if (isGm) {
                const nextMode = !isEditorMode;
                setIsEditorMode(nextMode);
                (window as any).__editorModeActive = nextMode;
                if ((window as any).__reDrawGridLines) (window as any).__reDrawGridLines();
              } else {
                setShowGmLogin(true);
              }
            }}
            className={`px-1.5 py-0.5 rounded text-[7px] uppercase font-black tracking-wider transition-colors ${
              isGm 
                ? isEditorMode 
                  ? 'bg-amber-500 text-black border border-amber-400' 
                  : 'bg-indigo-950 text-indigo-300 border border-indigo-800 hover:bg-indigo-900'
                : 'bg-rose-955/40 text-rose-300 border border-rose-900 hover:bg-rose-900/60'
            }`}
          >
            {isGm ? (isEditorMode ? '🔧 Editor' : '👑 GM') : '👑 Admin'}
          </button>
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
        {!dialogOpen && isNearTrainingNpc && !showTrainingChoice && (
          <div className="hud-prompt-box px-8 py-2 rounded text-center">
            <span className="text-[9px] font-extrabold text-[#ffe082] uppercase tracking-widest leading-none">
              Enter / E / A — Falar com Instrutor Kael
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

      {/* 6.5. LEFT-BOTTOM: VIRTUAL TOUCHPAD JOYSTICK (League of Legends Mobile style) */}
      <div className="absolute bottom-28 left-6 z-30 pointer-events-auto select-none touch-none">
        <div
          ref={joystickBaseRef}
          onMouseDown={handleJoystickStart}
          onTouchStart={handleJoystickStart}
          className={`w-20 h-20 bg-[#121226]/40 backdrop-blur-sm border border-[#b59441]/40 rounded-full flex items-center justify-center relative shadow-lg ${
            joystickActive ? 'border-yellow-400 ring-2 ring-yellow-400/20 scale-105' : ''
          } transition-all`}
        >
          {/* Outer compass marks */}
          <span className="absolute top-1 text-[6px] text-gray-500 font-bold leading-none font-mono">▲</span>
          <span className="absolute bottom-1 text-[6px] text-gray-500 font-bold leading-none font-mono">▼</span>
          <span className="absolute left-1 text-[6px] text-gray-500 font-bold leading-none font-mono">◀</span>
          <span className="absolute right-1 text-[6px] text-gray-500 font-bold leading-none font-mono">▶</span>

          {/* Inner Knob */}
          <div
            className="w-9 h-9 bg-gradient-to-b from-[#ffe082] to-[#c5a059] border border-[#b59441] rounded-full shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center"
            style={{
              transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
              transition: joystickActive ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <div className="w-2.5 h-2.5 bg-slate-950/50 rounded-full border border-yellow-300/30" />
          </div>
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
              <span className="text-[8px] font-extrabold text-[#ffe082] uppercase tracking-widest font-mono">⚔️ Instrutor Kael</span>
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

      {showTrainingChoice && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-6 pointer-events-auto">
          <div role="dialog" aria-modal="true" aria-labelledby="training-title" className="max-w-md w-full rounded-2xl border-2 border-[#b59441] bg-[#0a0a18] p-6 shadow-2xl text-center">
            <span className="text-4xl block mb-3">⚔️</span>
            <h3 id="training-title" className="text-lg font-black text-[#ffe082] uppercase tracking-wider">Duelo de Treinamento</h3>
            <p className="mt-3 text-sm text-gray-300 leading-relaxed">Deseja escolher três dos seus cinco heróis e enfrentar a equipe de Kael?</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button autoFocus onClick={acceptTrainingBattle} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-300">Sim — Iniciar</button>
              <button onClick={closeTrainingChoice} className="rounded-xl border border-indigo-800 bg-indigo-950 px-4 py-3 text-sm font-bold text-indigo-200 hover:bg-indigo-900 focus:ring-2 focus:ring-indigo-400">Agora não</button>
            </div>
            <p className="mt-4 text-[9px] uppercase tracking-widest text-gray-500">Enter/A: confirmar · Esc/N: cancelar</p>
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

      {/* GM LOGIN MODAL */}
      {showGmLogin && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 font-sans p-6 pointer-events-auto">
          <div className="bg-[#121226] border-2 border-indigo-900 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => {
                setShowGmLogin(false);
                setGmAuthError(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-white text-xs"
            >
              ✕
            </button>
            <div className="text-center space-y-1">
              <span className="text-3xl block">🔑</span>
              <h4 className="font-extrabold text-white text-base">Acesso de Administrador</h4>
              <p className="text-[9.5px] text-gray-400">Insira a chave secreta de Game Master para acessar o editor de mapas.</p>
            </div>

            <form onSubmit={handleGmAuth} className="space-y-4 pt-2">
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] uppercase font-bold text-indigo-300 tracking-wider">Chave Secreta (GM Passphrase)</label>
                <input
                  type="password"
                  value={gmPassphrase}
                  onChange={(e) => setGmPassphrase(e.target.value)}
                  placeholder="Insira a senha do GM..."
                  className="w-full bg-black/40 border border-indigo-950 rounded-xl px-3 py-2 text-xs text-[#ffe082] outline-none placeholder-gray-700"
                  required
                />
              </div>

              {gmAuthError && (
                <p className="text-[9.5px] font-bold text-rose-400 text-left bg-rose-955/20 border border-rose-900/30 p-2 rounded-lg">
                  ❌ {gmAuthError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-indigo-850 to-indigo-750 hover:from-indigo-750 hover:to-indigo-650 text-white text-xs font-bold rounded-xl transition-all border border-indigo-600/30 shadow-md font-sans"
              >
                Autenticar Administrador
              </button>
            </form>
          </div>
        </div>
      )}

      {/* GM MAP EDITOR FLOATING SIDEBAR */}
      {isGm && isEditorMode && (
        <div className="absolute top-20 left-4 z-30 w-44 bg-[#0a0a18]/90 border border-indigo-900/80 rounded-2xl p-3 shadow-2xl flex flex-col gap-3 text-left pointer-events-auto backdrop-blur-sm max-h-[70%] overflow-y-auto">
          <div className="border-b border-indigo-900/60 pb-1.5">
            <span className="text-[7.5px] uppercase font-bold text-amber-400 tracking-widest block leading-none">Paleta de Tiles</span>
            <span className="text-[6.5px] text-gray-500 font-bold block mt-1">Selecione e clique no mapa</span>
          </div>

          {/* Tile Selector Roster */}
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { typeId: 0, label: 'Grama', emoji: '🌿' },
              { typeId: 1, label: 'Pedra', emoji: '🪨' },
              { typeId: 4, label: 'Flores', emoji: '🌸' },
              { typeId: 6, label: 'Madeira', emoji: '🪵' },
              { typeId: 2, label: 'Parede', emoji: '🧱' },
              { typeId: 7, label: 'Cerca', emoji: '🚧' },
              { typeId: 5, label: 'Água', emoji: '💧' },
              { typeId: 3, label: 'Portal', emoji: '🔮' }
            ].map(tile => {
              const active = selectedTile === tile.typeId;
              return (
                <button
                  key={tile.typeId}
                  onClick={() => {
                    setSelectedTile(tile.typeId);
                    (window as any).__editorSelectedTile = tile.typeId;
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-[8.5px] font-bold transition-all ${
                    active 
                      ? 'bg-indigo-950 border-indigo-500 text-white shadow-lg' 
                      : 'bg-black/30 border-indigo-950/40 text-gray-400 hover:bg-black/50 hover:border-indigo-900/60'
                  }`}
                >
                  <span className="text-sm">{tile.emoji}</span>
                  <span className="text-[6.5px] mt-0.5 font-bold uppercase tracking-wider">{tile.label}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-indigo-900/60 pt-2 flex flex-col gap-1.5">
            <button
              onClick={() => {
                if (roomRef.current) {
                  roomRef.current.send("save_map");
                }
              }}
              className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-[8.5px] rounded-lg border border-amber-400 transition-colors uppercase tracking-widest shadow-md"
            >
              💾 Salvar Mapa
            </button>
            <button
              onClick={() => {
                setIsEditorMode(false);
                (window as any).__editorModeActive = false;
                if ((window as any).__reDrawGridLines) (window as any).__reDrawGridLines();
              }}
              className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-extrabold text-[8.5px] rounded-lg border border-zinc-700 transition-colors uppercase tracking-widest"
            >
              Fechar Editor
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
