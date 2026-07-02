import React from 'react';

export const QuestsTab: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto space-y-4 font-sans mt-4">
      <div className="border-b border-indigo-950/80 pb-2 flex justify-between items-center">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#ffe082]">Diário de Missões</h3>
        <span className="text-[9px] text-gray-500 font-bold">1 Ativa • 0 Concluídas</span>
      </div>

      <div className="space-y-4">
        {/* Quest card */}
        <div className="p-4 bg-[#121226]/40 border border-indigo-950 rounded-xl relative overflow-hidden group shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500" />
          <div className="flex justify-between items-start">
            <div className="space-y-1 pl-2">
              <h4 className="font-extrabold text-white group-hover:text-yellow-400 transition-colors text-sm">Ecos de Outra Dimensão</h4>
              <p className="text-[10px] text-gray-400 leading-snug">
                Investigue as rachaduras dimensionais na Cidade-Portal e derrote os Slimes de Fogo que emergiram do portal.
              </p>
            </div>
            <span className="text-[8px] px-2 py-0.5 rounded-full bg-yellow-950/60 border border-yellow-800 text-yellow-300 font-black uppercase">Principal</span>
          </div>
          <div className="mt-4 pt-2 border-t border-indigo-950/30 flex items-center justify-between text-[9px] text-gray-500">
            <span>Recompensa: 100 XP + 50 Ouro</span>
            <span className="text-[#ffe082]">Progresso: 1 / 3 Slimes Derrotados</span>
          </div>
        </div>
      </div>
    </div>
  );
};
