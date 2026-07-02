import React from 'react';
import { CompanionCharacter } from '../useMenuData';

interface TeamTabProps {
  activeTeam: CompanionCharacter[];
  reserveTeam: CompanionCharacter[];
  selectedMemberId: string | null;
  setSelectedMemberId: (id: string) => void;
  onSwapMember: (id: string) => void;
  // Stats distribution temporary state
  availablePoints: number;
  bonusStrength: number;
  bonusDefense: number;
  bonusSpeed: number;
  setBonusStrength: React.Dispatch<React.SetStateAction<number>>;
  setBonusDefense: React.Dispatch<React.SetStateAction<number>>;
  setBonusSpeed: React.Dispatch<React.SetStateAction<number>>;
  setAvailablePoints: React.Dispatch<React.SetStateAction<number>>;
  statsSaving: boolean;
  onConfirmStats: () => void;
}

export const TeamTab: React.FC<TeamTabProps> = ({
  activeTeam, reserveTeam, selectedMemberId, setSelectedMemberId, onSwapMember,
  availablePoints, bonusStrength, bonusDefense, bonusSpeed,
  setBonusStrength, setBonusDefense, setBonusSpeed, setAvailablePoints,
  statsSaving, onConfirmStats
}) => {

  const selectedMember = [...activeTeam, ...reserveTeam].find(m => m.id === selectedMemberId) || activeTeam[0];

  const getRankBadgeClass = (rank: string) => {
    if (rank === 'S+') return 'rank-S-plus';
    if (rank === 'S') return 'rank-S';
    if (rank === 'A') return 'rank-A';
    return 'rank-D';
  };

  const getElementColorClass = (elem: string) => {
    return `text-element-${elem.toLowerCase()}`;
  };

  const getElementEmoji = (elem: string) => {
    if (elem === 'fogo') return '🔥';
    if (elem === 'agua') return '💧';
    if (elem === 'terra') return '🌿';
    if (elem === 'vento') return '💨';
    return '✨';
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
      
      {/* ─── LEFT: ATIVOS & RESERVA GRIDS ─── */}
      <div className="flex-1 flex flex-col justify-between gap-6 min-h-0 overflow-y-auto pr-1">
        
        {/* ATIVOS (6 Slots Grid) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-950/80 pb-1">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#ffe082]">ATIVOS ({activeTeam.length}/6)</h3>
            <span className="text-[9px] text-gray-500 font-bold">Companheiros ativos na arena</span>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {/* Display active slots */}
            {Array.from({ length: 6 }).map((_, idx) => {
              const char = activeTeam[idx];
              if (!char) {
                // Empty slot styling matching JRPG layout
                return (
                  <div key={`empty-${idx}`} className="aspect-[3/4] rounded-xl border border-dashed border-indigo-950/40 bg-black/10 flex flex-col items-center justify-center text-gray-600">
                    <span className="text-lg">➕</span>
                    <span className="text-[8px] font-bold uppercase mt-1">Vazio</span>
                  </div>
                );
              }

              const isSelected = selectedMemberId === char.id;

              return (
                <div
                  key={char.id}
                  onClick={() => setSelectedMemberId(char.id)}
                  className={`aspect-[3/4] rounded-xl p-3 bg-indigo-950/10 border flex flex-col justify-between transition-all cursor-pointer relative group ${
                    isSelected ? 'pulse-selection-gold bg-indigo-950/20' : 'border-indigo-950 hover:border-indigo-900'
                  }`}
                >
                  {/* Portrait Area */}
                  <div className="flex-1 flex items-center justify-center text-4xl bg-black/30 rounded-lg mb-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-1" />
                    <span className="group-hover:scale-110 transition-transform z-2">{char.portrait}</span>
                    
                    {/* Element Icon top-left */}
                    <span className="absolute top-1.5 left-1.5 text-xs bg-black/60 px-1 py-0.5 rounded leading-none">
                      {getElementEmoji(char.element)}
                    </span>

                    {/* Drag swap button top-right */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSwapMember(char.id);
                      }}
                      className="absolute top-1.5 right-1.5 text-[8px] bg-indigo-950/90 border border-indigo-800 text-indigo-300 font-bold px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-900"
                    >
                      Reservar
                    </button>
                  </div>

                  {/* Character Info footer */}
                  <div className="space-y-0.5 relative z-2">
                    <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold">
                      <span>Lv. {char.level}</span>
                      <span className={`rank-badge px-1 rounded-sm text-[8px] uppercase ${getRankBadgeClass(char.rank)}`}>
                        {char.rank}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-[11px] text-white truncate">{char.name}</h4>
                    <span className="text-[8px] text-indigo-400 font-bold block uppercase leading-none mt-0.5">
                      ⚔️ {char.class}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RESERVA */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-950/80 pb-1">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#ffe082]">RESERVA</h3>
            <span className="text-[8px] text-gray-500 italic">Companheiros prontos para revezamento</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {reserveTeam.map((char) => {
              const isSelected = selectedMemberId === char.id;
              return (
                <div
                  key={char.id}
                  onClick={() => setSelectedMemberId(char.id)}
                  className={`aspect-[3/4] rounded-xl p-3 bg-black/20 border flex flex-col justify-between opacity-80 hover:opacity-100 transition-all cursor-pointer relative group ${
                    isSelected ? 'pulse-selection-blue bg-indigo-950/20' : 'border-indigo-950 hover:border-indigo-900'
                  }`}
                >
                  {/* Portrait Area */}
                  <div className="flex-1 flex items-center justify-center text-3xl bg-black/30 rounded-lg mb-2 relative">
                    <span>{char.portrait}</span>
                    <span className="absolute top-1.5 left-1.5 text-xs bg-black/60 px-1 py-0.5 rounded leading-none">
                      {getElementEmoji(char.element)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSwapMember(char.id);
                      }}
                      className="absolute top-1.5 right-1.5 text-[8px] bg-emerald-950/90 border border-emerald-800 text-emerald-300 font-bold px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-900"
                    >
                      Ativar
                    </button>
                  </div>

                  {/* Character Info footer */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between items-center text-[8px] text-gray-500 font-bold">
                      <span>Lv. {char.level}</span>
                      <span className={`rank-badge px-1 rounded-sm text-[8px] uppercase ${getRankBadgeClass(char.rank)}`}>
                        {char.rank}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-[10px] text-gray-300 truncate">{char.name}</h4>
                    <span className="text-[7px] text-indigo-400 font-bold block uppercase leading-none mt-0.5">
                      {char.class}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[8px] text-gray-500 text-center mt-2 italic">
            Apenas 6 companheiros podem permanecer ativos na equipe de exploração.
          </p>
        </div>

      </div>

      {/* ─── RIGHT: DETAIL PANEL (Mockup matched) ─── */}
      {selectedMember && (
        <div className="w-80 bg-[#121226]/50 border border-indigo-950/80 rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-xl shrink-0 overflow-y-auto">
          
          {/* Section 1: Header */}
          <div className="flex items-start gap-4 border-b border-indigo-950/60 pb-3">
            <div className="w-16 h-16 bg-black/30 rounded-full border border-indigo-900/60 flex items-center justify-center text-3xl shadow-inner shrink-0 relative">
              <span className="absolute bottom-0 right-0 text-xs bg-black/85 px-1 rounded-sm leading-none">
                {getElementEmoji(selectedMember.element)}
              </span>
              {selectedMember.portrait}
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-white text-base truncate uppercase">{selectedMember.name}</h3>
              <p className="text-[8px] text-gray-500 leading-snug mt-0.5 italic line-clamp-2">
                {selectedMember.description}
              </p>
            </div>
          </div>

          {/* Section 2: Stats with progress bars */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase font-bold tracking-widest border-b border-indigo-950/40 pb-1">
              <span>Status Básicos</span>
              <span>Lv. {selectedMember.level}</span>
            </div>

            {/* Exp gauge */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[8px] text-gray-500 font-bold leading-none">
                <span>EXP</span>
                <span>{selectedMember.xp.toLocaleString()} / {selectedMember.maxXp.toLocaleString()}</span>
              </div>
              <div className="stat-bar-container h-1.5 rounded-full">
                <div className="stat-bar-fill h-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                  style={{ width: `${Math.min(100, (selectedMember.xp / selectedMember.maxXp) * 100)}%` }}
                />
              </div>
            </div>

            {/* HP gauge */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[8px] text-gray-500 font-bold leading-none">
                <span>❤️ HP (Vida)</span>
                <span className="text-emerald-400 font-extrabold">{selectedMember.hp} / {selectedMember.maxHp}</span>
              </div>
              <div className="stat-bar-container h-1.5 rounded-full">
                <div className="stat-bar-fill h-full bg-gradient-to-r from-emerald-600 to-emerald-500"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* MP gauge */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[8px] text-gray-500 font-bold leading-none">
                <span>💧 MP (Magia)</span>
                <span className="text-blue-400 font-extrabold">{selectedMember.mp} / {selectedMember.maxMp}</span>
              </div>
              <div className="stat-bar-container h-1.5 rounded-full">
                <div className="stat-bar-fill h-full bg-gradient-to-r from-blue-600 to-blue-500"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Numeric Stats */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1.5 text-[9px] font-semibold text-gray-300">
              <div className="flex justify-between border-b border-indigo-950/30 pb-0.5">
                <span className="text-gray-500">Raridade</span>
                <span className={`font-bold uppercase ${getRankBadgeClass(selectedMember.rank)} px-1 rounded-sm text-[8px] leading-none flex items-center`}>
                  {selectedMember.rank}
                </span>
              </div>
              <div className="flex justify-between border-b border-indigo-950/30 pb-0.5">
                <span className="text-gray-500">Elemento</span>
                <span className={`font-extrabold capitalize ${getElementColorClass(selectedMember.element)}`}>
                  {selectedMember.element}
                </span>
              </div>
              <div className="flex justify-between border-b border-indigo-950/30 pb-0.5">
                <span className="text-gray-500">Ataque (ATK)</span>
                <span className="font-extrabold text-white">
                  {selectedMember.at} 
                  {selectedMember.isPlayerChar && bonusStrength > 0 && (
                    <span className="text-emerald-400 font-black ml-1">+{bonusStrength}</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between border-b border-indigo-950/30 pb-0.5">
                <span className="text-gray-500">Defesa (DEF)</span>
                <span className="font-extrabold text-white">
                  {selectedMember.df}
                  {selectedMember.isPlayerChar && bonusDefense > 0 && (
                    <span className="text-emerald-400 font-black ml-1">+{bonusDefense}</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between border-b border-indigo-950/30 pb-0.5">
                <span className="text-gray-500">M. ATK</span>
                <span className="font-extrabold text-white">{selectedMember.mat}</span>
              </div>
              <div className="flex justify-between border-b border-indigo-950/30 pb-0.5">
                <span className="text-gray-500">Velocidade</span>
                <span className="font-extrabold text-white">
                  {selectedMember.speed}
                  {selectedMember.isPlayerChar && bonusSpeed > 0 && (
                    <span className="text-emerald-400 font-black ml-1">+{bonusSpeed}</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* ─── POINT DISTRIBUTION FOR ACTIVE PLAYER CHARACTER ─── */}
          {selectedMember.isPlayerChar && availablePoints > 0 && (
            <div className="bg-yellow-950/15 border border-yellow-900/50 p-2.5 rounded-lg space-y-2">
              <div className="flex justify-between items-center leading-none">
                <span className="text-[8px] font-bold text-yellow-400 uppercase tracking-wider">Pontos Disponíveis</span>
                <span className="text-xs font-black text-yellow-400 animate-pulse">+{availablePoints} PTS</span>
              </div>

              <div className="flex items-center justify-between text-[8px] font-bold">
                <span className="text-gray-400">FORÇA (ATK)</span>
                <div className="flex items-center gap-1.5">
                  {bonusStrength > 0 && (
                    <button onClick={() => { setBonusStrength(p => p - 1); setAvailablePoints(p => p + 1); }}
                      className="w-4 h-4 bg-slate-900 hover:bg-slate-800 border border-indigo-950 text-indigo-400 rounded flex items-center justify-center font-extrabold"
                    >-</button>
                  )}
                  <span className="text-white w-3 text-center">{bonusStrength}</span>
                  <button onClick={() => { setBonusStrength(p => p + 1); setAvailablePoints(p => p - 1); }}
                    className="w-4 h-4 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 rounded flex items-center justify-center font-extrabold"
                  >+</button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[8px] font-bold">
                <span className="text-gray-400">DEFESA</span>
                <div className="flex items-center gap-1.5">
                  {bonusDefense > 0 && (
                    <button onClick={() => { setBonusDefense(p => p - 1); setAvailablePoints(p => p + 1); }}
                      className="w-4 h-4 bg-slate-900 hover:bg-slate-800 border border-indigo-950 text-indigo-400 rounded flex items-center justify-center font-extrabold"
                    >-</button>
                  )}
                  <span className="text-white w-3 text-center">{bonusDefense}</span>
                  <button onClick={() => { setBonusDefense(p => p + 1); setAvailablePoints(p => p - 1); }}
                    className="w-4 h-4 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 rounded flex items-center justify-center font-extrabold"
                  >+</button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[8px] font-bold">
                <span className="text-gray-400">VELOCIDADE</span>
                <div className="flex items-center gap-1.5">
                  {bonusSpeed > 0 && (
                    <button onClick={() => { setBonusSpeed(p => p - 1); setAvailablePoints(p => p + 1); }}
                      className="w-4 h-4 bg-slate-900 hover:bg-slate-800 border border-indigo-950 text-indigo-400 rounded flex items-center justify-center font-extrabold"
                    >-</button>
                  )}
                  <span className="text-white w-3 text-center">{bonusSpeed}</span>
                  <button onClick={() => { setBonusSpeed(p => p + 1); setAvailablePoints(p => p - 1); }}
                    className="w-4 h-4 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 rounded flex items-center justify-center font-extrabold"
                  >+</button>
                </div>
              </div>

              {(bonusStrength > 0 || bonusDefense > 0 || bonusSpeed > 0) && (
                <button
                  onClick={onConfirmStats}
                  disabled={statsSaving}
                  className="w-full py-1 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-black font-extrabold text-[8px] uppercase tracking-wider rounded transition-all"
                >
                  {statsSaving ? 'Salvando...' : 'Confirmar Atributos'}
                </button>
              )}
            </div>
          )}

          {/* Section 3: Passive traits */}
          <div className="space-y-1.5">
            <h4 className="text-[9px] text-[#ffe082] uppercase font-bold tracking-widest border-b border-indigo-950/40 pb-0.5">Traços / Passivas</h4>
            <div className="space-y-1.5 text-[8px] leading-tight">
              {selectedMember.traits.map((t, idx) => (
                <div key={idx} className="space-y-0.5">
                  <span className="font-extrabold text-gray-200">✦ {t.name}</span>
                  <p className="text-gray-500 pl-3">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Equipped Weapon / Item */}
          {selectedMember.equippedItem && (
            <div className="space-y-1.5">
              <h4 className="text-[9px] text-[#ffe082] uppercase font-bold tracking-widest border-b border-indigo-950/40 pb-0.5">Equipado</h4>
              <div className="flex gap-2.5 p-2 bg-black/20 border border-indigo-950 rounded-lg items-center">
                <div className="w-9 h-9 bg-black/40 rounded border border-indigo-950 flex items-center justify-center text-xl shrink-0 shadow-inner">
                  {selectedMember.equippedItem.portrait}
                </div>
                <div className="min-w-0 text-[8px]">
                  <span className="block font-extrabold text-white truncate uppercase">{selectedMember.equippedItem.name}</span>
                  <span className="block text-gray-500 uppercase font-bold leading-none mt-0.5">{selectedMember.equippedItem.type}</span>
                  <p className="text-indigo-400 mt-1 font-bold">{selectedMember.equippedItem.stats}</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Lore text */}
          <div className="bg-black/20 p-2.5 border border-indigo-950/40 rounded-lg text-[8px] text-gray-500 leading-normal italic">
            "{selectedMember.lore}"
          </div>

        </div>
      )}
    </div>
  );
};
