import React from 'react';

export const MenuHotkeys: React.FC = () => {
  return (
    <div className="w-full bg-[#08080f] border-t border-[#b59441]/30 py-2.5 px-6 shrink-0 z-10 text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center gap-6">
      <div className="flex items-center gap-1">
        <span className="bg-[#16162a] border border-indigo-900/60 px-1.5 py-0.5 rounded text-[#ffe082] text-[8px] font-black">Enter</span>
        <span>Selecionar</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="bg-[#16162a] border border-indigo-900/60 px-1.5 py-0.5 rounded text-[#ffe082] text-[8px] font-black">Esc</span>
        <span>Fechar</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="bg-[#16162a] border border-indigo-900/60 px-1.5 py-0.5 rounded text-[#ffe082] text-[8px] font-black">Q / E</span>
        <span>Alternar Aba</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="bg-[#16162a] border border-indigo-900/60 px-1.5 py-0.5 rounded text-[#ffe082] text-[8px] font-black">← →</span>
        <span>Navegar</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="bg-[#16162a] border border-indigo-900/60 px-1.5 py-0.5 rounded text-[#ffe082] text-[8px] font-black">X</span>
        <span>Organizar Equipe</span>
      </div>
    </div>
  );
};
