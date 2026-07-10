import { useEffect, useState, useRef } from 'react';
import { client } from '../../game/colyseus';
import { sounds } from '../../game/sound';
import { gsap } from 'gsap';
import { Teammate, PREP_ROSTER, BattleStateData, getElementEmoji } from './battleTypes';

export const useBattleData = (roomId: string | null, token: string | null, onFinishBattle: () => void) => {
  const [room, setRoom] = useState<any>(null);
  const [battleState, setBattleState] = useState<BattleStateData | null>(null);
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

  // Character recruitment pós-combat state
  const [showRecruitScreen, setShowRecruitScreen] = useState<boolean>(false);
  const [characterToReplaceId, setCharacterToReplaceId] = useState<string>("");

  // Active planning states
  const [activeTeammateId, setActiveTeammateId] = useState<string>('char-lyria');
  const [selectedSpellId, setSelectedSpellId] = useState<string>('nova-astral');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('opp-nyxara');
  const [plannedActions, setPlannedActions] = useState<Record<string, { action: string; spellId?: string; targetId?: string }>>({});
  const [timerSeconds, setTimerSeconds] = useState(12);

  // Resolution simulation state
  const [resolutionStep, setResolutionStep] = useState<number>(-1);
  const [showQte, setShowQte] = useState(false);
  const [qteScale, setQteScale] = useState(3.0);
  const [qteResult, setQteResult] = useState<'idle' | 'perfect' | 'fail' | 'miss'>('idle');
  const qteTimerRef = useRef<number | null>(null);
  const perfectCombosRef = useRef<number>(0);
  const qteResolverRef = useRef<((result: any) => void) | null>(null);

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

  const [redTeam, setRedTeam] = useState<any[]>([
    { id: 'opp-korr', name: 'Korr', class: 'Lanceiro', level: 119, hp: 8120, maxHp: 8120, mp: 180, maxMp: 250, element: 'fogo', portrait: '🦁', active: true },
    { id: 'opp-lobo', name: 'Lobo Cinzento', class: 'Companheiro', level: 132, hp: 5980, maxHp: 5980, mp: 160, maxMp: 240, element: 'vento', portrait: '🐺', active: true },
    { id: 'opp-nyxara', name: 'Nyxara', class: 'Inimigo', level: 125, hp: 4220, maxHp: 4220, mp: 620, maxMp: 820, element: 'none', portrait: '🧙‍♀️', active: true }
  ]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const waitForQte = (): Promise<'perfect' | 'fail' | 'miss'> => {
    return new Promise((resolve) => {
      setShowQte(true);
      qteResolverRef.current = resolve;
    });
  };

  const updateVisualStats = (event: any) => {
    if (event.targetHp !== undefined) {
      setRedTeam(prev => prev.map(m => m.id === event.targetId ? { ...m, hp: event.targetHp, active: event.targetHp > 0 } : m));
      setBlueTeam(prev => prev.map(m => m.id === event.targetId ? { ...m, hp: event.targetHp } : m));
    }
    if (event.actorMp !== undefined) {
      setBlueTeam(prev => prev.map(m => m.id === event.actorId ? { ...m, mp: event.actorMp } : m));
      setRedTeam(prev => prev.map(m => m.id === event.actorId ? { ...m, mp: event.actorMp } : m));
    }
  };

  const animateRoundEvents = async (events: any[], activeRoom: any) => {
    setResolutionStep(0); // Ativa modo de resolução visual

    for (let idx = 0; idx < events.length; idx++) {
      const event = events[idx];
      
      // Adiciona o log no painel tático
      setActionLog(prev => [event.log, ...prev]);

      if (event.type === 'defend') {
        sounds.playBarrier();
        gsap.to(`.character-node-${event.actorId}`, {
          x: event.actorId.startsWith('char-') ? 20 : -20,
          y: -10,
          duration: 0.4,
          yoyo: true,
          repeat: 1,
          ease: "power1.inOut"
        });
        await delay(900);
      } 
      else if (event.type === 'attack') {
        const isLocalAttacker = event.actorId.startsWith('char-');
        let qteRes: 'perfect' | 'fail' | 'miss' = 'fail';

        if (isLocalAttacker) {
          qteRes = await waitForQte();
        }

        const attackerNode = `.character-node-${event.actorId}`;
        const targetNode = `.character-node-${event.targetId}`;

        if (qteRes === 'perfect' && isLocalAttacker) {
          gsap.to(".qte-flash-overlay", { opacity: 0.75, duration: 0.1, yoyo: true, repeat: 1 });
          gsap.timeline()
            .to(attackerNode, { x: 380, y: -70, duration: 0.12, ease: "power2.out" })
            .to(targetNode, {
              x: "+=22",
              yoyo: true,
              repeat: 9,
              duration: 0.02,
              onStart: () => {
                sounds.playSlash();
                document.querySelector(targetNode)?.classList.add("flash-hit");
              }
            })
            .to(attackerNode, { x: 0, y: 0, duration: 0.18, ease: "power1.inOut", delay: 0.15,
              onComplete: () => document.querySelector(targetNode)?.classList.remove("flash-hit")
            });
          await delay(1600);
        } else {
          // Ataque regular ou oponente atacando
          const dx = isLocalAttacker ? 300 : -300;
          const dy = isLocalAttacker ? -80 : 80;
          gsap.timeline()
            .to(attackerNode, { x: dx, y: dy, duration: 0.22, ease: "power2.out" })
            .to(targetNode, {
              x: isLocalAttacker ? "+=12" : "-=12",
              yoyo: true,
              repeat: 3,
              duration: 0.04,
              onStart: () => {
                sounds.playSlash();
                document.querySelector(targetNode)?.classList.add("flash-hit");
              }
            })
            .to(attackerNode, { x: 0, y: 0, duration: 0.28, ease: "power1.inOut",
              onComplete: () => document.querySelector(targetNode)?.classList.remove("flash-hit")
            });
          await delay(1200);
        }
      } 
      else if (event.type === 'spell_cure') {
        sounds.playCure();
        gsap.to(`.character-node-${event.actorId}`, {
          x: 30,
          y: -10,
          duration: 0.4,
          yoyo: true,
          repeat: 1,
          ease: "power2.out"
        });
        gsap.to(`.character-node-${event.targetId}`, {
          scale: 1.15,
          duration: 0.3,
          yoyo: true,
          repeat: 1,
        });
        await delay(1000);
      } 
      else if (event.type === 'spell_attack') {
        sounds.playExplosion();
        gsap.to(`.character-node-${event.actorId}`, {
          x: event.actorId.startsWith('char-') ? 40 : -40,
          y: -10,
          duration: 0.4,
          yoyo: true,
          repeat: 1,
          ease: "power2.out"
        });
        
        const targetNode = `.character-node-${event.targetId}`;
        gsap.timeline()
          .to(".qte-flash-overlay", { opacity: 0.3, duration: 0.1, yoyo: true, repeat: 1 })
          .to(targetNode, {
            x: "+=8",
            yoyo: true,
            repeat: 5,
            duration: 0.05,
            onStart: () => document.querySelector(targetNode)?.classList.add("flash-hit"),
            onComplete: () => {
              gsap.to(targetNode, { x: 0, duration: 0.1 });
              document.querySelector(targetNode)?.classList.remove("flash-hit");
            }
          });
        await delay(1200);
      } 
      else if (event.type === 'death') {
        sounds.playFailure();
        gsap.to(`.character-node-${event.actorId}`, {
          opacity: 0.35,
          scale: 0.8,
          duration: 0.8,
          ease: "power2.inOut"
        });
        await delay(800);
      }

      updateVisualStats(event);
      await delay(450);
    }

    setResolutionStep(-1);
    
    if (activeRoom) {
      activeRoom.send("animation_complete");
    }
  };

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
            logs: Array.from(state.logs) as string[],
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
            }, {} as any) as any,
          });

          // Sync teams from server schema when not resolving animations
          if (state.status !== "resolving") {
            const localPlayer = state.players.get(activeRoom.sessionId);
            if (localPlayer && localPlayer.combatants && localPlayer.combatants.size > 0) {
              const newBlue: Teammate[] = [];
              localPlayer.combatants.forEach((c: any) => {
                const baseMeta = PREP_ROSTER.find(item => item.id === c.id) || {
                  portrait: '👤',
                  rank: 'A' as const,
                  spells: []
                };
                newBlue.push({
                  id: c.id,
                  name: c.name,
                  class: c.class,
                  level: c.level,
                  hp: c.hp,
                  maxHp: c.maxHp,
                  mp: c.mp,
                  maxMp: c.maxMp,
                  element: c.element as any,
                  position: c.position as any,
                  portrait: baseMeta.portrait,
                  rank: baseMeta.rank,
                  spells: baseMeta.spells,
                });
              });
              setBlueTeam(newBlue);
            }

            const opponentSessionId = Array.from(state.players.keys()).find(id => id !== activeRoom.sessionId);
            if (opponentSessionId) {
              const oppPlayer = state.players.get(opponentSessionId);
              if (oppPlayer && oppPlayer.combatants && oppPlayer.combatants.size > 0) {
                const newRed: any[] = [];
                oppPlayer.combatants.forEach((c: any) => {
                  const baseMeta = PREP_ROSTER.find(item => item.id === c.id) || {
                    portrait: '👤',
                    rank: 'A' as const,
                    spells: []
                  };
                  newRed.push({
                    id: c.id,
                    name: c.name,
                    class: c.class,
                    level: c.level,
                    hp: c.hp,
                    maxHp: c.maxHp,
                    mp: c.mp,
                    maxMp: c.maxMp,
                    element: c.element as any,
                    portrait: baseMeta.portrait,
                    active: c.hp > 0,
                  });
                });
                setRedTeam(newRed);
              }
            }
          }
        });

        activeRoom.onMessage("round_resolved", (data: { events: any[] }) => {
          animateRoundEvents(data.events, activeRoom);
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

  // Initialize plannedActions with default actions when entering planning phase
  useEffect(() => {
    if (battleState?.status === 'planning') {
      const initial: Record<string, any> = {};
      blueTeam.forEach(t => {
        initial[t.id] = { action: 'attack', targetId: 'opp-nyxara' };
      });
      setPlannedActions(initial);
    }
  }, [battleState?.status, blueTeam]);

  // Trigger battle transition when status changes from confrontation_prep to planning
  useEffect(() => {
    if (battleState?.status === 'planning' && !playedTransition) {
      setTriggerTransition(true);
    }
  }, [battleState?.status, playedTransition]);

  // Play victory/defeat sounds when battle ends
  useEffect(() => {
    if (battleState?.status === 'finished') {
      const isWinner = battleState.winnerSessionId === room?.sessionId;
      if (isWinner) {
        sounds.playVictory();
      } else {
        sounds.playFailure();
      }

      if (room) {
        room.send("report_performance", { perfectCombos: perfectCombosRef.current });
      }
    }
  }, [battleState?.status, battleState?.winnerSessionId, room?.sessionId]);

  // Trigger resolution steps when turn increases
  const lastTurnRef = useRef<number>(1);
  useEffect(() => {
    if (battleState && battleState.turn > lastTurnRef.current) {
      setResolutionStep(0);
      lastTurnRef.current = battleState.turn;
    }
  }, [battleState?.turn]);

  // Resolution step timer sequencer (3s per step - paused during QTE at step 1)
  useEffect(() => {
    if (resolutionStep === -1 || resolutionStep >= 6 || showQte) return;

    const interval = setInterval(() => {
      setResolutionStep(prev => {
        const next = prev + 1;
        
        if (next === 1) {
          setShowQte(true);
          return next;
        }

        if (next >= 6) {
          setTimeout(() => {
            setResolutionStep(-1);
          }, 1500);
        }
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [resolutionStep, showQte]);

  // QTE Evaluation & Resolution logic (Legend of Dragoon style)
  const triggerQteResolution = (result: 'perfect' | 'fail' | 'miss') => {
    if (qteTimerRef.current) cancelAnimationFrame(qteTimerRef.current);
    setQteResult(result);

    if (result === 'perfect') {
      perfectCombosRef.current += 1;
      sounds.playPerfect();
    } else {
      sounds.playFailure();
    }

    if (qteResolverRef.current) {
      qteResolverRef.current(result);
      qteResolverRef.current = null;
    }

    setTimeout(() => {
      setShowQte(false);
    }, 1600);
  };

  const evaluateQtePress = () => {
    if (qteResult !== 'idle') return;

    // Sweet spot: Golden zone scale is around 0.95 to 1.25
    if (qteScale >= 0.95 && qteScale <= 1.25) {
      triggerQteResolution('perfect');
    } else {
      triggerQteResolution('fail');
    }
  };

  // Run the shrinking ring QTE loop when active
  useEffect(() => {
    if (!showQte) return;

    setQteScale(3.0);
    setQteResult('idle');
    (window as any).__lastTickSegment = -1;

    const start = performance.now();
    const duration = 1200; // 1.2 seconds to reach the target size

    const qteLoop = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(1.0, elapsed / duration);
      const currentScale = 3.0 - (progress * 2.5); // shrinks from 3.0 to 0.5
      setQteScale(currentScale);

      const tickSegment = Math.floor(progress * 4);
      if ((window as any).__lastTickSegment !== tickSegment) {
        (window as any).__lastTickSegment = tickSegment;
        if (tickSegment > 0 && tickSegment < 4) {
          sounds.playTick();
        }
      }

      if (progress < 1.0) {
        qteTimerRef.current = requestAnimationFrame(qteLoop);
      } else {
        triggerQteResolution('miss');
      }
    };

    qteTimerRef.current = requestAnimationFrame(qteLoop);

    return () => {
      if (qteTimerRef.current) cancelAnimationFrame(qteTimerRef.current);
    };
  }, [showQte]);

  // Spacebar keypress detection for QTE timing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showQte || qteResult !== 'idle') return;
      if (e.key === ' ') {
        e.preventDefault();
        evaluateQtePress();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showQte, qteScale, qteResult]);

  const handleConfirmStrategy = () => {
    if (room) {
      room.send("plan_actions", { actions: plannedActions });
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
      setLineupPositions(prev => {
        const slots: ('front' | 'mid' | 'back')[] = ['front', 'mid', 'back'];
        const occupied = Object.values(prev);
        const free = slots.find(s => !occupied.includes(s)) || 'front';
        return { ...prev, [char.id]: free };
      });
    }
  };

  const handleConfirmLineup = () => {
    if (selectedLineup.length !== 3) return;
    setConfrontationConfirmed(true);
    const chosen = PREP_ROSTER.filter(c => selectedLineup.includes(c.id));
    setBlueTeam(chosen);
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

  const handleResetLineup = () => {
    if (confrontationConfirmed) return;
    setSelectedLineup([]);
    setLineupPositions({});
  };

  const handleSelectAttack = (attackerId: string, targetId: string) => {
    const attacker = blueTeam.find(t => t.id === attackerId);
    if (!attacker) return;
    
    setActionLog(prev => [`${attacker.name}: Planejou atacar ${redTeam.find(r => r.id === targetId)?.name || 'Nyxara'}`, ...prev.slice(0, 5)]);
    setPlannedActions(prev => ({
      ...prev,
      [attackerId]: { action: 'attack', targetId }
    }));
  };

  const handleSelectDefend = (attackerId: string) => {
    const attacker = blueTeam.find(t => t.id === attackerId);
    if (!attacker) return;
    
    setActionLog(prev => [`${attacker.name}: Planejou defender postura`, ...prev.slice(0, 5)]);
    setPlannedActions(prev => ({
      ...prev,
      [attackerId]: { action: 'defend' }
    }));
  };

  const handleSelectSpell = (attackerId: string, spellId: string, targetId: string) => {
    const attacker = blueTeam.find(t => t.id === attackerId);
    if (!attacker) return;
    
    const spell = attacker.spells.find(s => s.id === spellId);
    if (!spell) return;
    
    setActionLog(prev => [`${attacker.name}: Planejou feitiço ${spell.name}`, ...prev.slice(0, 5)]);
    setPlannedActions(prev => ({
      ...prev,
      [attackerId]: { action: 'spell', spellId, targetId }
    }));
  };

  return {
    room,
    battleState,
    connectionError,
    selectedLineup,
    lineupPositions,
    selectedRuneId,
    setSelectedRuneId,
    confrontationTimer,
    confrontationConfirmed,
    playedTransition,
    triggerTransition,
    setTriggerTransition,
    setPlayedTransition,
    showRecruitScreen,
    setShowRecruitScreen,
    characterToReplaceId,
    setCharacterToReplaceId,
    activeTeammateId,
    setActiveTeammateId,
    selectedSpellId,
    setSelectedSpellId,
    selectedTargetId,
    setSelectedTargetId,
    plannedActions,
    setPlannedActions,
    timerSeconds,
    resolutionStep,
    showQte,
    qteScale,
    qteResult,
    actionLog,
    setActionLog,
    blueTeam,
    redTeam,
    positions,
    perfectCombosRef,
    handleConfirmStrategy,
    handleMovePosition,
    handleToggleLineupCharacter,
    handleConfirmLineup,
    handleResetLineup,
    handleSelectAttack,
    handleSelectDefend,
    handleSelectSpell,
    evaluateQtePress,
  };
};
