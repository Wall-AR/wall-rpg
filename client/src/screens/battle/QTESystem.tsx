import React from 'react';

interface QTESystemProps {
  showQte: boolean;
  qteScale: number;
  qteResult: 'idle' | 'perfect' | 'fail' | 'miss';
  onPress: () => void;
}

export const QTESystem: React.FC<QTESystemProps> = ({ showQte, qteScale, qteResult, onPress }) => {
  if (!showQte) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-50">
      {/* QTE ADDITION COMPASS (The Legend of Dragoon style) */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onPress();
        }}
        className="relative w-28 h-28 flex items-center justify-center cursor-pointer select-none"
      >
        {/* Target Center Circle (Blue) */}
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 bg-cyan-950/70 flex items-center justify-center shadow-[0_0_10px_#22d3ee]">
          <span className="text-[6px] font-black text-cyan-300 tracking-tighter">GOLPE!</span>
        </div>

        {/* Golden Sweet Spot Ring (Target zone guide) */}
        <div className="absolute w-12 h-12 rounded-full border border-dashed border-[#ffe082]/60 animate-pulse" />

        {/* Shrinking Outer Ring (Gold) */}
        <div 
          className="absolute rounded-full border-2 border-yellow-400 shadow-[0_0_15px_#facc15] pointer-events-none"
          style={{
            width: `${qteScale * 32}px`,
            height: `${qteScale * 32}px`,
          }}
        />

        {/* Result Text Banner */}
        {qteResult !== 'idle' && (
          <div className="absolute -top-6 bg-black/80 px-2 py-0.5 rounded border border-[#b59441] animate-bounce whitespace-nowrap z-50">
            <span className={`text-[8px] font-black uppercase tracking-widest ${
              qteResult === 'perfect' ? 'text-yellow-400' : 'text-rose-400'
            }`}>
              {qteResult === 'perfect' ? '⚡ PERFEITO!' : 'FALHA...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
