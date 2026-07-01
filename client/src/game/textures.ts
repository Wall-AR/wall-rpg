import { Texture, Rectangle } from 'pixi.js';

// Helper to load an image element asynchronously
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

// Generates game textures programmatically using HTML Canvas
export interface GameTextures {
  grass: Texture;
  stone: Texture;
  brick: Texture;
  portal: Texture;
  flowers: Texture;
  water: Texture;
  woodFloor: Texture;
  fence: Texture;
  playerDown: Texture[];
  playerUp: Texture[];
  playerLeft: Texture[];
  playerRight: Texture[];
  monster: Texture;
}

export const generateTextures = async (): Promise<GameTextures> => {
  const tileSize = 32;

  // Helper to create a canvas and context
  const createCanvas = (width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  };

  let grass: Texture;
  let stone: Texture;
  let brick: Texture;
  let portal: Texture;
  let flowers: Texture;
  let water: Texture;
  let woodFloor: Texture;
  let fence: Texture;

  // Helper to slice a tile from base tileset texture
  const sliceTile = (base: any, col: number, row: number) => {
    return new Texture({
      source: base.source,
      frame: new Rectangle(col * tileSize, row * tileSize, tileSize, tileSize)
    });
  };

  try {
    const tilesetImg = await loadImage('/assets/tilesets/tileset.png');
    const baseTileset = Texture.from(tilesetImg);

    // Slice tiles from the first row of the loaded tileset image
    grass = sliceTile(baseTileset, 0, 0);
    stone = sliceTile(baseTileset, 1, 0);
    brick = sliceTile(baseTileset, 2, 0);
    portal = sliceTile(baseTileset, 3, 0);
    flowers = sliceTile(baseTileset, 4, 0);
    water = sliceTile(baseTileset, 5, 0);
    woodFloor = sliceTile(baseTileset, 6, 0);
    fence = sliceTile(baseTileset, 7, 0);
    console.log("🌸 RPG Maker tileset loaded successfully from '/assets/tilesets/tileset.png'!");
  } catch (err) {
    console.log("ℹ️ Local RPG Maker tileset image not found, using programmatic canvas fallbacks.");
    // 1. Grass Tile Fallback
    grass = (() => {
      const { canvas, ctx } = createCanvas(tileSize, tileSize);
      ctx.fillStyle = '#488b49';
      ctx.fillRect(0, 0, tileSize, tileSize);
      ctx.fillStyle = '#5fb460';
      for (let i = 0; i < 6; i++) {
        const x = (i * 5 + 3) % tileSize;
        const y = (i * 7 + 4) % tileSize;
        ctx.fillRect(x, y, 1, 3);
        ctx.fillRect(x - 1, y + 1, 3, 1);
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(5, 5, 3, 3);
      ctx.fillRect(20, 20, 3, 3);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(6, 6, 1, 1);
      ctx.fillRect(21, 21, 1, 1);
      ctx.fillStyle = '#f87171';
      ctx.fillRect(15, 8, 2, 2);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(15, 8, 1, 1);
      return Texture.from(canvas);
    })();

    // 2. Stone Tile Fallback
    stone = (() => {
      const { canvas, ctx } = createCanvas(tileSize, tileSize);
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 0, tileSize, tileSize);
      const drawStone = (x: number, y: number, w: number, h: number) => {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(x + 1, y + 1, w - 2, 1);
        ctx.fillRect(x + 1, y + 1, 1, h - 2);
      };
      drawStone(1, 1, 14, 6);
      drawStone(16, 1, 15, 6);
      drawStone(1, 8, 10, 7);
      drawStone(12, 8, 19, 7);
      drawStone(1, 16, 15, 7);
      drawStone(17, 16, 14, 7);
      drawStone(1, 24, 12, 7);
      drawStone(14, 24, 17, 7);
      return Texture.from(canvas);
    })();

    // 3. Brick Tile Fallback
    brick = (() => {
      const { canvas, ctx } = createCanvas(tileSize, tileSize);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(0, 0, tileSize, tileSize);
      const drawBrick = (x: number, y: number, w: number, h: number) => {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(x + 1, y + 1, w - 2, 1);
      };
      drawBrick(0, 0, 15, 7);
      drawBrick(16, 0, 16, 7);
      drawBrick(0, 8, 32, 7);
      drawBrick(0, 16, 11, 7);
      drawBrick(12, 16, 20, 7);
      drawBrick(0, 24, 22, 7);
      drawBrick(23, 24, 9, 7);
      return Texture.from(canvas);
    })();

    // 4. Portal Tile Fallback
    portal = (() => {
      const { canvas, ctx } = createCanvas(tileSize, tileSize);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, tileSize, tileSize);
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(tileSize / 2, tileSize / 2, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(tileSize / 2, tileSize / 2, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(tileSize / 2, tileSize / 2, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(13, 13, 6, 6);
      ctx.fillStyle = '#e9d5ff';
      ctx.fillRect(15, 15, 2, 2);
      return Texture.from(canvas);
    })();

    // 5. Flowers Tile Fallback
    flowers = (() => {
      const { canvas, ctx } = createCanvas(tileSize, tileSize);
      ctx.fillStyle = '#3f7d3f';
      ctx.fillRect(0, 0, tileSize, tileSize);
      const flowerColors = ['#f472b6', '#fb923c', '#facc15', '#a78bfa', '#ffffff'];
      for (let i = 0; i < 12; i++) {
        const fx = (i * 7 + 2) % (tileSize - 2);
        const fy = (i * 5 + 3) % (tileSize - 2);
        ctx.fillStyle = flowerColors[i % flowerColors.length];
        ctx.fillRect(fx, fy, 2, 2);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(fx, fy, 1, 1);
      }
      return Texture.from(canvas);
    })();

    // 6. Water Tile Fallback
    water = (() => {
      const { canvas, ctx } = createCanvas(tileSize, tileSize);
      ctx.fillStyle = '#1e3a5f';
      ctx.fillRect(0, 0, tileSize, tileSize);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(2, 8, 10, 2);
      ctx.fillRect(14, 16, 12, 2);
      ctx.fillRect(6, 24, 8, 2);
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(5, 7, 3, 1);
      ctx.fillRect(18, 15, 4, 1);
      ctx.fillRect(8, 23, 2, 1);
      return Texture.from(canvas);
    })();

    // 7. Wood Floor Tile Fallback
    woodFloor = (() => {
      const { canvas, ctx } = createCanvas(tileSize, tileSize);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(0, 0, tileSize, tileSize);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 7, tileSize, 1);
      ctx.fillRect(0, 15, tileSize, 1);
      ctx.fillRect(0, 23, tileSize, 1);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(3, 2, 6, 1);
      ctx.fillRect(18, 10, 8, 1);
      ctx.fillRect(5, 18, 10, 1);
      ctx.fillRect(20, 26, 6, 1);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(2, 7, 1, 1);
      ctx.fillRect(16, 7, 1, 1);
      ctx.fillRect(8, 15, 1, 1);
      ctx.fillRect(24, 15, 1, 1);
      return Texture.from(canvas);
    })();

    // 8. Fence Tile Fallback
    fence = (() => {
      const { canvas, ctx } = createCanvas(tileSize, tileSize);
      ctx.fillStyle = '#488b49';
      ctx.fillRect(0, 0, tileSize, tileSize);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(4, 4, 4, 24);
      ctx.fillRect(24, 4, 4, 24);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(0, 8, tileSize, 4);
      ctx.fillRect(0, 20, tileSize, 4);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 8, tileSize, 1);
      ctx.fillRect(0, 20, tileSize, 1);
      return Texture.from(canvas);
    })();
  }

  // 5. High-Quality Retro Walk Animation Frame Generator
  const drawPlayerFrame = (dir: 'up' | 'down' | 'left' | 'right', frame: number): Texture => {
    const { canvas, ctx } = createCanvas(tileSize, tileSize);
    
    const hairColor = '#d97706'; // Golden orange hair
    const tunicColor = '#3b82f6'; // Cozy blue tunic
    const skinColor = '#ffdbb5';
    const bootColor = '#1e293b'; // Slate boots
    const swordColor = '#94a3b8'; // Silver sword on back/hand

    let armSwing = 0;
    let legStep = 0;

    if (frame === 1) { // Left leg lifted
      legStep = -2;
      armSwing = 1;
    } else if (frame === 2) { // Right leg lifted
      legStep = 2;
      armSwing = -1;
    }

    if (dir === 'down') {
      // Draw boots
      ctx.fillStyle = bootColor;
      ctx.fillRect(8, 26 + (legStep < 0 ? -1 : 0), 5, 4); // Left foot
      ctx.fillRect(19, 26 + (legStep > 0 ? -1 : 0), 5, 4); // Right foot

      // Tunic
      ctx.fillStyle = tunicColor;
      ctx.fillRect(7, 13, 18, 13);
      ctx.fillRect(6, 14, 20, 4); // Shoulders

      // Hands and Arm Swings
      ctx.fillStyle = skinColor;
      ctx.fillRect(4, 17 + armSwing * 2, 3, 5); // Left hand
      ctx.fillRect(25, 17 - armSwing * 2, 3, 5); // Right hand

      // Head
      ctx.fillStyle = skinColor;
      ctx.fillRect(10, 5, 12, 9);

      // Face (Eyes looking forward)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, 9, 2, 2);
      ctx.fillRect(18, 9, 2, 2);
      ctx.fillStyle = '#1d4ed8'; // Blue pupils
      ctx.fillRect(12, 9, 1, 2);
      ctx.fillRect(18, 9, 1, 2);

      // Hair
      ctx.fillStyle = hairColor;
      ctx.fillRect(8, 3, 16, 3);
      ctx.fillRect(8, 6, 3, 3);
      ctx.fillRect(21, 6, 3, 3);
    } 
    else if (dir === 'up') {
      // Draw boots
      ctx.fillStyle = bootColor;
      ctx.fillRect(8, 26 + (legStep < 0 ? -1 : 0), 5, 4);
      ctx.fillRect(19, 26 + (legStep > 0 ? -1 : 0), 5, 4);

      // Tunic (with silver sword on back!)
      ctx.fillStyle = tunicColor;
      ctx.fillRect(7, 13, 18, 13);
      ctx.fillRect(6, 14, 20, 4);

      // Sword on back
      ctx.fillStyle = '#78350f'; // Brown hilt
      ctx.fillRect(12, 8, 2, 5);
      ctx.fillStyle = swordColor; // Silver blade
      ctx.fillRect(11, 13, 3, 10);

      // Back of Head (All hair cover)
      ctx.fillStyle = hairColor;
      ctx.fillRect(8, 3, 16, 11);
    } 
    else if (dir === 'left') {
      // Boots
      ctx.fillStyle = bootColor;
      ctx.fillRect(10, 26 + (legStep < 0 ? -1 : 0), 5, 4);
      ctx.fillRect(17, 26 + (legStep > 0 ? -1 : 0), 5, 4);

      // Tunic
      ctx.fillStyle = tunicColor;
      ctx.fillRect(9, 13, 13, 13);

      // Head
      ctx.fillStyle = skinColor;
      ctx.fillRect(11, 5, 10, 9);

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(13, 9, 2, 2);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(13, 9, 1, 2);

      // Hair
      ctx.fillStyle = hairColor;
      ctx.fillRect(10, 3, 12, 3);
      ctx.fillRect(15, 6, 7, 3);

      // Arm swing (Side hand)
      ctx.fillStyle = skinColor;
      ctx.fillRect(13 + armSwing, 17, 4, 5);
    } 
    else if (dir === 'right') {
      // Boots
      ctx.fillStyle = bootColor;
      ctx.fillRect(10, 26 + (legStep < 0 ? -1 : 0), 5, 4);
      ctx.fillRect(17, 26 + (legStep > 0 ? -1 : 0), 5, 4);

      // Tunic
      ctx.fillStyle = tunicColor;
      ctx.fillRect(10, 13, 13, 13);

      // Head
      ctx.fillStyle = skinColor;
      ctx.fillRect(11, 5, 10, 9);

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(17, 9, 2, 2);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(18, 9, 1, 2);

      // Hair
      ctx.fillStyle = hairColor;
      ctx.fillRect(10, 3, 12, 3);
      ctx.fillRect(10, 6, 7, 3);

      // Arm swing (Side hand)
      ctx.fillStyle = skinColor;
      ctx.fillRect(15 - armSwing, 17, 4, 5);
    }

    return Texture.from(canvas);
  };

  // Create walking animation loops (Stand, Step Left, Stand, Step Right)
  let playerDown: Texture[] = [];
  let playerUp: Texture[] = [];
  let playerLeft: Texture[] = [];
  let playerRight: Texture[] = [];

  try {
    // Try to load local RPG Maker spritesheet from assets folder
    const playerImg = await loadImage('/assets/sprites/player.png');
    const baseTexture = Texture.from(playerImg);
    
    // An RPG Maker single character sheet has 3 columns and 4 rows
    const frameW = playerImg.width / 3;
    const frameH = playerImg.height / 4;

    const getFrameTexture = (col: number, row: number) => {
      return new Texture({
        source: baseTexture.source,
        frame: new Rectangle(col * frameW, row * frameH, frameW, frameH)
      });
    };

    // Row 0: Down, Row 1: Left, Row 2: Right, Row 3: Up
    playerDown = [
      getFrameTexture(0, 0),
      getFrameTexture(1, 0),
      getFrameTexture(2, 0),
      getFrameTexture(1, 0)
    ];

    playerLeft = [
      getFrameTexture(0, 1),
      getFrameTexture(1, 1),
      getFrameTexture(2, 1),
      getFrameTexture(1, 1)
    ];

    playerRight = [
      getFrameTexture(0, 2),
      getFrameTexture(1, 2),
      getFrameTexture(2, 2),
      getFrameTexture(1, 2)
    ];

    playerUp = [
      getFrameTexture(0, 3),
      getFrameTexture(1, 3),
      getFrameTexture(2, 3),
      getFrameTexture(1, 3)
    ];
    console.log("🎮 RPG Maker spritesheet loaded successfully from '/assets/sprites/player.png'!");
  } catch (err) {
    console.log("ℹ️ Local RPG Maker player sprite not found, using high-quality programmatic fallback.");
    playerDown = [
      drawPlayerFrame('down', 0),
      drawPlayerFrame('down', 1),
      drawPlayerFrame('down', 0),
      drawPlayerFrame('down', 2)
    ];

    playerUp = [
      drawPlayerFrame('up', 0),
      drawPlayerFrame('up', 1),
      drawPlayerFrame('up', 0),
      drawPlayerFrame('up', 2)
    ];

    playerLeft = [
      drawPlayerFrame('left', 0),
      drawPlayerFrame('left', 1),
      drawPlayerFrame('left', 0),
      drawPlayerFrame('left', 2)
    ];

    playerRight = [
      drawPlayerFrame('right', 0),
      drawPlayerFrame('right', 1),
      drawPlayerFrame('right', 0),
      drawPlayerFrame('right', 2)
    ];
  }

  // 6. Monster Sprite (Cute retro Green Slime / Goblin)
  const monster = (() => {
    const { canvas, ctx } = createCanvas(tileSize, tileSize);
    // Green body
    ctx.fillStyle = '#059669';
    ctx.fillRect(8, 13, 16, 13);
    // Lighter green cheeks
    ctx.fillStyle = '#34d399';
    ctx.fillRect(6, 17, 20, 5);

    // Red glowing eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(11, 15, 2, 2);
    ctx.fillRect(19, 15, 2, 2);

    // Mouth
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(14, 20, 4, 2);

    return Texture.from(canvas);
  })();

  return {
    grass,
    stone,
    brick,
    portal,
    flowers,
    water,
    woodFloor,
    fence,
    playerDown,
    playerUp,
    playerLeft,
    playerRight,
    monster,
  };
};
