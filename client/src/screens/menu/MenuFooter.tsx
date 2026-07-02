import React from 'react';

interface MenuFooterProps {
  gold: number;
  soulOrbs: number;
  dimCrystals: number;
  meritPoints: number;
  playTime: string;
  gameDate: string;
  locationName: string;
  onOpenMemories: () => void;
}

export const MenuFooter: React.FC<MenuFooterProps> = ({
  gold, soulOrbs, dimCrystals, meritPoints,
  playTime, gameDate, locationName, onOpenMemories
}) => {
  return (
    <footer className="w-full grid grid-cols-1 md:grid-cols-4 border-t border-indigo-950/60 bg-black/50 shrink-0 z-10 text-xs text-gray-400">
      
      {/* 1. RECURSOS */}
      <div className="p-4 border-r border-indigo-950/40 space-y-2">
        <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#ffe082] mb-1">RECURSOS</h4>
        <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-gray-300">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🪙</span>
            <div>
              <span className="block text-[8px] text-gray-500 uppercase leading-none">Ouro</span>
              <span className="font-extrabold text-white">{gold.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🔮</span>
            <div>
              <span className="block text-[8px] text-gray-500 uppercase leading-none">Orbes Alma</span>
              <span className="font-extrabold text-indigo-300">{soulOrbs.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">💎</span>
            <div>
              <span className="block text-[8px] text-gray-500 uppercase leading-none">Cristais Dim.</span>
              <span className="font-extrabold text-blue-300">{dimCrystals.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">⭐</span>
            <div>
              <span className="block text-[8px] text-gray-500 uppercase leading-none">Pontos Mérito</span>
              <span className="font-extrabold text-yellow-500">{meritPoints.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MISSÃO ATUAL */}
      <div className="p-4 border-r border-indigo-950/40 space-y-1">
        <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#ffe082] mb-1">MISSÃO ATUAL</h4>
        <div className="flex items-start gap-2.5">
          <span className="text-lg mt-0.5 filter drop-shadow-[0_0_4px_rgba(99,102,241,0.4)]">🛡️</span>
          <div className="min-w-0">
            <span className="block text-[11px] font-extrabold text-white truncate uppercase">Ecos de Outra Dimensão</span>
            <p className="text-[9px] text-gray-500 leading-snug mt-0.5 line-clamp-2">
              O Distúrbio Dimensional se intensificou. Investigue as rachaduras na Cidade-Portal.
            </p>
          </div>
        </div>
      </div>

      {/* 3. LIVRO DE MEMÓRIAS */}
      <div className="p-4 border-r border-indigo-950/40 flex flex-col justify-between">
        <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#ffe082] mb-1 leading-none">LIVRO DE MEMÓRIAS</h4>
        <div className="flex items-center gap-3">
          <span className="text-2xl">📖</span>
          <div>
            <span className="block text-lg font-black text-white leading-none">24</span>
            <span className="text-[8px] text-gray-500 uppercase font-bold leading-none block mt-0.5">Companheiros Registrados</span>
          </div>
        </div>
        <button
          onClick={onOpenMemories}
          className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold underline text-left mt-1.5"
        >
          [V] Ver Companheiros
        </button>
      </div>

      {/* 4. INFORMAÇÕES */}
      <div className="p-4 space-y-1.5 text-[9px] font-semibold text-gray-300">
        <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#ffe082] mb-1">INFORMAÇÕES</h4>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500 uppercase">Tempo de Jogo</span>
            <span className="font-extrabold text-white">{playTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 uppercase">Data no Jogo</span>
            <span className="font-extrabold text-white">{gameDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 uppercase">Localização</span>
            <span className="font-extrabold text-indigo-300">{locationName}</span>
          </div>
        </div>
      </div>

    </footer>
  );
};
