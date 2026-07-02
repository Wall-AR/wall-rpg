import React from 'react';

export const MapTab: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto space-y-4 font-sans mt-4">
      <div className="border-b border-indigo-950/80 pb-2 flex justify-between items-center">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#ffe082]">Mapa Dimensional</h3>
        <span className="text-[9px] text-gray-500 font-bold">Cidade-Portal e Arredores</span>
      </div>

      <div className="aspect-[16/9] bg-[#0c0c16] border-2 border-indigo-950 rounded-xl relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black" />
        
        {/* Simple mock map grid */}
        <div className="absolute w-24 h-24 rounded-full border border-indigo-900/40 flex items-center justify-center animate-pulse">
          <span className="text-[9px] font-black text-indigo-400">Cidade-Portal</span>
        </div>
        
        <div className="absolute top-8 right-12 w-16 h-16 rounded-full border border-red-900/40 flex items-center justify-center">
          <span className="text-[8px] font-black text-red-500">Arena de Fogo</span>
        </div>

        <div className="absolute bottom-8 left-12 w-16 h-16 rounded-full border border-emerald-900/40 flex items-center justify-center">
          <span className="text-[8px] font-black text-emerald-500 font-bold">Floresta Veylar</span>
        </div>
        
        <span className="text-xs font-bold text-gray-550 z-1 leading-none uppercase tracking-widest">Mapa do Mundo 2D</span>
      </div>
    </div>
  );
};
