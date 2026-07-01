import React from 'react';
import { Character } from '../../types';

interface HomeTabProps {
  character: Character;
  onlineCount: number;
  onStartGame: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ character, onlineCount, onStartGame }) => (
  <div className="space-y-6 max-w-4xl mx-auto font-sans">
    <div className="p-8 rounded-2xl bg-gradient-to-r from-indigo-950 to-indigo-900/60 border border-indigo-800/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
      <div className="space-y-2 text-center md:text-left z-10">
        <h2 className="text-3xl font-extrabold tracking-wide text-indigo-300">Pronto para a Arena, {character.name}?</h2>
        <p className="text-gray-400 text-sm max-w-lg">
          Explore o mapa do mundo 2D, interaja com outros guerreiros e desafie monstros para evoluir seus poderes de Dragoon.
        </p>
      </div>
      <button
        onClick={onStartGame}
        className="px-8 py-4 bg-gradient-to-r from-[#e94560] to-[#ff6b81] hover:from-[#d13750] hover:to-[#e0546a] text-white font-bold rounded-xl shadow-lg hover:shadow-[#e94560]/30 transition-all text-base uppercase tracking-wider whitespace-nowrap scale-105 active:scale-100 z-10"
      >
        🎮 Entrar no Jogo
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-6 bg-[#16162a] border border-indigo-950 rounded-xl space-y-3 shadow-md">
        <div className="flex justify-between items-center text-gray-400">
          <span className="text-sm font-semibold uppercase tracking-wider text-indigo-300">Status Geral</span>
          <span>Lv. {character.level}</span>
        </div>
        <div className="text-3xl font-extrabold">{character.hp} HP</div>
        <div className="text-xs text-gray-400">Poder de Ataque: <span className="text-indigo-200">{character.at}</span></div>
      </div>

      <div className="p-6 bg-[#16162a] border border-indigo-950 rounded-xl space-y-3 shadow-md">
        <div className="flex justify-between items-center text-gray-400">
          <span className="text-sm font-semibold uppercase tracking-wider text-indigo-300">Elemento Dragoon</span>
          <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 uppercase font-bold">{character.element}</span>
        </div>
        <div className="text-3xl font-extrabold">{character.soulOrbs || 0} Orbes</div>
        <div className="text-xs text-gray-400">XP Acumulado: <span className="text-indigo-200">{character.xp}</span></div>
      </div>

      <div className="p-6 bg-[#16162a] border border-indigo-950 rounded-xl space-y-3 shadow-md">
        <div className="flex justify-between items-center text-gray-400">
          <span className="text-sm font-semibold uppercase tracking-wider text-indigo-300">Amigos & Duelos</span>
          <span className="text-green-400 text-xs flex items-center gap-1.5 font-bold">● Online</span>
        </div>
        <div className="text-3xl font-extrabold">{onlineCount} {onlineCount === 1 ? 'Jogador' : 'Jogadores'}</div>
        <div className="text-xs text-gray-400">Desafie amigos na aba Amigos!</div>
      </div>
    </div>
  </div>
);
