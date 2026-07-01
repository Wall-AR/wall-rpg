import React from 'react';
import { LobbyData } from './useLobbyData';

type GMTabProps = Pick<LobbyData,
  'gmNarration' | 'setGmNarration' | 'handleGmNarrateSubmit' |
  'gmMonsterType' | 'setGmMonsterType' | 'gmMonsterName' | 'setGmMonsterName' |
  'gmSpawnX' | 'setGmSpawnX' | 'gmSpawnY' | 'setGmSpawnY' | 'handleGmSpawnSubmit' |
  'gmQuestTitle' | 'setGmQuestTitle' | 'gmQuestDesc' | 'setGmQuestDesc' | 'handleGmQuestSubmit'
>;

export const GMTab: React.FC<GMTabProps> = ({
  gmNarration, setGmNarration, handleGmNarrateSubmit,
  gmMonsterType, setGmMonsterType, gmMonsterName, setGmMonsterName,
  gmSpawnX, setGmSpawnX, gmSpawnY, setGmSpawnY, handleGmSpawnSubmit,
  gmQuestTitle, setGmQuestTitle, gmQuestDesc, setGmQuestDesc, handleGmQuestSubmit,
}) => (
  <div className="max-w-4xl mx-auto space-y-6 font-sans">
    <h3 className="text-xl font-bold border-b border-indigo-950 pb-4 flex items-center gap-2">
      🧙‍♂️ Painel de Controle do Mestre (GM)
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Narration */}
      <div className="bg-[#16162a] border border-indigo-950 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
        <div className="space-y-1">
          <h4 className="font-bold text-gray-200 text-sm">📖 Narrar Campanha</h4>
          <p className="text-[10px] text-gray-500">Envie caixas de diálogos narrativos em tempo real para a exploração dos jogadores.</p>
        </div>
        <form onSubmit={handleGmNarrateSubmit} className="space-y-3">
          <textarea required rows={4} placeholder="O céu se fecha e um estrondo faz tremer o chão da arena..."
            value={gmNarration} onChange={(e) => setGmNarration(e.target.value)}
            className="w-full bg-slate-950 border border-indigo-950 text-xs rounded-lg p-2.5 text-indigo-200 outline-none focus:border-indigo-600 transition-all resize-none"
          />
          <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-colors">
            Narrar Evento Global
          </button>
        </form>
      </div>
      {/* Monster Spawn */}
      <div className="bg-[#16162a] border border-indigo-950 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="space-y-1">
          <h4 className="font-bold text-gray-200 text-sm">👿 Materializar Ameaças</h4>
          <p className="text-[10px] text-gray-550">Spawne monstros em coordenadas específicas do Grid de lobby.</p>
        </div>
        <form onSubmit={handleGmSpawnSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] text-indigo-400 font-bold uppercase block">Nome do Monstro</label>
            <input type="text" required value={gmMonsterName} onChange={(e) => setGmMonsterName(e.target.value)}
              className="w-full bg-slate-950 border border-indigo-950 text-xs rounded-lg px-2.5 py-1.5 text-indigo-200 outline-none focus:border-indigo-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-indigo-400 font-bold uppercase block">Tipo</label>
              <select value={gmMonsterType} onChange={(e) => setGmMonsterType(e.target.value)}
                className="w-full bg-slate-950 border border-indigo-950 text-xs rounded-lg px-2.5 py-1.5 text-indigo-200 outline-none focus:border-indigo-600">
                <option value="orc">Orc</option><option value="goblin">Goblin</option>
                <option value="wolf">Lobo</option><option value="gargoyle">Gárgula</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="space-y-1">
                <label className="text-[10px] text-indigo-400 font-bold uppercase block">Grid X</label>
                <input type="number" min={0} max={23} value={gmSpawnX} onChange={(e) => setGmSpawnX(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-indigo-950 text-xs rounded-lg px-2.5 py-1.5 text-indigo-200 outline-none focus:border-indigo-600 text-center"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-indigo-400 font-bold uppercase block">Grid Y</label>
                <input type="number" min={0} max={15} value={gmSpawnY} onChange={(e) => setGmSpawnY(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-indigo-950 text-xs rounded-lg px-2.5 py-1.5 text-indigo-200 outline-none focus:border-indigo-600 text-center"
                />
              </div>
            </div>
          </div>
          <button type="submit" className="w-full py-2 bg-[#e94560] hover:bg-[#d13750] text-white font-bold rounded-lg text-xs transition-colors">
            Spawnar Monstro
          </button>
        </form>
      </div>
      {/* Quest Creation */}
      <div className="bg-[#16162a] border border-indigo-950 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="space-y-1">
          <h4 className="font-bold text-gray-200 text-sm">📜 Ativar Missões</h4>
          <p className="text-[10px] text-gray-550">Inicie missões secundárias ou de campanha com recompensas para todos.</p>
        </div>
        <form onSubmit={handleGmQuestSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] text-indigo-400 font-bold uppercase block">Título da Missão</label>
            <input type="text" required placeholder="Ex: A Fúria do Orc Místico"
              value={gmQuestTitle} onChange={(e) => setGmQuestTitle(e.target.value)}
              className="w-full bg-slate-950 border border-indigo-950 text-xs rounded-lg px-2.5 py-1.5 text-indigo-200 outline-none focus:border-indigo-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-indigo-400 font-bold uppercase block">Descrição / Tarefas</label>
            <textarea required rows={2} placeholder="Ex: Vá ao norte e derrote a criatura invocada pelo Mestre."
              value={gmQuestDesc} onChange={(e) => setGmQuestDesc(e.target.value)}
              className="w-full bg-slate-950 border border-indigo-950 text-xs rounded-lg p-2.5 text-indigo-200 outline-none focus:border-indigo-600 resize-none"
            />
          </div>
          <button type="submit" className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg text-xs transition-colors">
            Ativar Missão de Campanha
          </button>
        </form>
      </div>
    </div>
  </div>
);
