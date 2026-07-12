import React, { useMemo, useState } from 'react';
import { Character } from '../../types';
import { CustomLobby, LobbyData, TabType } from './useLobbyData';

const HERO_ART: Record<string, string> = {
  caelum: '/assets/characters/caelum_bust.png',
  lyria: '/assets/characters/lyria_bust.png',
  raven: '/assets/characters/raven_bust.png',
  korr: '/assets/characters/korr_bust.png',
  thorn: '/assets/characters/thorn_bust.png',
  nyxara: '/assets/characters/nyxara_bust.png',
  seraphina: '/assets/characters/seraphina_bust.png',
};

export const heroArt = (name?: string) => HERO_ART[(name || '').toLowerCase()] || HERO_ART.caelum;

interface HomeProps {
  character: Character;
  onlineCount: number;
  companions: any[];
  onPlay: () => void;
  onWorld: () => void;
  navigate: (tab: TabType) => void;
}

export const HubHome: React.FC<HomeProps> = ({ character, onlineCount, companions, onPlay, onWorld, navigate }) => (
  <div className="hub-home" data-testid="hub-home">
    <section className="hub-hero-copy">
      <span className="hub-eyebrow">TEMPORADA I · O PORTÃO DESPERTO</span>
      <h1>Seu legado<br /><em>começa agora.</em></h1>
      <p>Explore Arkanor, fortaleça seu esquadrão e prepare-se para as campanhas conduzidas pelo Mestre.</p>
      <div className="hub-hero-actions">
        <button className="hub-primary-action" onClick={onPlay} autoFocus>
          <span className="hub-play-glyph">▶</span>
          <span><small>ESCOLHA SEU DESTINO</small>JOGAR</span>
        </button>
        <button className="hub-secondary-action" onClick={onWorld}>Continuar no mundo</button>
      </div>
      <div className="hub-status-row">
        <span><i className="status-dot" /> {onlineCount} aventureiro{onlineCount === 1 ? '' : 's'} online</span>
        <span>Região: Arkanor</span>
        <span>Latência: 28 ms</span>
      </div>
    </section>

    <aside className="hub-side-stack">
      <button className="hub-promo-card event" onClick={() => navigate('events')}>
        <span className="promo-kicker">EVENTO ATIVO</span>
        <strong>Ecos do Coliseu</strong>
        <span>7 dias restantes · Ver recompensas</span>
      </button>
      <button className="hub-promo-card quest" onClick={() => navigate('quests')}>
        <span className="promo-kicker">JORNADA SEMANAL</span>
        <strong>O Chamado de Kael</strong>
        <span>2 de 5 objetivos concluídos</span>
        <i><b style={{ width: '40%' }} /></i>
      </button>
      <button className="hub-squad-card" onClick={() => navigate('collection')}>
        <span className="promo-kicker">ESQUADRÃO ATIVO</span>
        <div className="hub-squad-faces">
          {companions.slice(0, 5).map((hero, index) => <img key={hero.id || index} src={heroArt(hero.name)} alt={hero.name} />)}
          {companions.length === 0 && <img src={heroArt(character.name)} alt={character.name} />}
        </div>
        <span>Gerenciar heróis →</span>
      </button>
    </aside>
  </div>
);

const modes = [
  { id: 'world', title: 'Mundo RPG', kicker: 'EXPLORAÇÃO ONLINE', description: 'Explore Arkanor, encontre NPCs, farme e avance em missões.', art: '/assets/characters/lyria_bust.png', status: 'Disponível' },
  { id: 'training', title: 'Treino de Kael', kicker: 'PVE · 5 ESCOLHE 3', description: 'Entre no lobby pré-batalha e teste sua formação contra o instrutor.', art: '/assets/characters/caelum_bust.png', status: 'Disponível' },
  { id: 'duel', title: 'Duelo', kicker: 'PVP · 1X1 A 3X3', description: 'Crie uma sala e convide jogadores para um confronto estratégico.', art: '/assets/characters/korr_bust.png', status: 'Sala personalizada' },
  { id: 'brawl', title: 'Brawl', kicker: '8 JOGADORES', description: 'Oito tabuleiros, confrontos rotativos e apenas um sobrevivente.', art: '/assets/characters/nyxara_bust.png', status: 'Em desenvolvimento' },
] as const;

interface PlayProps { onWorld: () => void; onTraining: () => void; navigate: (tab: TabType) => void }
export const PlayHub: React.FC<PlayProps> = ({ onWorld, onTraining, navigate }) => (
  <div className="hub-panel-page">
    <header className="hub-page-heading"><span>PORTAL DE JOGO</span><h2>Escolha seu modo</h2><p>Cada jornada usa os mesmos heróis, armas e progresso da sua conta.</p></header>
    <div className="mode-grid">
      {modes.map(mode => (
        <article key={mode.id} className={`mode-card mode-${mode.id}`}>
          <img src={mode.art} alt="" />
          <div className="mode-card-shade" />
          <div className="mode-copy"><span>{mode.kicker}</span><h3>{mode.title}</h3><p>{mode.description}</p><small>{mode.status}</small></div>
          <button disabled={mode.id === 'brawl'} onClick={() => mode.id === 'world' ? onWorld() : mode.id === 'training' ? onTraining() : navigate('rooms')}>
            {mode.id === 'brawl' ? 'EM BREVE' : mode.id === 'duel' ? 'CRIAR SALA' : 'ENTRAR'}
          </button>
        </article>
      ))}
    </div>
    <button className="custom-room-banner" onClick={() => navigate('rooms')}><span>⌘</span><div><strong>Salas personalizadas</strong><small>Crie, encontre ou reúna seu grupo em uma sala.</small></div><b>ABRIR SALAS →</b></button>
  </div>
);

export const CollectionHub: React.FC<{ companions: any[]; character: Character; navigate: (tab: TabType) => void }> = ({ companions, character, navigate }) => {
  const roster = companions.length ? companions : [{ id: character.id, name: character.name, level: character.level, element: character.element, rarity: 'S', isActive: true }];
  return <div className="hub-panel-page"><header className="hub-page-heading inline"><div><span>COLEÇÃO</span><h2>Seus heróis</h2><p>Monte formações e acompanhe o crescimento do seu elenco.</p></div><button onClick={() => navigate('inventory')}>Ver equipamentos</button></header><div className="collection-grid">{roster.map((hero: any) => <article key={hero.id} className="hero-collection-card"><img src={heroArt(hero.name)} alt={hero.name} /><div className="hero-rarity">{hero.rarity || 'C'}</div>{hero.isActive && <span className="hero-active">ATIVO</span>}<div><small>{hero.element || 'não elemental'}</small><h3>{hero.name}</h3><p>Nível {hero.level || 1}</p></div></article>)}</div></div>;
};

export const StoreHub: React.FC<{ soulOrbs: number }> = ({ soulOrbs }) => (
  <div className="hub-panel-page"><header className="hub-page-heading inline"><div><span>MERCADO CELESTIAL</span><h2>Loja</h2><p>Uma vitrine do futuro mercado. Compras ainda não estão habilitadas.</p></div><div className="store-balance">✦ {soulOrbs} <small>ORBES</small></div></header><section className="store-feature"><img src="/assets/characters/seraphina_bust.png" alt="Seraphina" /><div><span>DESTAQUE DA SEMANA</span><h3>Relíquias da Aurora</h3><p>Visuais, emblemas e lembranças cosméticas. Nenhum bônus de poder.</p><button disabled>EM PREPARAÇÃO</button></div></section><div className="store-grid">{['Pacote do Fundador', 'Emblema de Arkanor', 'Moldura do Coliseu'].map((item, index) => <article key={item}><div className={`store-item-art art-${index}`}>✦</div><span>{index === 0 ? 'PACOTE' : 'COSMÉTICO'}</span><h4>{item}</h4><p>Disponível em uma atualização futura.</p></article>)}</div></div>
);

export const EventsHub: React.FC<{ navigate: (tab: TabType) => void }> = ({ navigate }) => (
  <div className="hub-panel-page"><header className="hub-page-heading"><span>CRÔNICAS VIVAS</span><h2>Eventos</h2><p>Histórias temporárias, jornadas coletivas e recompensas memoráveis.</p></header><section className="event-feature"><div><span>EVENTO DE LANÇAMENTO</span><h3>Ecos do Coliseu</h3><p>Complete o duelo de teste, visite o mundo e prepare três heróis para conquistar as primeiras recompensas da conta zero.</p><div className="event-progress"><i><b style={{ width: '33%' }} /></i><small>1 / 3 marcos</small></div><button onClick={() => navigate('play')}>IR PARA JOGAR</button></div><img src="/assets/characters/raven_bust.png" alt="Raven" /></section><div className="event-list"><article><b>01</b><div><span>DIÁRIO</span><h4>Primeiros passos</h4><p>Entre no mundo de Arkanor.</p></div><em>+ 50 XP</em></article><article><b>02</b><div><span>SEMANAL</span><h4>Formação de elite</h4><p>Prepare três heróis no lobby de batalha.</p></div><em>✦ 2 orbes</em></article></div></div>
);

const modeLabels: Record<CustomLobby['mode'], string> = { world: 'Mundo RPG', training: 'Treino PvE', duel: 'Duelo' };
export const RoomsHub: React.FC<{ lobby: LobbyData }> = ({ lobby }) => {
  const [name, setName] = useState(`Sala de ${lobby.username}`);
  const [mode, setMode] = useState<CustomLobby['mode']>('training');
  const [maxPlayers, setMaxPlayers] = useState(3);
  const current = useMemo(() => lobby.customLobbies.find(room => room.id === lobby.currentCustomLobbyId), [lobby.customLobbies, lobby.currentCustomLobbyId]);
  const duelReady = current?.mode !== 'duel' || (current.members.length >= 2 && current.members.length % 2 === 0);

  const changeMode = (nextMode: CustomLobby['mode']) => {
    setMode(nextMode);
    setMaxPlayers(nextMode === 'duel' ? 2 : 3);
  };

  return <div className="hub-panel-page rooms-page">
    <header className="hub-page-heading">
      <span>SALAS PERSONALIZADAS</span><h2>Reúna seu grupo</h2>
      <p>Crie uma sala, compartilhe o código e escolha como a aventura começa.</p>
    </header>
    {current ? <section className="current-room">
      <div className="room-code"><small>CÓDIGO DA SALA</small><strong>{current.id}</strong></div>
      <div><span>{modeLabels[current.mode]}</span><h3>{current.name}</h3><p>Líder: {current.hostUsername} · {current.members.length}/{current.maxPlayers} jogadores</p></div>
      <div className="room-members">{current.members.map(member => <span key={member.sessionId}>{member.username.slice(0, 1).toUpperCase()}<small>{member.username}</small></span>)}</div>
      <div className="room-actions">
        {lobby.roomFeedback && <span className="room-feedback">{lobby.roomFeedback}</span>}
        <button className="ghost" onClick={lobby.leaveCustomLobby}>SAIR</button>
        {current.hostSessionId === lobby.presenceRoom?.sessionId && <button disabled={!duelReady} onClick={lobby.startCustomLobby}>{duelReady ? 'INICIAR PARTIDA' : 'AGUARDANDO EQUIPE PAR'}</button>}
      </div>
    </section> : <section className="room-create">
      <div><span>CRIAR NOVA SALA</span><h3>Defina a experiência</h3>
        <label>Nome da sala<input value={name} maxLength={32} onChange={event => setName(event.target.value)} /></label>
        <div className="room-form-row">
          <label>Modo<select value={mode} onChange={event => changeMode(event.target.value as CustomLobby['mode'])}><option value="training">Treino PvE</option><option value="world">Mundo RPG</option><option value="duel">Duelo</option></select></label>
          <label>Jogadores<select value={maxPlayers} onChange={event => setMaxPlayers(Number(event.target.value))}>{mode === 'duel' ? <><option value={2}>2</option><option value={4}>4</option><option value={6}>6</option></> : <><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></>}</select></label>
        </div>
        <button onClick={() => lobby.createCustomLobby(name, mode, maxPlayers)}>CRIAR SALA</button>
        {lobby.roomFeedback && <p className="room-feedback">{lobby.roomFeedback}</p>}
      </div>
      <aside><strong>Como funciona</strong><p>O líder escolhe o modo. Até três jogadores podem explorar ou treinar juntos; duelos aceitam duas equipes iguais de até três.</p><p>Ao iniciar, todos os membros conectados são transportados juntos.</p></aside>
    </section>}
    <section className="room-browser">
      <div className="room-browser-title"><div><span>SALAS ABERTAS</span><h3>Encontrar partida</h3></div><small>{lobby.customLobbies.length} disponível(is)</small></div>
      {lobby.customLobbies.length === 0 ? <div className="empty-rooms"><span>◇</span><p>Nenhuma sala aberta. Seja o primeiro a criar.</p></div> : lobby.customLobbies.map(room => <article key={room.id}><div><span>{modeLabels[room.mode]}</span><strong>{room.name}</strong><small>{room.hostUsername} · {room.id}</small></div><b>{room.members.length}/{room.maxPlayers}</b><button disabled={Boolean(current) || room.members.length >= room.maxPlayers} onClick={() => lobby.joinCustomLobby(room.id)}>ENTRAR</button></article>)}
    </section>
  </div>;
};
