import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../stores/auth';
import { client } from '../game/colyseus';
import { BattleTransition, EncounterContext } from '../game/BattleTransition';
import './styles/battle.css';
import './styles/confrontation.css';

interface BattleScreenProps {
  roomId: string | null;
  onFinishBattle: () => void;
}

// Teammate details mapping to JRPG mockup
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

interface Rune {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

const RUNES_LIST: Rune[] = [
  { id: 'runa-guarda', name: 'Runa da Guarda', desc: 'Primeiro personagem da linha de frente recebe escudo inicial.', icon: '🛡️' },
  { id: 'runa-furia', name: 'Runa da Fúria', desc: 'Primeiro ataque da equipe causa +10% de dano.', icon: '🔥' },
  { id: 'runa-vinculo', name: 'Runa do Vínculo', desc: 'Companheiros com afinidade recebem bônus de iniciativa.', icon: '🔗' },
  { id: 'runa-astral', name: 'Runa Astral', desc: 'Aumenta alcance de feitiços no primeiro turno.', icon: '✨' },
  { id: 'runa-retorno', name: 'Runa de Retorno', desc: 'Uma vez por batalha, evita morte fatal e deixa com 1 HP.', icon: '⏳' },
  { id: 'runa-cacada', name: 'Runa da Caçada', desc: 'Marca automaticamente o inimigo de menor HP no turno 1.', icon: '🎯' },
];

const PREP_ROSTER: Teammate[] = [
  { id: 'char-caelum', name: 'Caelum', class: 'Tanque', level: 128, hp: 8645, maxHp: 8645, mp: 210, maxMp: 280, element: 'fogo', position: 'front', portrait: '🛡️', spells: [{ id: 'holy-barrier', name: 'Barreira Sagrada', cost: 10, desc: 'Dobra a defesa de aliados na mesma linha por 1 turno.' }] },
  { id: 'char-lyria', name: 'Lyria', class: 'Mago', level: 124, hp: 6215, maxHp: 6215, mp: 420, maxMp: 650, element: 'none', position: 'back', portrait: '🧙‍♀️', spells: [{ id: 'nova-astral', name: 'Nova Astral', cost: 4, desc: 'Causa 215% de dano mágico a todos os inimigos e aplica Vulnerável por 2 turnos. Recarga: 3 turnos.' }, { id: 'cure', name: 'Chama Curativa', cost: 10, desc: 'Restaura HP de um companheiro ferido.' }] },
  { id: 'char-raven', name: 'Raven', class: 'Assassino', level: 127, hp: 6085, maxHp: 6085, mp: 200, maxMp: 260, element: 'terra', position: 'mid', portrait: '🥷', spells: [{ id: 'shadow-strike', name: 'Golpe Sombrio', cost: 15, desc: 'Ataca ignorando 30% da armadura do oponente.' }] },
  { id: 'char-lobo', name: 'Lobo Cinzento', class: 'Companheiro', level: 132, hp: 5980, maxHp: 5980, mp: 160, maxMp: 240, element: 'vento', position: 'mid', portrait: '🐺', spells: [{ id: 'wolf-bite', name: 'Mordida Voraz', cost: 10, desc: 'Ataca sangrando o alvo por 2 turnos.' }] },
  { id: 'char-seraphina', name: 'Seraphina', class: 'Guerreira', level: 120, hp: 6500, maxHp: 6500, mp: 180, maxMp: 220, element: 'terra', position: 'front', portrait: '🧝‍♀️', spells: [{ id: 'earth-smash', name: 'Impacto Sísmico', cost: 12, desc: 'Ataca atordoando o alvo no turno atual.' }] },
  { id: 'char-korr', name: 'Korr', class: 'Lanceiro', level: 119, hp: 8120, maxHp: 8120, mp: 180, maxMp: 250, element: 'fogo', position: 'front', portrait: '🦁', spells: [{ id: 'fire-charge', name: 'Investida Ígnea', cost: 12, desc: 'Avança causando dano com chance de aplicar queimadura.' }] }
];

export const BattleScreen: React.FC<BattleScreenProps> = ({ roomId, onFinishBattle }) => {
  const { token } = useAuthStore();
  
  // Colyseus State
  const [room, setRoom] = useState<any>(null);
  const [battleState, setBattleState] = useState<any>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Confrontation pre-battle states
  const [selectedLineup, setSelectedLineup] = useState<string[]>([]);
  const [lineupPositions, setLineupPositions] = useState<Record<string, 'front' | 'mid' | 'back'>>({});
  const [selectedRuneId, setSelectedRuneId] = useState<string>('runa-guarda');
  const [confrontationTimer, setConfrontationTimer] = useState<number>(20);
  const [confrontationConfirmed, setConfrontationConfirmed] = useState<boolean>(false);

  // Transition overlay state
  const [playedTransition, setPlayedTransition] = useState<boolean>(false);
  const [triggerTransition, setTriggerTransition] = useState<boolean>(false);

  // Active planning states
  const [activeTeammateId, setActiveTeammateId] = useState<string>('char-lyria');
  const [selectedSpellId, setSelectedSpellId] = useState<string>('nova-astral');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('opp-nyxara');
  const [timerSeconds, setTimerSeconds] = useState(12);

  // Resolution simulation state
  const [resolutionStep, setResolutionStep] = useState<number>(-1);

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

  // Teammates details
  const [blueTeam, setBlueTeam] = useState<Teammate[]>([
    PREP_ROSTER[0], // Caelum
    PREP_ROSTER[1], // Lyria
    PREP_ROSTER[2], // Raven
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
                hasSelectedLineup: val.hasSelectedLineup,
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

  // Pre-battle timer
  useEffect(() => {
    if (battleState?.status !== 'confrontation_prep') return;
    const timer = setInterval(() => {
      setConfrontationTimer(prev => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [battleState?.status]);

  // Turn planning countdown timer
  useEffect(() => {
    if (resolutionStep !== -1 || battleState?.status !== 'planning') return;
    const timer = setInterval(() => {
      setTimerSeconds(prev => (prev > 1 ? prev - 1 : 20));
    }, 1000);
    return () => clearInterval(timer);
  }, [resolutionStep, battleState?.status]);

  // Trigger battle transition when status changes from confrontation_prep to planning
  useEffect(() => {
    if (battleState?.status === 'planning' && !playedTransition) {
      setTriggerTransition(true);
    }
  }, [battleState?.status, playedTransition]);

  // Trigger resolution steps when turn increases
  const lastTurnRef = useRef<number>(1);
  useEffect(() => {
    if (battleState && battleState.turn > lastTurnRef.current) {
      setResolutionStep(0);
      lastTurnRef.current = battleState.turn;
    }
  }, [battleState?.turn]);

  // Resolution step timer sequencer (3s per step)
  useEffect(() => {
    if (resolutionStep === -1 || resolutionStep >= 6) return;

    const interval = setInterval(() => {
      setResolutionStep(prev => {
        const next = prev + 1;
        if (next >= 6) {
          setTimeout(() => {
            setResolutionStep(-1);
          }, 1500);
        }
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [resolutionStep]);

  // Update stats dynamically in resolution
  useEffect(() => {
    if (resolutionStep === 0) {
      setRedTeam(prev => prev.map(m => {
        if (m.id === 'opp-korr') return { ...m, hp: 7038 };
        if (m.id === 'opp-lobo') return { ...m, hp: 4844 };
        if (m.id === 'opp-nyxara') return { ...m, hp: 2768 };
        return m;
      }));
      setBlueTeam(prev => prev.map(m => {
        if (m.id === 'char-lyria') return { ...m, mp: 270 };
        return m;
      }));
      setActionLog(prev => [
        'Lyria conjura Nova Astral',
        'Todos os inimigos recebem dano mágico!',
        ...prev.slice(0, 4)
      ]);
    } else if (resolutionStep === 1) {
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
      setBlueTeam(prev => prev.map(m => {
        if (m.id === 'char-caelum') return { ...m, mp: 170 };
        return m;
      }));
      setActionLog(prev => [
        'Caelum protege a linha de frente',
        ...prev.slice(0, 5)
      ]);
    } else if (resolutionStep === 3) {
      setBlueTeam(prev => prev.map(m => {
        if (m.id === 'char-raven') return { ...m, hp: 4820 };
        return m;
      }));
      setActionLog(prev => [
        'Korr avança (Investida)',
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

  const localPlayer = battleState.players[room.sessionId];
  const opponentSessionId = Object.keys(battleState.players).find(id => id !== room.sessionId);
  const opponent = opponentSessionId ? battleState.players[opponentSessionId] : null;

  // Active teammate selection
  const currentTeammate = blueTeam.find(t => t.id === activeTeammateId) || blueTeam[1];
  const activeSpell = currentTeammate.spells.find(s => s.id === selectedSpellId) || currentTeammate.spells[0];

  const handleConfirmStrategy = () => {
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

  const getCoordinates = (side: 'blue' | 'red', pos: 'front' | 'mid' | 'back') => {
    if (side === 'blue') {
      if (pos === 'front') return { x: '45%', y: '45%' };
      if (pos === 'mid') return { x: '30%', y: '52%' };
      return { x: '18%', y: '68%' };
    } else {
      if (pos === 'front') return { x: '68%', y: '43%' };
      if (pos === 'mid') return { x: '58%', y: '52%' };
      return { x: '72%', y: '68%' };
    }
  };

  const handleMovePosition = () => {
    if (resolutionStep !== -1) return;
    setPositions(prev => {
      const current = prev[activeTeammateId];
      const nextPos = current === 'back' ? 'mid' : current === 'mid' ? 'front' : 'back';
      return { ...prev, [activeTeammateId]: nextPos };
    });
  };

  // Confrontation pre-battle lineup selection toggle
  const handleToggleLineupCharacter = (char: Teammate) => {
    if (confrontationConfirmed) return;
    if (selectedLineup.includes(char.id)) {
      setSelectedLineup(prev => prev.filter(id => id !== char.id));
      setLineupPositions(prev => {
        const copy = { ...prev };
        delete copy[char.id];
        return copy;
      });
    } else {
      if (selectedLineup.length >= 3) return;
      setSelectedLineup(prev => [...prev, char.id]);
      // Auto assign empty starting positions slots
      setLineupPositions(prev => {
        const slots: ('front' | 'mid' | 'back')[] = ['front', 'mid', 'back'];
        const occupied = Object.values(prev);
        const free = slots.find(s => !occupied.includes(s)) || 'front';
        return { ...prev, [char.id]: free };
      });
    }
  };

  // Confirm pre-battle selection
  const handleConfirmLineup = () => {
    if (selectedLineup.length !== 3) return;
    setConfrontationConfirmed(true);
    // Dynamic load chosen team to battle blueTeam state
    const chosen = PREP_ROSTER.filter(c => selectedLineup.includes(c.id));
    setBlueTeam(chosen);
    // Align starting positions mapped
    setPositions(prev => {
      const newPos = { ...prev };
      selectedLineup.forEach(id => {
        newPos[id] = lineupPositions[id];
      });
      return newPos;
    });

    room.send("choose_lineup", {
      lineup: selectedLineup,
      positions: lineupPositions,
      runeId: selectedRuneId,
    });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TELA 1: PREPARAÇÃO DE CONFRONTO (confrontation_prep)
  // ══════════════════════════════════════════════════════════════════════════
  if (battleState.status === "confrontation_prep") {
    const selectedRune = RUNES_LIST.find(r => r.id === selectedRuneId) || RUNES_LIST[0];
    
    return (
      <div className="w-full bg-[#06060c] flex flex-col p-6 border border-[#b59441]/40 rounded-3xl overflow-hidden shadow-2xl min-h-[580px] confrontation-container select-none">
        
        {/* Top Header */}
        <header className="flex justify-between items-center border-b border-indigo-950/40 pb-4 mb-5">
          <div>
            <h2 className="text-base font-black tracking-widest text-[#ffe082] uppercase leading-none">Preparação de Confronto</h2>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mt-1">Escolha 3 de seus 6 combatentes</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] px-2 py-0.5 bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 font-bold rounded-full">
              Lobby de Duelo
            </span>
            <span className="text-xl font-black text-rose-500 font-mono tracking-widest animate-pulse">
              00:{confrontationTimer < 10 ? `0${confrontationTimer}` : confrontationTimer}
            </span>
            <span className="text-[9px] text-gray-600 font-bold">/ 20s</span>
          </div>
        </header>

        {/* Core selection columns */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-5 min-h-0">
          
          {/* Left: 6 Characters roster list */}
          <div className="lg:col-span-1 border-r border-indigo-950/30 pr-5 flex flex-col gap-2.5 overflow-y-auto">
            <h3 className="text-[9px] font-bold text-[#ffe082] uppercase tracking-widest mb-1 leading-none">Seus Combatentes (6)</h3>
            <div className="confrontation-roster-grid">
              {PREP_ROSTER.map(c => {
                const isSelected = selectedLineup.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => handleToggleLineupCharacter(c)}
                    className={`p-3 rounded-2xl cursor-pointer text-left flex flex-col gap-1 confrontation-char-card ${
                      isSelected ? 'selected' : ''
                    } ${confrontationConfirmed ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex justify-between text-[7px] text-gray-500 font-bold leading-none">
                      <span>Lv. {c.level}</span>
                      <span className="text-blue-400 capitalize">{c.element}</span>
                    </div>
                    <span className="text-2xl mt-1 block">{c.portrait}</span>
                    <h5 className="font-extrabold text-[10px] text-white truncate leading-none mt-1">{c.name}</h5>
                    <span className="text-[8px] text-gray-400">{c.class}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center: Selected starting slots formation (3 slots) */}
          <div className="lg:col-span-1 flex flex-col gap-4 justify-between">
            <h3 className="text-[9px] font-bold text-[#ffe082] uppercase tracking-widest text-center leading-none">Alocação de Linhas</h3>
            
            {(['front', 'mid', 'back'] as const).map(slot => {
              const charId = Object.keys(lineupPositions).find(k => lineupPositions[k] === slot);
              const char = charId ? PREP_ROSTER.find(c => c.id === charId) : null;
              
              return (
                <div
                  key={slot}
                  className={`rounded-2xl p-4 flex items-center justify-between transition-all confrontation-slot ${
                    char ? 'has-char' : ''
                  }`}
                >
                  <div className="text-left">
                    <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest block leading-none">Linha de</span>
                    <span className="text-[10px] font-extrabold text-indigo-300 capitalize">{slot === 'back' ? 'Retaguarda' : slot === 'mid' ? 'Meio' : 'Frente'}</span>
                  </div>

                  {char ? (
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{char.portrait}</span>
                      <div className="text-right">
                        <span className="text-[9px] font-black text-white">{char.name}</span>
                        <span className="text-[7px] text-gray-400 block uppercase">{char.class}</span>
                      </div>
                      {!confrontationConfirmed && (
                        <button
                          onClick={() => handleToggleLineupCharacter(char)}
                          className="text-xs text-rose-500 hover:text-rose-400 font-bold ml-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-[8px] text-gray-600 font-bold uppercase italic">Vazio</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Opponent Anonymous status panel */}
          <div className="lg:col-span-1 border-l border-indigo-950/30 pl-5 flex flex-col gap-4 justify-between">
            <div>
              <h3 className="text-[9px] font-bold text-[#ffe082] uppercase tracking-widest leading-none mb-1">Rival</h3>
              <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block mt-1">Formação Secreta</span>
            </div>

            <div className="space-y-3.5 my-auto">
              {Array.from({ length: 3 }).map((_, idx) => {
                const rivalConfirmed = opponent?.hasSelectedLineup;
                return (
                  <div
                    key={idx}
                    className={`opponent-anon-card rounded-2xl ${rivalConfirmed ? 'confirmed' : ''}`}
                  >
                    <span className="text-xl animate-pulse">❓</span>
                    <span className="text-[7px] text-gray-600 font-bold uppercase mt-1">Oculto</span>
                  </div>
                );
              })}
            </div>

            <div className="text-center bg-black/35 p-3.5 rounded-2xl border border-indigo-950/40">
              <span className="text-[9px] font-bold text-gray-400 block leading-none">
                {opponent?.hasSelectedLineup ? "Isaac confirmou a formação! ✔" : "Isaac está escolhendo..."}
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Runes Selector Panel */}
        <footer className="border-t border-indigo-950/40 pt-4 flex flex-col gap-3.5 shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-left">
              <span className="text-[9px] font-bold text-[#ffe082] uppercase tracking-widest leading-none">Runas de Batalha</span>
              <span className="text-[7px] text-gray-500 block uppercase mt-0.5">Selecione 1 modificador tático travado</span>
            </div>
            <span className="text-[9px] text-[#ffe082] font-extrabold max-w-[400px] text-right truncate">
              {selectedRune.name}: <span className="text-gray-400 font-medium lowercase">{selectedRune.desc}</span>
            </span>
          </div>

          <div className="grid grid-cols-6 gap-3.5">
            {RUNES_LIST.map(r => {
              const isSelected = selectedRuneId === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => !confrontationConfirmed && setSelectedRuneId(r.id)}
                  className={`p-3 rounded-2xl text-center flex flex-col items-center gap-1.5 rune-card ${
                    isSelected ? 'selected' : ''
                  } ${confrontationConfirmed ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <span className="text-xl">{r.icon}</span>
                  <span className="text-[8px] font-black text-white truncate max-w-full leading-none">{r.name}</span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 mt-1 pt-1 border-t border-indigo-950/20">
            <button
              onClick={handleConfirmLineup}
              disabled={selectedLineup.length !== 3 || confrontationConfirmed}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all select-none ${
                confrontationConfirmed ? 'bg-indigo-950 text-indigo-400 border border-indigo-800/40 opacity-70' :
                selectedLineup.length === 3 ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black shadow-lg font-black active:translate-y-0.5' :
                'bg-gray-900 text-gray-600 cursor-not-allowed border border-gray-800'
              }`}
            >
              {confrontationConfirmed ? "Aguardando Oponente..." : "Confirmar Formação"}
            </button>
          </div>
        </footer>

      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TELA 2: ACTIVE BATTLE SCREEN (planning, resolving)
  // ══════════════════════════════════════════════════════════════════════════
  const encounterContext: EncounterContext = {
    type: opponent ? 'duel' : 'wild',
    enemyName: opponent?.username || "Guerreiro Rival",
    enemyLevel: 125,
    enemyElement: opponent?.weaponElement || "none",
    roomId: roomId || "unknown",
  };

  const blueHpSum = blueTeam.reduce((acc, t) => acc + t.hp, 0);
  const redHpSum = redTeam.reduce((acc, t) => acc + t.hp, 0);
  const isResolution = resolutionStep !== -1;

  return (
    <div className="w-full h-full relative">
      
      {/* Cinematic shatter transition trigger */}
      {triggerTransition && (
        <div className="absolute inset-0 z-50">
          <BattleTransition
            encounter={encounterContext}
            onTransitionComplete={() => {
              setTriggerTransition(false);
              setPlayedTransition(true);
            }}
          />
        </div>
      )}

      <div className="w-full h-full bg-[#06060c] flex flex-col p-5 border border-[#b59441]/40 rounded-3xl overflow-hidden shadow-2xl min-h-[580px] battle-container select-none">
        
        {/* Header (Wall vs Isaac) */}
        <header className="flex justify-between items-center border-b border-indigo-950/40 pb-4 mb-4 shrink-0 relative">
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

        {/* Main Grid content */}
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

          {/* Center Arena */}
          <div className="flex-1 min-w-0 bg-black/35 rounded-3xl border border-indigo-950/40 relative overflow-hidden flex items-center justify-center shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent pointer-events-none" />
            
            <div className="battle-arena-grid w-full h-full border-none bg-transparent">
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

              {/* Blue Team circles & sprites */}
              {blueTeam.map(t => {
                const pos = positions[t.id] || 'back';
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
                      {t.id === 'char-caelum' && resolutionStep === 2 && (
                        <div className="shield-bubble" />
                      )}
                      <span className="text-[7px] font-black text-white bg-black/60 px-1 py-0.5 rounded leading-none mt-1 uppercase border border-indigo-900/60 shadow-md">
                        {t.name}
                      </span>
                    </div>

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

              {/* Red Team circles & sprites */}
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

                    {resolutionStep === 0 && (
                      <>
                        <div className="nova-astral-explosion" />
                        <div className="floating-damage text-purple-400" style={{ color: '#a855f7' }}>
                          {t.id === 'opp-korr' ? '-1.082' : t.id === 'opp-lobo' ? '-1.136' : '-1.452'}
                          <span className="block text-[7px] uppercase font-black text-purple-300 text-center leading-none mt-0.5">Vulnerável</span>
                        </div>
                      </>
                    )}

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

            <div className="bg-[#121226]/40 border border-indigo-950 rounded-2xl p-4 min-h-[160px] flex flex-col">
              <h4 className="text-[9px] uppercase font-bold text-[#ffe082] border-b border-indigo-950/40 pb-1 mb-2 tracking-widest leading-none">Ordem Resolução</h4>
              <div className="space-y-1.5 flex-1 overflow-y-auto">
                {[
                  { name: 'Lyria', color: 'text-indigo-400', class: 'Mago' },
                  { name: 'Nyxara', color: 'text-rose-400', class: 'Oponente' },
                  { name: 'Caelum', color: 'text-blue-400', class: 'Tanque' },
                  { name: 'Korr', color: 'text-rose-400', class: 'Oponente' },
                  { name: 'Raven', color: 'text-emerald-400', class: 'Assassino' }
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

        {/* Footer actions */}
        <footer className="w-full bg-[#121226]/50 border border-indigo-950 rounded-2xl p-4 shrink-0 grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
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

          <div className="flex flex-col gap-2">
            {isResolution ? (
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

        <div className="w-full text-center text-[8px] text-gray-600 font-bold uppercase tracking-widest pt-2.5 mt-2.5 border-t border-indigo-950/30">
          Enter: Selecionar | Esc: Fechar Painel | Q / E: Alternar Personagem | Tab: Ver Ordem | Espaço: Confirmar Estratégia
        </div>

      </div>
    </div>
  );
};
