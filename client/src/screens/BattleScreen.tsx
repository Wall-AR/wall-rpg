import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../stores/auth';
import { client } from '../game/colyseus';
import './styles/battle.css';

interface BattleScreenProps {
  roomId: string | null;
  onFinishBattle: () => void;
}

interface Teammate {
  id: string;
  name: string;
  class: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  element: 'fogo' | 'agua' | 'terra' | 'vento' | 'none';
  position: 'front' | 'mid' | 'back';
  portrait: string;
  spells: { id: string; name: string; cost: number; desc: string }[];
}

export const BattleScreen: React.FC<BattleScreenProps> = ({ roomId, onFinishBattle }) => {
  const { token } = useAuthStore();
  
  // Colyseus State
  const [room, setRoom] = useState<any>(null);
  const [battleState, setBattleState] = useState<any>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Active planning states
  const [activeTeammateId, setActiveTeammateId] = useState<string>('char-lyria');
  const [selectedSpellId, setSelectedSpellId] = useState<string>('nova-astral');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('opp-nyxara');
  const [timerSeconds, setTimerSeconds] = useState(12);

  // Resolution simulation state
  // -1: Planning Phase, 0..5: Active Action steps, 6: Resolution Ended
  const [resolutionStep, setResolutionStep] = useState<number>(-1);
  const [stepTimer, setStepTimer] = useState<number>(0);

  // Character positions on isometric arena
  const [positions, setPositions] = useState<Record<string, 'front' | 'mid' | 'back'>>({
    'char-caelum': 'front',
    'char-raven': 'mid',
    'char-lyria': 'back',
    'opp-korr': 'front',
    'opp-lobo': 'mid',
    'opp-nyxara': 'back',
  });

  // Action log planning simulation
  const [actionLog, setActionLog] = useState<string[]>([
    'Caelum: Defender linha de frente',
    'Lyria: Feitiço "Nova Astral"',
    'Raven: Avançar e marcar Nyxara',
    'Korr: Investida',
    'Thorn: Golpe Perfurante em Raven',
    'Nyxara: Maldição Sombria',
  ]);

  // Teammates details (with dynamic HP/MP stats updated in resolution steps)
  const [blueTeam, setBlueTeam] = useState<Teammate[]>([
    {
      id: 'char-caelum',
      name: 'Caelum',
      class: 'Tanque',
      level: 128,
      hp: 8645,
      maxHp: 8645,
      mp: 210,
      maxMp: 280,
      element: 'fogo',
      position: 'front',
      portrait: '🛡️',
      spells: [
        { id: 'holy-barrier', name: 'Barreira Sagrada', cost: 10, desc: 'Dobra a defesa de aliados na mesma linha por 1 turno.' }
      ]
    },
    {
      id: 'char-lyria',
      name: 'Lyria',
      class: 'Mago',
      level: 124,
      hp: 6215,
      maxHp: 6215,
      mp: 420,
      maxMp: 650,
      element: 'none',
      position: 'back',
      portrait: '🧙‍♀️',
      spells: [
        { id: 'nova-astral', name: 'Nova Astral', cost: 4, desc: 'Causa 215% de dano mágico a todos os inimigos e aplica Vulnerável por 2 turnos. Recarga: 3 turnos.' },
        { id: 'cure', name: 'Chama Curativa', cost: 10, desc: 'Restaura HP de um companheiro ferido.' }
      ]
    },
    {
      id: 'char-raven',
      name: 'Raven',
      class: 'Assassino',
      level: 127,
      hp: 6085,
      maxHp: 6085,
      mp: 200,
      maxMp: 260,
      element: 'terra',
      position: 'mid',
      portrait: '🥷',
      spells: [
        { id: 'shadow-strike', name: 'Golpe Sombrio', cost: 15, desc: 'Ataca ignorando 30% da armadura do oponente.' }
      ]
    }
  ]);

  const [redTeam, setRedTeam] = useState([
    { id: 'opp-korr', name: 'Korr', class: 'Lanceiro', level: 119, hp: 8120, maxHp: 8120, mp: 180, maxMp: 250, element: 'fogo', portrait: '🦁', active: true },
    { id: 'opp-lobo', name: 'Lobo Cinzento', class: 'Companheiro', level: 132, hp: 5980, maxHp: 5980, mp: 160, maxMp: 240, element: 'vento', portrait: '🐺', active: true },
    { id: 'opp-nyxara', name: 'Nyxara', class: 'Inimigo', level: 125, hp: 4220, maxHp: 4220, mp: 620, maxMp: 820, element: 'none', portrait: '🧙‍♀️', active: true }
  ]);

  // Connect to Colyseus BattleRoom
  useEffect(() => {
    let activeRoom: any = null;

    const connectToBattle = async () => {
      try {
        if (roomId) {
          activeRoom = await client.joinById(roomId, { token });
        } else {
          activeRoom = await client.joinOrCreate("battle", { token });
        }
        setRoom(activeRoom);

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
              };
              return obj;
            }, {}),
          });
        });
      } catch (err: any) {
        console.error("Battle room connection failed:", err);
        setConnectionError("Falha ao se conectar na arena de combate.");
      }
    };

    if (token) connectToBattle();

    return () => {
      if (activeRoom) activeRoom.leave();
    };
  }, [token, roomId]);

  // Turn preparation countdown timer simulation
  useEffect(() => {
    if (resolutionStep !== -1) return;
    const timer = setInterval(() => {
      setTimerSeconds(prev => (prev > 1 ? prev - 1 : 20));
    }, 1000);
    return () => clearInterval(timer);
  }, [resolutionStep]);

  // Trigger resolution steps when turn increases (or click manually simulated)
  const lastTurnRef = useRef<number>(1);
  useEffect(() => {
    if (battleState && battleState.turn > lastTurnRef.current) {
      // Start resolution simulation!
      setResolutionStep(0);
      lastTurnRef.current = battleState.turn;
    }
  }, [battleState?.turn]);

  // Resolution step sequencer timer (3 seconds per step)
  useEffect(() => {
    if (resolutionStep === -1 || resolutionStep >= 6) return;

    const interval = setInterval(() => {
      setResolutionStep(prev => {
        const next = prev + 1;
        if (next >= 6) {
          // Finished resolution, transition back to planning
          setTimeout(() => {
            setResolutionStep(-1);
          }, 1500);
        }
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [resolutionStep]);

  // Update dynamic HP/MP stats during resolution steps to animate gauges
  useEffect(() => {
    if (resolutionStep === 0) {
      // Lyria Nova Astral casts - deal AOE damage to red team
      setRedTeam(prev => prev.map(m => {
        if (m.id === 'opp-korr') return { ...m, hp: 7038 };
        if (m.id === 'opp-lobo') return { ...m, hp: 4844 };
        if (m.id === 'opp-nyxara') return { ...m, hp: 2768 };
        return m;
      }));
      setBlueTeam(prev => prev.map(m => {
        if (m.id === 'char-lyria') return { ...m, mp: 270 }; // spell cost
        return m;
      }));
      setActionLog(prev => [
        'Lyria conjura Nova Astral',
        'Todos os inimigos recebem dano mágico!',
        ...prev.slice(0, 4)
      ]);
    } else if (resolutionStep === 1) {
      // Raven strikes Nyxara - deal single target damage
      setRedTeam(prev => prev.map(m => {
        if (m.id === 'opp-nyxara') return { ...m, hp: 2156 };
        return m;
      }));
      setBlueTeam(prev => prev.map(m => {
        if (m.id === 'char-raven') return { ...m, mp: 80 };
        return m;
      }));
      setActionLog(prev => [
        'Raven alcança Nyxara e aplica Marca',
        ...prev.slice(0, 5)
      ]);
    } else if (resolutionStep === 2) {
      // Caelum guards
      setBlueTeam(prev => prev.map(m => {
        if (m.id === 'char-caelum') return { ...m, mp: 170 };
        return m;
      }));
      setActionLog(prev => [
        'Caelum protege a linha de frente',
        ...prev.slice(0, 5)
      ]);
    } else if (resolutionStep === 3) {
      // Korr charges
      setBlueTeam(prev => prev.map(m => {
        if (m.id === 'char-raven') return { ...m, hp: 4820 };
        return m;
      }));
      setActionLog(prev => [
        'Korr avança (Investida)',
        ...prev.slice(0, 5)
      ]);
    } else if (resolutionStep === 4) {
      // Thorn strike
      setActionLog(prev => [
        'Thorn perfura Raven',
        ...prev.slice(0, 5)
      ]);
    } else if (resolutionStep === 5) {
      // Nyxara spells
      setActionLog(prev => [
        'Nyxara sofre Interrupção',
        ...prev.slice(0, 5)
      ]);
    }
  }, [resolutionStep]);

  if (connectionError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#06060c] text-rose-400 p-6 min-h-[500px] border border-rose-955 rounded-2xl">
        <span className="text-5xl mb-4">💥</span>
        <h2 className="text-xl font-bold mb-2">Falha na Arena</h2>
        <p className="text-sm text-gray-500 mb-6">{connectionError}</p>
        <button
          onClick={onFinishBattle}
          className="px-6 py-2.5 bg-indigo-955 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 rounded-lg text-xs font-bold transition-all"
        >
          Voltar ao Mapa
        </button>
      </div>
    );
  }

  if (!room || !battleState) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#06060c] text-[#ffe082] p-6 min-h-[500px] border border-indigo-955 rounded-2xl">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ffe082] mb-4"></div>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest animate-pulse">Entrando na Batalha Dimensional...</p>
      </div>
    );
  }

  // Session parameters
  const localPlayer = battleState.players[room.sessionId];

  // Active teammate selection
  const currentTeammate = blueTeam.find(t => t.id === activeTeammateId) || blueTeam[1];
  const activeSpell = currentTeammate.spells.find(s => s.id === selectedSpellId) || currentTeammate.spells[0];

  // Confirm strategy & force start resolution simulation
  const handleConfirmStrategy = () => {
    // Force simulation for demonstration if turn-based sync delayed
    if (resolutionStep === -1) {
      setResolutionStep(0);
    }
    if (activeSpell?.id === 'cure') {
      room.send("action", { action: "spell", spellId: "cure" });
    } else {
      room.send("action", { action: "attack" });
    }
  };

  const getElementColorClass = (elem: string) => {
    return `text-element-${elem.toLowerCase()}`;
  };

  const getElementEmoji = (elem: string) => {
    if (elem === 'fogo') return '🔥';
    if (elem === 'agua') return '💧';
    if (elem === 'terra') return '🌿';
    if (elem === 'vento') return '💨';
    return '✨';
  };

  // Helper positions mappings for grid isometric
  const getCoordinates = (side: 'blue' | 'red', pos: 'front' | 'mid' | 'back') => {
    if (side === 'blue') {
      if (pos === 'front') return { x: '45%', y: '45%' };
      if (pos === 'mid') return { x: '30%', y: '52%' };
      return { x: '18%', y: '68%' }; // back
    } else {
      if (pos === 'front') return { x: '68%', y: '43%' };
      if (pos === 'mid') return { x: '58%', y: '52%' };
      return { x: '72%', y: '68%' }; // back
    }
  };

  // Switch positions
  const handleMovePosition = () => {
    if (resolutionStep !== -1) return;
    setPositions(prev => {
      const current = prev[activeTeammateId];
      const nextPos = current === 'back' ? 'mid' : current === 'mid' ? 'front' : 'back';
      return { ...prev, [activeTeammateId]: nextPos };
    });
  };

  // Status mapping colors
  const getRankBadgeClass = (rank: string) => {
    if (rank === 'S+') return 'rank-S-plus';
    if (rank === 'S') return 'rank-S';
    return 'rank-D';
  };

  // Header status label
  const isResolution = resolutionStep !== -1;

  // Blue / Red Team HP Calculations
  const blueHpSum = blueTeam.reduce((acc, t) => acc + t.hp, 0);
  const redHpSum = redTeam.reduce((acc, t) => acc + t.hp, 0);

  return (
    <div className="w-full h-full bg-[#06060c] flex flex-col p-5 border border-[#b59441]/40 rounded-3xl overflow-hidden shadow-2xl min-h-[580px] battle-container select-none">
      
      {/* ═══ 1. HEADER (Wall vs Isaac) ═══ */}
      <header className="flex justify-between items-center border-b border-indigo-950/40 pb-4 mb-4 shrink-0 relative">
        {/* Left: Blue Side (Wall) */}
        <div className="flex flex-col text-left max-w-[200px]">
          <div className="flex items-center gap-1.5">
            <span className="text-indigo-400 text-sm font-black uppercase blue-glow-text">Wall</span>
            <span className="text-[8px] text-gray-500 font-bold">Poder: 52.843</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-32 h-2 bg-slate-950 border border-indigo-950 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(blueHpSum / 20945) * 100}%` }}></div>
            </div>
            <span className="text-[8px] font-bold text-blue-400">{blueHpSum.toLocaleString()} HP</span>
          </div>
        </div>

        {/* Center: Title / Round Info */}
        <div className="text-center">
          <h2 className="text-sm font-extrabold tracking-widest text-[#ffe082] uppercase">
            {isResolution ? "Fase de Resolução" : "Batalha Dimensional"}
          </h2>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
            {isResolution ? "Resolução Automática" : "Fase de Preparação"}
          </p>
          <div className="flex justify-center items-center gap-3 mt-1.5">
            <span className="text-[9px] px-2 py-0.5 bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 font-bold rounded-full">
              Turno {battleState.turn}
            </span>

            {/* Steps Timeline Header (Mockup matched) */}
            {isResolution ? (
              <div className="flex gap-1.5 items-center">
                {Array.from({ length: 6 }).map((_, idx) => {
                  const isChecked = idx < resolutionStep;
                  const isCurrent = idx === resolutionStep;
                  return (
                    <span
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black border ${
                        isChecked ? 'bg-indigo-950 border-indigo-500 text-[#ffe082]' :
                        isCurrent ? 'bg-indigo-600 border-indigo-400 text-white animate-pulse' :
                        'bg-black/60 border-gray-800 text-gray-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="text-lg font-black text-rose-500 font-mono tracking-widest animate-pulse">
                00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}
              </span>
            )}
            <span className="text-[8px] text-gray-600 font-bold">/ 20s</span>
          </div>
        </div>

        {/* Right: Red Side (Isaac) */}
        <div className="flex flex-col text-right max-w-[200px]">
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-[8px] text-gray-500 font-bold">Poder: 51.276</span>
            <span className="text-rose-400 text-sm font-black uppercase red-glow-text">Isaac</span>
          </div>
          <div className="flex items-center gap-2 mt-1 justify-end">
            <span className="text-[8px] font-bold text-rose-400">{redHpSum.toLocaleString()} HP</span>
            <div className="w-32 h-2 bg-slate-950 border border-rose-950 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${(redHpSum / 18320) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Left-center: PA Counter */}
        <div className="absolute left-[220px] top-1/2 transform -translate-y-1/2 flex items-center gap-2 bg-[#121226]/40 border border-indigo-950/60 px-3 py-1 rounded-xl">
          <span className="text-[8px] font-bold text-indigo-400">PA:</span>
          <div className="flex gap-1">
            {Array.from({ length: 7 }).map((_, idx) => (
              <span key={idx} className={`text-xs ${idx < (isResolution ? 2 : 4) ? 'text-blue-400' : 'text-gray-700'}`}>
                ♦
              </span>
            ))}
          </div>
          <span className="text-[7px] text-gray-600 font-semibold leading-none">+1 PA em 03:12</span>
        </div>
      </header>

      {/* ═══ 2. MAIN LAYOUT (Roster + Arena + Log) ═══ */}
      <div className="flex-1 flex gap-5 min-h-0 relative mb-4">
        
        {/* Left Column: Teammates roster cards */}
        <div className="w-52 flex flex-col gap-3 shrink-0 overflow-y-auto pr-1">
          <h4 className="text-[9px] uppercase font-bold text-[#ffe082] border-b border-indigo-950/60 pb-1 mb-1">Guerreiros</h4>
          
          {blueTeam.map(t => {
            const isActive = activeTeammateId === t.id;
            return (
              <div
                key={t.id}
                onClick={() => {
                  if (isResolution) return;
                  setActiveTeammateId(t.id);
                  setSelectedSpellId(t.spells[0]?.id || '');
                }}
                className={`p-3 bg-indigo-950/10 border rounded-2xl flex flex-col gap-1.5 cursor-pointer hover:bg-indigo-950/20 transition-all ${
                  isActive ? 'pulse-selection-gold' : 'border-indigo-950'
                }`}
              >
                <div className="flex justify-between items-center text-[8px] text-gray-400 font-bold leading-none">
                  <span>Lv. {t.level}</span>
                  <span className="capitalize text-indigo-300 font-black">{t.class}</span>
                </div>
                <h5 className="font-extrabold text-[10px] text-white flex items-center gap-1.5 leading-none">
                  <span>{t.portrait}</span>
                  <span className="truncate">{t.name}</span>
                </h5>

                {/* HP/MP representation */}
                <div className="space-y-1 pt-1 border-t border-indigo-950/30">
                  <div className="flex justify-between text-[7px] text-gray-500 font-bold leading-none">
                    <span>HP</span>
                    <span className="text-emerald-400 font-extrabold">{t.hp} / {t.maxHp}</span>
                  </div>
                  <div className="w-full h-1 bg-black/60 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(t.hp / t.maxHp) * 100}%` }}></div>
                  </div>

                  <div className="flex justify-between text-[7px] text-gray-500 font-bold leading-none">
                    <span>MP</span>
                    <span className="text-blue-400 font-extrabold">{t.mp} / {t.maxMp}</span>
                  </div>
                  <div className="w-full h-1 bg-black/60 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(t.mp / t.maxMp) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center: Isometric Tactical Arena Grid */}
        <div className="flex-1 min-w-0 bg-black/35 rounded-3xl border border-indigo-950/40 relative overflow-hidden flex items-center justify-center shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="battle-arena-grid w-full h-full border-none bg-transparent">
            {/* SVG Layer for targeting paths */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-5">
              {!isResolution && (
                <>
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 2 L 10 5 L 0 8 z" fill="#f5d67b" />
                    </marker>
                  </defs>
                  {(() => {
                    const activeCoord = getCoordinates('blue', positions[activeTeammateId]);
                    const targetCoord = getCoordinates('red', positions[selectedTargetId]);
                    return (
                      <line
                        x1={activeCoord.x} y1={activeCoord.y}
                        x2={targetCoord.x} y2={targetCoord.y}
                        stroke="#f5d67b" strokeWidth="2"
                        markerEnd="url(#arrow)"
                        className="target-path-line"
                      />
                    );
                  })()}
                </>
              )}

              {/* Resolution Step 1: Draw slash path from Raven to Nyxara */}
              {resolutionStep === 1 && (
                <>
                  <defs>
                    <marker id="slash-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 10 5 L 0 8 z" fill="#60a5fa" />
                    </marker>
                  </defs>
                  {(() => {
                    const activeCoord = getCoordinates('blue', positions['char-raven']);
                    const targetCoord = getCoordinates('red', positions['opp-nyxara']);
                    return (
                      <line
                        x1={activeCoord.x} y1={activeCoord.y}
                        x2={targetCoord.x} y2={targetCoord.y}
                        stroke="#60a5fa" strokeWidth="3"
                        markerEnd="url(#slash-arrow)"
                        className="target-path-line"
                      />
                    );
                  })()}
                </>
              )}
            </svg>

            {/* ─── Blue Team circles & sprites ─── */}
            {blueTeam.map(t => {
              const pos = positions[t.id];
              const coord = getCoordinates('blue', pos);
              const isActive = activeTeammateId === t.id;
              
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    if (isResolution) return;
                    setActiveTeammateId(t.id);
                    setSelectedSpellId(t.spells[0]?.id || '');
                  }}
                  className={`placement-circle circle-blue cursor-pointer ${isActive ? 'active' : ''}`}
                  style={{ left: coord.x, top: coord.y }}
                >
                  <div className="arena-character-sprite group">
                    <span className="text-3xl filter drop-shadow-[0_2px_6px_rgba(59,130,246,0.6)] group-hover:scale-110 transition-transform">
                      {t.portrait}
                    </span>

                    {/* Step 2 animation: Caelum Barreira Guardiã Bubble */}
                    {t.id === 'char-caelum' && resolutionStep === 2 && (
                      <div className="shield-bubble" />
                    )}

                    <span className="text-[7px] font-black text-white bg-black/60 px-1 py-0.5 rounded leading-none mt-1 uppercase border border-indigo-900/60 shadow-md">
                      {t.name}
                    </span>
                  </div>

                  {/* Step 2 overlay text */}
                  {t.id === 'char-caelum' && resolutionStep === 2 && (
                    <div className="absolute -top-12 text-[#60a5fa] font-black text-[9px] uppercase tracking-wider flex flex-col items-center">
                      <span className="bg-indigo-950/90 px-1.5 py-0.5 rounded border border-indigo-800">Protegido</span>
                      <span className="text-[7px] text-indigo-300 font-bold mt-0.5">Barreira Guardiã</span>
                    </div>
                  )}

                  <span className="circle-label">{pos}</span>
                </div>
              );
            })}

            {/* ─── Red Team circles & sprites ─── */}
            {redTeam.map(t => {
              const pos = positions[t.id] as 'front' | 'mid' | 'back';
              const coord = getCoordinates('red', pos);
              const isTargeted = selectedTargetId === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    if (isResolution) return;
                    setSelectedTargetId(t.id);
                  }}
                  className={`placement-circle circle-red cursor-pointer ${isTargeted ? 'active' : ''}`}
                  style={{ left: coord.x, top: coord.y }}
                >
                  <div className="arena-character-sprite group">
                    <span className={`text-3xl filter drop-shadow-[0_2px_6px_rgba(239,68,68,0.6)] group-hover:scale-110 transition-transform ${isTargeted && !isResolution ? 'pulse-target-indicator' : ''}`}>
                      {t.portrait}
                    </span>
                    <span className="text-[7px] font-black text-rose-200 bg-black/60 px-1 py-0.5 rounded leading-none mt-1 uppercase border border-rose-955/60 shadow-md">
                      {t.name}
                    </span>
                  </div>

                  {/* Step 0 animations: Nova Astral damage and particles */}
                  {resolutionStep === 0 && (
                    <>
                      <div className="nova-astral-explosion" />
                      <div className="floating-damage text-purple-400" style={{ color: '#a855f7' }}>
                        {t.id === 'opp-korr' ? '-1.082' : t.id === 'opp-lobo' ? '-1.136' : '-1.452'}
                        <span className="block text-[7px] uppercase font-black text-purple-300 text-center leading-none mt-0.5">Vulnerável</span>
                      </div>
                    </>
                  )}

                  {/* Step 1 animation: Raven's piercing damage on Nyxara */}
                  {resolutionStep === 1 && t.id === 'opp-nyxara' && (
                    <div className="floating-damage text-blue-400" style={{ color: '#60a5fa' }}>
                      -612
                      <span className="block text-[7px] uppercase font-black text-blue-300 text-center leading-none mt-0.5">Perfuração</span>
                    </div>
                  )}

                  <span className="circle-label">{pos}</span>
                </div>
              );
            })}

            {/* Spell cast alert banner in center of Arena */}
            {resolutionStep === 0 && (
              <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/75 border border-purple-500/40 px-6 py-2.5 rounded-full text-center shadow-2xl z-20 animate-bounce">
                <span className="block text-xs font-black text-purple-300 uppercase tracking-widest leading-none">Nova Astral</span>
                <span className="text-[8px] text-gray-400 mt-1 block">Todos os inimigos recebem dano mágico!</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tactical overlays */}
        <div className="w-56 flex flex-col gap-4 shrink-0 justify-between">
          
          {/* Action log panel */}
          <div className="bg-[#121226]/40 border border-indigo-950 rounded-2xl p-4 flex-1 flex flex-col min-h-0 overflow-y-auto">
            <h4 className="text-[9px] uppercase font-bold text-[#ffe082] border-b border-indigo-950/40 pb-1 mb-2 tracking-widest leading-none">Log de Ações</h4>
            <div className="space-y-2 text-[9px] font-semibold">
              {actionLog.map((log, idx) => {
                const isBlue = log.startsWith('Caelum') || log.startsWith('Lyria') || log.startsWith('Raven');
                return (
                  <div key={idx} className={`p-1.5 rounded bg-black/20 border-l-2 ${isBlue ? 'border-blue-500 text-gray-300' : 'border-rose-500 text-rose-200'}`}>
                    {log}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Turn resolution Order panel */}
          <div className="bg-[#121226]/40 border border-indigo-950 rounded-2xl p-4 min-h-[160px] flex flex-col">
            <h4 className="text-[9px] uppercase font-bold text-[#ffe082] border-b border-indigo-950/40 pb-1 mb-2 tracking-widest leading-none">Ordem Resolução</h4>
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {[
                { id: 0, name: 'Lyria', color: 'text-indigo-400', class: 'Mago' },
                { id: 1, name: 'Raven', color: 'text-emerald-400', class: 'Assassino' },
                { id: 2, name: 'Caelum', color: 'text-blue-400', class: 'Tanque' },
                { id: 3, name: 'Korr', color: 'text-rose-400', class: 'Oponente' },
                { id: 4, name: 'Thorn', color: 'text-rose-400', class: 'Oponente' },
                { id: 5, name: 'Nyxara', color: 'text-rose-400', class: 'Oponente' }
              ].map((item, idx) => {
                const isChecked = idx < resolutionStep;
                const isCurrent = idx === resolutionStep;
                
                return (
                  <div key={idx} className="flex justify-between items-center text-[9px] font-bold border-b border-indigo-950/20 pb-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black ${isChecked ? 'text-green-400' : isCurrent ? 'text-[#ffe082] animate-pulse' : 'text-gray-600'}`}>
                        {isChecked ? '✓' : isCurrent ? '➔' : idx + 1}
                      </span>
                      <span className={item.color}>{item.name}</span>
                    </div>
                    <span className="text-[8px] text-gray-500 uppercase">{item.class}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ═══ 3. BOTTOM PANEL (Action Configuration / Resolution details) ═══ */}
      <footer className="w-full bg-[#121226]/50 border border-indigo-950 rounded-2xl p-4 shrink-0 grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
        {/* Left: Active character profile */}
        <div className="flex items-center gap-3.5 border-r border-indigo-950/60 pr-4">
          <div className="w-14 h-14 bg-black/40 border border-indigo-900/60 rounded-full flex items-center justify-center text-3xl shadow-inner relative shrink-0">
            <span className="absolute bottom-0 right-0 text-[10px] leading-none">
              {getElementEmoji(currentTeammate.element)}
            </span>
            {currentTeammate.portrait}
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-white text-sm flex items-center gap-2 leading-none">
              {currentTeammate.name}
              <span className={`text-[8px] uppercase px-1 rounded-sm ${getElementColorClass(currentTeammate.element)} font-black`}>
                {currentTeammate.element}
              </span>
            </h4>
            <span className="text-[8px] text-indigo-400 uppercase font-black tracking-wider block mt-1">Lv. {currentTeammate.level} • {currentTeammate.class}</span>
            <div className="flex gap-2 text-[8px] mt-1.5 font-bold text-gray-500">
              <span>HP: <strong className="text-emerald-400">{currentTeammate.hp}</strong></span>
              <span>MP: <strong className="text-blue-400">{currentTeammate.mp}</strong></span>
            </div>
          </div>
        </div>

        {/* Center: Selected Spell details or Resolution progress bar */}
        <div className="lg:col-span-2 border-r border-indigo-950/60 pr-4 flex flex-col justify-center min-h-[50px]">
          {isResolution ? (
            <div className="space-y-2 text-center lg:text-left">
              <span className="text-[9px] font-black uppercase text-[#ffe082] tracking-wider block leading-none">Resolução em Andamento</span>
              <div className="flex gap-2.5 items-center justify-center lg:justify-start">
                {[
                  { name: 'Lyria', portrait: '🧙‍♀️' },
                  { name: 'Raven', portrait: '🥷' },
                  { name: 'Caelum', portrait: '🛡️' },
                  { name: 'Korr', portrait: '🦁' },
                  { name: 'Thorn', portrait: '👹' },
                  { name: 'Nyxara', portrait: '🧙‍♀️' }
                ].map((item, idx) => {
                  const isChecked = idx < resolutionStep;
                  const isCurrent = idx === resolutionStep;
                  return (
                    <div
                      key={idx}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center text-lg relative ${
                        isChecked ? 'border-emerald-600 bg-emerald-950/20' :
                        isCurrent ? 'border-yellow-500 bg-yellow-950/20 ring-1 ring-yellow-500 animate-pulse' :
                        'border-indigo-950 bg-black/40 opacity-40'
                      }`}
                    >
                      <span>{item.portrait}</span>
                      {isChecked && (
                        <span className="absolute bottom-0 right-0 text-[7px] bg-emerald-800 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-black">
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <span className="block text-[8px] text-gray-500 font-bold uppercase mt-1">
                {resolutionStep === 0 && "Executando: Nova Astral de Lyria"}
                {resolutionStep === 1 && "Executando: Golpe Sombrio de Raven"}
                {resolutionStep === 2 && "Executando: Barreira Sagrada de Caelum"}
                {resolutionStep === 3 && "Executando: Investida de Korr"}
                {resolutionStep === 4 && "Executando: Golpe Perfurante de Thorn"}
                {resolutionStep === 5 && "Executando: Maldição Sombria de Nyxara"}
              </span>
            </div>
          ) : (
            activeSpell ? (
              <div className="text-left space-y-1">
                <div className="flex justify-between items-center leading-none">
                  <span className="font-extrabold text-white text-xs uppercase">{activeSpell.name}</span>
                  <span className="text-[9px] font-black text-indigo-300">Custo: {activeSpell.cost} PA</span>
                </div>
                <p className="text-[9px] text-gray-400 leading-snug">
                  {activeSpell.desc}
                </p>
              </div>
            ) : (
              <span className="text-xs text-gray-555 italic">Nenhuma habilidade selecionada</span>
            )
          )}
        </div>

        {/* Right: Command Bar Actions list / Legends in Resolution */}
        <div className="flex flex-col gap-2">
          {isResolution ? (
            /* Legends display box matching mockup during resolution */
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[7px] text-gray-500 font-bold uppercase leading-tight bg-black/20 p-2 rounded-lg border border-indigo-950/60">
              <div className="flex items-center gap-1"><span className="text-purple-400">🟣</span> Vulnerável</div>
              <div className="flex items-center gap-1"><span className="text-blue-400">🔵</span> Protegido</div>
              <div className="flex items-center gap-1"><span className="text-pink-400">🎯</span> Marca</div>
              <div className="flex items-center gap-1"><span className="text-orange-400">🗡️</span> Perfuração</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={handleMovePosition}
                  className="command-btn py-1.5 px-1 rounded-lg text-[9px] font-extrabold text-center transition-all uppercase leading-none tracking-wider"
                >
                  Mover
                </button>
                <button
                  onClick={() => {
                    setSelectedSpellId('attack');
                    setActionLog(prev => [`${currentTeammate.name}: Atacou Nyxara`, ...prev.slice(0, 5)]);
                  }}
                  className="command-btn py-1.5 px-1 rounded-lg text-[9px] font-extrabold text-center transition-all uppercase leading-none tracking-wider"
                >
                  Atacar
                </button>
                <button
                  onClick={() => setActionLog(prev => [`${currentTeammate.name}: Defender Postura`, ...prev.slice(0, 5)])}
                  className="command-btn py-1.5 px-1 rounded-lg text-[9px] font-extrabold text-center transition-all uppercase leading-none tracking-wider"
                >
                  Defender
                </button>
                <button
                  onClick={() => {
                    if (currentTeammate.spells.length > 0) {
                      setSelectedSpellId(currentTeammate.spells[0].id);
                    }
                  }}
                  className="command-btn py-1.5 px-1 rounded-lg text-[9px] font-extrabold text-center transition-all uppercase leading-none tracking-wider"
                >
                  Feitiço
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={handleConfirmStrategy}
                  className="py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black rounded-lg text-[9px] uppercase tracking-wider transition-all"
                >
                  Confirmar
                </button>
                <button
                  onClick={onFinishBattle}
                  className="py-2 bg-rose-955 hover:bg-rose-900 border border-rose-800 text-rose-300 font-extrabold rounded-lg text-[9px] uppercase tracking-wider transition-all"
                >
                  Retornar
                </button>
              </div>
            </>
          )}
        </div>
      </footer>

      {/* Very Bottom Shortcut Bar */}
      <div className="w-full text-center text-[8px] text-gray-600 font-bold uppercase tracking-widest pt-2.5 mt-2.5 border-t border-indigo-950/30">
        Enter: Selecionar | Esc: Fechar Painel | Q / E: Alternar Personagem | Tab: Ver Ordem | Espaço: Confirmar Estratégia
      </div>

    </div>
  );
};
