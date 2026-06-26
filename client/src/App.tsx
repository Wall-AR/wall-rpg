import React, { useState } from 'react';
import { useAuthStore } from './stores/auth';
import GameCanvas from './game/GameCanvas';

type ScreenType = 'lobby' | 'game';

export const App: React.FC = () => {
  const { token, username, setAuth, logout } = useAuthStore();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('lobby');
  const [usernameInput, setUsernameInput] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim()) {
      setAuth('mock-jwt-token', usernameInput.trim());
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentScreen('lobby');
  };

  // If not logged in, render the login screen
  if (!token) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4 text-white font-sans">
        <div className="max-w-md w-full bg-[#1a1a2e] rounded-lg shadow-xl p-8 border border-indigo-900/50">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-wider text-indigo-400 mb-2">MEGACOLISEUM</h1>
            <p className="text-gray-400 text-sm">Enter the arena of Wall RPG</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter character name..."
                className="w-full px-4 py-3 bg-[#0f0f1a] border border-indigo-900/80 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-500 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-md shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#1a1a2e] text-sm"
            >
              Enter Game
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main UI when logged in
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col font-sans">
      {/* Header / Navbar */}
      <header className="bg-[#16162a] border-b border-indigo-900/40 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-indigo-400 tracking-wider">MEGACOLISEUM</span>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
            Phase 1
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-gray-400">Logged in as</p>
            <p className="font-semibold text-indigo-200">{username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-rose-950/40 hover:bg-rose-950/80 text-rose-300 border border-rose-900/60 rounded-md text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-6">
        {currentScreen === 'lobby' ? (
          <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-100">Welcome back, {username}!</h2>
              <p className="text-gray-400 leading-relaxed text-sm">
                The Colyseus integration is configured. You are ready to connect to the game server and explore the arena.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
              <button
                onClick={() => setCurrentScreen('game')}
                className="p-6 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 hover:border-indigo-500/50 rounded-lg text-left transition-all group"
              >
                <h3 className="font-bold text-lg text-gray-100 group-hover:text-indigo-400 transition-colors">Start Canvas Test</h3>
                <p className="text-xs text-gray-400 mt-2">Test dynamic canvas sizing & PixiJS graphics.</p>
              </button>

              <button
                disabled
                className="p-6 bg-gray-900/50 border border-gray-800 rounded-lg text-left opacity-50 cursor-not-allowed"
              >
                <h3 className="font-bold text-lg text-gray-400">Join Multiplayer Match</h3>
                <p className="text-xs text-gray-600 mt-2">Colyseus rooms will be available in the next phase.</p>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-100">2D Game Canvas</h2>
                <p className="text-sm text-gray-400">Rendering a dynamic player placeholder and grid with PixiJS</p>
              </div>
              <button
                onClick={() => setCurrentScreen('lobby')}
                className="px-4 py-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 rounded-md text-sm font-medium transition-colors"
              >
                Back to Lobby
              </button>
            </div>

            {/* Game Canvas Container */}
            <div className="flex-1 min-h-[400px] border border-indigo-900/40 rounded-lg overflow-hidden shadow-inner bg-[#1a1a2e]">
              <GameCanvas />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
