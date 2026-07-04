import React, { useEffect, useState, useRef } from 'react';

/**
 * EncounterContext — informação sobre o encontro que será exibida na transição.
 * Enviada pelo servidor ou construída pelo client no momento do trigger.
 */
export interface EncounterContext {
  type: 'wild' | 'duel' | 'boss';  // Tipo de encontro
  enemyName: string;                 // Nome do inimigo
  enemyLevel?: number;               // Nível (opcional para duelos)
  enemyElement?: string;             // Elemento do inimigo
  roomId: string;                    // ID da sala de batalha
}

interface BattleTransitionProps {
  encounter: EncounterContext;
  onTransitionComplete?: () => void;
  onComplete?: () => void;
}

/**
 * BattleTransition — Animação de transição entre exploração e combate.
 * 
 * Sequência de fases (inspirado em Pokémon + Legend of Dragoon):
 * 1. FLASH      → Flash branco rápido (como Pokémon GB)
 * 2. SHATTER    → Tela quebra em fragmentos com efeito de cristal
 * 3. VORTEX     → Espiral dragônica puxa para o centro
 * 4. ENCOUNTER  → Texto dramático com nome do inimigo
 * 5. FADE_OUT   → Fade para preto antes da tela de batalha
 */
export const BattleTransition: React.FC<BattleTransitionProps> = ({ encounter, onTransitionComplete, onComplete }) => {
  const [phase, setPhase] = useState<'flash' | 'shatter' | 'vortex' | 'encounter' | 'fade_out'>('flash');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleComplete = onTransitionComplete || onComplete;

  // Determine o gradiente do elemento
  const elementGradient = {
    fogo: ['#e94560', '#ff6b35'],
    agua: ['#1e90ff', '#00bfff'],
    terra: ['#8b5e3c', '#d4a574'],
    vento: ['#00e676', '#76ff03'],
    none: ['#7c3aed', '#a855f7'],
  }[encounter.enemyElement?.toLowerCase() || 'none'] || ['#7c3aed', '#a855f7'];

  const encounterLabel = {
    wild: '⚔️ ENCONTRO SELVAGEM',
    duel: '🏟️ DUELO NA ARENA',
    boss: '💀 CHEFE DE BATALHA',
  }[encounter.type];

  // ─── Phase Sequencer ─────────────────────────────────────────────────────
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('shatter'), 250));
    timers.push(setTimeout(() => setPhase('vortex'), 900));
    timers.push(setTimeout(() => setPhase('encounter'), 1800));
    timers.push(setTimeout(() => setPhase('fade_out'), 3300));
    timers.push(setTimeout(() => {
      if (handleComplete) handleComplete();
    }, 4000));
    return () => timers.forEach(clearTimeout);
  }, [handleComplete]);

  // ─── Canvas Shatter Effect ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'shatter' && phase !== 'vortex') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const SHARD_COUNT = 24;
    const shards: { x: number; y: number; w: number; h: number; vx: number; vy: number; rot: number; vr: number; opacity: number }[] = [];

    // Criar fragmentos de "cristal" que saem do centro
    for (let i = 0; i < SHARD_COUNT; i++) {
      const angle = (i / SHARD_COUNT) * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      shards.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        w: 40 + Math.random() * 80,
        h: 20 + Math.random() * 60,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.15,
        opacity: 1,
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      shards.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.rot += s.vr;
        s.opacity = Math.max(0, s.opacity - 0.012);

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.globalAlpha = s.opacity;

        // Fragmento de cristal com gradiente do elemento
        const grad = ctx.createLinearGradient(-s.w / 2, -s.h / 2, s.w / 2, s.h / 2);
        grad.addColorStop(0, elementGradient[0]);
        grad.addColorStop(1, elementGradient[1]);
        ctx.fillStyle = grad;
        
        // Forma de triângulo/cristal em vez de retângulo
        ctx.beginPath();
        ctx.moveTo(-s.w / 2, s.h / 2);
        ctx.lineTo(0, -s.h / 2);
        ctx.lineTo(s.w / 2, s.h / 2);
        ctx.closePath();
        ctx.fill();

        // Brilho na borda
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
      });

      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animId);
  }, [phase, elementGradient]);

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none select-none overflow-hidden"
      style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
    >
      {/* Phase 1: Flash branco rápido (Pokémon style) */}
      <div
        className="absolute inset-0 transition-opacity duration-200"
        style={{
          backgroundColor: '#ffffff',
          opacity: phase === 'flash' ? 1 : 0,
        }}
      />

      {/* Phase 2-3: Canvas para efeito de shatter/cristal */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: phase === 'shatter' || phase === 'vortex' ? 1 : 0 }}
      />

      {/* Phase 3: Vortex espiral (dragão) */}
      {(phase === 'vortex' || phase === 'encounter') && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full border-4 border-transparent"
            style={{
              width: phase === 'encounter' ? '200vmax' : '0',
              height: phase === 'encounter' ? '200vmax' : '0',
              background: `conic-gradient(from 0deg, ${elementGradient[0]}22, ${elementGradient[1]}44, transparent, ${elementGradient[0]}22)`,
              transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1), height 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
              animation: 'spin 2s linear infinite',
            }}
          />
        </div>
      )}

      {/* Phase 4: Encounter Text — dramático */}
      {(phase === 'encounter' || phase === 'fade_out') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          {/* Fundo escuro atrás do texto */}
          <div className="absolute inset-0 bg-black/80" />

          {/* Label do tipo de encontro */}
          <div
            className="relative text-xs font-extrabold uppercase tracking-[0.35em] px-6 py-2 rounded-full border"
            style={{
              color: elementGradient[0],
              borderColor: elementGradient[0] + '66',
              backgroundColor: elementGradient[0] + '15',
              animation: 'encounterSlideIn 0.5s ease-out forwards',
            }}
          >
            {encounterLabel}
          </div>

          {/* Nome do inimigo */}
          <h1
            className="relative text-5xl sm:text-7xl font-black uppercase tracking-wider text-white"
            style={{
              textShadow: `0 0 40px ${elementGradient[0]}88, 0 0 80px ${elementGradient[1]}44`,
              animation: 'encounterScaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s forwards',
              opacity: 0,
              transform: 'scale(0.5)',
            }}
          >
            {encounter.enemyName}
          </h1>

          {/* Nível e elemento */}
          {encounter.enemyLevel && (
            <div
              className="relative flex items-center gap-4 text-sm font-bold text-gray-400"
              style={{
                animation: 'encounterSlideIn 0.4s ease-out 0.35s forwards',
                opacity: 0,
              }}
            >
              <span>Nível {encounter.enemyLevel}</span>
              {encounter.enemyElement && (
                <>
                  <span className="text-gray-600">|</span>
                  <span className="capitalize" style={{ color: elementGradient[0] }}>
                    {encounter.enemyElement}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Barra horizontal decorativa */}
          <div
            className="relative h-[2px] rounded-full mt-2"
            style={{
              background: `linear-gradient(90deg, transparent, ${elementGradient[0]}, ${elementGradient[1]}, transparent)`,
              animation: 'encounterBarExpand 0.8s ease-out 0.25s forwards',
              width: 0,
            }}
          />
        </div>
      )}

      {/* Phase 5: Fade to black */}
      <div
        className="absolute inset-0 bg-black transition-opacity"
        style={{
          opacity: phase === 'fade_out' ? 1 : 0,
          transitionDuration: '700ms',
        }}
      />

      {/* Keyframes via inline style tag */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes encounterSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes encounterScaleIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes encounterBarExpand {
          from { width: 0; opacity: 0; }
          to { width: 300px; opacity: 1; }
        }
      `}</style>
    </div>
  );
};
