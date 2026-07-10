import React from 'react';

interface BattleHUDProps {
  isResolution: boolean;
  resolutionStep: number;
  timerSeconds: number;
  battleState: any;
  blueHpSum: number;
  redHpSum: number;
  opponent: any;
}

export const BattleHUD: React.FC<BattleHUDProps> = ({
  isResolution,
  resolutionStep,
  timerSeconds,
  battleState,
  blueHpSum,
  redHpSum,
  opponent,
}) => {
  return (
    <header className="flex justify-between items-center border-b border-indigo-950/40 pb-4 mb-4 shrink-0 relative">
      <div className="flex flex-col text-left max-w-[200px]">
        <div className="flex items-center gap-1.5">
          <span className="text-indigo-400 text-sm font-black uppercase blue-glow-text">Wall</span>
          <span className="text-[8px] text-gray-500 font-bold">Poder: 52.843</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-32 h-2 bg-slate-950 border border-indigo-950 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(blueHpSum / 20945) * 100}%` }}></div>
          </div>
          <span className="text-[8px] font-bold text-blue-400">{blueHpSum.toLocaleString()} HP</span>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-sm font-extrabold tracking-widest text-[#ffe082] uppercase">
          {isResolution ? "Fase de Resolução" : "Batalha Dimensional"}
        </h2>
        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
          {isResolution ? "Resolução Automática" : "Fase de Preparação"}
        </p>
        <div className="flex justify-center items-center gap-3 mt-1.5">
          <span className="text-[9px] px-2 py-0.5 bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 font-bold rounded-full">
            Turno {battleState.turn}
          </span>

          {isResolution ? (
            <div className="flex gap-1.5 items-center">
              {Array.from({ length: 6 }).map((_, idx) => {
                const isChecked = idx < resolutionStep;
                const isCurrent = idx === resolutionStep;
                return (
                  <span
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black border ${
                      isChecked ? 'bg-indigo-950 border-indigo-500 text-[#ffe082]' :
                      isCurrent ? 'bg-indigo-600 border-indigo-400 text-white animate-pulse' :
                      'bg-black/60 border-gray-800 text-gray-600'
                    }`}
                  >
                    {idx + 1}
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="text-lg font-black text-rose-500 font-mono tracking-widest animate-pulse">
              00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}
            </span>
          )}
          <span className="text-[8px] text-gray-600 font-bold">/ 20s</span>
        </div>
      </div>

      <div className="flex flex-col text-right max-w-[200px]">
        <div className="flex items-center gap-1.5 justify-end">
          <span className="text-[8px] text-gray-500 font-bold">Poder: 51.276</span>
          <span className="text-rose-400 text-sm font-black uppercase red-glow-text">{opponent?.username || "Isaac"}</span>
        </div>
        <div className="flex items-center gap-2 mt-1 justify-end">
          <span className="text-[8px] font-bold text-rose-400">{redHpSum.toLocaleString()} HP</span>
          <div className="w-32 h-2 bg-slate-950 border border-rose-950 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${(redHpSum / 18320) * 100}%` }}></div>
          </div>
        </div>
      </div>

      <div className="absolute left-[220px] top-1/2 transform -translate-y-1/2 flex items-center gap-2 bg-[#121226]/40 border border-indigo-950/60 px-3 py-1 rounded-xl">
        <span className="text-[8px] font-bold text-indigo-400">PA:</span>
        <div className="flex gap-1">
          {Array.from({ length: 7 }).map((_, idx) => (
            <span key={idx} className={`text-xs ${idx < (isResolution ? 2 : 4) ? 'text-blue-400' : 'text-gray-700'}`}>
              ♦
            </span>
          ))}
        </div>
        <span className="text-[7px] text-gray-600 font-semibold leading-none">+1 PA em 03:12</span>
      </div>
    </header>
  );
};
