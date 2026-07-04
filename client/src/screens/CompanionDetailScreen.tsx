import React, { useState, useMemo } from 'react';

export interface CompanionDetailData {
  id: string;
  name: string;
  class: string;
  element: string;
  role: string;
  level: number;
  xp: number;
  maxXp: number;
  rarity: 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S+';
  bondLabel: string;
  isFavorite: boolean;
  hp: number;
  mp: number;
  energy: number;
  atq: number;
  def: number;
  mag: number;
  res: number;
  vel: number;
  initiative: number;
  skills: { name: string; cost: number; desc: string }[];
  passives: { name: string; desc: string }[];
  affinities: { high: string; runes: string; formation: string };
  equipment: { name: string; stats: string; type: string }[];
  runes: { name: string; stats: string }[];
  history: {
    origin: string;
    joinedAt: string;
    battles: number;
    victories: number;
    campaigns: number;
    feat: string;
    quote: string;
    subtext: string;
  };
}

interface CompanionDetailScreenProps {
  characterId: string;
  onClose: () => void;
  onDesencantar?: (id: string) => void;
  status?: 'active' | 'reserve' | 'retired' | 'new_recruit';
}

export const CompanionDetailScreen: React.FC<CompanionDetailScreenProps> = ({
  characterId,
  onClose,
  onDesencantar,
  status = 'active'
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'skills' | 'equipment' | 'runes' | 'history'>('general');
  const [isFavorite, setIsFavorite] = useState(characterId === 'char-lobo'); // Default Lobo matches mockup
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // 1. Detailed database of companions matching the mockup details
  const companionsDb = useMemo<Record<string, CompanionDetailData>>(() => ({
    'char-lobo': {
      id: 'char-lobo',
      name: 'Lobo Cinzento',
      class: 'Companheiro',
      element: 'Vento',
      role: 'Suporte',
      level: 132,
      xp: 845210,
      maxXp: 1045000,
      rarity: 'D',
      bondLabel: 'Lendário',
      isFavorite: true,
      hp: 8645,
      mp: 2156,
      energy: 100,
      atq: 1254,
      def: 1486,
      mag: 1102,
      res: 1210,
      vel: 1307,
      initiative: 88,
      skills: [
        { name: 'Proteção Instintiva', cost: 1, desc: 'Protege o aliado mais ferido.' },
        { name: 'Uivo Guardião', cost: 2, desc: 'Aumenta a defesa dos aliados próximos por 2 turnos.' },
        { name: 'Mordida de Veylar', cost: 3, desc: 'Causa dano físico e reduz velocidade do alvo.' }
      ],
      passives: [
        { name: 'Companheiro de Jornada', desc: 'Recebe bônus quando luta ao lado de aliados com vínculo alto.' },
        { name: 'Lealdade Inabalável', desc: 'Pode intervir para proteger aliados frágeis.' }
      ],
      affinities: {
        high: 'Caelum, Seraphina',
        runes: 'Guarda, Vínculo, Vento',
        formation: 'retaguarda de suporte / proteção lateral'
      },
      equipment: [
        { name: 'Medalhão da Promessa', stats: 'DEF +210 | RES +150 | HP +8%', type: 'Acessório' },
        { name: 'Coleira Rúnica', stats: 'HP +12% | DEF +180 | VEL +5', type: 'Armadura' },
        { name: 'Garra de Veylar', stats: 'ATQ +190 | VEL +10 | Crit. +6%', type: 'Arma' }
      ],
      runes: [
        { name: 'Runa da Guarda', stats: 'DEF +15% | RES +10%' },
        { name: 'Runa do Vínculo', stats: 'HP +10% | Cura recebida +8%' },
        { name: 'Runa do Vento', stats: 'VEL +12% | Esquiva +6%' }
      ],
      history: {
        origin: 'Florestas de Veylar',
        joinedAt: '22/05/2025',
        battles: 418,
        victories: 301,
        campaigns: 12,
        feat: 'Sobreviveu à Fenda Abissal com 1 HP.',
        quote: 'Mais que um companheiro, uma memória viva.',
        subtext: 'Entrou como um filhote nas florestas de Veylar. Partiu como lenda.'
      }
    },
    'char-caelum': {
      id: 'char-caelum',
      name: 'Caelum',
      class: 'Tanque',
      element: 'Água',
      role: 'Defesa',
      level: 128,
      xp: 920500,
      maxXp: 1020000,
      rarity: 'S',
      bondLabel: 'Lendário',
      isFavorite: false,
      hp: 9485,
      mp: 1850,
      energy: 100,
      atq: 1154,
      def: 1886,
      mag: 820,
      res: 1480,
      vel: 980,
      initiative: 65,
      skills: [
        { name: 'Barreira Sagrada', cost: 1, desc: 'Protege a linha com escudo de água.' },
        { name: 'Golpe de Escudo', cost: 2, desc: 'Ataca provocando o inimigo.' },
        { name: 'Retaliação Divina', cost: 3, desc: 'Causa dano proporcional à defesa.' }
      ],
      passives: [
        { name: 'Baluarte Sagrado', desc: 'Aumenta defesa de aliados próximos em +15%.' },
        { name: 'Inabalável', desc: 'Imune a atordoamentos e empurrões.' }
      ],
      affinities: {
        high: 'Lyria, Seraphina',
        runes: 'Guarda, Resistência, Água',
        formation: 'linha de frente central / proteção total'
      },
      equipment: [
        { name: 'Escudo do Baluarte', stats: 'DEF +450 | RES +210 | HP +12%', type: 'Arma' },
        { name: 'Armadura Real', stats: 'HP +20% | DEF +380 | RES +120', type: 'Armadura' },
        { name: 'Anel do Oceano', stats: 'MP +15% | Reg. MP +5%', type: 'Acessório' }
      ],
      runes: [
        { name: 'Runa da Guarda', stats: 'DEF +15% | RES +10%' },
        { name: 'Runa da Barreira', stats: 'Escudo inicial +10% HP' },
        { name: 'Runa da Água', stats: 'Resistência a fogo +20%' }
      ],
      history: {
        origin: 'Cidadela do Norte',
        joinedAt: '22/05/2025',
        battles: 418,
        victories: 301,
        campaigns: 12,
        feat: 'Segurou o avanço do Colosso de Pedra por 5 turnos.',
        quote: 'Minha barreira nunca irá falhar diante do mal.',
        subtext: 'Cavaleiro errante que jurou proteger o portador da fenda.'
      }
    },
    'char-lyria': {
      id: 'char-lyria',
      name: 'Lyria',
      class: 'Mago',
      element: 'Nenhum',
      role: 'Dano Mágico',
      level: 124,
      xp: 750000,
      maxXp: 990000,
      rarity: 'S+',
      bondLabel: 'Alto',
      isFavorite: false,
      hp: 6215,
      mp: 3250,
      energy: 100,
      atq: 850,
      def: 920,
      mag: 2482,
      res: 1100,
      vel: 1220,
      initiative: 95,
      skills: [
        { name: 'Nova Astral', cost: 1, desc: 'Causa dano mágico massivo em área.' },
        { name: 'Chama Curativa', cost: 2, desc: 'Restaura HP de um companheiro ferido.' },
        { name: 'Impacto Rúnico', cost: 3, desc: 'Aplica vulnerabilidade mágica ao alvo.' }
      ],
      passives: [
        { name: 'Concentração Mágica', desc: 'Aumenta dano de feitiços em +20%.' },
        { name: 'Fluxo Estelar', desc: 'Regenera 5% de MP no início de cada turno.' }
      ],
      affinities: {
        high: 'Caelum, Raven',
        runes: 'Mana, Magia, Divina',
        formation: 'retaguarda / causador de dano mágico'
      },
      equipment: [
        { name: 'Cajado de Eter', stats: 'MAG +520 | Crítico +10% | Dano +12%', type: 'Arma' },
        { name: 'Toga Celestial', stats: 'MP +300 | RES +150 | VEL +8', type: 'Armadura' },
        { name: 'Amuleto das Fendas', stats: 'Eficácia mágica +15%', type: 'Acessório' }
      ],
      runes: [
        { name: 'Runa da Magia', stats: 'MAG +15% | Pen. Mágica +10%' },
        { name: 'Runa do Vínculo', stats: 'HP +10% | Cura recebida +8%' },
        { name: 'Runa da Luz', stats: 'Resistência a sombra +15%' }
      ],
      history: {
        origin: 'Templo de Veylar',
        joinedAt: '25/05/2025',
        battles: 350,
        victories: 245,
        campaigns: 10,
        feat: 'Canalizou a Nova Astral destruindo o boss em 1 hit.',
        quote: 'A verdade reside nas estrelas dimensionais.',
        subtext: 'Maga do templo rúnico encarregada de desvendar as fendas.'
      }
    },
    'char-raven': {
      id: 'char-raven',
      name: 'Raven',
      class: 'Assassino',
      element: 'Terra',
      role: 'Dano Físico',
      level: 127,
      xp: 890000,
      maxXp: 1010000,
      rarity: 'S',
      bondLabel: 'Alto',
      isFavorite: false,
      hp: 6085,
      mp: 1200,
      energy: 100,
      atq: 2120,
      def: 820,
      mag: 650,
      res: 780,
      vel: 1642,
      initiative: 110,
      skills: [
        { name: 'Golpe Sombrio', cost: 1, desc: 'Ataca ignorando 30% da armadura do alvo.' },
        { name: 'Passo das Sombras', cost: 2, desc: 'Aumenta esquiva e mobilidade por 1 turno.' },
        { name: 'Lâminas Envenenadas', cost: 3, desc: 'Aplica efeito de veneno por 3 turnos.' }
      ],
      passives: [
        { name: 'Instinto Assassino', desc: '+25% de dano a inimigos com HP menor que 30%.' },
        { name: 'Evasão Rápida', desc: 'Chance de esquivar de ataques físicos corpo-a-corpo.' }
      ],
      affinities: {
        high: 'Lyria, Caelum',
        runes: 'Destreza, Crítico, Velocidade',
        formation: 'flancos / causador de dano rápido'
      },
      equipment: [
        { name: 'Adagas Gêmeas', stats: 'ATQ +410 | VEL +25 | Crítico +12%', type: 'Arma' },
        { name: 'Manto do Ladino', stats: 'VEL +15 | Evasão +8% | HP +250', type: 'Armadura' },
        { name: 'Anel do Veneno', stats: 'Dano venenoso +20%', type: 'Acessório' }
      ],
      runes: [
        { name: 'Runa do Dano', stats: 'ATQ +12% | Crítico +6%' },
        { name: 'Runa do Vento', stats: 'VEL +12% | Esquiva +6%' },
        { name: 'Runa da Sombra', stats: 'Chance de invisibilidade +5%' }
      ],
      history: {
        origin: 'Distrito das Fendas',
        joinedAt: '03/06/2025',
        battles: 280,
        victories: 210,
        campaigns: 8,
        feat: 'Finalizou o Boss da Fenda Abissal nas sombras.',
        quote: 'As fendas fecham nas sombras.',
        subtext: 'Ladino mercenário que encontrou seu verdadeiro propósito no grupo.'
      }
    },
    'char-seraphina': {
      id: 'char-seraphina',
      name: 'Seraphina',
      class: 'Clériga',
      element: 'Nenhum',
      role: 'Cura',
      level: 121,
      xp: 610000,
      maxXp: 910000,
      rarity: 'A',
      bondLabel: 'Médio',
      isFavorite: false,
      hp: 6500,
      mp: 2850,
      energy: 100,
      atq: 910,
      def: 1120,
      mag: 1980,
      res: 1320,
      vel: 1050,
      initiative: 78,
      skills: [
        { name: 'Impacto Sísmico', cost: 1, desc: 'Ataca atordoando o alvo no turno atual.' },
        { name: 'Prece da Terra', cost: 2, desc: 'Cura aliados em cruz e aumenta armadura.' },
        { name: 'Chama Protetora', cost: 3, desc: 'Concede imunidade a efeitos por 1 turno.' }
      ],
      passives: [
        { name: 'Graça Divina', desc: 'Eficácia de magias curativas ampliada em +20%.' },
        { name: 'Meditação Terrestre', desc: 'Reduz custo de MP de cura em -10%.' }
      ],
      affinities: {
        high: 'Caelum, Lobo Cinzento',
        runes: 'Cura, Guarda, Terra',
        formation: 'retaguarda / suporte defensivo'
      },
      equipment: [
        { name: 'Cajado de Veylar', stats: 'MAG +320 | HP +250 | Cura +15%', type: 'Arma' },
        { name: 'Túnica Sagrada', stats: 'DEF +120 | RES +280 | MP +150', type: 'Armadura' },
        { name: 'Broche do Vínculo', stats: 'Ganho de Vínculo +25%', type: 'Acessório' }
      ],
      runes: [
        { name: 'Runa da Guarda', stats: 'DEF +15% | RES +10%' },
        { name: 'Runa do Vínculo', stats: 'HP +10% | Cura recebida +8%' },
        { name: 'Runa da Luz', stats: 'Resistência elemental +10%' }
      ],
      history: {
        origin: 'Templo da Luz',
        joinedAt: '12/06/2025',
        battles: 150,
        victories: 100,
        campaigns: 4,
        feat: 'Manteve Caelum vivo com 5 curas consecutivas críticas.',
        quote: 'A terra sempre responderá ao chamado dos fracos.',
        subtext: 'Clériga enviada pelos anciãos para guiar o grupo sob as bênçãos da floresta.'
      }
    },
    'char-korr': {
      id: 'char-korr',
      name: 'Korr',
      class: 'Lanceiro',
      element: 'Fogo',
      role: 'Dano Físico',
      level: 119,
      xp: 590000,
      maxXp: 890000,
      rarity: 'A',
      bondLabel: 'Alto',
      isFavorite: false,
      hp: 8120,
      mp: 1180,
      energy: 100,
      atq: 1840,
      def: 1220,
      mag: 920,
      res: 1080,
      vel: 1280,
      initiative: 85,
      skills: [
        { name: 'Investida Ígnea', cost: 1, desc: 'Avança em linha perfurando inimigos.' },
        { name: 'Sopro de Fogo', cost: 2, desc: 'Dano cônico em área aplicando queimadura.' },
        { name: 'Giro de Lança', cost: 3, desc: 'Causa dano em volta e afasta oponentes.' }
      ],
      passives: [
        { name: 'Fúria Leonina', desc: '+15% de ATQ quando HP cai abaixo de 50%.' },
        { name: 'Determinação de Fera', desc: '+10% de defesa para cada aliado próximo.' }
      ],
      affinities: {
        high: 'Caelum, Raven',
        runes: 'Força, Fogo, Dano',
        formation: 'linha de frente / causador de dano lateral'
      },
      equipment: [
        { name: 'Lança de Fogo', stats: 'ATQ +380 | Crit +8% | Ignora 10% DEF', type: 'Arma' },
        { name: 'Couraça Vermelha', stats: 'HP +300 | DEF +180 | RES +80', type: 'Armadura' },
        { name: 'Anel da Fera', stats: 'Dano físico +12%', type: 'Acessório' }
      ],
      runes: [
        { name: 'Runa do Dano', stats: 'ATQ +12% | Crítico +6%' },
        { name: 'Runa do Fogo', stats: 'Resistência a água +15%' },
        { name: 'Runa da Fúria', stats: 'Dano extra em berserk +10%' }
      ],
      history: {
        origin: 'Taverna do Porto',
        joinedAt: '18/06/2025',
        battles: 90,
        victories: 65,
        campaigns: 2,
        feat: 'Derrotou 15 capangas sozinho na Taverna.',
        quote: 'Nenhum fogo queima mais forte que minha lança.',
        subtext: 'Fera lanceira recrutada do porto após impressionar o grupo.'
      }
    }
  }), []);

  // Fetch companion data, fall back to Lobo Cinzento if not found
  const companion = companionsDb[characterId] || companionsDb['char-lobo'];

  // Badges color mapping
  const getRarityBadgeStyle = (r: string) => {
    if (r === 'S+') return 'bg-orange-955 border-orange-500/50 text-orange-400';
    if (r === 'S') return 'bg-rose-955 border-rose-500/50 text-rose-400';
    if (r === 'A') return 'bg-yellow-955 border-yellow-500/50 text-yellow-400';
    if (r === 'B') return 'bg-indigo-955 border-indigo-500/50 text-indigo-400';
    if (r === 'C') return 'bg-cyan-955 border-cyan-500/50 text-cyan-400';
    if (r === 'D') return 'bg-emerald-955 border-emerald-500/50 text-emerald-400';
    return 'bg-slate-900 border-slate-700/50 text-slate-400';
  };

  const getElementBadgeColor = (el: string) => {
    const e = el.toLowerCase();
    if (e === 'fogo') return 'text-rose-400';
    if (e === 'água' || e === 'agua') return 'text-blue-400';
    if (e === 'terra') return 'text-emerald-400';
    if (e === 'vento') return 'text-teal-400';
    if (e === 'sombra') return 'text-purple-400';
    return 'text-gray-400';
  };

  const getElementIcon = (el: string) => {
    const e = el.toLowerCase();
    if (e === 'fogo') return '🔥';
    if (e === 'água' || e === 'agua') return '💧';
    if (e === 'terra') return '⛰️';
    if (e === 'vento') return '🍃';
    if (e === 'sombra') return '🔮';
    return '🛡️';
  };

  const getRoleIcon = (role: string) => {
    const r = role.toLowerCase();
    if (r === 'tanque' || r === 'defesa') return '🛡️';
    if (r === 'assassino') return '🗡️';
    if (r === 'mago' || r === 'dano mágico') return '🧙‍♀️';
    if (r === 'lanceiro') return '⚔️';
    if (r === 'clériga' || r === 'suporte' || r === 'cura') return '🌿';
    return '👤';
  };

  const getCharacterFace = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('lobo')) return null;
    if (n.includes('caelum')) return '/assets/characters/caelum_face.png';
    if (n.includes('lyria')) return '/assets/characters/lyria_face.png';
    if (n.includes('raven')) return '/assets/characters/raven_face.png';
    if (n.includes('seraphina')) return '/assets/characters/seraphina_face.png';
    if (n.includes('korr')) return '/assets/characters/korr_face.png';
    return null;
  };

  const getFallbackEmoji = (name: string) => {
    if (name.includes('Lobo')) return '🐺';
    if (name.includes('Caelum')) return '🛡️';
    if (name.includes('Lyria')) return '🧙‍♀️';
    if (name.includes('Raven')) return '🗡️';
    if (name.includes('Seraphina')) return '🌿';
    if (name.includes('Korr')) return '🦁';
    return '👤';
  };

  const handleDesencantarClick = () => {
    setShowConfirmModal(true);
  };

  return (
    <div className="recruit-fullscreen-wrapper w-full h-full min-h-[580px] bg-[#06060c] border border-[#b59441]/40 rounded-3xl overflow-hidden p-6 flex flex-col justify-between select-none relative font-sans text-gray-200">
      
      {/* Background radial layer */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(27,61,109,0.04)_0%,_transparent_75%)] pointer-events-none" />

      {/* 1. TOP HEADER SECTION */}
      <header className="flex justify-between items-center border-b border-indigo-950/40 pb-4 mb-4 shrink-0 relative z-10">
        {/* Left Profile Details */}
        <div className="flex flex-col text-left max-w-[200px]">
          <div className="flex items-center gap-2">
            <span className="text-[#ffe082] text-[8px] bg-indigo-955 px-2 py-0.5 rounded border border-blue-900 uppercase font-black tracking-wider shadow">Vencedor</span>
            <span className="text-indigo-400 text-sm font-black uppercase blue-glow-text">Wall</span>
          </div>
          <span className="text-[7.5px] text-gray-500 font-bold uppercase mt-1">Poder da Equipe 52.341</span>
        </div>

        {/* Center Main Title */}
        <div className="text-center">
          <h1 className="text-[#ffe082] text-xl font-black uppercase tracking-widest leading-none filter drop-shadow-[0_2px_8px_rgba(255,224,130,0.35)]">
            FICHA DE COMPANHEIRO
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2 leading-none">
            <span className="text-[10px] text-gray-400 font-bold">{getElementIcon(companion.element)}</span>
            <h2 className="text-[#ffe082] text-sm font-black uppercase tracking-wider">{companion.name}</h2>
            <span className="text-[7.5px] text-gray-500 font-semibold">• {companion.class} • {companion.element} • {companion.role}</span>
          </div>
        </div>

        {/* Right Location Details */}
        <div className="flex items-center gap-3 text-right">
          <div className="flex flex-col">
            <span className="text-gray-400 text-[9px] font-bold leading-none">Local: <strong className="text-gray-200">Cidade-Portal de Veylar</strong></span>
            <span className="text-[8px] text-gray-500 uppercase font-bold mt-1.5 block tracking-wide">Estado: Ativo</span>
          </div>
          <div className="relative w-8 h-8 rounded-full border border-indigo-900/60 overflow-hidden flex items-center justify-center bg-black/60 shadow-[0_0_8px_rgba(99,102,241,0.25)]">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-800 to-indigo-950 animate-spin duration-3000" />
            <span className="text-xs relative z-10">🌀</span>
          </div>
        </div>
      </header>

      {/* 2. SUB-INDICATORS SUBHEADER */}
      <div className="flex justify-end gap-3.5 mb-4 shrink-0 relative z-10 mr-1 text-[9.5px]">
        <div className="flex items-center gap-1 bg-[#121226]/50 border border-indigo-950 px-3 py-1 rounded-xl">
          <span className="text-gray-500 font-bold">Raridade:</span>
          <span className={`font-black text-glow-green ${companion.rarity === 'S+' ? 'text-orange-400' : companion.rarity === 'S' ? 'text-rose-400' : companion.rarity === 'A' ? 'text-yellow-400' : 'text-emerald-400'}`}>{companion.rarity}</span>
        </div>
        <div className="flex items-center gap-1 bg-[#121226]/50 border border-indigo-950 px-3 py-1 rounded-xl">
          <span className="text-gray-500 font-bold">Nv.:</span>
          <strong className="text-white font-extrabold">{companion.level}</strong>
        </div>
        <div className="flex items-center gap-1 bg-[#121226]/50 border border-indigo-950 px-3 py-1 rounded-xl">
          <span className="text-gray-500 font-bold">Vínculo:</span>
          <strong className="text-yellow-400 font-extrabold">🏷️ {companion.bondLabel}</strong>
        </div>
        <button 
          onClick={() => setIsFavorite(!isFavorite)}
          className={`flex items-center gap-1 border px-3 py-1 rounded-xl transition-all ${
            isFavorite ? 'bg-yellow-950/20 border-yellow-500/50 text-yellow-400' : 'bg-[#121226]/50 border-indigo-950 text-gray-500 hover:text-gray-300'
          }`}
        >
          <span>{isFavorite ? '★' : '☆'}</span>
          <span className="font-bold">Favorito</span>
        </button>
      </div>

      {/* 3. TABS SELECTOR */}
      <div className="flex justify-center gap-2 mb-4 shrink-0 relative z-10 border-b border-indigo-950/30 pb-2.5">
        {[
          { key: 'general', label: 'Visão Geral' },
          { key: 'skills', label: 'Habilidades' },
          { key: 'equipment', label: 'Equipamentos' },
          { key: 'runes', label: 'Runas' },
          { key: 'history', label: 'Histórico' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-6 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
              activeTab === tab.key 
                ? 'bg-[#121226]/60 border-[#b59441] text-white shadow-inner font-extrabold' 
                : 'bg-black/25 border-indigo-950/30 text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. MAIN CORE CONTENT (GRID SYSTEM) */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch mb-5 min-h-0 relative z-10">
        
        {/* COLUMN 1: LEFT RETRATO PANEL */}
        <div className="bg-[#0b0b18]/65 border border-indigo-950 rounded-2xl p-4 flex flex-col justify-between items-center text-center">
          <div className="w-full flex-grow flex items-center justify-center relative min-h-[180px]">
            {/* Background glowing aura */}
            <div className="absolute w-44 h-44 rounded-full bg-gradient-to-tr from-purple-800/15 to-indigo-900/5 filter blur-xl animate-pulse pointer-events-none" />
            
            <div className="w-40 h-40 rounded-2xl bg-black/60 border-2 border-indigo-950 flex items-center justify-center overflow-hidden relative shadow-inner">
              {getCharacterFace(companion.name) ? (
                <img 
                  src={getCharacterFace(companion.name)!} 
                  onError={() => setImgErrors(prev => ({ ...prev, [companion.id]: true }))}
                  alt={companion.name} 
                  className="w-full h-full object-cover filter brightness-95 rounded-xl" 
                />
              ) : (
                <span className="text-7xl leading-none filter drop-shadow-[0_0_12px_rgba(181,148,65,0.25)]">{getFallbackEmoji(companion.name)}</span>
              )}
            </div>
          </div>

          <div className="w-full space-y-3 pt-2">
            <span className="w-full text-[#ffe082] text-[8.5px] bg-[#3a2f14]/20 border border-[#b59441]/40 px-3 py-1 rounded-xl uppercase font-black tracking-widest block leading-none">
              👑 Primeiro Companheiro
            </span>
            <span className="w-full text-indigo-400 text-[8px] bg-[#121226]/50 border border-indigo-950/60 px-3 py-1 rounded-xl uppercase font-black tracking-widest block leading-none mt-2">
              🐾 Desde o início da jornada
            </span>

            {/* Quote block */}
            <div className="w-full bg-black/40 border border-indigo-950/60 rounded-xl p-3.5 mt-4 text-center">
              <p className="text-[8.5px] text-gray-400 italic leading-relaxed px-2 font-medium">
                “{companion.history.quote}”
              </p>
            </div>
          </div>
        </div>

        {/* COLUMN 2 & 3: MAIN SELECTED TAB VIEW */}
        <div className="lg:col-span-2 bg-[#0b0b18]/45 border border-indigo-950/50 rounded-2xl p-5 flex flex-col justify-between overflow-hidden relative">
          {activeTab === 'general' && (
            <div className="flex-1 flex flex-col lg:flex-row gap-5 h-full">
              {/* Left inner side: Progress & Stats */}
              <div className="flex-1 flex flex-col justify-between text-left h-full">
                <div>
                  <span className="text-[#ffe082] text-[9.5px] font-black uppercase tracking-widest block border-b border-indigo-950/30 pb-1.5 mb-3.5">
                    Progressão e Atributos
                  </span>
                  
                  {/* Level and points available */}
                  <div className="flex justify-between items-center mb-2.5 leading-none">
                    <h4 className="font-extrabold text-[13px] text-white">Nv. {companion.level}</h4>
                    <span className="text-[8.5px] text-gray-500 font-bold">Pontos disponíveis: <strong className="text-indigo-400">0</strong></span>
                  </div>

                  {/* XP Bar */}
                  <div className="space-y-1 mb-4">
                    <div className="stat-bar-container h-2 rounded-full w-full">
                      <div className="stat-bar-fill h-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                        style={{ width: `${(companion.xp / companion.maxXp) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[7px] text-gray-500 font-black tracking-wider leading-none">
                      <span>XP ACUMULADO</span>
                      <span>{companion.xp.toLocaleString()} / {companion.maxXp.toLocaleString()} XP</span>
                    </div>
                  </div>

                  {/* Attributes Stats */}
                  <div className="space-y-1.5 text-[9.5px] font-semibold text-gray-300">
                    {[
                      { label: 'HP', val: companion.hp.toLocaleString(), icon: '❤️', color: 'text-emerald-400' },
                      { label: 'MP', val: companion.mp.toLocaleString(), icon: '💧', color: 'text-blue-400' },
                      { label: 'Energia', val: companion.energy, icon: '⚡', color: 'text-yellow-400' },
                      { label: 'ATQ', val: companion.atq.toLocaleString(), icon: '🗡️' },
                      { label: 'DEF', val: companion.def.toLocaleString(), icon: '🛡️' },
                      { label: 'MAG', val: companion.mag.toLocaleString(), icon: '🔮' },
                      { label: 'RES', val: companion.res.toLocaleString(), icon: '🛡️' },
                      { label: 'VEL', val: companion.vel.toLocaleString(), icon: '🍃' },
                      { label: 'Iniciativa', val: companion.initiative, icon: '⏱️' }
                    ].map((stat, sIdx) => (
                      <div key={sIdx} className="flex justify-between items-center border-b border-indigo-950/20 pb-1 leading-none">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <span>{stat.icon}</span>
                          <span>{stat.label}</span>
                        </span>
                        <strong className={`font-extrabold ${stat.color || 'text-white'} flex items-center gap-1`}>
                          <span>{stat.val}</span>
                          <span className="text-[7px] text-emerald-400">▲</span>
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden lg:block w-px bg-indigo-950/30 self-stretch" />

              {/* Right inner side: Skills, Passives & Affinities */}
              <div className="flex-1 flex flex-col justify-between text-left h-full">
                <div>
                  <span className="text-[#ffe082] text-[9.5px] font-black uppercase tracking-widest block border-b border-indigo-950/30 pb-1.5 mb-3.5">
                    Habilidades e Passivas
                  </span>

                  {/* Skills lists */}
                  <div className="space-y-3 mb-4">
                    {companion.skills.map((sk, skIdx) => (
                      <div key={skIdx} className="flex gap-2.5 items-start">
                        <span className="text-[10px] w-4.5 h-4.5 rounded-lg border border-indigo-950 bg-black/40 flex items-center justify-center text-indigo-400 shrink-0 font-extrabold">{skIdx + 1}</span>
                        <div>
                          <h5 className="font-extrabold text-[9px] text-white leading-none flex items-center gap-1.5">
                            {sk.name}
                            <span className="text-[7.5px] text-[#ffe082]/65 font-bold uppercase">({sk.cost} MP)</span>
                          </h5>
                          <p className="text-[8px] text-gray-500 mt-1 leading-snug">{sk.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Passives lists */}
                  <div className="space-y-3 border-t border-indigo-950/20 pt-3">
                    {companion.passives.map((pass, passIdx) => (
                      <div key={passIdx} className="flex gap-2.5 items-start">
                        <span className="text-[10px] text-yellow-500 shrink-0">✦</span>
                        <div>
                          <h5 className="font-extrabold text-[9px] text-[#ffe082] leading-none">{pass.name}</h5>
                          <p className="text-[8px] text-gray-500 mt-1 leading-snug">{pass.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Affinities info */}
                  <div className="mt-4 border-t border-indigo-950/20 pt-3 text-[8.5px] leading-relaxed">
                    <p className="flex justify-between">
                      <span className="text-gray-500">Alta afinidade:</span>
                      <strong className="text-white">{companion.affinities.high}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Runas afins:</span>
                      <strong className="text-white">{companion.affinities.runes}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Formação ideal:</span>
                      <strong className="text-white">{companion.affinities.formation}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fallback overlays for other tabs details */}
          {activeTab !== 'general' && (
            <div className="flex-grow flex flex-col justify-center items-center text-center p-6 border border-dashed border-indigo-950/50 rounded-2xl h-full">
              <span className="text-3xl mb-2">📜</span>
              <h4 className="text-xs font-black uppercase text-[#ffe082] tracking-wider">Aba de {activeTab} expandida</h4>
              <p className="text-[9.5px] text-gray-500 mt-2 max-w-sm leading-relaxed">
                Esta aba fornece a customização total das estatísticas e builds táticas do herói. Use os atalhos ou painéis da base para retornar.
              </p>
              <button 
                onClick={() => setActiveTab('general')}
                className="mt-4 px-4 py-2 bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-850 rounded-xl text-[8.5px] font-black uppercase tracking-wider text-indigo-300"
              >
                Voltar à Visão Geral
              </button>
            </div>
          )}
        </div>

        {/* COLUMN 4: RIGHT PANEL SHEET (MOCKUP COHERENCY) */}
        <div className="bg-[#121226]/50 border border-indigo-950/60 rounded-2xl p-5 flex flex-col justify-between shrink-0">
          <div>
            <span className="text-[#ffe082] text-[9.5px] font-black uppercase tracking-widest block border-b border-indigo-950/30 pb-1.5 mb-3.5">
              Ficha Resumida
            </span>

            {/* Small attributes listing details */}
            <div className="space-y-2 mb-4 text-[9.5px]">
              <div className="flex justify-between border-b border-indigo-950/20 pb-1">
                <span className="text-gray-400">Origem:</span>
                <strong className="text-white font-bold">{companion.history.origin}</strong>
              </div>
              <div className="flex justify-between border-b border-indigo-950/20 pb-1">
                <span className="text-gray-400 flex items-center gap-1">Entrada:</span>
                <strong className="text-white font-bold">{companion.history.joinedAt}</strong>
              </div>
              <div className="flex justify-between border-b border-indigo-950/20 pb-1">
                <span className="text-gray-400">Batalhas:</span>
                <strong className="text-white font-bold">{companion.history.battles}</strong>
              </div>
              <div className="flex justify-between border-b border-indigo-950/20 pb-1">
                <span className="text-gray-400">Vitórias:</span>
                <strong className="text-white font-bold">{companion.history.victories}</strong>
              </div>
              <div className="flex justify-between border-b border-indigo-950/20 pb-1">
                <span className="text-gray-400">Campanhas:</span>
                <strong className="text-white font-semibold">{companion.history.campaigns}</strong>
              </div>
            </div>

            {/* Feito Marcante summary */}
            <div className="space-y-1 pt-3 border-t border-indigo-950/30 text-[9.5px]">
              <span className="text-gray-500 font-bold block mb-1">Feito Marcante:</span>
              <p className="text-[8.5px] text-[#34d399] font-bold leading-relaxed">
                {companion.history.feat}
              </p>
            </div>
          </div>

          <div className="flex justify-center border-t border-indigo-950/30 pt-4 opacity-35">
            <span className="text-3xl">🛡️</span>
          </div>
        </div>

      </div>

      {/* 5. BOTTOM SLOTS ROW (EQUIPAMENTOS, RUNAS COMPATIVEIS, HISTORICO PANELS) */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4 relative z-10 shrink-0">
          {/* Panel 1: Equipamentos */}
          <div className="bg-[#0b0b18]/65 border border-indigo-950 rounded-2xl p-4 text-left">
            <span className="text-[#ffe082] text-[9.5px] font-black uppercase tracking-widest block border-b border-indigo-950/30 pb-1.5 mb-2.5">
              Equipamentos Equipados
            </span>
            <div className="space-y-2">
              {companion.equipment.map((eq, eqIdx) => (
                <div key={eqIdx} className="flex gap-2.5 p-2 bg-black/20 border border-indigo-950 rounded-lg items-center text-[8.5px]">
                  <div className="w-8 h-8 bg-black/40 rounded border border-indigo-950 flex items-center justify-center text-lg shrink-0 shadow-inner">
                    {eqIdx === 0 ? '👑' : eqIdx === 1 ? '💍' : '🐾'}
                  </div>
                  <div className="min-w-0 text-[8.5px] leading-snug">
                    <span className="block font-extrabold text-white truncate uppercase">{eq.name}</span>
                    <span className="block text-gray-500 uppercase font-bold text-[7px] leading-none mt-0.5">{eq.type}</span>
                    <p className="text-indigo-400 mt-1 font-bold">{eq.stats}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 2: Runas */}
          <div className="bg-[#0b0b18]/65 border border-indigo-950 rounded-2xl p-4 text-left">
            <span className="text-[#ffe082] text-[9.5px] font-black uppercase tracking-widest block border-b border-indigo-950/30 pb-1.5 mb-2.5">
              Runas Compatíveis
            </span>
            <div className="space-y-2">
              {companion.runes.map((ru, ruIdx) => (
                <div key={ruIdx} className="flex gap-2.5 p-2 bg-black/20 border border-indigo-950 rounded-lg items-center text-[8.5px]">
                  <div className="w-8 h-8 bg-black/40 rounded border border-indigo-950 flex items-center justify-center text-lg shrink-0 shadow-inner text-glow-purple">
                    🌀
                  </div>
                  <div className="min-w-0 text-[8.5px] leading-snug">
                    <span className="block font-extrabold text-white truncate uppercase">{ru.name}</span>
                    <p className="text-indigo-400 mt-1 font-bold">{ru.stats}</p>
                  </div>
                </div>
              ))}
            </div>
            <span className="text-[7.5px] text-emerald-400 font-black uppercase tracking-widest mt-2 block text-center">Compatibilidade Alta</span>
          </div>

          {/* Panel 3: Histórico */}
          <div className="bg-[#0b0b18]/65 border border-indigo-950 rounded-2xl p-4 text-left">
            <span className="text-[#ffe082] text-[9.5px] font-black uppercase tracking-widest block border-b border-indigo-950/30 pb-1.5 mb-2.5">
              Histórico de Trajetória
            </span>
            <div className="space-y-2 text-[9px] text-gray-400 font-medium">
              <p className="flex justify-between border-b border-indigo-950/20 pb-1.5">
                <span>Origem:</span>
                <strong className="text-white">{companion.history.origin}</strong>
              </p>
              <p className="flex justify-between border-b border-indigo-950/20 pb-1.5">
                <span>Entrada na Equipe:</span>
                <strong className="text-white">{companion.history.joinedAt}</strong>
              </p>
              <p className="flex justify-between border-b border-indigo-950/20 pb-1.5">
                <span>Total de Batalhas:</span>
                <strong className="text-white">{companion.history.battles}</strong>
              </p>
              <p className="flex justify-between border-b border-indigo-950/20 pb-1.5">
                <span>Vitórias:</span>
                <strong className="text-white">{companion.history.victories}</strong>
              </p>
              <p className="flex justify-between border-b border-indigo-950/20 pb-1.5">
                <span>Campanhas completas:</span>
                <strong className="text-white">{companion.history.campaigns}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. FOOTER CONTROLS & ACTION BUTTONS */}
      <footer className="w-full bg-[#121226]/50 border border-indigo-950 rounded-2xl p-4 shrink-0 flex justify-between items-center gap-4 relative z-10">
        {/* Left favorite button */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#101c38]/40 hover:bg-[#1a2c56]/60 border border-indigo-850 text-indigo-300 transition-all hover:scale-103"
        >
          {isFavorite ? '★ Remover Favorito' : '☆ Favoritar'}
        </button>

        {/* Center/right main actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDesencantarClick}
            className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-950/40 hover:bg-rose-950 border border-rose-900/50 hover:border-rose-500 text-rose-300 transition-all hover:scale-103"
          >
            🔥 Desencantar Companheiro
          </button>
          
          <button
            onClick={() => alert("Histórico de campanhas de batalha carregado.")}
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-955/40 hover:bg-indigo-900 border border-indigo-850 text-indigo-300 transition-all hover:scale-103"
          >
            📖 Ver Histórico
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-black/35 hover:bg-black/80 border border-gray-800 text-gray-400 transition-all hover:scale-103"
          >
            ↩ Voltar
          </button>

          {/* Locked memorial status */}
          <button
            disabled
            className="px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-slate-900 text-slate-500 border border-slate-950 cursor-not-allowed opacity-50 flex items-center gap-1.5"
          >
            🔒 Memorial Indisponível
          </button>
        </div>
      </footer>

      {/* Keyboard Shortcuts guidelines */}
      <div className="w-full text-center text-[7.5px] text-gray-600 font-bold uppercase tracking-widest pt-2.5 mt-2.5 border-t border-indigo-950/30 shrink-0 relative z-10">
        Enter: Selecionar | Tab: Alternar Aba | Esc: Voltar
      </div>

      {/* EMOTIONAL CONFIRMATION MODAL */}
      {showConfirmModal && companion && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="bg-[#121226] border-2 border-[#b59441] rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col justify-between relative overflow-hidden text-gray-200">
            
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-rose-500/10 rounded-full filter blur-xl" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full filter blur-xl" />

            <div className="text-center mb-5 border-b border-indigo-950/40 pb-4">
              <span className="text-2xl mb-2 block">🔔</span>
              <h3 className="text-sm font-black text-rose-450 tracking-wider uppercase">Confirmar Desencantamento</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">Essa decisão é permanente</p>
            </div>

            <div className="space-y-4 text-left">
              <p className="text-xs text-gray-300 leading-relaxed">
                Você está prestes a desencantar <strong className="text-white">{companion.name}</strong>.
              </p>
              
              <p className="text-[10px] text-gray-400 leading-relaxed bg-black/30 p-3 rounded-xl border border-indigo-950/30">
                Ele será registrado no <strong>Livro de Memórias</strong> com todo o seu histórico, mas <strong>não poderá mais retornar à equipe nem lutar novamente</strong>.
              </p>

              {(companion.id === 'char-lobo' || companion.level >= 120) && (
                <div className="p-3 bg-rose-955/25 border border-rose-900/50 rounded-xl text-[9px] text-rose-300 font-bold leading-normal flex items-start gap-2 shadow-inner">
                  <span>⚠️</span>
                  <p>
                    Atenção: Este companheiro possui <strong>Vínculo Alto/Lendário</strong>. Este companheiro marcou sua jornada. Deseja mesmo desencantá-lo?
                  </p>
                </div>
              )}

              <div className="bg-[#1a1a35] border border-indigo-950/40 rounded-xl p-3 text-[9px] text-gray-400 space-y-1.5">
                <span className="font-extrabold text-[8px] text-indigo-400 uppercase tracking-widest block mb-1">REGISTRO DE MEMÓRIA</span>
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <p>Nível Final: <strong className="text-white">{companion.level}</strong></p>
                  <p>Tempo na Equipe: <strong className="text-white">{companion.history.subtext}</strong></p>
                  <p>Batalhas: <strong className="text-white">{companion.history.battles}</strong></p>
                  <p>Feitos marcantes: <strong className="text-white">"{companion.history.feat}"</strong></p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 border-t border-indigo-950/40 pt-4 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/45 hover:bg-black/80 border border-gray-800 text-gray-400"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  if (onDesencantar) onDesencantar(companion.id);
                  onClose();
                }}
                className="px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-900 hover:bg-rose-800 text-white font-bold shadow-lg shadow-rose-955/50"
              >
                Confirmar Desencantamento
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
