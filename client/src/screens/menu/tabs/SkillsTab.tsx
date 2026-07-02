import React from 'react';

export const SkillsTab: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-4 font-sans mt-4">
      <div className="border-b border-indigo-950/80 pb-2 flex justify-between items-center">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#ffe082]">Habilidades & Selos Dragoon</h3>
        <span className="text-[9px] text-gray-500 font-bold">Menu de Spells de Combate</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Spell 1 */}
        <div className="p-4 bg-[#121226]/40 border border-indigo-950 rounded-xl space-y-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className="text-xl bg-red-950/40 p-1 rounded">🔥</span>
              <div>
                <span className="block font-bold text-white text-xs">Cure (Chama Sagrada)</span>
                <span className="text-[8px] text-gray-500 uppercase font-black">Magia de Recuperação</span>
              </div>
            </div>
            <span className="text-[9px] font-black text-indigo-400">10 MP</span>
          </div>
          <p className="text-[9px] text-gray-400 leading-snug">
            Canaliza o calor regenerativo das chamas para curar ferimentos leves. Recupera 50 HP de um aliado.
          </p>
        </div>

        {/* Spell 2 */}
        <div className="p-4 bg-[#121226]/40 border border-indigo-950 rounded-xl space-y-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className="text-xl bg-orange-950/40 p-1 rounded">☄️</span>
              <div>
                <span className="block font-bold text-white text-xs">Explosion (Ataque Ígneo)</span>
                <span className="text-[8px] text-gray-500 uppercase font-black">Magia de Dano</span>
              </div>
            </div>
            <span className="text-[9px] font-black text-indigo-400">15 MP</span>
          </div>
          <p className="text-[9px] text-gray-400 leading-snug">
            Conjura um orbe de fogo concentrado que explode ao impacto, desferindo dano elemental alto a um oponente.
          </p>
        </div>
      </div>
    </div>
  );
};
