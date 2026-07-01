import React from 'react';
import { Character } from '../../types';

interface ProfileTabProps {
  character: Character;
  retiredList: any[];
  isDismissing: boolean;
  onDismiss: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ character, retiredList, isDismissing, onDismiss }) => (
  <div className="max-w-3xl mx-auto bg-[#16162a] border border-indigo-950 rounded-2xl p-8 space-y-8 shadow-xl">
    <div className="flex items-center gap-6 border-b border-indigo-950/80 pb-6 font-sans">
      <div className="w-20 h-20 bg-indigo-900/60 rounded-full flex items-center justify-center border-2 border-indigo-500 shadow-md">
        <span className="text-4xl">👤</span>
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-gray-100">{character.name}</h3>
        <p className="text-sm text-indigo-400 uppercase font-semibold tracking-wider">Guerreiro do Elemento {character.element}</p>
        {character.soulOrbs !== undefined && (
          <p className="text-xs text-yellow-400 font-bold flex items-center gap-1.5 pt-1">
            ✨ {character.soulOrbs} Orbes de Alma
          </p>
        )}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
      <div className="space-y-5">
        <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-300 border-b border-indigo-950 pb-2">Atributos Básicos</h4>
        <div className="space-y-3">
          <div className="flex justify-between text-sm"><span className="text-gray-400">Nível</span><span className="font-bold text-gray-200">{character.level}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-400">Experiência (XP)</span><span className="font-bold text-gray-200">{character.xp}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-400 font-medium">HP (Vida)</span><span className="font-bold text-emerald-400">{character.hp} / {character.maxHp}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-400 font-medium">MP (Magia)</span><span className="font-bold text-blue-400">{character.mp} / {character.maxMp}</span></div>
        </div>
      </div>

      <div className="space-y-5">
        <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-300 border-b border-indigo-950 pb-2">Status de Combate</h4>
        <div className="space-y-3">
          <div className="flex justify-between text-sm"><span className="text-gray-400">Força (Ataque)</span><span className="font-bold text-gray-200">{character.at}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-400">Defesa</span><span className="font-bold text-gray-200">{character.df}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-400">Velocidade</span><span className="font-bold text-gray-200">{character.speed}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-400">Nível Dragoon</span><span className="font-bold text-indigo-300">{character.dragoonLevel > 0 ? `Lvl ${character.dragoonLevel}` : 'Não Desbloqueado'}</span></div>
        </div>
      </div>
    </div>

    {/* Despedida de Guerreiro */}
    <div className="border-t border-indigo-950/80 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 font-sans">
      <div className="space-y-1 text-center md:text-left">
        <h4 className="font-bold text-gray-200">Despedida de Guerreiro</h4>
        <p className="text-xs text-gray-400 max-w-md">
          Se você desejar abrir mão deste personagem (limite de 6 ativos), poderá despedir-se dele. A experiência acumulada será convertida em <b>Orbes de Alma</b> e ele será registrado no seu Álbum.
        </p>
      </div>
      <button
        onClick={onDismiss}
        disabled={isDismissing}
        className="px-5 py-2.5 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-900/50 hover:border-rose-500 text-rose-300 text-xs font-bold rounded-lg transition-all whitespace-nowrap"
      >
        {isDismissing ? 'Despedindo...' : 'Despedir-se do Guerreiro'}
      </button>
    </div>

    {/* Álbum de Lembranças */}
    <div className="border-t border-indigo-950/80 pt-6 space-y-4 font-sans">
      <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-300">Álbum de Lembranças (Mural de Heróis)</h4>
      {retiredList.length === 0 ? (
        <p className="text-xs text-gray-500 italic">Você não se despediu de nenhum guerreiro nesta conta ainda.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {retiredList.map((ret: any) => (
            <div key={ret.id} className="p-4 bg-[#0d0d1e]/90 border border-indigo-950 rounded-xl space-y-2 relative overflow-hidden group">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-indigo-500/20 to-transparent"></div>
              <div className="flex justify-between items-start">
                <h5 className="font-bold text-gray-200 truncate pr-2">{ret.name}</h5>
                <span className="text-[9px] uppercase font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-900 px-1.5 py-0.5 rounded shrink-0">
                  {ret.element}
                </span>
              </div>
              <div className="text-[10px] text-gray-400 space-y-0.5">
                <p>Nível Aposentado: <span className="text-white font-medium">{ret.level}</span></p>
                <p>XP Acumulado: <span className="text-white font-medium">{ret.xp}</span></p>
                <p>Aposentado em: <span className="text-slate-500 font-medium">{new Date(ret.retiredAt).toLocaleDateString()}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
