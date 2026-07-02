import React, { useState } from 'react';

export const SettingsTab: React.FC = () => {
  const [bgmVolume, setBgmVolume] = useState(70);
  const [sfxVolume, setSfxVolume] = useState(80);
  const [showDamageNumbers, setShowDamageNumbers] = useState(true);
  const [screenshake, setScreenshake] = useState(true);

  return (
    <div className="max-w-xl mx-auto bg-[#121226]/40 border border-indigo-950/80 rounded-2xl p-6 space-y-6 shadow-xl font-sans mt-4">
      <div className="border-b border-indigo-950/80 pb-2 flex justify-between items-center">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#ffe082]">Ajustes e Configurações</h3>
        <span className="text-[9px] text-gray-500 font-bold">Ajuste de performance e áudio</span>
      </div>

      <div className="space-y-5">
        {/* Audio BGM */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-semibold">
            <span className="text-gray-300">Volume da Música (BGM)</span>
            <span className="text-indigo-400">{bgmVolume}%</span>
          </div>
          <input
            type="range" min="0" max="100" value={bgmVolume} onChange={(e) => setBgmVolume(Number(e.target.value))}
            className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer accent-[#ffe082]"
          />
        </div>

        {/* Audio SFX */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-semibold">
            <span className="text-gray-300">Volume dos Efeitos (SFX)</span>
            <span className="text-indigo-400">{sfxVolume}%</span>
          </div>
          <input
            type="range" min="0" max="100" value={sfxVolume} onChange={(e) => setSfxVolume(Number(e.target.value))}
            className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer accent-[#ffe082]"
          />
        </div>

        {/* Game Switches */}
        <div className="space-y-3 pt-3 border-t border-indigo-950/30">
          <div className="flex justify-between items-center text-[10px]">
            <div>
              <span className="font-semibold text-gray-200">Exibir Números de Dano</span>
              <p className="text-[8px] text-gray-500">Mostra valores flutuantes nos acertos de combate.</p>
            </div>
            <button onClick={() => setShowDamageNumbers(!showDamageNumbers)}
              className={`w-12 h-6 rounded-full transition-colors flex items-center p-0.5 ${showDamageNumbers ? 'bg-indigo-600' : 'bg-gray-800'}`}>
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${showDamageNumbers ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex justify-between items-center text-[10px]">
            <div>
              <span className="font-semibold text-gray-200">Tremor de Tela (Screenshake)</span>
              <p className="text-[8px] text-gray-500">Habilita efeito vibratório no recebimento de ataques críticos.</p>
            </div>
            <button onClick={() => setScreenshake(!screenshake)}
              className={`w-12 h-6 rounded-full transition-colors flex items-center p-0.5 ${screenshake ? 'bg-indigo-600' : 'bg-gray-800'}`}>
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${screenshake ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-indigo-950/40 flex justify-between items-center text-[9px] text-gray-500 font-bold">
        <span>Licença do Mestre</span>
        <span>RPG de Mesa Privado v0.1.0</span>
      </div>
    </div>
  );
};
