import React, { useState } from 'react';
import { CompanionDetailScreen } from '../../CompanionDetailScreen';

export const CharactersTab: React.FC = () => {
  const [detailedCharId, setDetailedCharId] = useState<string | null>(null);

  const characterList = [
    { id: 'char-caelum', name: 'Caelum', level: 128, class: 'Tanque', status: 'Ativo' },
    { id: 'char-lyria', name: 'Lyria', level: 124, class: 'Mago', status: 'Ativo' },
    { id: 'char-raven', name: 'Raven', level: 127, class: 'Assassino', status: 'Ativo' },
    { id: 'char-seraphina', name: 'Seraphina', level: 121, class: 'Clériga', status: 'Ativo' },
    { id: 'char-lobo', name: 'Lobo Cinzento', level: 132, class: 'Companheiro', status: 'Ativo' },
    { id: 'char-korr', name: 'Korr', level: 119, class: 'Lanceiro', status: 'Ativo' }
  ];

  return (
    <div className="max-w-xl mx-auto space-y-4 font-sans mt-4 relative">
      <div className="border-b border-indigo-950/80 pb-2 flex justify-between items-center">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#ffe082]">Lista de Guerreiros</h3>
        <span className="text-[9px] text-gray-500 font-bold">Gerencie todos os seus personagens cadastrados</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-gray-300">
        {characterList.map(char => (
          <div
            key={char.id}
            onClick={() => setDetailedCharId(char.id)}
            className="p-3 bg-[#121226]/40 border border-indigo-950 hover:border-[#b59441]/40 rounded-xl flex justify-between items-center cursor-pointer transition-all hover:bg-indigo-955/15 hover:scale-101"
          >
            <div>
              <span className="font-extrabold text-white">{char.name}</span>
              <span className="block text-[8px] text-gray-500">Nível {char.level} • {char.class}</span>
            </div>
            <span className="text-[8.5px] bg-[#b59441]/20 border border-[#b59441]/40 text-[#ffe082] px-2 py-0.5 rounded font-bold uppercase">
              {char.status}
            </span>
          </div>
        ))}
      </div>

      {detailedCharId && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6">
          <CompanionDetailScreen
            characterId={detailedCharId}
            onClose={() => setDetailedCharId(null)}
          />
        </div>
      )}
    </div>
  );
};
