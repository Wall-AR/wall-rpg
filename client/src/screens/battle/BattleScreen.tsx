import React from 'react';
import { useAuthStore } from '../../stores/auth';
import { useBattleData } from './useBattleData';
import { BattleHUD } from './BattleHUD';
import { ConfrontationPrep } from './ConfrontationPrep';
import { PlanningPhase } from './PlanningPhase';
import { BattleResults } from './BattleResults';
import { QTESystem } from './QTESystem';
import { RecruitmentRevealScreen } from '../RecruitmentRevealScreen';
import { BattleTransition, EncounterContext } from '../../game/BattleTransition';
import { Teammate, getGridCoordinates, getElementEmoji, getElementColorClass, PREP_ROSTER } from './battleTypes';
import '../styles/battle.css';
import '../styles/confrontation.css';
import '../styles/results.css';
import '../styles/recruit.css';

interface BattleScreenProps {
  roomId: string | null;
  onFinishBattle: () => void;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({ roomId, onFinishBattle }) => {
  const { token } = useAuthStore();
  
  const {
    room,
    battleState,
    connectionError,
    selectedLineup,
    lineupPositions,
    lineupSlots,
    lineupSelectionLimit,
    occupiedTeamSlots,
    selectedRuneId,
    setSelectedRuneId,
    confrontationTimer,
    confrontationConfirmed,
    strategyError,
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
    timerSeconds,
    resolutionStep,
    showQte,
    qteScale,
    qteResult,
    actionLog,
    blueTeam,
    redTeam,
    positions,
    perfectCombosRef,
    handleConfirmStrategy,
    handleMovePosition,
    handleToggleLineupCharacter,
    handleSelectGridSlot,
    handleConfirmLineup,
    handleResetLineup,
    handleSelectAttack,
    handleSelectDefend,
    handleSelectSpell,
    evaluateQtePress,
  } = useBattleData(roomId, token, onFinishBattle);

  if (connectionError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#06060c] text-rose-400 p-6 min-h-[500px] border border-rose-955 rounded-2xl">
        <span className="text-5xl mb-4">💥</span>
        <h2 className="text-xl font-bold mb-2">Falha na Arena</h2>
        <p className="text-sm text-gray-550 mb-6">{connectionError}</p>
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
        <p className="text-xs text-gray-550 font-bold uppercase tracking-widest animate-pulse">Entrando na Batalha Dimensional...</p>
      </div>
    );
  }

  const localPlayer = battleState.players[room.sessionId];
  const opponentSessionId = Object.keys(battleState.players).find(id => battleState.players[id].teamId !== localPlayer?.teamId);
  const opponent = opponentSessionId ? battleState.players[opponentSessionId] : null;

  // Active teammate selection
  const currentTeammate = blueTeam.find(t => t.id === activeTeammateId && t.controllable)
    || blueTeam.find(t => t.controllable)
    || blueTeam[0]
    || PREP_ROSTER[0];
  const activeSpell = currentTeammate.spells.find(s => s.id === selectedSpellId) || currentTeammate.spells[0];

  // ══════════════════════════════════════════════════════════════════════════
  // TELA 4: NEW COMPANION RECRUITMENT SCREEN (recruiting)
  // ══════════════════════════════════════════════════════════════════════════
  if (showRecruitScreen) {
    return (
      <RecruitmentRevealScreen
        sourceType="post_battle_offer"
        character={{
          id: 'thorn',
          name: 'Thorn',
          rarity: 'B',
          element: 'Terra',
          role: 'Lanceiro',
          level: 18,
          passive: 'Instinto de Sobrevivência',
          skill: 'Golpe Perfurante',
          stats: { hp: 1800, mp: 90, strength: 75, defense: 60, speed: 55 }
        }}
        teamMembers={PREP_ROSTER}
        onAccept={() => {
          alert("Thorn foi adicionado à sua equipe!");
          onFinishBattle();
        }}
        onConvert={() => {
          room.send("recruit_convert");
          alert("Thorn foi convertido em 25 Orbes de Alma!");
          onFinishBattle();
        }}
        onReplace={(substituteId) => {
          const replacedChar = PREP_ROSTER.find(c => c.id === substituteId);
          room.send("recruit_substitute", { substituteCharacterId: substituteId });
          alert(`Você desencantou ${replacedChar?.name} e adicionou Thorn à sua equipe!`);
          onFinishBattle();
        }}
        onDecline={() => {
          onFinishBattle();
        }}
      />
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TELA 3: BATTLE RESULTS SCREEN (finished)
  // ══════════════════════════════════════════════════════════════════════════
  if (battleState.status === "finished") {
    const isWinner = Boolean(localPlayer && battleState.winnerTeamId === localPlayer.teamId);
    return (
      <BattleResults
        isWinner={isWinner}
        onFinishBattle={onFinishBattle}
        room={room}
        totalDamage="22.814"
        totalHealing="8.748"
        totalShields="6.305"
      />
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TELA 1: PREPARAÇÃO DE CONFRONTO (confrontation_prep)
  // ══════════════════════════════════════════════════════════════════════════
  if (battleState.status === "confrontation_prep") {
    return (
      <ConfrontationPrep
        confrontationTimer={confrontationTimer}
        confrontationConfirmed={confrontationConfirmed}
        selectedLineup={selectedLineup}
        lineupPositions={lineupPositions}
        lineupSlots={lineupSlots}
        selectionLimit={lineupSelectionLimit}
        occupiedTeamSlots={occupiedTeamSlots}
        mode={battleState.mode}
        strategyError={strategyError}
        selectedRuneId={selectedRuneId}
        onToggleLineupCharacter={handleToggleLineupCharacter}
        onConfirmLineup={handleConfirmLineup}
        onResetLineup={handleResetLineup}
        onSelectGridSlot={handleSelectGridSlot}
        setSelectedRuneId={setSelectedRuneId}
        opponent={opponent}
      />
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TELA 2: ACTIVE BATTLE SCREEN (planning, resolving)
  // ══════════════════════════════════════════════════════════════════════════
  const blueHpSum = blueTeam.reduce((acc, t) => acc + t.hp, 0);
  const redHpSum = redTeam.reduce((acc, t) => acc + t.hp, 0);
  const isResolution = resolutionStep !== -1;

  const encounterContext: EncounterContext = {
    type: opponent ? 'duel' : 'wild',
    enemyName: opponent?.username || "Guerreiro Rival",
    enemyLevel: 125,
    enemyElement: opponent?.weaponElement || "none",
    roomId: roomId || "unknown",
  };

  return (
    <div className="w-full h-full relative">
      
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
        
        <BattleHUD
          isResolution={isResolution}
          resolutionStep={resolutionStep}
          timerSeconds={timerSeconds}
          battleState={battleState}
          blueHpSum={blueHpSum}
          redHpSum={redHpSum}
          opponent={opponent}
          localPlayer={localPlayer}
        />

        {/* Main Grid */}
        <div className="flex-1 flex gap-5 min-h-0 relative mb-4">
          
          <div className="w-52 flex flex-col gap-3 shrink-0 overflow-y-auto pr-1">
            <h4 className="text-[9px] uppercase font-bold text-[#ffe082] border-b border-indigo-950/60 pb-1 mb-1">Guerreiros</h4>
            
            {blueTeam.map(t => {
              const isActive = activeTeammateId === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    if (isResolution || !t.controllable) return;
                    setActiveTeammateId(t.id);
                    setSelectedSpellId(t.spells[0]?.id || '');
                  }}
                  className={`p-3 bg-indigo-955/10 border rounded-2xl flex flex-col gap-1.5 transition-all ${t.controllable ? 'cursor-pointer hover:bg-indigo-955/20' : 'cursor-default opacity-80'} ${
                    isActive ? 'pulse-selection-gold' : 'border-indigo-950'
                  }`}
                >
                  <div className="flex justify-between items-center text-[8px] text-gray-405 font-bold leading-none">
                    <span>Lv. {t.level}</span>
                    <span className="capitalize text-indigo-300 font-black">{t.class}</span>
                  </div>
                  <h5 className="font-extrabold text-[10px] text-white flex items-center gap-2 leading-none">
                    {t.portrait && (t.portrait.startsWith('/') || t.portrait.endsWith('.png')) ? (
                      <img src={t.portrait} alt={t.name} className="w-5 h-5 rounded object-cover border border-indigo-900" />
                    ) : (
                      <span>{t.portrait}</span>
                    )}
                    <span className="truncate">{t.name}</span>
                  </h5>

                  <div className="space-y-1 pt-1 border-t border-indigo-950/30">
                    <div className="flex justify-between text-[7px] text-gray-505 font-bold leading-none">
                      <span>HP</span>
                      <span className="text-emerald-400 font-extrabold">{t.hp} / {t.maxHp}</span>
                    </div>
                    <div className="w-full h-1 bg-black/60 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(t.hp / t.maxHp) * 100}%` }}></div>
                    </div>

                    <div className="flex justify-between text-[7px] text-gray-505 font-bold leading-none">
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

          <div className="flex-1 min-w-0 bg-black/35 rounded-3xl border border-indigo-950/40 relative overflow-hidden flex items-center justify-center shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent pointer-events-none" />
            
            <div className="battle-arena-grid w-full h-full border-none bg-transparent">
              <div className="qte-flash-overlay absolute inset-0 bg-white opacity-0 pointer-events-none z-50" />
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-5">
                {!isResolution && (
                  <>
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 2 L 10 5 L 0 8 z" fill="#f5d67b" />
                      </marker>
                    </defs>
                    {(() => {
                      const targetCoord = getGridCoordinates('red', redTeam.find(t => t.id === selectedTargetId)?.gridSlot);
                      const localCoord = getGridCoordinates('blue', blueTeam.find(t => t.id === activeTeammateId)?.gridSlot);
                      return (
                        <line
                          x1={localCoord.x} y1={localCoord.y}
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
                      const activeCoord = getGridCoordinates('blue', blueTeam[0]?.gridSlot);
                      const targetCoord = getGridCoordinates('red', redTeam[0]?.gridSlot);
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
                const pos = t.position || positions[t.id] || 'back';
                const coord = getGridCoordinates('blue', t.gridSlot);
                const isActive = activeTeammateId === t.id;
                
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      if (isResolution || !t.controllable) return;
                      setActiveTeammateId(t.id);
                      setSelectedSpellId(t.spells[0]?.id || '');
                    }}
                    className={`placement-circle circle-blue character-node-${t.id} ${t.controllable ? 'cursor-pointer' : 'cursor-default'} ${isActive ? 'active' : ''}`}
                    style={{ left: coord.x, top: coord.y }}
                  >
                    <div className="arena-character-sprite group">
                      {t.portrait && (t.portrait.startsWith('/') || t.portrait.endsWith('.png')) ? (
                        <img 
                          src={t.portrait} 
                          alt={t.name} 
                          className="w-12 h-12 object-contain filter drop-shadow-[0_2px_6px_rgba(59,130,246,0.6)] group-hover:scale-110 transition-transform" 
                        />
                      ) : (
                        <span className="text-3xl filter drop-shadow-[0_2px_6px_rgba(59,130,246,0.6)] group-hover:scale-110 transition-transform">
                          {t.portrait}
                        </span>
                      )}
                      {t.heroId === 'char-caelum' && resolutionStep === 2 && (
                        <div className="shield-bubble" />
                      )}
                      <span className="text-[7px] font-black text-white bg-black/60 px-1 py-0.5 rounded leading-none mt-1 uppercase border border-indigo-900/60 shadow-md">
                        {t.name}
                      </span>
                    </div>

                    {t.heroId === 'char-caelum' && resolutionStep === 2 && (
                      <div className="absolute -top-12 text-[#60a5fa] font-black text-[9px] uppercase tracking-wider flex flex-col items-center">
                        <span className="bg-indigo-955/90 px-1.5 py-0.5 rounded border border-indigo-800">Protegido</span>
                        <span className="text-[7px] text-indigo-300 font-bold mt-0.5">Barreira Guardiã</span>
                      </div>
                    )}

                    <span className="circle-label">{pos} · {(t.gridSlot ?? 0) + 1}</span>
                  </div>
                );
              })}

              {/* Red Team circles & sprites */}
              {redTeam.map(t => {
                const coord = getGridCoordinates('red', t.gridSlot);
                const isTargeted = selectedTargetId === t.id;

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      if (isResolution) return;
                      setSelectedTargetId(t.id);
                    }}
                    className={`placement-circle circle-red cursor-pointer character-node-${t.id} ${isTargeted ? 'active' : ''}`}
                    style={{ left: coord.x, top: coord.y }}
                  >
                    <div className="arena-character-sprite group">
                      {t.portrait && (t.portrait.startsWith('/') || t.portrait.endsWith('.png')) ? (
                        <img 
                          src={t.portrait} 
                          alt={t.name} 
                          className={`w-12 h-12 object-contain filter drop-shadow-[0_2px_6px_rgba(239,68,68,0.6)] group-hover:scale-110 transition-transform ${isTargeted && !isResolution ? 'pulse-target-indicator' : ''}`} 
                        />
                      ) : (
                        <span className={`text-3xl filter drop-shadow-[0_2px_6px_rgba(239,68,68,0.6)] group-hover:scale-110 transition-transform ${isTargeted && !isResolution ? 'pulse-target-indicator' : ''}`}>
                          {t.portrait}
                        </span>
                      )}
                      <span className="text-[7px] font-black text-rose-200 bg-black/60 px-1 py-0.5 rounded leading-none mt-1 uppercase border border-rose-955/60 shadow-md">
                        {t.name}
                      </span>
                    </div>

                    {resolutionStep === 0 && (
                      <>
                        <div className="nova-astral-explosion" />
                        <div className="floating-damage text-purple-400" style={{ color: '#a855f7' }}>
                          {t.heroId === 'char-korr' ? '-1.082' : t.heroId === 'char-lobo' ? '-1.136' : '-1.452'}
                          <span className="block text-[7px] uppercase font-black text-purple-300 text-center leading-none mt-0.5">Vulnerável</span>
                        </div>
                      </>
                    )}

                    {resolutionStep === 1 && t.id === selectedTargetId && (
                      <div 
                        className={`floating-damage ${qteResult === 'perfect' ? 'text-yellow-400 scale-125 font-black' : 'text-blue-400'}`} 
                        style={{ color: qteResult === 'perfect' ? '#fbbf24' : '#60a5fa' }}
                      >
                        {qteResult === 'perfect' ? '-918' : '-612'}
                        <span className="block text-[7px] uppercase font-black text-center leading-none mt-0.5" style={{ color: qteResult === 'perfect' ? '#ffe082' : '#93c5fd' }}>
                          {qteResult === 'perfect' ? '🔥 CRÍTICO!' : 'Perfuração'}
                        </span>
                      </div>
                    )}

                    <QTESystem
                      showQte={showQte && t.id === selectedTargetId}
                      qteScale={qteScale}
                      qteResult={qteResult}
                      onPress={evaluateQtePress}
                    />

                    <span className="circle-label">{t.position || 'front'} · {(t.gridSlot ?? 0) + 1}</span>
                  </div>
                );
              })}

              {resolutionStep === 0 && (
                <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/75 border border-purple-500/40 px-6 py-2.5 rounded-full text-center shadow-2xl z-20 animate-bounce">
                  <span className="block text-xs font-black text-purple-300 uppercase tracking-widest leading-none">Nova Astral</span>
                  <span className="text-[8px] text-gray-400 mt-1 block">Todos os inimigos recebem dano mágico!</span>
                </div>
              )}

              {showQte && (
                <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/85 border border-[#b59441] px-6 py-3 rounded-2xl text-center shadow-[0_0_20px_rgba(252,211,77,0.25)] z-25 max-w-xs pointer-events-none">
                  <span className="block text-[9px] font-black text-yellow-400 uppercase tracking-widest leading-none">💥 APRESTE-SE (COMBO)</span>
                  <span className="text-[7.5px] text-gray-200 mt-2 block leading-relaxed font-semibold">
                    Aperte <span className="bg-gray-800 border border-gray-600 px-1 py-0.5 rounded text-[7px] text-yellow-300 font-mono">ESPAÇO</span> ou toque no alvo quando o anel externo encolher até a borda interna!
                  </span>
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

        {strategyError && !isResolution && (
          <div className="mb-2 rounded-lg border border-rose-800/60 bg-rose-950/35 px-3 py-2 text-center text-[9px] font-bold text-rose-300">
            {strategyError}
          </div>
        )}

        <PlanningPhase
          currentTeammate={currentTeammate}
          activeSpell={activeSpell}
          selectedSpellId={selectedSpellId}
          selectedTargetId={selectedTargetId}
          plannedActions={plannedActions}
          isResolution={isResolution}
          resolutionStep={resolutionStep}
          onMovePosition={handleMovePosition}
          onSelectAttack={() => {
            setSelectedSpellId('attack');
            handleSelectAttack(activeTeammateId, selectedTargetId);
          }}
          onSelectDefend={() => {
            handleSelectDefend(activeTeammateId);
          }}
          onSelectSpell={() => {
            if (currentTeammate.spells.length > 0) {
              const spell = currentTeammate.spells[0];
              setSelectedSpellId(spell.id);
              handleSelectSpell(activeTeammateId, spell.id, selectedTargetId);
            }
          }}
          onConfirmStrategy={handleConfirmStrategy}
          onFinishBattle={onFinishBattle}
          activeTeammateId={activeTeammateId}
          availableMana={localPlayer?.mana || 0}
          strategyConfirmed={Boolean(localPlayer?.hasSelectedAction)}
        />

        <div className="w-full text-center text-[8px] text-gray-600 font-bold uppercase tracking-widest pt-2.5 mt-2.5 border-t border-indigo-950/30">
          Enter: Selecionar | Esc: Fechar Painel | Q / E: Alternar Personagem | Tab: Ver Ordem | Espaço: Confirmar Estratégia
        </div>

      </div>
    </div>
  );
};
