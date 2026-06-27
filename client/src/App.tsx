import React, { useState } from 'react';
import { useAuthStore } from './stores/auth';
import { LoginScreen } from './screens/LoginScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import GameCanvas from './game/GameCanvas';
import { BattleScreen } from './screens/BattleScreen';

type ScreenType = 'lobby' | 'game' | 'battle';

export const App: React.FC = () => {
  const { token, username } = useAuthStore();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('lobby');

  // If not logged in, render the login screen
  if (!token) {
    return <LoginScreen />;
  }

  // Render main screen when logged in
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col font-sans select-none">
      {currentScreen === 'lobby' ? (
        <LobbyScreen onStartGame={() => setCurrentScreen('game')} />
      ) : currentScreen === 'battle' ? (
        <div className="flex-1 flex flex-col">
          {/* HUD Header */}
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

          {/* Battle Screen Area */}
          <main className="flex-1 flex flex-col p-6 justify-center">
            <div className="max-w-5xl w-full mx-auto">
              <BattleScreen onFinishBattle={() => setCurrentScreen('game')} />
            </div>
          </main>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* HUD Header */}
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
              <div className="flex-1 min-h-[400px] border border-indigo-900/40 rounded-lg overflow-hidden shadow-inner bg-[#1a1a2e]">
                <GameCanvas onTriggerBattle={() => setCurrentScreen('battle')} />
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default App;
