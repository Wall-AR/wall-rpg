import React, { useCallback, useRef } from 'react';
import { Application, extend, useApplication } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';

// Extend @pixi/react with the PixiJS components we want to use in JSX
extend({
  Container,
  Graphics,
});

const GameScene: React.FC = () => {
  const { app } = useApplication();

  const drawCallback = useCallback(
    (g: any) => {
      if (!app) return;
      g.clear();

      const width = app.screen.width;
      const height = app.screen.height;
      const gridSize = 50;

      // 1. Draw Grid Lines
      for (let x = 0; x < width; x += gridSize) {
        g.moveTo(x, 0);
        g.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        g.moveTo(0, y);
        g.lineTo(width, y);
      }
      g.stroke({ width: 1, color: 0x2e2e4f });

      // 2. Draw Placeholder Player (Circle in the center)
      const centerX = width / 2;
      const centerY = height / 2;
      g.circle(centerX, centerY, 20);
      g.fill({ color: 0x4f46e5 });
      g.stroke({ width: 2, color: 0xffffff });
    },
    [app]
  );

  return (
    <pixiContainer>
      <pixiGraphics draw={drawCallback} />
    </pixiContainer>
  );
};

export const GameCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] bg-[#1a1a2e] relative overflow-hidden">
      <Application
        resizeTo={containerRef}
        background="#1a1a2e"
        antialias={true}
        autoStart={true}
        sharedTicker={true}
      >
        <GameScene />
      </Application>
    </div>
  );
};

export default GameCanvas;
