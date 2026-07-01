import React from 'react';

interface SettingsTabProps {
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ soundEnabled, setSoundEnabled, volume, setVolume }) => (
  <div className="max-w-xl mx-auto bg-[#16162a] border border-indigo-950 rounded-2xl p-8 space-y-6 shadow-xl font-sans">
    <h3 className="text-xl font-bold border-b border-indigo-950 pb-3">Configurações Gerais</h3>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-0.5">
          <div className="font-semibold text-gray-200">Efeitos Sonoros</div>
          <div className="text-xs text-gray-400">Habilita/Desabilita música e efeitos sonoros.</div>
        </div>
        <button onClick={() => setSoundEnabled(!soundEnabled)}
          className={`w-14 h-8 rounded-full transition-colors flex items-center p-1 ${soundEnabled ? 'bg-indigo-600' : 'bg-gray-800'}`}>
          <div className={`w-6 h-6 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-semibold">
          <span className="text-gray-200">Volume</span>
          <span className="text-indigo-400">{volume}%</span>
        </div>
        <input type="range" min="0" max="100" disabled={!soundEnabled} value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full h-2 bg-[#0f0f1a] rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed"
        />
      </div>
      <div className="pt-6 border-t border-[#1a1a2e] flex justify-between items-center text-xs text-gray-500">
        <span>Licença de Uso</span>
        <span>RPG de Mesa Privado v0.1.0</span>
      </div>
    </div>
  </div>
);
