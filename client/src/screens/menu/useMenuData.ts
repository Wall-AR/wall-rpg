import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/auth';
import { Character } from '../../types';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export type MenuTabType = 'team' | 'characters' | 'inventory' | 'skills' | 'equipment' | 'quests' | 'map' | 'memories' | 'settings';

export interface CompanionCharacter {
  id: string;
  name: string;
  level: number;
  xp: number;
  maxXp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  energy: number;
  maxEnergy: number;
  at: number;
  df: number;
  mat: number;
  mdf: number;
  speed: number;
  rank: 'S+' | 'S' | 'A' | 'D';
  element: 'fogo' | 'agua' | 'terra' | 'vento' | 'none';
  class: string;
  description: string;
  lore: string;
  portrait: string;
  traits: { name: string; desc: string }[];
  equippedItem?: {
    name: string;
    type: string;
    stats: string;
    portrait: string;
  };
  isPlayerChar?: boolean;
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

export function useMenuData(onClose: () => void) {
  const { token } = useAuthStore();

  const [activeTab, setActiveTab] = useState<MenuTabType>('team');
  const [loading, setLoading] = useState(true);
  const [playerCharacter, setPlayerCharacter] = useState<Character | null>(null);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Distribute points temporary state
  const [bonusStrength, setBonusStrength] = useState(0);
  const [bonusDefense, setBonusDefense] = useState(0);
  const [bonusSpeed, setBonusSpeed] = useState(0);
  const [statsSaving, setStatsSaving] = useState(false);

  // Active / Reserve Team state
  const [activeTeam, setActiveTeam] = useState<CompanionCharacter[]>([]);
  const [reserveTeam, setReserveTeam] = useState<CompanionCharacter[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Resources state
  const [gold, setGold] = useState(1248765);
  const [soulOrbs, setSoulOrbs] = useState(3842);
  const [dimCrystals, setDimCrystals] = useState(620);
  const [meritPoints, setMeritPoints] = useState(7910);

  // Time & Info
  const [playTime, setPlayTime] = useState("128:47:38");
  const [gameDate, setGameDate] = useState("22/05/2026 19:42");
  const [locationName, setLocationName] = useState("Cidade-Portal");

  // ─── Fetch Data ────────────────────────────────────────────────────────────

  const fetchMenuData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch character status
      const charRes = await fetch('/character/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let fetchedChar: Character | null = null;
      if (charRes.ok) {
        const data = await charRes.json();
        
        // Translate format to frontend structure
        fetchedChar = {
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
        setPlayerCharacter(fetchedChar);
        if (data.soulOrbs !== undefined) {
          setSoulOrbs(data.soulOrbs);
        }
      }

      // 2. Fetch inventory
      const invRes = await fetch('/inventory', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (invRes.ok) {
        const data = await invRes.json();
        setInventoryList(data);
      }

      // 3. Fetch available points
      const ptsRes = await fetch('/character/available-points', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (ptsRes.ok) {
        const ptsData = await ptsRes.json();
        setAvailablePoints(ptsData.availablePoints || 0);
      }

      // 4. Reset stat distributions
      setBonusStrength(0);
      setBonusDefense(0);
      setBonusSpeed(0);

      // 5. Initialize party lists (using mockup companions + player character)
      initializeParties(fetchedChar);

    } catch (err) {
      console.error("Error loading menu data:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initializing mock elements matching approved JRPG layout
  const initializeParties = (playerChar: Character | null) => {
    // A. Player character companion mapper
    const playerCompanion: CompanionCharacter = playerChar ? {
      id: playerChar.id,
      name: playerChar.name,
      level: playerChar.level,
      xp: playerChar.xp,
      maxXp: playerChar.level * 1000,
      hp: playerChar.hp,
      maxHp: playerChar.maxHp,
      mp: playerChar.mp,
      maxMp: playerChar.maxMp,
      energy: 100,
      maxEnergy: 100,
      at: playerChar.at,
      df: playerChar.df,
      mat: playerChar.mat,
      mdf: playerChar.mdf,
      speed: playerChar.speed,
      rank: playerChar.level > 100 ? 'S+' : playerChar.level > 50 ? 'S' : 'A',
      element: mapElementToPt(playerChar.element),
      class: playerChar.dragoonLevel > 0 ? "Dragoon Chevalier" : "Tanque",
      description: "Guerreiro do Coliseu lutando pelo destino das dimensões.",
      lore: `${playerChar.name} é um guerreiro de elemento ${playerChar.element} que busca conquistar o MegaColiseum e superar os testes dos mestres.`,
      portrait: "👤",
      traits: [
        { name: "Resolução Heroica", desc: "Aumenta ATK em 10% quando o HP cai abaixo de 30%." },
        { name: "Poder Dimensional", desc: "Aumenta a afinidade com magias de seu elemento principal." }
      ],
      equippedItem: {
        name: "Espada Rúnica da Batalha",
        type: "Espada Rígida",
        stats: "ATK +90, Dano Elemental +15%",
        portrait: "⚔️"
      },
      isPlayerChar: true
    } : {
      id: 'mock-player',
      name: 'Caelum',
      level: 128,
      xp: 23145,
      maxXp: 100000,
      hp: 8645,
      maxHp: 8645,
      mp: 2156,
      maxMp: 2156,
      energy: 100,
      maxEnergy: 100,
      at: 1254,
      df: 1486,
      mat: 1102,
      mdf: 1205,
      speed: 1307,
      rank: 'S',
      element: 'fogo',
      class: 'Tanque',
      description: "Companheiro lendário do fogo.",
      lore: "Lendário soldado das colinas ardentes de Veylar.",
      portrait: "🛡️",
      traits: [{ name: "Lealdade Inabalável", desc: "Aumenta DEF e RES dos aliados" }],
      isPlayerChar: true
    };

    // B. Mock companions from the mockup image
    const lyria: CompanionCharacter = {
      id: 'comp-lyria',
      name: 'Lyria',
      level: 124,
      xp: 75210,
      maxXp: 100000,
      hp: 5120,
      maxHp: 5120,
      mp: 6840,
      maxMp: 6840,
      energy: 100,
      maxEnergy: 100,
      at: 820,
      df: 910,
      mat: 2450,
      mdf: 2210,
      speed: 1120,
      rank: 'S+',
      element: 'none',
      class: 'Mago',
      description: "Maga dimensional de alto nível.",
      lore: "Estudou a energia arcana nas ruínas antigas das dimensões externas.",
      portrait: "🧙‍♀️",
      traits: [
        { name: "Amplificar Feitiço", desc: "Aumenta dano mágico elemental em 15%." }
      ],
      equippedItem: {
        name: "Cajado das Estrelas",
        type: "Cajado Mágico",
        stats: "MAG +240, MP Max +500",
        portrait: "🔮"
      }
    };

    const raven: CompanionCharacter = {
      id: 'comp-raven',
      name: 'Raven',
      level: 127,
      xp: 88400,
      maxXp: 120000,
      hp: 7120,
      maxHp: 7120,
      mp: 1850,
      maxMp: 1850,
      energy: 100,
      maxEnergy: 100,
      at: 2150,
      df: 1020,
      mat: 850,
      mdf: 920,
      speed: 2480,
      rank: 'S',
      element: 'terra',
      class: 'Assassino',
      description: "Sombra veloz que desfere golpes letais.",
      lore: "Diz-se que Raven veio do vazio, agindo nas sombras para proteger o Reino.",
      portrait: "🥷",
      traits: [
        { name: "Golpe Crítico", desc: "Aumenta taxa crítica em 20% no primeiro turno." }
      ],
      equippedItem: {
        name: "Adaga das Sombras",
        type: "Adaga",
        stats: "ATK +180, Taxa Crítica +10%",
        portrait: "🗡️"
      }
    };

    const seraphina: CompanionCharacter = {
      id: 'comp-seraphina',
      name: 'Seraphina',
      level: 121,
      xp: 99420,
      maxXp: 110000,
      hp: 6150,
      maxHp: 6150,
      mp: 4950,
      maxMp: 4950,
      energy: 100,
      maxEnergy: 100,
      at: 790,
      df: 1120,
      mat: 1890,
      mdf: 2040,
      speed: 1050,
      rank: 'A',
      element: 'none',
      class: 'Clériga',
      description: "Portadora da luz e da cura divina.",
      lore: "Sua fé inabalável emana uma luz pura capaz de fechar qualquer ferida.",
      portrait: "🧝‍♀️",
      traits: [
        { name: "Prece de Cura", desc: "Aumenta cura realizada em 25%." }
      ]
    };

    const loboCinzento: CompanionCharacter = {
      id: 'comp-lobo',
      name: 'Lobo Cinzento',
      level: 132,
      xp: 845210,
      maxXp: 1045000,
      hp: 8645,
      maxHp: 8645,
      mp: 2156,
      maxMp: 2156,
      energy: 100,
      maxEnergy: 100,
      at: 1254,
      df: 1486,
      mat: 1102,
      mdf: 1205,
      speed: 1307,
      rank: 'D',
      element: 'vento',
      class: 'Companheiro',
      description: "Companheiro fiel desde o início da jornada.",
      lore: "Um lobo cinzento encontrado ainda filhote nas florestas de Veylar. Desde então, nunca deixou seu lado. Mais que um companheiro, é família.",
      portrait: "🐺",
      traits: [
        { name: "Lealdade Inabalável", desc: "Aumenta DEF e RES de todos aliados próximos." },
        { name: "Instinto do Alfa", desc: "Chance de provocar inimigos e reduzir dano recebido." },
        { name: "Companheiro de Jornada", desc: "EXP recebida +10% em batalha." }
      ],
      equippedItem: {
        name: "Medalhão da Promessa",
        type: "Acessório",
        stats: "DEF +120, HP +10%, Vínculo +20%",
        portrait: "🏅"
      }
    };

    const korr: CompanionCharacter = {
      id: 'comp-korr',
      name: 'Korr',
      level: 119,
      xp: 45800,
      maxXp: 95000,
      hp: 9150,
      maxHp: 9150,
      mp: 1250,
      maxMp: 1250,
      energy: 100,
      maxEnergy: 100,
      at: 1840,
      df: 1520,
      mat: 620,
      mdf: 840,
      speed: 1250,
      rank: 'A',
      element: 'fogo',
      class: 'Lanceiro',
      description: "Guerreiro fera empunhando uma lança ígnea.",
      lore: "Korr pertence à tribo dos Homens-Leão, ferozes guardiões da savana de cinzas.",
      portrait: "🦁",
      traits: [
        { name: "Fúria Leonina", desc: "Aumenta ATK corporal à medida que o HP diminui." }
      ]
    };

    // Ativos: Player, Lyria, Raven (como no mockup de 3 cards em cima)
    // Reserva: Seraphina, Lobo Cinzento, Korr (3 cards em baixo)
    setActiveTeam([playerCompanion, lyria, raven]);
    setReserveTeam([seraphina, loboCinzento, korr]);

    // Selecionar o lobo como padrão para combinar com a imagem do mockup
    setSelectedMemberId(loboCinzento.id);
  };

  const mapElementToPt = (elem: string): any => {
    switch (elem?.toLowerCase()) {
      case 'fire': return 'fogo';
      case 'water': return 'agua';
      case 'earth': return 'terra';
      case 'wind': return 'vento';
      default: return 'none';
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  // ─── Actions / Handlers ───────────────────────────────────────────────────

  // Confirm stat points distribution
  const handleConfirmStats = async () => {
    if (!token || statsSaving) return;
    const total = bonusStrength + bonusDefense + bonusSpeed;
    if (total <= 0) return;

    setStatsSaving(true);
    try {
      const res = await fetch('/character/add-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          strength: bonusStrength,
          defense: bonusDefense,
          speed: bonusSpeed
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Update local character data
        setPlayerCharacter((prev: any) => ({
          ...prev,
          stats: data.newStats,
          at: data.newStats.strength,
          df: data.newStats.defense,
          speed: data.newStats.speed
        }));

        setAvailablePoints(data.remainingPoints);
        setBonusStrength(0);
        setBonusDefense(0);
        setBonusSpeed(0);

        // Update player card in activeTeam
        setActiveTeam(prev => prev.map(m => {
          if (m.isPlayerChar) {
            return {
              ...m,
              level: playerCharacter?.level || m.level,
              at: data.newStats.strength,
              df: data.newStats.defense,
              speed: data.newStats.speed
            };
          }
          return m;
        }));

        alert("Atributos fortalecidos com sucesso!");
      } else {
        alert(data.error || "Erro ao distribuir atributos.");
      }
    } catch (err) {
      alert("Erro ao salvar atributos.");
    } finally {
      setStatsSaving(false);
    }
  };

  // Swap companion character between active/reserve
  const handleSwapMember = (memberId: string) => {
    const isActive = activeTeam.some(m => m.id === memberId);
    if (isActive) {
      // Move from active to reserve if we have at least 1 left
      if (activeTeam.length <= 1) {
        alert("Você precisa manter pelo menos 1 membro ativo na equipe.");
        return;
      }
      const member = activeTeam.find(m => m.id === memberId)!;
      setActiveTeam(prev => prev.filter(m => m.id !== memberId));
      setReserveTeam(prev => [...prev, member]);
    } else {
      // Move from reserve to active if we have less than 6 slots filled
      if (activeTeam.length >= 6) {
        alert("O limite de guerreiros ativos é 6.");
        return;
      }
      const member = reserveTeam.find(m => m.id === memberId)!;
      setReserveTeam(prev => prev.filter(m => m.id !== memberId));
      setActiveTeam(prev => [...prev, member]);
    }
  };

  // Item upgrades
  const handleFuseItem = async (targetId: string) => {
    if (!selectedItemId || !token) return;
    try {
      const res = await fetch('/inventory/fuse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ item1Id: selectedItemId, item2Id: targetId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setSelectedItemId(null);
        const invRes = await fetch('/inventory', { headers: { 'Authorization': `Bearer ${token}` } });
        if (invRes.ok) setInventoryList(await invRes.json());
      } else {
        alert(data.error || "Erro na fusão do item.");
      }
    } catch (err) {
      alert("Erro na conexão.");
    }
  };

  const handleEvolveItem = async () => {
    if (!selectedItemId || !token) return;
    try {
      const res = await fetch('/inventory/evolve-rarity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inventoryId: selectedItemId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setSelectedItemId(null);
        // Refresh data
        fetchMenuData();
      } else {
        alert(data.error || "Erro ao evoluir item.");
      }
    } catch (err) {
      alert("Erro de conexão.");
    }
  };

  return {
    activeTab, setActiveTab,
    loading, playerCharacter,
    inventoryList, selectedItemId, setSelectedItemId,
    availablePoints, setAvailablePoints,
    bonusStrength, setBonusStrength,
    bonusDefense, setBonusDefense,
    bonusSpeed, setBonusSpeed,
    statsSaving,
    // Team management
    activeTeam, setActiveTeam,
    reserveTeam, setReserveTeam,
    selectedMemberId, setSelectedMemberId,
    handleSwapMember,
    // Resources & Stats
    gold, soulOrbs, dimCrystals, meritPoints,
    playTime, gameDate, locationName,
    // Handlers
    handleConfirmStats,
    handleFuseItem,
    handleEvolveItem,
    onClose
  };
}

export type MenuData = ReturnType<typeof useMenuData>;
