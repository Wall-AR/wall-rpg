import React from 'react';

export const EquipmentTab: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto space-y-4 font-sans mt-4">
      <div className="border-b border-indigo-950/80 pb-2 flex justify-between items-center">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#ffe082]">Equipamentos Equipados</h3>
        <span className="text-[9px] text-gray-500 font-bold">Distribuição de Armaduras e Acessórios</span>
      </div>

      <div className="space-y-3">
        <div className="flex gap-4 p-3 bg-[#121226]/40 border border-indigo-950 rounded-xl items-center">
          <div className="w-10 h-10 bg-black/40 border border-indigo-950 rounded flex items-center justify-center text-xl shrink-0">⚔️</div>
          <div>
            <span className="block font-bold text-white text-xs">Espada Rúnica da Batalha</span>
            <span className="text-[8px] text-gray-550 uppercase font-black">Arma Principal (Equipado em Caelum)</span>
            <p className="text-emerald-400 font-semibold text-[9px] mt-0.5">Bônus: +90 ATK, Dano Elemental +15%</p>
          </div>
        </div>

        <div className="flex gap-4 p-3 bg-[#121226]/40 border border-indigo-950 rounded-xl items-center">
          <div className="w-10 h-10 bg-black/40 border border-indigo-950 rounded flex items-center justify-center text-xl shrink-0">🏅</div>
          <div>
            <span className="block font-bold text-white text-xs">Medalhão da Promessa</span>
            <span className="text-[8px] text-gray-550 uppercase font-black">Acessório (Equipado em Lobo Cinzento)</span>
            <p className="text-emerald-400 font-semibold text-[9px] mt-0.5">Bônus: DEF +120, HP +10%, Vínculo +20%</p>
          </div>
        </div>
      </div>
    </div>
  );
};
