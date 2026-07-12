import React from 'react';
import { Teammate, RUNES_LIST, PREP_ROSTER, getElementEmoji } from './battleTypes';

interface ConfrontationPrepProps {
  confrontationTimer: number;
  confrontationConfirmed: boolean;
  selectedLineup: string[];
  lineupPositions: Record<string, 'front' | 'mid' | 'back'>;
  lineupSlots: Record<string, number>;
  selectionLimit: number;
  occupiedTeamSlots: number[];
  mode: string;
  strategyError: string | null;
  selectedRuneId: string;
  onToggleLineupCharacter: (char: Teammate) => void;
  onConfirmLineup: () => void;
  onResetLineup: () => void;
  onSelectGridSlot: (heroId: string, gridSlot: number) => void;
  setSelectedRuneId: (id: string) => void;
  opponent: any;
}

export const ConfrontationPrep: React.FC<ConfrontationPrepProps> = ({
  confrontationTimer,
  confrontationConfirmed,
  selectedLineup,
  lineupPositions,
  lineupSlots,
  selectionLimit,
  occupiedTeamSlots,
  mode,
  strategyError,
  selectedRuneId,
  onToggleLineupCharacter,
  onConfirmLineup,
  onResetLineup,
  onSelectGridSlot,
  setSelectedRuneId,
  opponent,
}) => {
  const myTeamHpText = "18.945 / 18.945 (100%)";
  const rivalTeamHpText = "18.320 / 18.320 (100%)";
  const isSharedTeamMode = selectionLimit === 1;
  const selectedHeroId = selectedLineup[0];

  return (
    <div className="w-full bg-[#06060c] flex flex-col p-5 border border-[#b59441]/40 rounded-3xl overflow-hidden shadow-2xl min-h-[580px] confrontation-container select-none">
      
      {/* Header (Wall vs Isaac) */}
      <header className="flex justify-between items-center border-b border-indigo-950/40 pb-4 mb-4 shrink-0 relative">
        <div className="flex flex-col text-left max-w-[200px]">
          <div className="flex items-center gap-1.5">
            <span className="text-indigo-400 text-sm font-black uppercase blue-glow-text">Wall</span>
            <span className="text-[8px] text-gray-500 font-bold">Poder da Equipe 52.843</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-32 h-2 bg-slate-950 border border-indigo-950 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: '100%' }}></div>
            </div>
            <span className="text-[8px] font-bold text-blue-400">{myTeamHpText}</span>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-base font-black tracking-widest text-[#ffe082] uppercase leading-none font-sans">Preparação de Confronto</h2>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1.5">
            {isSharedTeamMode
              ? 'Escolha seu herói e uma casa livre da grade compartilhada.'
              : 'Escolha 3 de 6 combatentes e configure a formação.'}
          </p>
          <div className="flex justify-center items-center gap-2 mt-2">
            <span className="text-[9px] px-2 py-0.5 bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 font-bold rounded-full">
              {mode === 'coop' ? 'Cooperativo' : mode === 'team_pvp' ? 'PvP em Equipe' : mode === 'solo' ? 'Exploração Solo' : 'Duelo'}
            </span>
            <span className="text-lg font-black text-rose-500 font-mono tracking-widest animate-pulse">
              00:{confrontationTimer < 10 ? `0${confrontationTimer}` : confrontationTimer}
            </span>
            <span className="text-[8px] text-gray-600 font-bold">/ 20s</span>
          </div>
        </div>

        <div className="flex flex-col text-right max-w-[200px]">
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-[8px] text-gray-500 font-bold">Poder da Equipe 51.276</span>
            <span className="text-rose-400 text-sm font-black uppercase red-glow-text">Isaac</span>
          </div>
          <div className="flex items-center gap-2 mt-1 justify-end">
            <span className="text-[8px] font-bold text-rose-400">{rivalTeamHpText}</span>
            <div className="w-32 h-2 bg-slate-950 border border-rose-950 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </header>

      {/* Core Layout Columns */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4 min-h-0 relative">
        
        {/* Column 1: SUA EQUIPE (6) */}
        <div className="lg:col-span-1 border-r border-indigo-950/30 pr-4 flex flex-col justify-between overflow-y-auto">
          <div>
            <h3 className="text-[10px] font-black text-[#ffe082] uppercase tracking-widest mb-3 pb-1 border-b border-indigo-950/40 leading-none">Sua Equipe (6)</h3>
            <div className="confrontation-roster-grid">
              {PREP_ROSTER.map(c => {
                const isSelected = selectedLineup.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => onToggleLineupCharacter(c)}
                    className={`p-2.5 rounded-xl cursor-pointer text-left flex flex-col justify-between confrontation-char-card relative min-h-[110px] ${
                      isSelected ? 'selected' : ''
                    } ${confrontationConfirmed ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex justify-between items-center leading-none">
                      <span className="element-badge-mini" style={{ color: c.element === 'agua' ? '#60a5fa' : c.element === 'terra' ? '#34d399' : c.element === 'fogo' ? '#f87171' : '#a78bfa' }}>
                        {getElementEmoji(c.element)}
                      </span>
                      <span className="text-[8px] text-gray-500 font-extrabold">👑</span>
                    </div>
                    
                    <div className="text-center my-1.5">
                      <span className={`rank-badge ${c.rank === 'S+' ? 'rank-S-plus' : c.rank === 'S' ? 'rank-S' : c.rank === 'A' ? 'rank-A' : c.rank === 'D'}`}>
                        {c.rank}
                      </span>
                    </div>

                    <div className="border-t border-indigo-950/40 pt-1">
                      <span className="text-[7px] text-gray-400 font-bold block leading-none">Lv. {c.level}</span>
                      <h5 className="font-extrabold text-[9px] text-white truncate leading-none mt-0.5">{c.name}</h5>
                      <span className="text-[7px] text-gray-500 uppercase block mt-0.5">{c.class}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[7px] text-gray-500 italic mt-2">Seleção deste modo: {selectionLimit} herói(s) por jogador.</p>
        </div>

        {/* Column 2 & 3: SUA FORMAÇÃO (3/3) & RUNAS */}
        <div className="lg:col-span-2 flex flex-col justify-between px-2 gap-4">
          
          {/* Sua Formação area */}
          <div>
            <h3 className="text-[10px] font-black text-[#ffe082] uppercase tracking-widest mb-3 text-center leading-none">
              Grade Compartilhada 3×3
            </h3>

            <div className="grid grid-cols-[42px_repeat(3,minmax(0,1fr))] gap-1.5 items-stretch">
              {['Trás', 'Meio', 'Frente'].map((rowLabel, row) => (
                <React.Fragment key={rowLabel}>
                  <div className="flex items-center justify-center text-[7px] uppercase font-black text-gray-500 [writing-mode:vertical-rl] rotate-180">
                    {rowLabel}
                  </div>
                  {Array.from({ length: 3 }).map((_, column) => {
                    const gridSlot = row * 3 + column;
                    const localHeroId = Object.keys(lineupSlots).find(heroId => lineupSlots[heroId] === gridSlot);
                    const localHero = localHeroId ? PREP_ROSTER.find(hero => hero.id === localHeroId) : undefined;
                    const occupiedByAlly = occupiedTeamSlots.includes(gridSlot);
                    const isSelectedTarget = selectedHeroId && lineupSlots[selectedHeroId] === gridSlot;
                    return (
                      <button
                        type="button"
                        key={gridSlot}
                        disabled={!selectedHeroId || occupiedByAlly || confrontationConfirmed}
                        onClick={() => selectedHeroId && onSelectGridSlot(selectedHeroId, gridSlot)}
                        className={`min-h-[72px] rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          occupiedByAlly
                            ? 'border-emerald-700/60 bg-emerald-950/25 text-emerald-300'
                            : localHero
                              ? 'border-blue-400 bg-indigo-900/40 shadow-[0_0_14px_rgba(59,130,246,.25)]'
                              : isSelectedTarget
                                ? 'border-blue-500/60 bg-blue-950/20'
                                : 'border-indigo-950 bg-black/25 hover:border-indigo-600'
                        } disabled:cursor-not-allowed`}
                      >
                        {occupiedByAlly ? (
                          <><span className="text-lg">🤝</span><span className="text-[7px] font-black uppercase">Aliado</span></>
                        ) : localHero ? (
                          <>
                            <span className="text-lg">{localHero.portrait.startsWith('/') ? '⚔️' : localHero.portrait}</span>
                            <span className="text-[7px] font-black text-white truncate max-w-full px-1">{localHero.name}</span>
                          </>
                        ) : (
                          <><span className="text-[9px] text-gray-700">◇</span><span className="text-[6px] text-gray-600">Casa {gridSlot + 1}</span></>
                        )}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

            {/* Status indicators */}
            <div className="flex justify-between items-center mt-3 bg-black/25 px-3 py-1.5 rounded-lg border border-indigo-950/40 text-[8px] font-bold text-gray-400">
              <span>👥 {selectedLineup.length}/{selectionLimit} selecionado(s)</span>
              <span>{isSharedTeamMode ? '🤝 Casas dos aliados ficam bloqueadas' : '🔒 Uma unidade por casa'}</span>
            </div>
            {strategyError && (
              <div className="mt-2 rounded-lg border border-rose-800/60 bg-rose-950/30 px-3 py-2 text-[8px] font-bold text-rose-300 text-center">
                {strategyError}
              </div>
            )}
          </div>

          {/* Runas de Batalha box layout */}
          <div className="runes-container-box p-3 flex flex-col gap-2">
            <div className="text-left border-b border-indigo-950/40 pb-1 flex justify-between items-center leading-none">
              <span className="text-[8px] font-black text-[#ffe082] uppercase tracking-widest">Runas de Batalha</span>
              <span className="text-[7px] text-gray-500 font-bold uppercase">Configure suas runas. Elas ficarão ativas durante toda a batalha.</span>
            </div>

            <div className="flex justify-around items-center gap-3 py-1">
              {RUNES_LIST.map(r => {
                const isSelected = selectedRuneId === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => !confrontationConfirmed && setSelectedRuneId(r.id)}
                    className={`flex items-center gap-3.5 p-2 rounded-xl cursor-pointer transition-all flex-1 ${
                      isSelected ? 'bg-indigo-950/40 border border-indigo-850 shadow-inner' : 'border border-transparent'
                    }`}
                  >
                    <div className={`rune-circle-plate flex items-center justify-center shrink-0 ${isSelected ? 'selected' : ''}`}>
                      <span className="text-base">{r.icon}</span>
                    </div>
                    <div className="text-left min-w-0">
                      <span className="text-[8px] font-black text-white block truncate leading-none">{r.name}</span>
                      <span className="text-[6.5px] text-gray-400 block mt-0.5 leading-snug">{r.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Column 4: FORMAÇÃO DO OPONENTE */}
        <div className="lg:col-span-1 border-l border-indigo-950/30 pl-4 flex flex-col justify-between">
          <div>
            <h3 className="text-[10px] font-black text-[#ffe082] uppercase tracking-widest mb-3 pb-1 border-b border-indigo-950/40 leading-none text-right">Formação do Oponente</h3>
            
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, idx) => {
                const rivalConfirmed = opponent?.hasSelectedLineup;
                return (
                  <div
                    key={idx}
                    className={`opponent-anon-card rounded-xl p-2 flex flex-col items-center justify-around ${
                      rivalConfirmed ? 'confirmed' : ''
                    }`}
                  >
                    <span className="text-lg font-black text-rose-500 animate-pulse z-10">?</span>
                    <div className="text-center z-10">
                      <span className="text-[6px] text-gray-500 font-bold uppercase block leading-none">Combatente</span>
                      <span className="text-[6px] text-gray-500 font-bold uppercase block leading-none mt-0.5">oculto</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="text-center bg-rose-950/20 p-2.5 rounded-xl border border-rose-900/30">
              <span className="text-[8px] font-black text-rose-300 block leading-none uppercase tracking-wide">
                {opponent?.hasSelectedLineup ? " Isaac confirmou a formação! ✔" : "⚔️ Isaac confirmou 2/3"}
              </span>
            </div>

            {/* Glowing Confirm Button (Mockup matched compass blue button) */}
            <button
              onClick={onConfirmLineup}
              disabled={selectedLineup.length !== selectionLimit || selectedLineup.some(id => lineupSlots[id] === undefined) || confrontationConfirmed}
              className="w-full py-3 rounded-full text-xs font-black uppercase tracking-widest confirm-btn-glowing shadow-lg disabled:opacity-40"
            >
              {confrontationConfirmed ? "Confirmado" : "Confirmar"}
            </button>
          </div>
        </div>

      </div>

      {/* Footer shortcuts matching mockup */}
      <footer className="w-full text-center text-[7px] text-gray-600 font-bold uppercase tracking-widest pt-3 border-t border-indigo-950/30 shrink-0">
        Enter: Confirmar Formação | R: Resetar | Q / E: Alternar Personagem | Tab: Ver Regras | Esc: Cancelar
      </footer>

    </div>
  );
};
