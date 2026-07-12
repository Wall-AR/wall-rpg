import React, { useEffect, useState } from 'react';
import {
  useLobbyData, TabType, ProfileTab, InventoryTab, FriendsTab,
  BattlesTab, QuestsTab, GMTab, SettingsTab, MemoriesTab,
} from './lobby';
import { CollectionHub, EventsHub, heroArt, HubHome, PlayHub, RoomsHub, StoreHub } from './lobby/HubPanels';
import './styles/lobby-hub.css';

interface LobbyScreenProps {
  onStartGame: () => void;
  onStartBattle: (roomId: string) => void;
}

const MAIN_NAV: Array<{ key: TabType; label: string }> = [
  { key: 'home', label: 'INÍCIO' }, { key: 'play', label: 'JOGAR' },
  { key: 'collection', label: 'HERÓIS' }, { key: 'store', label: 'LOJA' },
  { key: 'events', label: 'EVENTOS' },
];

const SECONDARY_NAV: Array<{ key: TabType; label: string; description: string }> = [
  { key: 'profile', label: 'Perfil', description: 'Atributos e legado' },
  { key: 'inventory', label: 'Mochila', description: 'Itens e equipamentos' },
  { key: 'friends', label: 'Amigos', description: 'Grupo e duelos' },
  { key: 'quests', label: 'Missões', description: 'Objetivos ativos' },
  { key: 'memories', label: 'Memórias', description: 'Heróis aposentados' },
  { key: 'battles', label: 'Histórico', description: 'Registro de batalhas' },
  { key: 'gm', label: 'Painel do Mestre', description: 'Ferramentas narrativas' },
  { key: 'settings', label: 'Ajustes', description: 'Som e preferências' },
];

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onStartGame, onStartBattle }) => {
  const lobby = useLobbyData(onStartBattle, onStartGame);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let frame = 0;
    let previousA = false;
    const handleKeyDown = (event: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (event.key.toLowerCase() === 'g') {
        event.preventDefault();
        lobby.setActiveTab('play');
      }
      if (event.key.toLowerCase() === 'm') {
        event.preventDefault();
        setDrawerOpen(value => !value);
      }
    };
    const pollGamepad = () => {
      const gamepad = navigator.getGamepads?.()[0];
      const aPressed = Boolean(gamepad?.buttons[0]?.pressed);
      if (lobby.activeTab === 'home' && aPressed && !previousA) lobby.setActiveTab('play');
      previousA = aPressed;
      frame = requestAnimationFrame(pollGamepad);
    };
    window.addEventListener('keydown', handleKeyDown);
    frame = requestAnimationFrame(pollGamepad);
    return () => { window.removeEventListener('keydown', handleKeyDown); cancelAnimationFrame(frame); };
  }, [lobby.activeTab, lobby.setActiveTab]);

  const navigate = (tab: TabType) => { lobby.setActiveTab(tab); setDrawerOpen(false); };
  const startTraining = () => lobby.presenceRoom?.send('startTestBattle');

  const renderLegacy = () => {
    if (!lobby.character) return null;
    const c = lobby.character;
    switch (lobby.activeTab) {
      case 'profile': return <ProfileTab character={c} retiredList={lobby.retiredList} isDismissing={lobby.isDismissing} onDismiss={lobby.handleDismissCharacter} />;
      case 'inventory': return <InventoryTab {...lobby} />;
      case 'friends': return <FriendsTab character={c} username={lobby.username} friendsList={lobby.friendsList} onlinePlayers={lobby.onlinePlayers} presenceRoom={lobby.presenceRoom} addFriendName={lobby.addFriendName} setAddFriendName={lobby.setAddFriendName} onAddFriend={lobby.handleAddFriend} onAcceptFriend={lobby.handleAcceptFriend} onRequestDuel={lobby.handleRequestDuel} onInviteParty={lobby.handleInviteParty} onLeaveParty={lobby.handleLeaveParty} />;
      case 'battles': return <BattlesTab />;
      case 'quests': return <QuestsTab />;
      case 'memories': return <MemoriesTab retiredList={lobby.retiredList} setActiveTab={lobby.setActiveTab} />;
      case 'gm': return <GMTab {...lobby} />;
      case 'settings': return <SettingsTab soundEnabled={lobby.soundEnabled} setSoundEnabled={lobby.setSoundEnabled} volume={lobby.volume} setVolume={lobby.setVolume} />;
      default: return null;
    }
  };

  const renderContent = () => {
    if (lobby.loading) return <div className="hub-legacy-panel">Carregando seu legado...</div>;
    if (lobby.error || !lobby.character) return <div className="hub-legacy-panel">{lobby.error || 'Não foi possível carregar o personagem.'}</div>;
    const c = lobby.character;
    switch (lobby.activeTab) {
      case 'home': return <HubHome character={c} onlineCount={lobby.onlineCount} companions={lobby.companionsList} onPlay={() => navigate('play')} onWorld={onStartGame} navigate={navigate} />;
      case 'play': return <PlayHub onWorld={onStartGame} onTraining={startTraining} navigate={navigate} />;
      case 'collection': return <CollectionHub companions={lobby.companionsList} character={c} navigate={navigate} />;
      case 'store': return <StoreHub soulOrbs={c.soulOrbs || 0} />;
      case 'events': return <EventsHub navigate={navigate} />;
      case 'rooms': return <RoomsHub lobby={lobby} />;
      default: return <div className="hub-legacy-panel">{renderLegacy()}</div>;
    }
  };

  const visibleMainTab = MAIN_NAV.some(item => item.key === lobby.activeTab) ? lobby.activeTab : null;

  return <div className="hub-shell">
    <div className="hub-backdrop" aria-hidden="true" />

    {lobby.incomingDuel && <div className="hub-alert"><b>⚔</b><p><strong>{lobby.incomingDuel.challengerUsername}</strong> desafiou você para um duelo.</p><button onClick={lobby.handleAcceptDuel}>ACEITAR</button><button onClick={lobby.handleDeclineDuel}>RECUSAR</button></div>}
    {lobby.incomingPartyInvite && <div className="hub-alert"><b>◇</b><p><strong>{lobby.incomingPartyInvite.leaderUsername}</strong> convidou você para um grupo.</p><button onClick={lobby.handleAcceptParty}>ENTRAR</button><button onClick={() => lobby.setIncomingPartyInvite(null)}>RECUSAR</button></div>}

    <header className="hub-topbar">
      <button className="hub-brand" onClick={() => navigate('home')} aria-label="Ir para o início">
        <span className="hub-brand-mark"><b>M</b></span><div><strong>MEGACOLISEUM</strong><small>CRÔNICAS DE ARKANOR</small></div>
      </button>
      <nav className="hub-nav" aria-label="Navegação principal">{MAIN_NAV.map(item => <button key={item.key} className={visibleMainTab === item.key ? 'active' : ''} onClick={() => navigate(item.key)}>{item.label}</button>)}</nav>
      <div className="hub-account">
        <span className="hub-currency"><i>✦</i>{lobby.character?.soulOrbs || 0}</span>
        <span className="hub-currency"><i>◇</i> 0</span>
        <button className="hub-icon-btn" onClick={() => navigate('friends')} aria-label="Amigos">♙</button>
        <button className="hub-profile-chip" onClick={() => navigate('profile')}><img src={heroArt(lobby.character?.name)} alt="" /><div><strong>{lobby.username}</strong><small>NÍVEL {lobby.character?.level || 1}</small></div></button>
        <button className="hub-icon-btn" onClick={() => setDrawerOpen(value => !value)} aria-label="Abrir menu">☰</button>
      </div>
    </header>

    <main className="hub-main">{renderContent()}</main>

    <nav className="hub-bottom-nav" aria-label="Atalhos principais">
      <button className={lobby.activeTab === 'home' ? 'active' : ''} onClick={() => navigate('home')}>INÍCIO</button>
      <button className={lobby.activeTab === 'collection' ? 'active' : ''} onClick={() => navigate('collection')}>HERÓIS</button>
      <button className={`play-tab ${lobby.activeTab === 'play' ? 'active' : ''}`} onClick={() => navigate('play')}><span><i>▶</i></span>JOGAR</button>
      <button className={lobby.activeTab === 'events' ? 'active' : ''} onClick={() => navigate('events')}>EVENTOS</button>
      <button className={lobby.activeTab === 'store' ? 'active' : ''} onClick={() => navigate('store')}>LOJA</button>
    </nav>

    {drawerOpen && <aside className="hub-drawer" role="dialog" aria-label="Mais opções"><h2>Central do aventureiro</h2><div className="hub-drawer-grid">{SECONDARY_NAV.map(item => <button key={item.key} onClick={() => navigate(item.key)}><strong>{item.label}</strong><small>{item.description}</small></button>)}<button onClick={() => navigate('rooms')}><strong>Salas</strong><small>Criar e encontrar grupos</small></button><button onClick={lobby.logout}><strong>Sair da conta</strong><small>Encerrar sessão</small></button></div></aside>}
  </div>;
};
