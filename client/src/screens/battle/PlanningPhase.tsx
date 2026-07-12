import React from 'react';
import { Teammate, getElementEmoji, getElementColorClass } from './battleTypes';

interface PlanningPhaseProps {
  currentTeammate: Teammate;
  activeSpell: any;
  selectedSpellId: string;
  selectedTargetId: string;
  plannedActions: Record<string, { action: string; spellId?: string; targetId?: string }>;
  isResolution: boolean;
  resolutionStep: number;
  onMovePosition: () => void;
  onSelectAttack: () => void;
  onSelectDefend: () => void;
  onSelectSpell: () => void;
  onConfirmStrategy: () => void;
  onFinishBattle: () => void;
  activeTeammateId: string;
  availableMana: number;
  strategyConfirmed: boolean;
}

export const PlanningPhase: React.FC<PlanningPhaseProps> = ({
  currentTeammate,
  activeSpell,
  selectedSpellId,
  selectedTargetId,
  plannedActions,
  isResolution,
  resolutionStep,
  onMovePosition,
  onSelectAttack,
  onSelectDefend,
  onSelectSpell,
  onConfirmStrategy,
  onFinishBattle,
  activeTeammateId,
  availableMana,
  strategyConfirmed,
}) => {
  return (
    <footer className="w-full bg-[#121226]/50 border border-indigo-950 rounded-2xl p-4 shrink-0 grid grid-cols-1 lg:grid-cols-4 gap-4 items-center relative z-10">
      <div className="flex items-center gap-3.5 border-r border-indigo-950/60 pr-4">
        <div className="w-14 h-14 bg-black/40 border border-indigo-900/60 rounded-full flex items-center justify-center text-3xl shadow-inner relative shrink-0">
          <span className="absolute bottom-0 right-0 text-[10px] leading-none">
            {getElementEmoji(currentTeammate.element)}
          </span>
          {currentTeammate.portrait && (currentTeammate.portrait.startsWith('/') || currentTeammate.portrait.endsWith('.png')) ? (
            <img src={currentTeammate.portrait} alt={currentTeammate.name} className="w-10 h-10 object-contain rounded-full" />
          ) : (
            <span>{currentTeammate.portrait}</span>
          )}
        </div>
        <div className="min-w-0">
          <h4 className="font-extrabold text-white text-sm flex items-center gap-2 leading-none">
            {currentTeammate.name}
            <span className={`text-[8px] uppercase px-1 rounded-sm ${getElementColorClass(currentTeammate.element)} font-black`}>
              {currentTeammate.element}
            </span>
            {plannedActions[currentTeammate.id] && (
              <span className="text-[7.5px] bg-[#121226]/80 text-[#ffe082] font-black px-1.5 py-0.5 rounded border border-[#b59441]/40 uppercase tracking-wider">
                {plannedActions[currentTeammate.id].action === 'attack' ? '⚔️ Atacar' :
                 plannedActions[currentTeammate.id].action === 'defend' ? '🛡️ Defender' : '✨ Feitiço'}
              </span>
            )}
          </h4>
          <span className="text-[8px] text-indigo-400 uppercase font-black tracking-wider block mt-1">Lv. {currentTeammate.level} • {currentTeammate.class}</span>
          <div className="flex gap-2 text-[8px] mt-1.5 font-bold text-gray-500">
            <span>HP: <strong className="text-emerald-400">{currentTeammate.hp}</strong></span>
            <span>MP: <strong className="text-blue-400">{currentTeammate.mp}</strong></span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 border-r border-indigo-950/60 pr-4 flex flex-col justify-center min-h-[50px]">
        {isResolution ? (
          <div className="space-y-2 text-center lg:text-left">
            <span className="text-[9px] font-black uppercase text-[#ffe082] tracking-wider block leading-none">Resolução em Andamento</span>
            <div className="flex gap-2.5 items-center justify-center lg:justify-start">
              {[
                { name: 'Lyria', portrait: '🧙‍♀️' },
                { name: 'Raven', portrait: '🥷' },
                { name: 'Caelum', portrait: '🛡️' },
                { name: 'Korr', portrait: '🦁' },
                { name: 'Thorn', portrait: '👹' },
                { name: 'Nyxara', portrait: '🧙‍♀️' }
              ].map((item, idx) => {
                const isChecked = idx < resolutionStep;
                const isCurrent = idx === resolutionStep;
                return (
                  <div
                    key={idx}
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center text-lg relative ${
                      isChecked ? 'border-emerald-600 bg-emerald-950/20' :
                      isCurrent ? 'border-yellow-500 bg-yellow-950/20 ring-1 ring-yellow-500 animate-pulse' :
                      'border-indigo-950 bg-black/40 opacity-40'
                    }`}
                  >
                    <span>{item.portrait}</span>
                    {isChecked && (
                      <span className="absolute bottom-0 right-0 text-[7px] bg-emerald-800 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-black">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <span className="block text-[8px] text-gray-500 font-bold uppercase mt-1">
              {resolutionStep === 0 && "Executando: Nova Astral de Lyria"}
              {resolutionStep === 1 && "Executando: Golpe Sombrio de Raven"}
              {resolutionStep === 2 && "Executando: Barreira Sagrada de Caelum"}
              {resolutionStep === 3 && "Executando: Investida de Korr"}
            </span>
          </div>
        ) : (
          activeSpell ? (
            <div className="text-left space-y-1">
              <div className="flex justify-between items-center leading-none">
                <span className="font-extrabold text-white text-xs uppercase">{activeSpell.name}</span>
                <span className="text-[9px] font-black text-indigo-300">Custo: {activeSpell.cost} Mana</span>
              </div>
              <p className="text-[9px] text-gray-400 leading-snug">
                {activeSpell.desc}
              </p>
            </div>
          ) : (
            <span className="text-xs text-gray-555 italic">Nenhuma habilidade selecionada</span>
          )
        )}
      </div>

      <div className="flex flex-col gap-2">
        {isResolution ? (
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[7px] text-gray-500 font-bold uppercase leading-tight bg-black/20 p-2 rounded-lg border border-indigo-950/60">
            <div className="flex items-center gap-1"><span className="text-purple-400">🟣</span> Vulnerável</div>
            <div className="flex items-center gap-1"><span className="text-blue-400">🔵</span> Protegido</div>
            <div className="flex items-center gap-1"><span className="text-pink-400">🎯</span> Marca</div>
            <div className="flex items-center gap-1"><span className="text-orange-400">🗡️</span> Perfuração</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={onMovePosition}
                disabled={strategyConfirmed}
                className="command-btn py-1.5 px-1 rounded-lg text-[9px] font-extrabold text-center transition-all uppercase leading-none tracking-wider disabled:opacity-35"
              >
                Mover
              </button>
              <button
                onClick={onSelectAttack}
                disabled={strategyConfirmed}
                className="command-btn py-1.5 px-1 rounded-lg text-[9px] font-extrabold text-center transition-all uppercase leading-none tracking-wider disabled:opacity-35"
              >
                Atacar
              </button>
              <button
                onClick={onSelectDefend}
                disabled={strategyConfirmed}
                className="command-btn py-1.5 px-1 rounded-lg text-[9px] font-extrabold text-center transition-all uppercase leading-none tracking-wider disabled:opacity-35"
              >
                Defender
              </button>
              <button
                onClick={onSelectSpell}
                disabled={!activeSpell || activeSpell.cost > availableMana || strategyConfirmed}
                className="command-btn py-1.5 px-1 rounded-lg text-[9px] font-extrabold text-center transition-all uppercase leading-none tracking-wider disabled:opacity-35 disabled:cursor-not-allowed"
              >
                Feitiço
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={onConfirmStrategy}
                disabled={strategyConfirmed}
                className="py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black rounded-lg text-[9px] uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {strategyConfirmed ? 'Confirmado' : 'Confirmar'}
              </button>
              <button
                onClick={onFinishBattle}
                className="py-2 bg-rose-955 hover:bg-rose-900 border border-rose-800 text-rose-300 font-extrabold rounded-lg text-[9px] uppercase tracking-wider transition-all"
              >
                Retornar
              </button>
            </div>
          </>
        )}
      </div>
    </footer>
  );
};
