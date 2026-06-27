import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../stores/auth';
import { client } from '../game/colyseus';

interface BattleScreenProps {
  onFinishBattle: () => void;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({ onFinishBattle }) => {
  const { token } = useAuthStore();
  const [room, setRoom] = useState<any>(null);
  const [battleState, setBattleState] = useState<any>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<string>("cure");
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Connect to Colyseus BattleRoom
  useEffect(() => {
    let activeRoom: any = null;

    const connectToBattle = async () => {
      try {
        activeRoom = await client.joinOrCreate("battle", { token });
        setRoom(activeRoom);

        // Sync state changes
        activeRoom.onStateChange((state: any) => {
          setBattleState({
            status: state.status,
            turn: state.turn,
            winnerSessionId: state.winnerSessionId,
            logs: Array.from(state.logs),
            players: Array.from(state.players.entries()).reduce((obj: any, [key, val]: any) => {
              obj[key] = {
                username: val.username,
                hp: val.hp,
                maxHp: val.maxHp,
                mp: val.mp,
                maxMp: val.maxMp,
                speed: val.speed,
                strength: val.strength,
                intelligence: val.intelligence,
                weaponElement: val.weaponElement,
                hasSelectedAction: val.hasSelectedAction,
                selectedAction: val.selectedAction,
              };
              return obj;
            }, {}),
          });
        });
      } catch (err: any) {
        console.error("Battle room connection error:", err);
        setConnectionError("Falha ao entrar na arena de combate.");
      }
    };

    if (token) {
      connectToBattle();
    }

    return () => {
      if (activeRoom) {
        activeRoom.leave();
      }
    };
  }, [token]);

  // Scroll to bottom of logs on update
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [battleState?.logs]);

  if (connectionError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0d0d1e] text-rose-400 p-6 min-h-[500px]">
        <span className="text-5xl mb-4">💥</span>
        <h2 className="text-xl font-bold mb-2">Erro de Conexão</h2>
        <p className="text-sm text-gray-400 mb-6">{connectionError}</p>
        <button
          onClick={onFinishBattle}
          className="px-6 py-2.5 bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-700 text-indigo-200 rounded-lg text-sm font-semibold transition-all"
        >
          Voltar ao Mundo
        </button>
      </div>
    );
  }

  if (!room || !battleState) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0d0d1e] text-indigo-400 p-6 min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-sm text-gray-400 font-medium">Entrando na sala de combate...</p>
      </div>
    );
  }

  const localPlayer = battleState.players[room.sessionId];
  const opponentSessionId = Object.keys(battleState.players).find(id => id !== room.sessionId);
  const opponent = opponentSessionId ? battleState.players[opponentSessionId] : null;

  const handleAction = (actionType: string, spellId?: string) => {
    room.send("action", { action: actionType, spellId });
  };

  const getElementBadge = (element: string) => {
    const el = element.toLowerCase();
    const styleMap: Record<string, { bg: string, text: string, name: string, emoji: string }> = {
      fogo: { bg: 'bg-rose-950/80', text: 'text-rose-400 border-rose-800', name: 'Fogo', emoji: '🔥' },
      agua: { bg: 'bg-cyan-950/80', text: 'text-cyan-400 border-cyan-800', name: 'Água', emoji: '💧' },
      terra: { bg: 'bg-amber-950/80', text: 'text-amber-400 border-amber-800', name: 'Terra', emoji: '🪨' },
      vento: { bg: 'bg-emerald-950/80', text: 'text-emerald-400 border-emerald-800', name: 'Vento', emoji: '🍃' },
      none: { bg: 'bg-slate-900/80', text: 'text-slate-400 border-slate-700', name: 'Neutro', emoji: '🛡️' }
    };
    const details = styleMap[el] || styleMap.none;
    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${details.bg} ${details.text} flex items-center gap-1`}>
        {details.emoji} {details.name}
      </span>
    );
  };

  // 1. Loading/Waiting Screen
  if (battleState.status === "waiting") {
    return (
      <div className="w-full h-full bg-[#0d0d1e] flex flex-col justify-between p-8 min-h-[500px] border border-indigo-900/30 rounded-xl overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent pointer-events-none"></div>

        <div className="text-center">
          <h2 className="text-2xl font-extrabold tracking-widest text-indigo-400 bg-gradient-to-r from-indigo-400 to-indigo-300 bg-clip-text">
            TELA DE APRESENTAÇÃO
          </h2>
          <p className="text-xs text-gray-500 mt-1">Carregando cartas dos desafiantes</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 justify-center items-center my-6">
          {/* Local Player Card */}
          {localPlayer && (
            <div className="w-64 h-80 rounded-2xl bg-gradient-to-b from-indigo-950/60 to-[#121228]/80 border-2 border-indigo-500/50 p-6 flex flex-col justify-between shadow-lg backdrop-blur-md relative group overflow-hidden">
              <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-indigo-500/10 blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
              <div>
                <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Desafiante</span>
                <h3 className="text-xl font-bold mt-1 text-white">{localPlayer.username}</h3>
                <div className="mt-4 space-y-1.5 text-xs text-gray-400">
                  <div className="flex justify-between"><span>Hp Máximo</span><span className="text-white font-medium">{localPlayer.maxHp} HP</span></div>
                  <div className="flex justify-between"><span>Mana Máxima</span><span className="text-white font-medium">{localPlayer.maxMp} MP</span></div>
                  <div className="flex justify-between"><span>Força (STR)</span><span className="text-white font-medium">{localPlayer.strength}</span></div>
                  <div className="flex justify-between"><span>Velocidade</span><span className="text-white font-medium">{localPlayer.speed}</span></div>
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-indigo-950 pt-4 mt-4">
                <span className="text-xs text-gray-500">Arma Encantada:</span>
                {getElementBadge(localPlayer.weaponElement)}
              </div>
            </div>
          )}

          <div className="text-3xl font-extrabold text-indigo-500 select-none">VS</div>

          {/* Opponent Card */}
          {opponent ? (
            <div className="w-64 h-80 rounded-2xl bg-gradient-to-b from-rose-950/40 to-[#121228]/80 border-2 border-rose-500/40 p-6 flex flex-col justify-between shadow-lg backdrop-blur-md relative group overflow-hidden">
              <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-rose-500/10 blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
              <div>
                <span className="text-xs text-rose-400 font-bold uppercase tracking-wider">Oponente</span>
                <h3 className="text-xl font-bold mt-1 text-white">{opponent.username}</h3>
                <div className="mt-4 space-y-1.5 text-xs text-gray-400">
                  <div className="flex justify-between"><span>Hp Máximo</span><span className="text-white font-medium">{opponent.maxHp} HP</span></div>
                  <div className="flex justify-between"><span>Mana Máxima</span><span className="text-white font-medium">{opponent.maxMp} MP</span></div>
                  <div className="flex justify-between"><span>Força (STR)</span><span className="text-white font-medium">{opponent.strength}</span></div>
                  <div className="flex justify-between"><span>Velocidade</span><span className="text-white font-medium">{opponent.speed}</span></div>
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-rose-950 pt-4 mt-4">
                <span className="text-xs text-gray-500">Arma Encantada:</span>
                {getElementBadge(opponent.weaponElement)}
              </div>
            </div>
          ) : (
            <div className="w-64 h-80 rounded-2xl border-2 border-dashed border-indigo-900/40 bg-indigo-950/10 p-6 flex flex-col justify-center items-center shadow-lg text-center backdrop-blur-sm">
              <div className="animate-pulse flex flex-col items-center">
                <span className="text-3xl mb-3">⚔️</span>
                <p className="text-sm font-semibold text-indigo-400">Aguardando Rival...</p>
                <p className="text-xs text-gray-500 mt-2">Abra outra janela ou aba do jogo para conectar</p>
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-xs text-gray-500 border-t border-indigo-950 pt-4">
          Conexão segura estabelecida via Colyseus Room.
        </div>
      </div>
    );
  }

  // Helper calculation for health width
  const getHealthPercent = (current: number, max: number) => {
    return Math.max(0, Math.min(100, (current / max) * 100));
  };

  // 2. Active Combat Screen
  return (
    <div className="w-full h-full bg-[#0b0b18] flex flex-col p-6 border border-indigo-950 rounded-xl overflow-hidden shadow-2xl min-h-[500px]">
      {/* Fighters HP / MP Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        {/* Local Player Status */}
        {localPlayer && (
          <div className="bg-[#121226]/80 border border-indigo-950 rounded-xl p-4 flex flex-col justify-between shadow-md relative">
            {localPlayer.hasSelectedAction && (
              <span className="absolute -top-2 -right-2 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500 text-black shadow-md uppercase tracking-wider animate-bounce">
                PRONTO
              </span>
            )}
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Você</span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {localPlayer.username}
                  {getElementBadge(localPlayer.weaponElement)}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-gray-400">HP: {localPlayer.hp}/{localPlayer.maxHp}</span>
              </div>
            </div>

            {/* HP Bar */}
            <div className="w-full h-3.5 bg-slate-950 border border-slate-800 rounded-full overflow-hidden mb-2">
              <div
                style={{ width: `${getHealthPercent(localPlayer.hp, localPlayer.maxHp)}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              ></div>
            </div>

            {/* MP Bar */}
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>MP: {localPlayer.mp}/{localPlayer.maxMp}</span>
              <div className="w-32 h-1.5 bg-slate-950 border border-slate-800 rounded-full overflow-hidden self-center ml-2">
                <div
                  style={{ width: `${getHealthPercent(localPlayer.mp, localPlayer.maxMp)}%` }}
                  className="h-full bg-indigo-500 transition-all duration-500"
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Opponent Status */}
        {opponent ? (
          <div className="bg-[#121226]/80 border border-rose-950/40 rounded-xl p-4 flex flex-col justify-between shadow-md relative">
            {opponent.hasSelectedAction && (
              <span className="absolute -top-2 -right-2 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500 text-black shadow-md uppercase tracking-wider">
                PRONTO
              </span>
            )}
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Rival</span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {opponent.username}
                  {getElementBadge(opponent.weaponElement)}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-gray-400">HP: {opponent.hp}/{opponent.maxHp}</span>
              </div>
            </div>

            {/* HP Bar */}
            <div className="w-full h-3.5 bg-slate-950 border border-slate-800 rounded-full overflow-hidden mb-2">
              <div
                style={{ width: `${getHealthPercent(opponent.hp, opponent.maxHp)}%` }}
                className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
              ></div>
            </div>

            {/* MP Bar */}
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>MP: {opponent.mp}/{opponent.maxMp}</span>
              <div className="w-32 h-1.5 bg-slate-950 border border-slate-800 rounded-full overflow-hidden self-center ml-2">
                <div
                  style={{ width: `${getHealthPercent(opponent.mp, opponent.maxMp)}%` }}
                  className="h-full bg-rose-500 transition-all duration-500"
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#121226]/40 border border-dashed border-indigo-950 rounded-xl p-4 flex items-center justify-center min-h-[92px]">
            <span className="text-xs text-gray-500">Rival desconectado...</span>
          </div>
        )}
      </div>

      {/* Main Panels Section: Actions & Logs */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[250px]">
        {/* Turn Choices / Control Panel */}
        <div className="lg:col-span-1 bg-[#121226] border border-indigo-950 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-indigo-500 to-transparent"></div>
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-400">Painel de Ações</h4>
              <span className="text-[10px] text-gray-500 font-semibold px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-full">
                Turno {battleState.turn}
              </span>
            </div>

            {battleState.status === "planning" && localPlayer && localPlayer.hp > 0 && !localPlayer.hasSelectedAction ? (
              <div className="space-y-4">
                {/* 1. Attack Weapon Button */}
                <button
                  onClick={() => handleAction("attack")}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.98] transition-all text-white font-bold rounded-lg text-sm shadow-lg flex items-center justify-center gap-2 border border-indigo-500/20 group"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">⚔️</span>
                  Ataque Físico
                </button>

                {/* 2. Guard Button */}
                <button
                  onClick={() => handleAction("defend")}
                  className="w-full py-3 bg-[#1e1e38] hover:bg-[#252549] text-indigo-300 font-semibold rounded-lg text-sm transition-colors border border-indigo-850 shadow-md flex items-center justify-center gap-2"
                >
                  <span>🛡️</span>
                  Defender Postura (-50%)
                </button>

                {/* 3. Spells selector & action */}
                <div className="border-t border-indigo-950 pt-4 mt-2">
                  <span className="text-xs text-gray-500 font-semibold mb-2 block">Lançar Magia:</span>
                  <div className="flex gap-2">
                    <select
                      value={selectedSpell}
                      onChange={(e) => setSelectedSpell(e.target.value)}
                      className="flex-1 bg-slate-950 border border-indigo-950 text-xs rounded-lg px-3 py-2 text-indigo-200 outline-none focus:border-indigo-600 transition-colors"
                    >
                      <option value="cure">Cura (+HP)</option>
                      <option value="fireball">Magia Elementar</option>
                    </select>
                    <button
                      onClick={() => handleAction("spell", selectedSpell)}
                      className="px-4 py-2 bg-purple-950/80 hover:bg-purple-900 border border-purple-800 text-purple-300 text-xs font-bold rounded-lg transition-colors"
                    >
                      Conjurar
                    </button>
                  </div>
                </div>
              </div>
            ) : battleState.status === "resolving" ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3"></div>
                <p className="text-xs text-indigo-400 font-semibold">Calculando forças elementais...</p>
              </div>
            ) : battleState.status === "finished" ? (
              <div className="text-center py-6">
                <span className="text-5xl block mb-3">
                  {battleState.winnerSessionId === room.sessionId ? "👑" : "💀"}
                </span>
                <h5 className="text-lg font-bold text-white mb-2">
                  {battleState.winnerSessionId === room.sessionId ? "Vitória!" : "Derrota (Desmaio)"}
                </h5>
                <p className="text-xs text-gray-400 mb-6">
                  {battleState.winnerSessionId === room.sessionId 
                    ? "Você superou seu adversário na arena de combate!" 
                    : "Você desmaiou e seus companheiros o resgataram (0 XP recebido)."}
                </p>
                <button
                  onClick={onFinishBattle}
                  className="w-full py-2.5 bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-700 text-indigo-200 text-xs font-bold rounded-lg transition-colors"
                >
                  Voltar para a Exploração
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="animate-pulse text-indigo-400 text-3xl mb-2">⏳</div>
                <p className="text-xs text-gray-400">Aguardando oponente escolher ação...</p>
              </div>
            )}
          </div>

          <div className="text-[10px] text-gray-600 text-center border-t border-indigo-950/50 pt-3">
            O dano elemental é recalculado dinamicamente no servidor.
          </div>
        </div>

        {/* Logs terminal box */}
        <div className="lg:col-span-2 bg-slate-950 border border-indigo-950 rounded-xl p-5 flex flex-col justify-between relative shadow-inner">
          <div className="flex justify-between items-center border-b border-indigo-950/40 pb-3 mb-3">
            <span className="text-xs font-bold tracking-wider text-gray-400">Relatório da Arena (Logs)</span>
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[220px] space-y-1.5 font-mono text-xs text-gray-300 pr-2">
            {battleState.logs.length === 0 ? (
              <p className="text-gray-600 italic">Nenhum evento registrado ainda...</p>
            ) : (
              battleState.logs.map((log: string, idx: number) => {
                let colorClass = 'text-gray-300';
                if (log.includes('Super Efetivo!')) colorClass = 'text-rose-400 font-semibold';
                if (log.includes('Resistido...')) colorClass = 'text-slate-500';
                if (log.includes('atacou')) colorClass = 'text-indigo-300';
                if (log.includes('Vencedor:')) colorClass = 'text-emerald-400 font-bold';
                if (log.includes('desmaiou') || log.includes('fugiu')) colorClass = 'text-rose-400 font-semibold';
                if (log.includes('Cura')) colorClass = 'text-emerald-400';
                return (
                  <div key={idx} className={`leading-relaxed border-b border-slate-900/30 pb-1 ${colorClass}`}>
                    <span className="text-indigo-900 mr-1.5">&gt;</span> {log}
                  </div>
                );
              })
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
