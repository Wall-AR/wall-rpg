import React from 'react';

export const CharactersTab: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto space-y-4 font-sans mt-4">
      <div className="border-b border-indigo-950/80 pb-2 flex justify-between items-center">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#ffe082]">Lista de Guerreiros</h3>
        <span className="text-[9px] text-gray-500 font-bold">Gerencie todos os seus personagens cadastrados</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-gray-300">
        <div className="p-3 bg-[#121226]/40 border border-indigo-950 rounded-xl flex justify-between items-center">
          <div>
            <span className="font-extrabold text-white">Caelum</span>
            <span className="block text-[8px] text-gray-500">Nível 128 • Tanque</span>
          </div>
          <span className="text-xs bg-[#b59441]/20 border border-[#b59441]/40 text-[#ffe082] px-2 py-0.5 rounded font-bold uppercase">Ativo</span>
        </div>

        <div className="p-3 bg-[#121226]/40 border border-indigo-950 rounded-xl flex justify-between items-center">
          <div>
            <span className="font-extrabold text-white">Lyria</span>
            <span className="block text-[8px] text-gray-500">Nível 124 • Mago</span>
          </div>
          <span className="text-xs bg-[#b59441]/20 border border-[#b59441]/40 text-[#ffe082] px-2 py-0.5 rounded font-bold uppercase">Ativo</span>
        </div>
      </div>
    </div>
  );
};
