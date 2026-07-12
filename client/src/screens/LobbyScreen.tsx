import React, { useEffect } from 'react';
import {
  useLobbyData, TabType,
  HomeTab, ProfileTab, InventoryTab, FriendsTab,
  BattlesTab, QuestsTab, GMTab, SettingsTab, MemoriesTab,
} from './lobby';

interface LobbyScreenProps {
  onStartGame: () => void;
  onStartBattle: (roomId: string) => void;
}

const TAB_CONFIG: { key: TabType; icon: string; label: string }[] = [
  { key: 'home', icon: '🏠', label: 'Início' },
  { key: 'profile', icon: '👤', label: 'Perfil' },
  { key: 'inventory', icon: '🎒', label: 'Mochila' },
  { key: 'friends', icon: '👥', label: 'Amigos' },
  { key: 'battles', icon: '⚔️', label: 'Batalhas' },
  { key: 'quests', icon: '📜', label: 'Missões' },
  { key: 'memories', icon: '📖', label: 'Memórias' },
  { key: 'gm', icon: '🧙‍♂️', label: 'Painel do Mestre' },
  { key: 'settings', icon: '⚙️', label: 'Ajustes' },
];

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onStartGame, onStartBattle }) => {
  const lobby = useLobbyData(onStartBattle);

  useEffect(() => {
    let frame = 0;
    let previousA = false;
    const handleKeyDown = (event: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (lobby.activeTab === 'home' && (event.key === 'Enter' || event.key.toLowerCase() === 'g')) {
        event.preventDefault();
        onStartGame();
      }
    };
    const pollGamepad = () => {
      const gamepad = navigator.getGamepads?.()[0];
      const aPressed = Boolean(gamepad?.buttons[0]?.pressed);
      if (lobby.activeTab === 'home' && aPressed && !previousA) onStartGame();
      previousA = aPressed;
      frame = requestAnimationFrame(pollGamepad);
    };
    window.addEventListener('keydown', handleKeyDown);
    frame = requestAnimationFrame(pollGamepad);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(frame);
    };
  }, [lobby.activeTab, onStartGame]);

  const renderTabContent = () => {
    if (lobby.loading) {
      return (
        <div className="flex-grow flex items-center justify-center p-12">
          <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      );
    }

    if (lobby.error || !lobby.character) {
      return (
        <div className="p-8 text-center text-rose-400 bg-rose-950/20 border border-rose-900/40 rounded-xl max-w-md mx-auto my-8 font-sans">
          <span className="text-3xl block mb-2">⚠️</span>
          <p>{lobby.error || 'Erro ao carregar dados do lobby.'}</p>
        </div>
      );
    }

    const c = lobby.character;

    switch (lobby.activeTab) {
      case 'home':
        return <HomeTab character={c} onlineCount={lobby.onlineCount} onStartGame={onStartGame} />;
      case 'profile':
        return <ProfileTab character={c} retiredList={lobby.retiredList} isDismissing={lobby.isDismissing} onDismiss={lobby.handleDismissCharacter} />;
      case 'inventory':
        return <InventoryTab {...lobby} />;
      case 'friends':
        return (
          <FriendsTab
            character={c} username={lobby.username} friendsList={lobby.friendsList}
            onlinePlayers={lobby.onlinePlayers} presenceRoom={lobby.presenceRoom}
            addFriendName={lobby.addFriendName} setAddFriendName={lobby.setAddFriendName}
            onAddFriend={lobby.handleAddFriend} onAcceptFriend={lobby.handleAcceptFriend}
            onRequestDuel={lobby.handleRequestDuel} onInviteParty={lobby.handleInviteParty}
            onLeaveParty={lobby.handleLeaveParty}
          />
        );
      case 'battles':
        return <BattlesTab />;
      case 'quests':
        return <QuestsTab />;
      case 'memories':
        return <MemoriesTab retiredList={lobby.retiredList} setActiveTab={lobby.setActiveTab} />;
      case 'gm':
        return <GMTab {...lobby} />;
      case 'settings':
        return <SettingsTab soundEnabled={lobby.soundEnabled} setSoundEnabled={lobby.setSoundEnabled} volume={lobby.volume} setVolume={lobby.setVolume} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col font-sans relative">
      
      {/* Incoming Duel Banner */}
      {lobby.incomingDuel && (
        <div className="w-full bg-rose-900 border-b border-rose-700 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl z-50 animate-pulse font-sans">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚔️</span>
            <p className="text-sm font-bold text-white">
              O desafiante <span className="underline">{lobby.incomingDuel.challengerUsername}</span> convidou você para um Duelo PvP Elemental na arena!
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={lobby.handleAcceptDuel} className="px-5 py-1.5 bg-emerald-500 text-black text-xs font-extrabold rounded-lg shadow hover:bg-emerald-400 transition-colors uppercase tracking-wider">
              Aceitar Desafio
            </button>
            <button onClick={lobby.handleDeclineDuel} className="px-4 py-1.5 bg-rose-950/70 hover:bg-rose-950 text-white border border-rose-800 text-xs font-semibold rounded-lg transition-colors">
              Recusar
            </button>
          </div>
        </div>
      )}

      {/* Incoming Party Invite Banner */}
      {lobby.incomingPartyInvite && (
        <div className="w-full bg-indigo-900 border-b border-indigo-750 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl z-50 animate-pulse font-sans">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <p className="text-sm font-bold text-white">
              O líder <span className="underline">{lobby.incomingPartyInvite.leaderUsername}</span> convidou você para se juntar ao Grupo de Aventura!
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={lobby.handleAcceptParty} className="px-5 py-1.5 bg-emerald-500 text-black text-xs font-extrabold rounded-lg shadow hover:bg-emerald-400 transition-colors uppercase tracking-wider">
              Aceitar Grupo
            </button>
            <button onClick={() => lobby.setIncomingPartyInvite(null)} className="px-4 py-1.5 bg-indigo-950/70 hover:bg-indigo-950 text-white border border-indigo-850 text-xs font-semibold rounded-lg transition-colors">
              Recusar
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-[#16162a] border-b border-indigo-900/40 px-6 py-4 flex items-center justify-between shadow-md z-10 font-sans">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-extrabold text-indigo-400 tracking-widest bg-gradient-to-r from-indigo-400 to-indigo-500 bg-clip-text">
            MEGACOLISEUM
          </span>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
            Lobby
          </span>
        </div>
        <button onClick={lobby.logout} className="px-4 py-2 bg-rose-950/30 hover:bg-rose-950/80 text-rose-300 border border-rose-900/50 rounded-lg text-sm font-medium transition-all">
          Sair da Conta
        </button>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 max-w-6xl w-full mx-auto overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-48 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 bg-[#16162a] border border-indigo-950 p-2 rounded-2xl shadow-md shrink-0 h-fit z-10">
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.key}
              onClick={() => lobby.setActiveTab(tab.key)}
              className={`flex-1 lg:flex-none px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all whitespace-nowrap ${
                lobby.activeTab === tab.key ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-indigo-950/50 hover:text-gray-200'
              }`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </aside>

        {/* Tab Content */}
        <main className="flex-1 bg-[#121224]/30 border border-indigo-950/50 p-6 rounded-2xl min-h-[400px] shadow-inner flex flex-col justify-start z-10 overflow-y-auto">
          {renderTabContent()}
        </main>

        {/* Chat Panel */}
        <section className="w-full lg:w-72 bg-[#121226]/80 border border-indigo-950 rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden z-10 font-sans min-h-[300px] h-[450px] lg:h-auto">
          <div className="bg-[#16162a] border-b border-indigo-950/50 px-4 py-3 flex justify-between items-center shrink-0">
            <span className="text-xs font-bold tracking-wider text-indigo-400">Bate-papo Global</span>
            <span className="text-[10px] text-gray-500 font-bold px-2 py-0.5 bg-slate-950 rounded-full border border-slate-900">
              {lobby.onlineCount} Online
            </span>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-2.5 text-xs text-gray-300">
            {lobby.chatMessages.length === 0 ? (
              <p className="text-gray-650 italic text-center py-6">Sala silenciosa. Diga olá aos outros guerreiros!</p>
            ) : (
              lobby.chatMessages.map((msg, idx) => {
                const isMe = msg.sender === lobby.username;
                return (
                  <div key={idx} className={`leading-relaxed ${isMe ? 'text-indigo-300' : 'text-gray-300'}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-[10px] uppercase">{msg.sender}</span>
                      <span className="text-[8px] text-gray-500">{msg.time}</span>
                    </div>
                    <p className="mt-0.5 text-white bg-[#0f0f1f]/50 border border-indigo-950/30 p-2 rounded-lg leading-normal break-all">
                      {msg.text}
                    </p>
                  </div>
                );
              })
            )}
          </div>
          <form onSubmit={lobby.handleSendChat} className="bg-[#16162a] border-t border-indigo-950/50 p-3 shrink-0 flex gap-2">
            <input type="text" required placeholder="Digite sua mensagem..."
              value={lobby.chatInput} onChange={(e) => lobby.setChatInput(e.target.value)}
              className="flex-grow bg-slate-950 border border-indigo-950 text-xs rounded-lg px-3 py-2 text-indigo-200 outline-none focus:border-indigo-600 transition-all"
            />
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-lg transition-all">
              Enviar
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
