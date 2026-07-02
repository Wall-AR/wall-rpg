import React from 'react';

export const MemoryBookTab: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto space-y-4 font-sans mt-4">
      <div className="border-b border-indigo-950/80 pb-2 flex justify-between items-center">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#ffe082]">Mural de Heróis Aposentados</h3>
        <span className="text-[9px] text-gray-500 font-bold">Registro de Companheiros Despedidos</span>
      </div>

      <div className="space-y-3">
        <div className="p-4 bg-[#121226]/40 border border-indigo-950 rounded-xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-white text-xs">Veylar the Elder</span>
            <span className="text-[8px] bg-indigo-950 border border-indigo-900 text-indigo-400 font-black px-1.5 py-0.5 rounded uppercase">Vento</span>
          </div>
          <div className="flex justify-between text-[8px] text-gray-500">
            <span>Nível Aposentado: Lv. 85</span>
            <span>Aposentado em: 15/05/2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};
