import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/auth';
import { Character } from '../../types';
import { client } from '../../game/colyseus';

// ─── Types ──────────────────────────────────────────────────────────────────────

export type TabType = 'home' | 'profile' | 'inventory' | 'friends' | 'battles' | 'quests' | 'gm' | 'settings' | 'memories';

export interface ChatMessage {
  sender: string;
  text: string;
  time: string;
}

export interface DuelInvitation {
  challengerSessionId: string;
  challengerUsername: string;
}

export interface PartyInvitation {
  leaderSessionId: string;
  leaderUsername: string;
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

export function useLobbyData(onStartBattle: (roomId: string) => void) {
  const { token, logout, username } = useAuthStore();

  // Core state
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [retiredList, setRetiredList] = useState<any[]>([]);
  const [isDismissing, setIsDismissing] = useState(false);
  const [companionsList, setCompanionsList] = useState<any[]>([]);
  const [isSwappingCompanion, setIsSwappingCompanion] = useState(false);

  // Social & Multiplayer
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [presenceRoom, setPresenceRoom] = useState<any>(null);
  const [onlinePlayers, setOnlinePlayers] = useState<Record<string, string>>({});
  const [addFriendName, setAddFriendName] = useState("");
  const [transferTarget, setTransferTarget] = useState("");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // Duel & Party
  const [incomingDuel, setIncomingDuel] = useState<DuelInvitation | null>(null);
  const [incomingPartyInvite, setIncomingPartyInvite] = useState<PartyInvitation | null>(null);

  // Fusion & Evolution
  const [fuseTargetId, setFuseTargetId] = useState("");
  const [isFusing, setIsFusing] = useState(false);
  const [isEvolvingRarity, setIsEvolvingRarity] = useState(false);

  // GM
  const [gmNarration, setGmNarration] = useState("");
  const [gmMonsterType, setGmMonsterType] = useState("orc");
  const [gmMonsterName, setGmMonsterName] = useState("Orc Gigante");
  const [gmSpawnX, setGmSpawnX] = useState(5);
  const [gmSpawnY, setGmSpawnY] = useState(5);
  const [gmQuestTitle, setGmQuestTitle] = useState("");
  const [gmQuestDesc, setGmQuestDesc] = useState("");

  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(80);

  // ─── Fetch Functions ───────────────────────────────────────────────────────
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

  const fetchCompanions = async () => {
    try {
      const res = await fetch('/companions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCompanionsList(data);
      }
    } catch (err) {
      console.error("Error fetching companions:", err);
    }
  };

  // ─── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      fetchCharacter();
      fetchFriends();
      fetchInventory();
      fetchCompanions();
    }
  }, [token]);

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

        activeRoom.onMessage("chat", (msg: ChatMessage) => {
          setChatMessages(prev => {
            const updated = [...prev, msg];
            // Limitar a 100 mensagens para evitar memory leak
            return updated.length > 100 ? updated.slice(-100) : updated;
          });
        });

        activeRoom.onMessage("duelRequest", (data: DuelInvitation) => {
          setIncomingDuel(data);
        });

        activeRoom.onMessage("startDuel", (data: { roomId: string }) => {
          setIncomingDuel(null);
          onStartBattle(data.roomId);
        });

        activeRoom.onMessage("partyInvite", (data: PartyInvitation) => {
          setIncomingPartyInvite(data);
        });

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

  useEffect(() => {
    if (activeTab === 'profile' || activeTab === 'memories') {
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

  // ─── Handlers ──────────────────────────────────────────────────────────────
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

  const handleSwapCompanionActive = async (companionId: string, isActive: boolean) => {
    setIsSwappingCompanion(true);
    try {
      const res = await fetch('/companions/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ companionId, isActive })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchCompanions();
      } else {
        alert(data.error || "Erro ao alterar time.");
      }
    } catch (err) {
      alert("Erro ao conectar.");
    } finally {
      setIsSwappingCompanion(false);
    }
  };

  const handleDisenchantCompanion = async (companionId: string) => {
    const targetComp = companionsList.find(c => c.id === companionId);
    if (!targetComp) return;
    
    const confirm = window.confirm(
      `Tem certeza que deseja aposentar ${targetComp.name}? Esta ação é irreversível. Ele entrará para o Livro de Memórias e você receberá Orbes de Alma.`
    );
    if (!confirm) return;

    try {
      const res = await fetch('/companions/disenchant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ companionId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`${data.message}\nVocê recebeu +${data.soulOrbsAwarded} Orbes de Alma!`);
        fetchCompanions();
        fetchCharacter();
      } else {
        alert(data.error || "Erro ao aposentar companheiro.");
      }
    } catch (err) {
      alert("Erro ao conectar.");
    }
  };

  // GM Handlers
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

  return {
    // Auth
    token, logout, username,
    // Core
    activeTab, setActiveTab,
    character, loading, error,
    onlineCount, retiredList,
    isDismissing,
    companionsList, isSwappingCompanion,
    // Social
    friendsList, inventoryList,
    chatMessages, chatInput, setChatInput,
    presenceRoom, onlinePlayers,
    addFriendName, setAddFriendName,
    transferTarget, setTransferTarget,
    selectedItem, setSelectedItem,
    isTransferring,
    // Duel & Party
    incomingDuel, setIncomingDuel,
    incomingPartyInvite, setIncomingPartyInvite,
    // Fusion
    fuseTargetId, setFuseTargetId,
    isFusing, isEvolvingRarity,
    // GM
    gmNarration, setGmNarration,
    gmMonsterType, setGmMonsterType,
    gmMonsterName, setGmMonsterName,
    gmSpawnX, setGmSpawnX,
    gmSpawnY, setGmSpawnY,
    gmQuestTitle, setGmQuestTitle,
    gmQuestDesc, setGmQuestDesc,
    // Settings
    soundEnabled, setSoundEnabled,
    volume, setVolume,
    // Handlers
    handleSendChat,
    handleAddFriend, handleAcceptFriend,
    handleTransferItem,
    handleRequestDuel, handleAcceptDuel, handleDeclineDuel,
    handleAcceptParty, handleInviteParty, handleLeaveParty,
    handleFuseItems, handleEvolveRarityAction,
    handleDismissCharacter,
    handleSwapCompanionActive, handleDisenchantCompanion, fetchCompanions,
    handleGmNarrateSubmit, handleGmSpawnSubmit, handleGmQuestSubmit,
    // Fetch (for external refresh)
    fetchInventory, fetchCharacter, fetchFriends,
  };
}

export type LobbyData = ReturnType<typeof useLobbyData>;
