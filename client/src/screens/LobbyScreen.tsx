import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/auth';
import { Character } from '../types';
import { client } from '../game/colyseus';

type TabType = 'home' | 'profile' | 'inventory' | 'friends' | 'battles' | 'quests' | 'gm' | 'settings';

interface LobbyScreenProps {
  onStartGame: () => void;
  onStartBattle: (roomId: string) => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onStartGame, onStartBattle }) => {
  const { token, logout, username } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [retiredList, setRetiredList] = useState<any[]>([]);
  const [isDismissing, setIsDismissing] = useState(false);

  // Phase 6 States
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [presenceRoom, setPresenceRoom] = useState<any>(null);
  const [onlinePlayers, setOnlinePlayers] = useState<Record<string, string>>({}); // sessionId -> username
  const [addFriendName, setAddFriendName] = useState("");
  const [transferTarget, setTransferTarget] = useState("");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // Active Duel Invitation state
  const [incomingDuel, setIncomingDuel] = useState<{ challengerSessionId: string, challengerUsername: string } | null>(null);

  // Phase 9 Party States
  const [incomingPartyInvite, setIncomingPartyInvite] = useState<{ leaderSessionId: string, leaderUsername: string } | null>(null);

  // Fusion & Evolution States (Phase 5 Extension)
  const [fuseTargetId, setFuseTargetId] = useState("");
  const [isFusing, setIsFusing] = useState(false);
  const [isEvolvingRarity, setIsEvolvingRarity] = useState(false);

  // GM inputs (Phase 7)
  const [gmNarration, setGmNarration] = useState("");
  const [gmMonsterType, setGmMonsterType] = useState("orc");
  const [gmMonsterName, setGmMonsterName] = useState("Orc Gigante");
  const [gmSpawnX, setGmSpawnX] = useState(5);
  const [gmSpawnY, setGmSpawnY] = useState(5);
  const [gmQuestTitle, setGmQuestTitle] = useState("");
  const [gmQuestDesc, setGmQuestDesc] = useState("");

  // Settings mock state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(80);

  // 1. Fetch character, friends, and inventory on mount
  const fetchCharacter = async () => {
    try {
      const response = await fetch('/character/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Falha ao carregar dados do personagem.');
      const data = await response.json();
      
      const charData: Character = {
        id: data.id,
        name: data.name,
        level: data.level,
        xp: data.xp,
        hp: data.stats.hp,
        maxHp: data.stats.hp,
        mp: data.stats.mp,
        maxMp: data.stats.mp,
        sp: 0,
        maxSp: 100,
        at: data.stats.strength,
        df: data.stats.defense,
        mat: data.stats.strength,
        mdf: data.stats.defense,
        speed: data.stats.speed,
        element: data.element,
        dragoonLevel: data.dragoonLevel,
        additions: [],
        equipment: { weapon: null, armor: null, accessory: null },
        soulOrbs: data.soulOrbs
      };
      setCharacter(charData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch('/friends', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFriendsList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch('/inventory', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInventoryList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCharacter();
      fetchFriends();
      fetchInventory();
    }
  }, [token]);

  // 2. Colyseus Presence connection & Events
  useEffect(() => {
    let activeRoom: any = null;

    const connectToPresence = async () => {
      try {
        activeRoom = await client.joinOrCreate("game", { token });
        setPresenceRoom(activeRoom);
        
        const updateOnlinePlayers = () => {
          setOnlineCount(activeRoom.state.players.size);
          const playersMap: Record<string, string> = {};
          activeRoom.state.players.forEach((p: any, sessionId: string) => {
            playersMap[sessionId] = p.username;
          });
          setOnlinePlayers(playersMap);
        };

        activeRoom.state.players.onAdd = updateOnlinePlayers;
        activeRoom.state.players.onRemove = updateOnlinePlayers;
        activeRoom.onStateChange(() => {
          updateOnlinePlayers();
        });

        // Chat Broadcast listener
        activeRoom.onMessage("chat", (msg: any) => {
          setChatMessages(prev => [...prev, msg]);
        });

        // Duel Request listener
        activeRoom.onMessage("duelRequest", (data: any) => {
          setIncomingDuel(data);
        });

        // Start Duel room redirect listener
        activeRoom.onMessage("startDuel", (data: { roomId: string }) => {
          setIncomingDuel(null);
          onStartBattle(data.roomId);
        });

        // Party Invite listener
        activeRoom.onMessage("partyInvite", (data: any) => {
          setIncomingPartyInvite(data);
        });

        // Start Battle redirect listener (Phase 9 Co-op)
        activeRoom.onMessage("startBattle", (data: { roomId: string }) => {
          setIncomingDuel(null);
          onStartBattle(data.roomId);
        });

        updateOnlinePlayers();
      } catch (err) {
        console.warn("Failed to connect to Colyseus presence room:", err);
      }
    };

    if (token) {
      connectToPresence();
    }

    return () => {
      if (activeRoom) {
        activeRoom.leave();
      }
    };
  }, [token]);

  // Fetch retired list when Profile tab is active
  useEffect(() => {
    if (activeTab === 'profile') {
      const fetchRetired = async () => {
        try {
          const res = await fetch('/character/retired', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setRetiredList(data);
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchRetired();
    }
  }, [activeTab, token]);

  // Phase 6 Handlers
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !presenceRoom) return;
    presenceRoom.send("chat", { text: chatInput });
    setChatInput("");
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFriendName.trim()) return;
    try {
      const res = await fetch('/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUsername: addFriendName })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setAddFriendName("");
        fetchFriends();
      } else {
        alert(data.error || "Erro ao adicionar amigo.");
      }
    } catch (err) {
      alert("Erro ao conectar ao servidor.");
    }
  };

  const handleAcceptFriend = async (friendId: string) => {
    try {
      const res = await fetch('/friends/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ friendId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        fetchFriends();
      }
    } catch (err) {
      alert("Erro ao conectar.");
    }
  };

  const handleTransferItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTarget.trim() || !selectedItem) return;
    setIsTransferring(true);
    try {
      const res = await fetch('/inventory/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUsername: transferTarget, inventoryId: selectedItem.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setTransferTarget("");
        setSelectedItem(null);
        fetchInventory();
      } else {
        alert(data.error || "Erro ao transferir item.");
      }
    } catch (err) {
      alert("Erro de conexão.");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleRequestDuel = (friendUsername: string) => {
    if (!presenceRoom) return;
    // Find sessionId by username
    const targetSessionId = Object.keys(onlinePlayers).find(sid => onlinePlayers[sid] === friendUsername);
    if (targetSessionId) {
      presenceRoom.send("requestDuel", { targetSessionId });
      alert(`Desafio de duelo enviado para ${friendUsername}! Aguardando resposta.`);
    } else {
      alert(`${friendUsername} não está mais online no lobby.`);
    }
  };

  const handleAcceptDuel = () => {
    if (!presenceRoom || !incomingDuel) return;
    presenceRoom.send("acceptDuel", { challengerSessionId: incomingDuel.challengerSessionId });
    setIncomingDuel(null);
  };

  const handleDeclineDuel = () => {
    setIncomingDuel(null);
  };

  const handleAcceptParty = () => {
    if (!presenceRoom || !incomingPartyInvite) return;
    presenceRoom.send("acceptParty", { leaderSessionId: incomingPartyInvite.leaderSessionId });
    setIncomingPartyInvite(null);
  };

  const handleInviteParty = (friendUsername: string) => {
    if (!presenceRoom) return;
    const targetSessionId = Object.keys(onlinePlayers).find(sid => onlinePlayers[sid] === friendUsername);
    if (targetSessionId) {
      presenceRoom.send("inviteParty", { targetSessionId });
      alert(`Convite de grupo enviado para ${friendUsername}!`);
    } else {
      alert(`${friendUsername} não está online no lobby.`);
    }
  };

  const handleLeaveParty = () => {
    if (!presenceRoom) return;
    presenceRoom.send("leaveParty");
    alert("Você saiu do grupo.");
  };

  const handleFuseItems = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !fuseTargetId) return;
    setIsFusing(true);
    try {
      const res = await fetch('/inventory/fuse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ item1Id: selectedItem.id, item2Id: fuseTargetId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setSelectedItem(null);
        setFuseTargetId("");
        fetchInventory();
      } else {
        alert(data.error || "Erro na fusão.");
      }
    } catch (err) {
      alert("Erro de conexão.");
    } finally {
      setIsFusing(false);
    }
  };

  const handleEvolveRarityAction = async () => {
    if (!selectedItem) return;
    setIsEvolvingRarity(true);
    try {
      const res = await fetch('/inventory/evolve-rarity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inventoryId: selectedItem.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        fetchCharacter();
        setSelectedItem(null);
        fetchInventory();
      } else {
        alert(data.error || "Erro na evolução de raridade.");
      }
    } catch (err) {
      alert("Erro de conexão.");
    } finally {
      setIsEvolvingRarity(false);
    }
  };

  const handleDismissCharacter = async () => {
    if (!character) return;
    const confirm = window.confirm(
      `Tem certeza que deseja se despedir de ${character.name}? Esta ação é irreversível e ele será enviado para o Álbum de Lembranças.`
    );
    if (!confirm) return;

    setIsDismissing(true);
    try {
      const res = await fetch('/character/dismiss', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ characterId: character.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`${data.message}\nVocê recebeu +${data.orbsAwarded} Orbes de Alma!`);
        logout();
      } else {
        alert(data.error || 'Erro ao despedir guerreiro.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao despedir guerreiro.');
    } finally {
      setIsDismissing(false);
    }
  };

  // Phase 7 GM Handlers
  const handleGmNarrateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmNarration.trim() || !presenceRoom) return;
    presenceRoom.send("gmNarrate", { text: gmNarration });
    setGmNarration("");
    alert("Narração enviada para todos os jogadores!");
  };

  const handleGmSpawnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presenceRoom) return;
    presenceRoom.send("gmSpawn", {
      type: gmMonsterType,
      name: gmMonsterName,
      x: gmSpawnX * 32,
      y: gmSpawnY * 32
    });
    alert(`Monstro ${gmMonsterName} materializado no Grid (${gmSpawnX}, ${gmSpawnY})!`);
  };

  const handleGmQuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmQuestTitle.trim() || !presenceRoom) return;
    presenceRoom.send("gmQuest", {
      id: 'gm-quest-' + Date.now(),
      name: gmQuestTitle,
      description: gmQuestDesc
    });
    setGmQuestTitle("");
    setGmQuestDesc("");
    alert("Missão de Mestre (Campanha) iniciada globalmente!");
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex-grow flex items-center justify-center p-12">
          <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      );
    }

    if (error || !character) {
      return (
        <div className="p-8 text-center text-rose-400 bg-rose-950/20 border border-rose-900/40 rounded-xl max-w-md mx-auto my-8 font-sans">
          <span className="text-3xl block mb-2">⚠️</span>
          <p>{error || 'Erro ao carregar dados do lobby.'}</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6 max-w-4xl mx-auto font-sans">
            <div className="p-8 rounded-2xl bg-gradient-to-r from-indigo-950 to-indigo-900/60 border border-indigo-800/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
              <div className="space-y-2 text-center md:text-left z-10">
                <h2 className="text-3xl font-extrabold tracking-wide text-indigo-300">Pronto para a Arena, {character.name}?</h2>
                <p className="text-gray-400 text-sm max-w-lg">
                  Explore o mapa do mundo 2D, interaja com outros guerreiros e desafie monstros para evoluir seus poderes de Dragoon.
                </p>
              </div>
              <button
                onClick={onStartGame}
                className="px-8 py-4 bg-gradient-to-r from-[#e94560] to-[#ff6b81] hover:from-[#d13750] hover:to-[#e0546a] text-white font-bold rounded-xl shadow-lg hover:shadow-[#e94560]/30 transition-all text-base uppercase tracking-wider whitespace-nowrap scale-105 active:scale-100 z-10"
              >
                🎮 Entrar no Jogo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-[#16162a] border border-indigo-950 rounded-xl space-y-3 shadow-md">
                <div className="flex justify-between items-center text-gray-400">
                  <span className="text-sm font-semibold uppercase tracking-wider text-indigo-300">Status Geral</span>
                  <span>Lv. {character.level}</span>
                </div>
                <div className="text-3xl font-extrabold">{character.hp} HP</div>
                <div className="text-xs text-gray-400">Poder de Ataque: <span className="text-indigo-200">{character.at}</span></div>
              </div>

              <div className="p-6 bg-[#16162a] border border-indigo-950 rounded-xl space-y-3 shadow-md">
                <div className="flex justify-between items-center text-gray-400">
                  <span className="text-sm font-semibold uppercase tracking-wider text-indigo-300">Elemento Dragoon</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 uppercase font-bold">{character.element}</span>
                </div>
                <div className="text-3xl font-extrabold">{character.soulOrbs || 0} Orbes</div>
                <div className="text-xs text-gray-400">XP Acumulado: <span className="text-indigo-200">{character.xp}</span></div>
              </div>

              <div className="p-6 bg-[#16162a] border border-indigo-950 rounded-xl space-y-3 shadow-md">
                <div className="flex justify-between items-center text-gray-400">
                  <span className="text-sm font-semibold uppercase tracking-wider text-indigo-300">Amigos & Duelos</span>
                  <span className="text-green-400 text-xs flex items-center gap-1.5 font-bold">● Online</span>
                </div>
                <div className="text-3xl font-extrabold">{onlineCount} {onlineCount === 1 ? 'Jogador' : 'Jogadores'}</div>
                <div className="text-xs text-gray-400">Desafie amigos na aba Amigos!</div>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="max-w-3xl mx-auto bg-[#16162a] border border-indigo-950 rounded-2xl p-8 space-y-8 shadow-xl">
            <div className="flex items-center gap-6 border-b border-indigo-950/80 pb-6 font-sans">
              <div className="w-20 h-20 bg-indigo-900/60 rounded-full flex items-center justify-center border-2 border-indigo-500 shadow-md">
                <span className="text-4xl">👤</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-gray-100">{character.name}</h3>
                <p className="text-sm text-indigo-400 uppercase font-semibold tracking-wider">Guerreiro do Elemento {character.element}</p>
                {character.soulOrbs !== undefined && (
                  <p className="text-xs text-yellow-400 font-bold flex items-center gap-1.5 pt-1">
                    ✨ {character.soulOrbs} Orbes de Alma
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
              <div className="space-y-5">
                <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-300 border-b border-indigo-950 pb-2">Atributos Básicos</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Nível</span>
                    <span className="font-bold text-gray-200">{character.level}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Experiência (XP)</span>
                    <span className="font-bold text-gray-200">{character.xp}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-medium">HP (Vida)</span>
                    <span className="font-bold text-emerald-400">{character.hp} / {character.maxHp}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-medium">MP (Magia)</span>
                    <span className="font-bold text-blue-400">{character.mp} / {character.maxMp}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-300 border-b border-indigo-950 pb-2">Status de Combate</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Força (Ataque)</span>
                    <span className="font-bold text-gray-200">{character.at}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Defesa</span>
                    <span className="font-bold text-gray-200">{character.df}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Velocidade</span>
                    <span className="font-bold text-gray-200">{character.speed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Nível Dragoon</span>
                    <span className="font-bold text-indigo-300">{character.dragoonLevel > 0 ? `Lvl ${character.dragoonLevel}` : 'Não Desbloqueado'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Despedida de Guerreiro */}
            <div className="border-t border-indigo-950/80 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 font-sans">
              <div className="space-y-1 text-center md:text-left">
                <h4 className="font-bold text-gray-200">Despedida de Guerreiro</h4>
                <p className="text-xs text-gray-400 max-w-md">
                  Se você desejar abrir mão deste personagem (limite de 6 ativos), poderá despedir-se dele. A experiência acumulada será convertida em <b>Orbes de Alma</b> e ele será registrado no seu Álbum.
                </p>
              </div>
              <button
                onClick={handleDismissCharacter}
                disabled={isDismissing}
                className="px-5 py-2.5 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-900/50 hover:border-rose-500 text-rose-300 text-xs font-bold rounded-lg transition-all whitespace-nowrap"
              >
                {isDismissing ? 'Despedindo...' : 'Despedir-se do Guerreiro'}
              </button>
            </div>

            {/* Álbum de Lembranças */}
            <div className="border-t border-indigo-950/80 pt-6 space-y-4 font-sans">
              <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-300">Álbum de Lembranças (Mural de Heróis)</h4>
              {retiredList.length === 0 ? (
                <p className="text-xs text-gray-500 italic">Você não se despediu de nenhum guerreiro nesta conta ainda.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {retiredList.map((ret: any) => (
                    <div key={ret.id} className="p-4 bg-[#0d0d1e]/90 border border-indigo-950 rounded-xl space-y-2 relative overflow-hidden group">
                      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-indigo-500/20 to-transparent"></div>
                      <div className="flex justify-between items-start">
                        <h5 className="font-bold text-gray-200 truncate pr-2">{ret.name}</h5>
                        <span className="text-[9px] uppercase font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-900 px-1.5 py-0.5 rounded shrink-0">
                          {ret.element}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 space-y-0.5">
                        <p>Nível Aposentado: <span className="text-white font-medium">{ret.level}</span></p>
                        <p>XP Acumulado: <span className="text-white font-medium">{ret.xp}</span></p>
                        <p>Aposentado em: <span className="text-slate-500 font-medium">{new Date(ret.retiredAt).toLocaleDateString()}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'inventory':
        return (
          <div className="max-w-4xl mx-auto space-y-6 font-sans">
            <div className="flex items-center justify-between border-b border-indigo-950 pb-4">
              <h3 className="text-xl font-bold">Mochila & Equipamento</h3>
              <span className="text-xs text-gray-400">Total: {inventoryList.length} itens</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Items Grid */}
              <div className="md:col-span-2 grid grid-cols-4 sm:grid-cols-5 gap-3 h-fit">
                {inventoryList.length === 0 ? (
                  <p className="col-span-full text-sm text-gray-500 italic py-6">Sua mochila está vazia.</p>
                ) : (
                  inventoryList.map((item: any) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`aspect-square bg-[#16162a] border rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 hover:border-indigo-500 transition-colors group cursor-pointer relative ${
                        selectedItem?.id === item.id ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-indigo-950'
                      }`}
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">
                        {item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '🧪'}
                      </span>
                      <span className="text-[9px] text-gray-300 font-semibold truncate max-w-full text-center">
                        {item.name}
                      </span>
                      {item.equippedCharacterId && (
                        <span className="absolute top-1 right-1 text-[8px] px-1 bg-indigo-900 border border-indigo-700 text-indigo-300 font-bold rounded">
                          E
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Item details & Transfer Panel */}
              <div className="md:col-span-1 bg-[#16162a] border border-indigo-950 rounded-2xl p-5 shadow-lg flex flex-col justify-start gap-4 min-h-[300px]">
                {selectedItem ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider block mb-1">
                        {selectedItem.metadata?.rarity || selectedItem.rarity} {selectedItem.type}
                      </span>
                      <h4 className="font-bold text-white text-base leading-tight">
                        {selectedItem.name}
                        {selectedItem.metadata?.evolvedSuffix || ''}
                      </h4>
                    </div>

                    <div className="text-xs text-gray-400 space-y-1 border-t border-indigo-950 pt-3">
                      <p>Nível: <span className="text-white font-semibold">Lv. {selectedItem.metadata?.level || 1} / 10</span></p>
                      <p>Bônus de Ataque: <span className="text-emerald-400 font-semibold">+{selectedItem.metadata?.atkBonus || 0} ATK</span></p>
                      <p>Equipado: <span className="text-white font-semibold">{selectedItem.equippedCharacterId ? "Sim" : "Não"}</span></p>
                      {selectedItem.metadata?.element && (
                        <p>Encanto: <span className="text-indigo-400 font-semibold capitalize">{selectedItem.metadata.element}</span></p>
                      )}
                    </div>

                    {!selectedItem.equippedCharacterId ? (
                      <div className="space-y-4 border-t border-indigo-950 pt-3">
                        {/* 1. Gift Transfer */}
                        <form onSubmit={handleTransferItem} className="space-y-1.5">
                          <span className="text-[9px] text-indigo-350 font-bold uppercase block">Transferir para Amigo (Gift)</span>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              required
                              placeholder="Username"
                              value={transferTarget}
                              onChange={(e) => setTransferTarget(e.target.value)}
                              className="flex-1 bg-slate-950 border border-indigo-950 text-[10px] rounded-lg px-2.5 py-1.5 text-indigo-200 outline-none focus:border-indigo-600 transition-all"
                            />
                            <button
                              type="submit"
                              disabled={isTransferring}
                              className="px-2.5 bg-indigo-900/40 hover:bg-indigo-800 border border-indigo-700 text-indigo-300 text-[10px] font-bold rounded-lg transition-colors shrink-0"
                            >
                              Enviar
                            </button>
                          </div>
                        </form>

                        {/* 2. Fusion Level Up */}
                        {(() => {
                          const identicalItems = inventoryList.filter(
                            (i: any) => i.itemId === selectedItem.itemId && i.id !== selectedItem.id && !i.equippedCharacterId
                          );
                          const currentLvl = selectedItem.metadata?.level || 1;

                          if (currentLvl >= 10) {
                            return <p className="text-[9px] text-emerald-400 italic">✓ Item atingiu o nível máximo (Lv. 10)</p>;
                          }

                          return (
                            <form onSubmit={handleFuseItems} className="space-y-1.5">
                              <span className="text-[9px] text-indigo-350 font-bold uppercase block">Fusão (Subir Nível)</span>
                              {identicalItems.length === 0 ? (
                                <p className="text-[8px] text-gray-550 italic">Adquira outro item idêntico não equipado para poder fundir.</p>
                              ) : (
                                <div className="flex gap-1.5">
                                  <select
                                    required
                                    value={fuseTargetId}
                                    onChange={(e) => setFuseTargetId(e.target.value)}
                                    className="flex-1 bg-slate-950 border border-indigo-950 text-[10px] rounded-lg px-2 py-1.5 text-indigo-250 outline-none focus:border-indigo-600"
                                  >
                                    <option value="">Selecione o item base...</option>
                                    {identicalItems.map((item: any) => (
                                      <option key={item.id} value={item.id}>
                                        {item.name} (Lv. {item.metadata?.level || 1})
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="submit"
                                    disabled={isFusing || !fuseTargetId}
                                    className="px-2.5 bg-indigo-900/40 hover:bg-indigo-800 border border-indigo-700 text-indigo-300 text-[10px] font-bold rounded-lg transition-colors shrink-0"
                                  >
                                    Mesclar
                                  </button>
                                </div>
                              )}
                            </form>
                          );
                        })()}

                        {/* 3. Evolve Rarity */}
                        {(() => {
                          const currentRar = selectedItem.metadata?.rarity || 'comum';
                          if (currentRar === 'lendário') {
                            return <p className="text-[9px] text-yellow-400 italic">✨ Item atingiu a raridade máxima (Lendário)</p>;
                          }
                          return (
                            <div className="space-y-1.5">
                              <span className="text-[9px] text-yellow-500 font-bold uppercase block">Evoluir Raridade</span>
                              <button
                                onClick={handleEvolveRarityAction}
                                disabled={isEvolvingRarity}
                                className="w-full py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-extrabold rounded-lg text-[10px] uppercase tracking-wider transition-all"
                              >
                                {isEvolvingRarity ? 'Evoluindo...' : 'Subir de Raridade (Custa 10 Orbes)'}
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <p className="text-[10px] text-amber-500 font-medium bg-amber-950/20 border border-amber-900/30 p-2.5 rounded-lg">
                        ⚠️ Desequipe este item no menu do personagem para poder melhorá-lo ou transferi-lo.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8 text-gray-500">
                    <span className="text-3xl mb-2">🎒</span>
                    <p className="text-xs font-medium">Selecione um item da mochila para ver detalhes ou evoluir.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'friends':
        const myPartyId = presenceRoom?.state?.players?.get(presenceRoom.sessionId)?.partyId;
        const partyMembers: string[] = [];
        if (myPartyId && presenceRoom?.state?.players) {
          presenceRoom.state.players.forEach((p: any) => {
            if (p.partyId === myPartyId) {
              partyMembers.push(p.username);
            }
          });
        }

        return (
          <div className="max-w-2xl mx-auto space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-indigo-950 pb-4 gap-4">
              <h3 className="text-xl font-bold">Amigos & Duelos</h3>
              
              {/* Add friend form */}
              <form onSubmit={handleAddFriend} className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  required
                  placeholder="Username do Amigo"
                  value={addFriendName}
                  onChange={(e) => setAddFriendName(e.target.value)}
                  className="bg-slate-950 border border-indigo-950 text-xs rounded-lg px-3 py-1.5 text-indigo-200 outline-none focus:border-indigo-600 transition-all w-full sm:w-44"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-900/40 hover:bg-indigo-800 border border-indigo-700 rounded-lg text-xs font-bold text-indigo-300 transition-colors whitespace-nowrap"
                >
                  Adicionar
                </button>
              </form>
            </div>

            {/* Active Party Panel */}
            {myPartyId && (
              <div className="p-5 bg-indigo-950/20 border border-indigo-900/50 rounded-2xl space-y-3 shadow-md">
                <div className="flex justify-between items-center border-b border-indigo-950 pb-2">
                  <h4 className="font-bold text-indigo-300 text-sm flex items-center gap-1.5">👥 Seu Grupo Ativo</h4>
                  <button
                    onClick={handleLeaveParty}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-bold border border-rose-950 bg-rose-950/30 px-2 py-0.5 rounded transition-all"
                  >
                    Sair do Grupo
                  </button>
                </div>
                <ul className="text-xs text-gray-300 space-y-1.5 pl-1">
                  {partyMembers.map((m, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-emerald-500 font-extrabold">●</span> {m} {m === username ? '(Você)' : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3">
              {friendsList.length === 0 ? (
                <p className="text-sm text-gray-500 italic py-4">Você ainda não tem amigos adicionados.</p>
              ) : (
                friendsList.map((friend: any) => {
                  const isOnline = Object.values(onlinePlayers).includes(friend.username);
                  return (
                    <div key={friend.friendId} className="p-4 bg-[#16162a] border border-indigo-950 rounded-xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                        <div>
                          <span className="font-semibold text-gray-200 text-sm block">{friend.username}</span>
                          <span className="text-[10px] text-gray-500 capitalize">{friend.status === 'pending' ? 'Pedido Pendente' : 'Amigos'}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {friend.status === 'pending' && friend.friendId !== character.id && (
                          <button
                            onClick={() => handleAcceptFriend(friend.friendId)}
                            className="px-3 py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 text-xs font-bold rounded transition-colors"
                          >
                            Aceitar Pedido
                          </button>
                        )}
                        {friend.status === 'accepted' && isOnline && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleInviteParty(friend.username)}
                              className="px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 text-xs font-bold rounded transition-colors"
                            >
                              Convidar Grupo
                            </button>
                            <button
                              onClick={() => handleRequestDuel(friend.username)}
                              className="px-3 py-1.5 bg-rose-950/30 hover:bg-rose-950/80 border border-rose-900 text-rose-300 text-xs font-bold rounded transition-colors"
                            >
                              ⚔️ Desafiar Duelo
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      case 'battles':
        return (
          <div className="max-w-2xl mx-auto space-y-6 font-sans">
            <h3 className="text-xl font-bold border-b border-indigo-950 pb-4">Histórico de Batalhas</h3>
            <div className="space-y-4">
              <div className="p-5 bg-[#16162a] border border-indigo-950 rounded-xl flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Vitória</div>
                  <div className="font-bold text-gray-200">vs GuerreiroLendario</div>
                  <div className="text-[10px] text-gray-500">26/06/2026 às 20:15</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-indigo-300">+45 XP</div>
                  <div className="text-[10px] text-gray-500">Arma: Fogo 🔥</div>
                </div>
              </div>

              <div className="p-5 bg-[#16162a] border border-indigo-950 rounded-xl flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">Derrota (Desmaio)</div>
                  <div className="font-bold text-gray-200">vs MagoDoVento</div>
                  <div className="text-[10px] text-gray-500">26/06/2026 às 19:40</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-indigo-400/50">+0 XP</div>
                  <div className="text-[10px] text-gray-500">Arma: Neutra 🛡️</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'quests':
        return (
          <div className="max-w-2xl mx-auto space-y-6 font-sans">
            <h3 className="text-xl font-bold border-b border-indigo-950 pb-4">Diário de Missões</h3>
            <div className="space-y-4">
              <div className="p-5 bg-[#16162a] border border-indigo-950 rounded-xl relative overflow-hidden group shadow-sm">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-500" />
                <div className="flex justify-between items-start">
                  <div className="space-y-1 pl-2">
                    <h4 className="font-bold text-gray-100 group-hover:text-yellow-400 transition-colors text-sm sm:text-base">A Prova de Fogo</h4>
                    <p className="text-xs text-gray-400">Derrote 3 Slimes de Fogo nos arredores do coliseu.</p>
                  </div>
                  <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-yellow-950/60 border border-yellow-800 text-yellow-300 font-bold uppercase">Ativa</span>
                </div>
                <div className="mt-4 pt-3 border-t border-indigo-950/80 flex items-center justify-between text-[10px] text-gray-500">
                  <span>Recompensa: 100 XP + Espada Rústica</span>
                  <span>Progresso: 1 / 3 derrotados</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'gm':
        return (
          <div className="max-w-4xl mx-auto space-y-6 font-sans">
            <h3 className="text-xl font-bold border-b border-indigo-950 pb-4 flex items-center gap-2">
              🧙‍♂️ Painel de Controle do Mestre (GM)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Section 1: Narration */}
              <div className="bg-[#16162a] border border-indigo-950 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
                <div className="space-y-1">
                  <h4 className="font-bold text-gray-200 text-sm">📖 Narrar Campanha</h4>
                  <p className="text-[10px] text-gray-500">Envie caixas de diálogos narrativos em tempo real para a exploração dos jogadores.</p>
                </div>
                <form onSubmit={handleGmNarrateSubmit} className="space-y-3">
                  <textarea
                    required
                    rows={4}
                    placeholder="O céu se fecha e um estrondo faz tremer o chão da arena..."
                    value={gmNarration}
                    onChange={(e) => setGmNarration(e.target.value)}
                    className="w-full bg-slate-950 border border-indigo-950 text-xs rounded-lg p-2.5 text-indigo-200 outline-none focus:border-indigo-600 transition-all resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-colors"
                  >
                    Narrar Evento Global
                  </button>
                </form>
              </div>

              {/* Section 2: Monsters Spawning */}
              <div className="bg-[#16162a] border border-indigo-950 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-gray-200 text-sm">👿 Materializar Ameaças</h4>
                  <p className="text-[10px] text-gray-550">Spawne monstros em coordenadas específicas do Grid de lobby.</p>
                </div>
                <form onSubmit={handleGmSpawnSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-indigo-400 font-bold uppercase block">Nome do Monstro</label>
                    <input
                      type="text"
                      required
                      value={gmMonsterName}
                      onChange={(e) => setGmMonsterName(e.target.value)}
                      className="w-full bg-slate-950 border border-indigo-950 text-xs rounded-lg px-2.5 py-1.5 text-indigo-200 outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-indigo-400 font-bold uppercase block">Tipo</label>
                      <select
                        value={gmMonsterType}
                        onChange={(e) => setGmMonsterType(e.target.value)}
                        className="w-full bg-slate-950 border border-indigo-950 text-xs rounded-lg px-2.5 py-1.5 text-indigo-200 outline-none focus:border-indigo-600"
                      >
                        <option value="orc">Orc</option>
                        <option value="goblin">Goblin</option>
                        <option value="wolf">Lobo</option>
                        <option value="gargoyle">Gárgula</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="space-y-1">
                        <label className="text-[10px] text-indigo-400 font-bold uppercase block">Grid X</label>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={gmSpawnX}
                          onChange={(e) => setGmSpawnX(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-indigo-950 text-xs rounded-lg px-2.5 py-1.5 text-indigo-200 outline-none focus:border-indigo-600 text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-indigo-400 font-bold uppercase block">Grid Y</label>
                        <input
                          type="number"
                          min={0}
                          max={15}
                          value={gmSpawnY}
                          onChange={(e) => setGmSpawnY(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-indigo-950 text-xs rounded-lg px-2.5 py-1.5 text-indigo-200 outline-none focus:border-indigo-600 text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#e94560] hover:bg-[#d13750] text-white font-bold rounded-lg text-xs transition-colors"
                  >
                    Spawnar Monstro
                  </button>
                </form>
              </div>

              {/* Section 3: Quests Creation */}
              <div className="bg-[#16162a] border border-indigo-950 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-gray-200 text-sm">📜 Ativar Missões</h4>
                  <p className="text-[10px] text-gray-550">Inicie missões secundárias ou de campanha com recompensas para todos.</p>
                </div>
                <form onSubmit={handleGmQuestSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-indigo-400 font-bold uppercase block">Título da Missão</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: A Fúria do Orc Místico"
                      value={gmQuestTitle}
                      onChange={(e) => setGmQuestTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-indigo-950 text-xs rounded-lg px-2.5 py-1.5 text-indigo-200 outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-indigo-400 font-bold uppercase block">Descrição / Tarefas</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Ex: Vá ao norte e derrote a criatura invocada pelo Mestre."
                      value={gmQuestDesc}
                      onChange={(e) => setGmQuestDesc(e.target.value)}
                      className="w-full bg-slate-950 border border-indigo-950 text-xs rounded-lg p-2.5 text-indigo-200 outline-none focus:border-indigo-600 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg text-xs transition-colors"
                  >
                    Ativar Missão de Campanha
                  </button>
                </form>
              </div>

            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="max-w-xl mx-auto bg-[#16162a] border border-indigo-950 rounded-2xl p-8 space-y-6 shadow-xl font-sans">
            <h3 className="text-xl font-bold border-b border-indigo-950 pb-3">Configurações Gerais</h3>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <div className="font-semibold text-gray-200">Efeitos Sonoros</div>
                  <div className="text-xs text-gray-400">Habilita/Desabilita música e efeitos sonoros.</div>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-14 h-8 rounded-full transition-colors flex items-center p-1 ${soundEnabled ? 'bg-indigo-600' : 'bg-gray-800'}`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-gray-200">Volume</span>
                  <span className="text-indigo-400">{volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  disabled={!soundEnabled}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-2 bg-[#0f0f1a] rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed"
                />
              </div>

              <div className="pt-6 border-t border-[#1a1a2e] flex justify-between items-center text-xs text-gray-500">
                <span>Licença de Uso</span>
                <span>RPG de Mesa Privado v0.1.0</span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col font-sans relative">
      
      {/* 🛑 INCOMING DUEL MODAL/BANNER 🛑 */}
      {incomingDuel && (
        <div className="w-full bg-rose-900 border-b border-rose-700 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl z-50 animate-pulse font-sans">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚔️</span>
            <p className="text-sm font-bold text-white">
              O desafiante <span className="underline">{incomingDuel.challengerUsername}</span> convidou você para um Duelo PvP Elemental na arena!
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAcceptDuel}
              className="px-5 py-1.5 bg-emerald-500 text-black text-xs font-extrabold rounded-lg shadow hover:bg-emerald-400 transition-colors uppercase tracking-wider"
            >
              Aceitar Desafio
            </button>
            <button
              onClick={handleDeclineDuel}
              className="px-4 py-1.5 bg-rose-950/70 hover:bg-rose-950 text-white border border-rose-800 text-xs font-semibold rounded-lg transition-colors"
            >
              Recusar
            </button>
          </div>
        </div>
      )}

      {/* 🛑 INCOMING PARTY INVITE BANNER 🛑 */}
      {incomingPartyInvite && (
        <div className="w-full bg-indigo-900 border-b border-indigo-750 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl z-50 animate-pulse font-sans">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <p className="text-sm font-bold text-white">
              O líder <span className="underline">{incomingPartyInvite.leaderUsername}</span> convidou você para se juntar ao Grupo de Aventura!
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAcceptParty}
              className="px-5 py-1.5 bg-emerald-500 text-black text-xs font-extrabold rounded-lg shadow hover:bg-emerald-400 transition-colors uppercase tracking-wider"
            >
              Aceitar Grupo
            </button>
            <button
              onClick={() => setIncomingPartyInvite(null)}
              className="px-4 py-1.5 bg-indigo-950/70 hover:bg-indigo-950 text-white border border-indigo-850 text-xs font-semibold rounded-lg transition-colors"
            >
              Recusar
            </button>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="bg-[#16162a] border-b border-indigo-900/40 px-6 py-4 flex items-center justify-between shadow-md z-10 font-sans">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-extrabold text-indigo-400 tracking-widest bg-gradient-to-r from-indigo-400 to-indigo-500 bg-clip-text">
            MEGACOLISEUM
          </span>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
            Lobby
          </span>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 bg-rose-950/30 hover:bg-rose-950/80 text-rose-300 border border-rose-900/50 rounded-lg text-sm font-medium transition-all"
        >
          Sair da Conta
        </button>
      </header>

      {/* Main Lobby Layout with split Chat panel */}
      <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 max-w-6xl w-full mx-auto overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-48 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 bg-[#16162a] border border-indigo-950 p-2 rounded-2xl shadow-md shrink-0 h-fit z-10">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 lg:flex-none px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all whitespace-nowrap ${
              activeTab === 'home' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-indigo-950/50 hover:text-gray-200'
            }`}
          >
            <span>🏠</span> Início
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 lg:flex-none px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all whitespace-nowrap ${
              activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-indigo-950/50 hover:text-gray-200'
            }`}
          >
            <span>👤</span> Perfil
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 lg:flex-none px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all whitespace-nowrap ${
              activeTab === 'inventory' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-indigo-950/50 hover:text-gray-200'
            }`}
          >
            <span>🎒</span> Mochila
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 lg:flex-none px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all whitespace-nowrap ${
              activeTab === 'friends' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-indigo-950/50 hover:text-gray-200'
            }`}
          >
            <span>👥</span> Amigos
          </button>
          <button
            onClick={() => setActiveTab('battles')}
            className={`flex-1 lg:flex-none px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all whitespace-nowrap ${
              activeTab === 'battles' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-indigo-950/50 hover:text-gray-200'
            }`}
          >
            <span>⚔️</span> Batalhas
          </button>
          <button
            onClick={() => setActiveTab('quests')}
            className={`flex-1 lg:flex-none px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all whitespace-nowrap ${
              activeTab === 'quests' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-indigo-950/50 hover:text-gray-200'
            }`}
          >
            <span>📜</span> Missões
          </button>
          <button
            onClick={() => setActiveTab('gm')}
            className={`flex-1 lg:flex-none px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all whitespace-nowrap ${
              activeTab === 'gm' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-indigo-950/50 hover:text-gray-200'
            }`}
          >
            <span>🧙‍♂️</span> Painel do Mestre
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 lg:flex-none px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all whitespace-nowrap ${
              activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-indigo-950/50 hover:text-gray-200'
            }`}
          >
            <span>⚙️</span> Ajustes
          </button>
        </aside>

        {/* Middle Tab Content Panel */}
        <main className="flex-1 bg-[#121224]/30 border border-indigo-950/50 p-6 rounded-2xl min-h-[400px] shadow-inner flex flex-col justify-start z-10 overflow-y-auto">
          {renderTabContent()}
        </main>

        {/* Right side: Global Chat Panel */}
        <section className="w-full lg:w-72 bg-[#121226]/80 border border-indigo-950 rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden z-10 font-sans min-h-[300px] h-[450px] lg:h-auto">
          <div className="bg-[#16162a] border-b border-indigo-950/50 px-4 py-3 flex justify-between items-center shrink-0">
            <span className="text-xs font-bold tracking-wider text-indigo-400">Bate-papo Global</span>
            <span className="text-[10px] text-gray-500 font-bold px-2 py-0.5 bg-slate-950 rounded-full border border-slate-900">
              {onlineCount} Online
            </span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2.5 text-xs text-gray-300">
            {chatMessages.length === 0 ? (
              <p className="text-gray-650 italic text-center py-6">Sala silenciosa. Diga olá aos outros guerreiros!</p>
            ) : (
              chatMessages.map((msg: any, idx: number) => {
                const isMe = msg.sender === username;
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

          {/* Input form */}
          <form onSubmit={handleSendChat} className="bg-[#16162a] border-t border-indigo-950/50 p-3 shrink-0 flex gap-2">
            <input
              type="text"
              required
              placeholder="Digite sua mensagem..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-grow bg-slate-950 border border-indigo-950 text-xs rounded-lg px-3 py-2 text-indigo-200 outline-none focus:border-indigo-600 transition-all"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-lg transition-all"
            >
              Enviar
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
