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
  lightYellow: Texture;
  lightBlue: Texture;
  lightCyan: Texture;
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
    
    // Helper to draw isometric diamond tiles
    const drawIsometricDiamond = (color: string, drawDecorations?: (ctx: CanvasRenderingContext2D) => void) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 32;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      // Draw Diamond path
      ctx.beginPath();
      ctx.moveTo(32, 0);
      ctx.lineTo(64, 16);
      ctx.lineTo(32, 32);
      ctx.lineTo(0, 16);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Border outline (subtle overlay)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (drawDecorations) {
        drawDecorations(ctx);
      }

      return Texture.from(canvas);
    };

    // 1. Grass Tile Fallback (Green Diamond)
    grass = drawIsometricDiamond('#2d6a4f', (ctx) => {
      ctx.fillStyle = '#40916c';
      for (let i = 0; i < 5; i++) {
        const x = 12 + (i * 9) % 36;
        const y = 6 + (i * 4) % 18;
        ctx.fillRect(x, y, 1, 3);
        ctx.fillRect(x - 1, y + 1, 3, 1);
      }
    });

    // 2. Stone Tile Fallback (Grey cobblestones)
    stone = drawIsometricDiamond('#475569', (ctx) => {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(32, 8); ctx.lineTo(16, 16); ctx.lineTo(32, 24); ctx.lineTo(48, 16); ctx.closePath();
      ctx.moveTo(32, 0); ctx.lineTo(32, 32);
      ctx.moveTo(0, 16); ctx.lineTo(64, 16);
      ctx.stroke();
    });

    // 3. Brick Tile Fallback (Blocked walls)
    brick = drawIsometricDiamond('#581c0c', (ctx) => {
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(32, 4); ctx.lineTo(8, 16); ctx.lineTo(32, 28); ctx.lineTo(56, 16); ctx.closePath();
      ctx.stroke();
    });

    // 4. Portal Tile Fallback (Glowing blue)
    portal = drawIsometricDiamond('#0f172a', (ctx) => {
      ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.beginPath();
      ctx.ellipse(32, 16, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.ellipse(32, 16, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(30, 14, 4, 4);
    });

    // 5. Flowers Tile Fallback
    flowers = drawIsometricDiamond('#1b4332', (ctx) => {
      const colors = ['#f472b6', '#fb923c', '#facc15', '#a78bfa'];
      for (let i = 0; i < 8; i++) {
        const fx = 12 + (i * 7) % 36;
        const fy = 6 + (i * 3) % 18;
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(fx, fy, 2, 2);
      }
    });

    // 6. Water Tile Fallback (Dark blue diamond)
    water = drawIsometricDiamond('#0c4a6e', (ctx) => {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(20, 12, 24, 1);
      ctx.fillRect(12, 18, 16, 1);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(28, 11, 8, 1);
    });

    // 7. Wood Floor Tile Fallback
    woodFloor = drawIsometricDiamond('#78350f', (ctx) => {
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(32, 0); ctx.lineTo(32, 32);
      ctx.moveTo(16, 8); ctx.lineTo(48, 24);
      ctx.stroke();
    });

    // 8. Fence Fallback
    fence = drawIsometricDiamond('#451a03', (ctx) => {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(30, 4, 4, 12);
    });
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

  // 7. Ambient Glow Light Generator
  const drawLightGlow = (color: string, radius: number): Texture => {
    const canvas = document.createElement('canvas');
    canvas.width = radius * 2;
    canvas.height = radius * 2;
    const ctx = canvas.getContext('2d')!;
    
    const grad = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
    grad.addColorStop(0, color);
    grad.addColorStop(0.4, color.replace('0.6)', '0.2)').replace('0.5)', '0.15)').replace('0.4)', '0.12)'));
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, radius * 2, radius * 2);
    return Texture.from(canvas);
  };

  const lightYellow = drawLightGlow('rgba(253, 224, 71, 0.4)', 64);
  const lightBlue = drawLightGlow('rgba(59, 130, 246, 0.45)', 96);
  const lightCyan = drawLightGlow('rgba(6, 182, 212, 0.55)', 128);

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
    lightYellow,
    lightBlue,
    lightCyan,
  };
};
