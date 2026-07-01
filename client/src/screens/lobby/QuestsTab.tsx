import React from 'react';

export const QuestsTab: React.FC = () => (
  <div className="max-w-2xl mx-auto space-y-6 font-sans">
    <h3 className="text-xl font-bold border-b border-indigo-950 pb-4">Diário de Missões</h3>
    <div className="space-y-4">
      <div className="p-5 bg-[#16162a] border border-indigo-950 rounded-xl relative overflow-hidden group shadow-sm">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-500" />
        <div className="flex justify-between items-start">
          <div className="space-y-1 pl-2">
            <h4 className="font-bold text-gray-100 group-hover:text-yellow-400 transition-colors text-sm sm:text-base">A Prova de Fogo</h4>
            <p className="text-xs text-gray-400">Derrote 3 Slimes de Fogo nos arredores do coliseu.</p>
          </div>
          <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-yellow-950/60 border border-yellow-800 text-yellow-300 font-bold uppercase">Ativa</span>
        </div>
        <div className="mt-4 pt-3 border-t border-indigo-950/80 flex items-center justify-between text-[10px] text-gray-500">
          <span>Recompensa: 100 XP + Espada Rústica</span>
          <span>Progresso: 1 / 3 derrotados</span>
        </div>
      </div>
    </div>
  </div>
);
