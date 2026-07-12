import React, { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from './stores/auth';
import { LoginScreen } from './screens/LoginScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import GameCanvas from './game/GameCanvas';
import { BattleScreen } from './screens/BattleScreen';
import { BattleTransition, EncounterContext } from './game/BattleTransition';
import { GameMenu } from './screens/menu';

type ScreenType = 'lobby' | 'game' | 'battle';

/**
 * App — Orquestrador de telas do MEGACOLISEUM.
 * 
 * Fluxo de encontro:
 *   Mapa (GameCanvas) → Trigger (colisão/duelo)
 *     → BattleTransition (animação ~4s)
 *       → BattleScreen (combate por turnos)
 *         → Volta ao Mapa
 */
export const App: React.FC = () => {
  const { token, username } = useAuthStore();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('lobby');
  const [battleRoomId, setBattleRoomId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Estado da transição de encontro
  const [encounter, setEncounter] = useState<EncounterContext | null>(null);
  const [showTransition, setShowTransition] = useState(false);

  /**
   * handleEncounter — Chamado quando o jogador inicia um encontro.
   * Recebe o contexto do encontro (tipo, inimigo, room) e dispara a transição.
   * 
   * Pode ser chamado de:
   *   - GameCanvas (colisão com monstro no mapa → encontro selvagem)
   *   - LobbyScreen (duelo PvP aceito → duelo na arena)
   *   - GameRoom server (boss spawn → chefe de batalha)
   */
  const handleEncounter = useCallback((ctx: EncounterContext) => {
    setEncounter(ctx);
    setBattleRoomId(ctx.roomId);
    setCurrentScreen('battle');
  }, []);


  /**
   * Backwards-compatible trigger para uso simples com roomId.
   * Constrói um EncounterContext mínimo para manter compatibilidade
   * com o sistema atual que só envia roomId.
   */
  const handleSimpleBattleTrigger = useCallback((roomId: string, context?: Partial<EncounterContext>) => {
    handleEncounter({
      type: context?.type || 'wild',
      enemyName: context?.enemyName || 'Inimigo Desconhecido',
      enemyLevel: context?.enemyLevel,
      enemyElement: context?.enemyElement,
      roomId,
    });
  }, [handleEncounter]);

  /**
   * handleDuelTrigger — Específico para duelos PvP do lobby.
   */
  const handleDuelTrigger = useCallback((roomId: string) => {
    handleSimpleBattleTrigger(roomId, {
      type: 'duel',
      enemyName: 'Guerreiro Desafiante',
    });
  }, [handleSimpleBattleTrigger]);

  // Global Escape key down to toggle menu from Lobby or Game screen
  useEffect(() => {
    if (!token) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const isTyping = document.activeElement?.tagName === 'INPUT' || 
                         document.activeElement?.tagName === 'TEXTAREA';
        if (!isTyping && (currentScreen === 'lobby' || currentScreen === 'game')) {
          e.preventDefault();
          setMenuOpen(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [token, currentScreen]);

  if (!token) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col font-sans select-none relative">



      {/* ═══ Global GameMenu Overlay ═══ */}
      {menuOpen && (
        <GameMenu
          onClose={() => setMenuOpen(false)}
          onReturnToLobby={currentScreen === 'game' ? () => {
            setMenuOpen(false);
            setCurrentScreen('lobby');
          } : undefined}
        />
      )}

      {currentScreen === 'lobby' ? (
        <LobbyScreen 
          onStartGame={() => setCurrentScreen('game')} 
          onStartBattle={handleDuelTrigger}
        />
      ) : currentScreen === 'battle' ? (
        <div className="flex-1 flex flex-col">
          {/* Battle HUD Header */}
          <header className="bg-[#16162a] border-b border-indigo-900/40 px-6 py-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-extrabold text-indigo-400 tracking-widest bg-gradient-to-r from-indigo-400 to-indigo-500 bg-clip-text">
                MEGACOLISEUM
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                Arena de Combate Elementar
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-gray-400">Guerreiro</p>
                <p className="font-semibold text-indigo-200">{username}</p>
              </div>
            </div>
          </header>

          {/* Battle Screen */}
          <main className="flex-1 flex flex-col p-6 justify-center">
            <div className="max-w-5xl w-full mx-auto">
              <BattleScreen 
                roomId={battleRoomId} 
                onFinishBattle={() => {
                  setBattleRoomId(null);
                  setCurrentScreen('game');
                }} 
              />
            </div>
          </main>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Game HUD Header */}
          <header className="bg-[#16162a] border-b border-indigo-900/40 px-6 py-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-extrabold text-indigo-400 tracking-widest bg-gradient-to-r from-indigo-400 to-indigo-500 bg-clip-text">
                MEGACOLISEUM
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                Arena de Jogo
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-gray-400">Guerreiro</p>
                <p className="font-semibold text-indigo-200">{username}</p>
              </div>
              <button
                onClick={() => setCurrentScreen('lobby')}
                className="px-4 py-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 rounded-md text-sm font-medium transition-colors"
              >
                Voltar ao Lobby
              </button>
            </div>
          </header>

          {/* Game Area */}
          <main className="flex-1 flex flex-col p-6">
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex-1 min-h-[400px] border border-indigo-900/40 rounded-lg overflow-hidden shadow-inner bg-[#1a1a2e] relative">
                <GameCanvas 
                  onTriggerBattle={handleSimpleBattleTrigger} 
                  menuOpen={menuOpen} 
                  onToggleMenu={() => setMenuOpen(p => !p)} 
                />
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default App;
