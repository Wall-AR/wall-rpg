import { Texture } from 'pixi.js';

// Generates game textures programmatically using HTML Canvas
export interface GameTextures {
  grass: Texture;
  stone: Texture;
  brick: Texture;
  portal: Texture;
  playerDown: Texture;
  playerUp: Texture;
  playerLeft: Texture;
  playerRight: Texture;
  monster: Texture;
}

export const generateTextures = (): GameTextures => {
  const tileSize = 32;

  // Helper to create a canvas and context
  const createCanvas = (width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    // Disable anti-aliasing for sharp retro pixel art
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  };

  // 1. Grass Tile (Walkable)
  const grass = (() => {
    const { canvas, ctx } = createCanvas(tileSize, tileSize);
    ctx.fillStyle = '#1e3f20'; // Base dark forest green
    ctx.fillRect(0, 0, tileSize, tileSize);
    
    // Add grass blades
    ctx.fillStyle = '#2d5a27';
    for (let i = 0; i < 8; i++) {
      const x = Math.floor(Math.random() * (tileSize - 2));
      const y = Math.floor(Math.random() * (tileSize - 4));
      ctx.fillRect(x, y, 2, 4);
      ctx.fillRect(x - 1, y + 2, 4, 1);
    }
    return Texture.from(canvas);
  })();

  // 2. Stone Tile (Walkable Floor)
  const stone = (() => {
    const { canvas, ctx } = createCanvas(tileSize, tileSize);
    ctx.fillStyle = '#2b2b36'; // Base dark slate gray
    ctx.fillRect(0, 0, tileSize, tileSize);
    
    // Borders
    ctx.strokeStyle = '#3e3e4f';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, tileSize - 2, tileSize - 2);

    // Stone texture/cracks
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(4, 4, 2, 2);
    ctx.fillRect(20, 16, 3, 2);
    ctx.fillRect(10, 24, 2, 3);
    return Texture.from(canvas);
  })();

  // 3. Brick Tile (Obstacle/Wall)
  const brick = (() => {
    const { canvas, ctx } = createCanvas(tileSize, tileSize);
    ctx.fillStyle = '#4a2525'; // Brick red-brown
    ctx.fillRect(0, 0, tileSize, tileSize);
    
    // Mortar lines (grout)
    ctx.fillStyle = '#1f1f2e';
    ctx.fillRect(0, 7, tileSize, 1);
    ctx.fillRect(0, 15, tileSize, 1);
    ctx.fillRect(0, 23, tileSize, 1);
    ctx.fillRect(0, 31, tileSize, 1);
    
    // Vertical mortar lines
    ctx.fillRect(8, 0, 1, 8);
    ctx.fillRect(24, 0, 1, 8);
    ctx.fillRect(16, 8, 1, 8);
    ctx.fillRect(0, 16, 1, 8);
    ctx.fillRect(16, 16, 1, 8);
    ctx.fillRect(8, 24, 1, 8);
    ctx.fillRect(24, 24, 1, 8);
    
    return Texture.from(canvas);
  })();

  // 4. Portal Tile (Teleporter)
  const portal = (() => {
    const { canvas, ctx } = createCanvas(tileSize, tileSize);
    ctx.fillStyle = '#161233'; // Deep dark violet
    ctx.fillRect(0, 0, tileSize, tileSize);
    
    // Outer rune ring
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(tileSize / 2, tileSize / 2, 12, 0, Math.PI * 2);
    ctx.stroke();

    // Center core
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(tileSize / 2, tileSize / 2, 6, 0, Math.PI * 2);
    ctx.fill();
    
    return Texture.from(canvas);
  })();

  // 5. Player Sprites (4 directions)
  const drawPlayerBase = (ctx: CanvasRenderingContext2D) => {
    // Body (armor)
    ctx.fillStyle = '#4f46e5'; // Indigo tunic
    ctx.fillRect(8, 12, 16, 14);

    // Hands
    ctx.fillStyle = '#ffdbb5'; // Skin color
    ctx.fillRect(4, 14, 4, 6);
    ctx.fillRect(24, 14, 4, 6);

    // Boots
    ctx.fillStyle = '#1e1b4b'; // Dark boots
    ctx.fillRect(8, 26, 6, 4);
    ctx.fillRect(18, 26, 6, 4);

    // Head
    ctx.fillStyle = '#ffdbb5';
    ctx.fillRect(10, 4, 12, 10);

    // Hair
    ctx.fillStyle = '#d97706'; // Orange hair
    ctx.fillRect(8, 2, 16, 4);
    ctx.fillRect(8, 4, 3, 6);
    ctx.fillRect(21, 4, 3, 6);
  };

  const playerDown = (() => {
    const { canvas, ctx } = createCanvas(tileSize, tileSize);
    drawPlayerBase(ctx);
    // Face details: eyes looking forward
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, 8, 2, 2);
    ctx.fillRect(18, 8, 2, 2);
    ctx.fillStyle = '#312e81';
    ctx.fillRect(12, 8, 1, 2);
    ctx.fillRect(18, 8, 1, 2);
    return Texture.from(canvas);
  })();

  const playerUp = (() => {
    const { canvas, ctx } = createCanvas(tileSize, tileSize);
    drawPlayerBase(ctx);
    // Back of head has no eyes, just hair cover
    ctx.fillStyle = '#d97706';
    ctx.fillRect(10, 4, 12, 8);
    return Texture.from(canvas);
  })();

  const playerLeft = (() => {
    const { canvas, ctx } = createCanvas(tileSize, tileSize);
    // Draw facing left
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(10, 12, 12, 14);
    ctx.fillStyle = '#ffdbb5';
    ctx.fillRect(12, 4, 10, 10);
    // Face details
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(13, 8, 2, 2);
    ctx.fillStyle = '#312e81';
    ctx.fillRect(13, 8, 1, 2);
    // Hair
    ctx.fillStyle = '#d97706';
    ctx.fillRect(10, 2, 14, 4);
    ctx.fillRect(16, 4, 6, 4);
    // Boots
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(10, 26, 5, 4);
    ctx.fillRect(17, 26, 5, 4);
    return Texture.from(canvas);
  })();

  const playerRight = (() => {
    const { canvas, ctx } = createCanvas(tileSize, tileSize);
    // Draw facing right
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(10, 12, 12, 14);
    ctx.fillStyle = '#ffdbb5';
    ctx.fillRect(10, 4, 10, 10);
    // Face details
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(17, 8, 2, 2);
    ctx.fillStyle = '#312e81';
    ctx.fillRect(18, 8, 1, 2);
    // Hair
    ctx.fillStyle = '#d97706';
    ctx.fillRect(8, 2, 14, 4);
    ctx.fillRect(10, 4, 6, 4);
    // Boots
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(10, 26, 5, 4);
    ctx.fillRect(17, 26, 5, 4);
    return Texture.from(canvas);
  })();

  // 6. Monster Sprite (Orc / Goblin)
  const monster = (() => {
    const { canvas, ctx } = createCanvas(tileSize, tileSize);
    // Green body
    ctx.fillStyle = '#065f46';
    ctx.fillRect(8, 12, 16, 14);
    // Skin head
    ctx.fillStyle = '#047857';
    ctx.fillRect(10, 4, 12, 10);
    // Red glowing eyes
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(12, 8, 2, 2);
    ctx.fillRect(18, 8, 2, 2);
    // Teeth
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(13, 12, 1, 2);
    ctx.fillRect(18, 12, 1, 2);
    // Boots
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(8, 26, 6, 4);
    ctx.fillRect(18, 26, 6, 4);
    
    return Texture.from(canvas);
  })();

  return {
    grass,
    stone,
    brick,
    portal,
    playerDown,
    playerUp,
    playerLeft,
    playerRight,
    monster,
  };
};
