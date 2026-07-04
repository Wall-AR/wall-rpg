import React, { useState, useEffect, useMemo } from 'react';

interface MapTabProps {
  dimCrystals: number;
  setDimCrystals: (val: number) => void;
  locationName: string;
  setLocationName: (val: string) => void;
  onClose: () => void;
}

interface DimensionNode {
  id: string;
  name: string;
  type: 'hub' | 'region' | 'campaign' | 'event' | 'pvp' | 'boss';
  status: 'unlocked' | 'locked' | 'active' | 'unstable' | 'completed';
  recommendedLevel: string;
  players: number;
  friends: string[];
  lore: string;
  recompensas: { label: string; icon: string }[];
  activeCampaign?: { name: string; progress: number; objective: string; boss: string };
  spawnPoint: string;
  cost?: number;
  x: number; // percentage from center x
  y: number; // percentage from center y
  icon: string;
  aura?: string; // CSS style filter or glow
  bossHp?: number;
}

export const MapTab: React.FC<MapTabProps> = ({
  dimCrystals,
  setDimCrystals,
  locationName,
  setLocationName,
  onClose
}) => {
  const [selectedId, setSelectedId] = useState<string>('ruinas');
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'regions' | 'campaigns' | 'events' | 'pvp'>('all');
  const [travelCostMessage, setTravelCostMessage] = useState<string | null>(null);

  // 1. Astrolabe network nodes data
  const nodes = useMemo<Record<string, DimensionNode>>(() => ({
    'veylar': {
      id: 'veylar',
      name: 'Cidade-Portal de Veylar',
      type: 'hub',
      status: 'unlocked',
      recommendedLevel: 'Livre',
      players: 18,
      friends: ['Wall (Você)'],
      lore: 'O porto seguro de todos os viajantes dimensionais. Conecta todas as fendas ativas e mundos conhecidos.',
      recompensas: [
        { label: 'Ouro', icon: '🪙' },
        { label: 'Orbes de Alma', icon: '✨' }
      ],
      spawnPoint: 'Praça Central',
      x: 50,
      y: 50,
      icon: '🌀'
    },
    'ruinas': {
      id: 'ruinas',
      name: 'Ruínas da Primeira Fenda',
      type: 'campaign',
      status: 'unlocked',
      recommendedLevel: '35–60',
      players: 3,
      friends: ['Isaac', 'RavenBR'],
      lore: 'Vestígios de um tempo anterior à abertura das fendas. Ecos de outra dimensão ainda ressoam entre as pedras quebradas. Algo antigo observa de dentro do abismo.',
      recompensas: [
        { label: 'Experiência', icon: 'XP' },
        { label: 'Cristais', icon: '💎' },
        { label: 'Fragmentos', icon: '🔮' },
        { label: 'Equipamento', icon: '📦' }
      ],
      activeCampaign: {
        name: 'Ecos de Outra Dimensão',
        progress: 42,
        objective: 'Investigue o altar quebrado.',
        boss: 'Guardião da Fenda'
      },
      spawnPoint: 'Santuário dos Ecos (Seguro)',
      cost: 10,
      x: 23,
      y: 33,
      icon: '🏰',
      aura: 'shadow-[0_0_15px_rgba(235,190,80,0.5)] border-yellow-500'
    },
    'bosque': {
      id: 'bosque',
      name: 'Bosque dos Ecos',
      type: 'region',
      status: 'unlocked',
      recommendedLevel: '1–30',
      players: 4,
      friends: [],
      lore: 'Uma floresta antiga onde as árvores preservam as lembranças dos primeiros viajantes perdidos. Criaturas de Vento e Terra percorrem seus caminhos sussurrantes.',
      recompensas: [
        { label: 'Essência Vento', icon: '🍃' },
        { label: 'Madeira Rúnica', icon: '🪵' },
        { label: 'Lobo Silvestre', icon: '🐺' }
      ],
      spawnPoint: 'Acampamento Base',
      cost: 0,
      x: 50,
      y: 20,
      icon: '🌳'
    },
    'pantano': {
      id: 'pantano',
      name: 'Pântano Sombrio',
      type: 'region',
      status: 'unlocked',
      recommendedLevel: '30–60',
      players: 2,
      friends: [],
      lore: 'Pântano envolto em névoas ácidas e criaturas das sombras. O veneno escorre das raízes petrificadas e fendas instáveis foram relatadas na região.',
      recompensas: [
        { label: 'Essência Sombra', icon: '🔮' },
        { label: 'Plantas Raras', icon: '🌿' }
      ],
      spawnPoint: 'Ponte do Lodo',
      cost: 5,
      x: 74,
      y: 28,
      icon: '💀'
    },
    'ninja': {
      id: 'ninja',
      name: 'Mundo Ninja',
      type: 'event',
      status: 'active',
      recommendedLevel: '50–90',
      players: 6,
      friends: [],
      lore: 'Dimensão paralela de guerreiros das sombras e clãs elementares em guerra eterna. Uma fenda temporária aberta pelo Mestre revelou segredos inestimáveis.',
      recompensas: [
        { label: 'Pergaminho Selo', icon: '📜' },
        { label: 'Equipamento Ninja', icon: '⚔️' }
      ],
      activeCampaign: {
        name: 'Guerra dos Cinco Clãs',
        progress: 15,
        objective: 'Resgate o Pergaminho Proibido.',
        boss: 'Sombra de Hanzo'
      },
      spawnPoint: 'Templo Oculto',
      cost: 15,
      x: 78,
      y: 56,
      icon: '🏮',
      aura: 'shadow-[0_0_15px_rgba(168,85,247,0.7)] border-purple-500'
    },
    'coliseu': {
      id: 'coliseu',
      name: 'Coliseu dos Ecos PvP',
      type: 'pvp',
      status: 'unlocked',
      recommendedLevel: 'Livre',
      players: 7,
      friends: [],
      lore: 'Arena sagrada flutuante onde os guerreiros provam sua superioridade técnica. Duelos amistosos e ranqueados acontecem sem cessar.',
      recompensas: [
        { label: 'Pontos Mérito', icon: '🎖️' },
        { label: 'Orbes de Alma', icon: '✨' }
      ],
      spawnPoint: 'Salão de Entrada',
      cost: 0,
      x: 58,
      y: 78,
      icon: '🏟️'
    },
    'abissal': {
      id: 'abissal',
      name: 'Dimensão Abissal',
      type: 'boss',
      status: 'unstable',
      recommendedLevel: '100+',
      players: 5,
      friends: [],
      lore: 'O coração da instabilidade cósmica. Sombras puras e monstros devoradores habitam o vácuo. O Devorador de Ecos foi invocado!',
      recompensas: [
        { label: 'Baú Abissal', icon: '📦' },
        { label: 'Equipamento S', icon: '⚔️' },
        { label: 'Runa Abissal', icon: '🌀' }
      ],
      bossHp: 74,
      spawnPoint: 'Fronteira do Vácuo',
      cost: 30,
      x: 30,
      y: 72,
      icon: '👾',
      aura: 'shadow-[0_0_18px_rgba(239,68,68,0.7)] border-red-500'
    },
    'dragao': {
      id: 'dragao',
      name: 'Pico do Dragão Congelado',
      type: 'region',
      status: 'locked',
      recommendedLevel: '80+',
      players: 0,
      friends: [],
      lore: 'Pico glacial inóspito guardado por dragões anciãos de gelo. O vento congelante impede a navegação de portais comuns.',
      recompensas: [],
      spawnPoint: 'Cavernas de Gelo',
      x: 22,
      y: 50,
      icon: '🔒'
    }
  }), []);

  // Filter nodes based on activeFilter
  const filteredNodes = useMemo(() => {
    const arr = Object.values(nodes);
    if (activeFilter === 'all') return arr;
    if (activeFilter === 'regions') return arr.filter(n => n.type === 'region' || n.type === 'hub');
    if (activeFilter === 'campaigns') return arr.filter(n => n.type === 'campaign');
    if (activeFilter === 'events') return arr.filter(n => n.type === 'event');
    if (activeFilter === 'pvp') return arr.filter(n => n.type === 'pvp');
    return arr;
  }, [nodes, activeFilter]);

  // Key navigation handling (Q/E to rotate map, Esc to return)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'q') {
        setRotationAngle(p => p - 15);
      } else if (key === 'e') {
        setRotationAngle(p => p + 15);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const selectedNode = nodes[selectedId] || nodes['veylar'];

  const handleEntrarDimensao = () => {
    if (selectedNode.status === 'locked') {
      alert(`Viagem bloqueada. Requisitos de nível ou história não alcançados.`);
      return;
    }

    const travelCost = selectedNode.cost || 0;
    if (dimCrystals < travelCost) {
      alert(`Saldo insuficiente de Cristais Dimensionais. Requer ${travelCost}💎.`);
      return;
    }

    // Deduct crystals & set location
    if (travelCost > 0) {
      setDimCrystals(dimCrystals - travelCost);
    }
    setLocationName(selectedNode.name);

    setTravelCostMessage(`Portal dimensional aberto! Viajando para ${selectedNode.name}...`);
    setTimeout(() => {
      setTravelCostMessage(null);
      onClose(); // Auto closes map menu after success travel simulation
    }, 2000);
  };

  return (
    <div className="absolute inset-0 bg-[#06060c] z-30 flex flex-col justify-between p-6 rounded-3xl select-none font-sans text-gray-200 overflow-hidden relative">
      {/* Astrolabe star background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.06)_0%,_transparent_75%)] pointer-events-none" />

      {/* Travel Portal Loader overlay */}
      {travelCostMessage && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col justify-center items-center z-50 animate-fadeIn">
          <div className="relative w-28 h-28 flex items-center justify-center mb-6">
            {/* Spinning space portal */}
            <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#b59441] animate-spin duration-3000" />
            <div className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-700 to-transparent animate-pulse flex items-center justify-center shadow-inner">
              <span className="text-3xl">🌀</span>
            </div>
          </div>
          <h3 className="text-sm font-extrabold text-[#ffe082] uppercase tracking-widest text-center animate-pulse">
            {travelCostMessage}
          </h3>
          <p className="text-[8px] text-gray-550 uppercase tracking-widest mt-2">Distorcendo malha espaço-temporal...</p>
        </div>
      )}

      {/* 1. TOP HEADER PANEL */}
      <header className="flex justify-between items-center border-b border-indigo-950/40 pb-4 shrink-0 relative z-10">
        {/* Left Profile Details */}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2">
            <span className="text-[#ffe082] text-[8px] bg-indigo-955 px-2 py-0.5 rounded border border-blue-900 uppercase font-black tracking-wider shadow">Explorador</span>
            <span className="text-indigo-400 text-sm font-black uppercase blue-glow-text">Wall</span>
          </div>
          <span className="text-[7.5px] text-gray-550 font-bold uppercase mt-1">Poder da Equipe 52.341</span>
        </div>

        {/* Center Main Title */}
        <div className="text-center">
          <h1 className="text-[#ffe082] text-xl font-black uppercase tracking-widest leading-none filter drop-shadow-[0_2px_8px_rgba(255,224,130,0.35)]">
            MAPA DIMENSIONAL
          </h1>
          <h2 className="text-[7.5px] text-gray-550 font-semibold mt-1.5 uppercase tracking-widest">
            Atlas das rotas conectadas a Veylar
          </h2>
        </div>

        {/* Right Info subheader rows */}
        <div className="flex gap-4 text-[8.5px] text-gray-400 font-bold">
          <div className="flex items-center gap-1.5 bg-[#121226]/50 border border-indigo-950 px-3 py-1 rounded-xl">
            <span className="text-gray-500">Local atual:</span>
            <strong className="text-white font-extrabold">{locationName}</strong>
          </div>
          <div className="flex items-center gap-1.5 bg-[#121226]/50 border border-indigo-950 px-3 py-1 rounded-xl">
            <span className="text-gray-500">Crystals:</span>
            <strong className="text-blue-400 font-extrabold flex items-center gap-1">💎 {dimCrystals}</strong>
          </div>
          <div className="flex items-center gap-1.5 bg-[#121226]/50 border border-indigo-950 px-3 py-1 rounded-xl">
            <span className="text-gray-500">Online:</span>
            <strong className="text-emerald-400 font-extrabold flex items-center gap-1">🟢 18</strong>
          </div>
        </div>
      </header>

      {/* 2. BODY CONTENT (LEFT SIDEBAR, COSMIC ASTROLABE, RIGHT PANEL) */}
      <div className="flex-grow flex gap-5 my-4 min-h-0 relative z-10">
        
        {/* LEFT SIDEBAR: Active Campaigns & Eventos do Mestre */}
        <aside className="w-56 shrink-0 flex flex-col justify-between gap-4 text-left">
          
          {/* Active Campaigns Panel */}
          <div className="bg-[#0b0b18]/65 border border-indigo-950 rounded-2xl p-4 flex flex-col justify-start">
            <span className="text-[#ffe082] text-[9px] font-black uppercase tracking-widest block border-b border-indigo-950/30 pb-1.5 mb-3">
              Campanhas Ativas
            </span>
            <div className="space-y-4">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-xl bg-black/40 border border-indigo-950 flex items-center justify-center text-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />
                  🌀
                </div>
                <div className="min-w-0 text-[8.5px]">
                  <span className="block font-black text-white truncate uppercase">Ecos de Outra Dimensão</span>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="h-1 bg-indigo-950 rounded-full flex-grow w-16 overflow-hidden">
                      <div className="h-full bg-blue-400" style={{ width: '42%' }} />
                    </div>
                    <span className="text-blue-400 font-bold shrink-0">42%</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-xl bg-black/40 border border-indigo-950 flex items-center justify-center text-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-rose-500/10 animate-pulse" />
                  🏮
                </div>
                <div className="min-w-0 text-[8.5px]">
                  <span className="block font-black text-white truncate uppercase">Guerra dos Cinco Clãs</span>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="h-1 bg-indigo-950 rounded-full flex-grow w-16 overflow-hidden">
                      <div className="h-full bg-rose-500" style={{ width: '15%' }} />
                    </div>
                    <span className="text-rose-400 font-bold shrink-0">15%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GM Event Master Panel */}
          <div className="bg-[#121226]/55 border border-indigo-950 rounded-2xl p-4 flex flex-col justify-start relative overflow-hidden">
            {/* Soft purple glow inside GM box */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/10 rounded-full filter blur-xl pointer-events-none" />

            <span className="text-[#ffe082] text-[9px] font-black uppercase tracking-widest block border-b border-indigo-950/30 pb-1.5 mb-2.5">
              Evento do Mestre
            </span>

            <div className="text-[8.5px] space-y-2 leading-relaxed">
              <div className="flex items-center gap-2">
                <span className="text-purple-400 animate-ping">●</span>
                <span className="font-extrabold uppercase text-purple-300">Fenda Aberta: Mundo Ninja</span>
              </div>
              <p className="text-gray-500 text-[8px] leading-snug">
                O Mestre abriu uma fenda especial temporária. Desafios únicos e recompensas raras aguardam os valentes.
              </p>
              <div className="bg-black/35 border border-indigo-950/50 p-2 rounded-lg text-[7.5px] font-black uppercase text-yellow-400/90 tracking-wide mt-2 block text-center leading-none">
                ⏳ Termina em: 2d 14h 37m
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER AREA: COSMIC ASTROLABE MAP CANVAS/SVG */}
        <div className="flex-1 bg-black/40 border border-indigo-950/60 rounded-3xl relative overflow-hidden flex items-center justify-center">
          
          {/* Rotating astrolabe rings */}
          <div 
            className="absolute w-[440px] h-[440px] rounded-full border border-indigo-950/30 transition-transform duration-500 pointer-events-none"
            style={{ transform: `rotate(${rotationAngle}deg)` }}
          >
            {/* SVG concentric lines and nodes lines */}
            <svg className="w-full h-full text-indigo-950/40" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1,1" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.3" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="3,2" />
              
              {/* Node connectors lines radiating from center */}
              <line x1="50" y1="50" x2="23" y2="33" stroke="currentColor" strokeWidth="0.4" />
              <line x1="50" y1="50" x2="50" y2="20" stroke="currentColor" strokeWidth="0.4" />
              <line x1="50" y1="50" x2="74" y2="28" stroke="currentColor" strokeWidth="0.4" />
              <line x1="50" y1="50" x2="78" y2="56" stroke="currentColor" strokeWidth="0.4" />
              <line x1="50" y1="50" x2="58" y2="78" stroke="currentColor" strokeWidth="0.4" />
              <line x1="50" y1="50" x2="30" y2="72" stroke="currentColor" strokeWidth="0.4" />
              <line x1="50" y1="50" x2="22" y2="50" stroke="currentColor" strokeWidth="0.4" />

              {/* Glowing lightning route for active campaign selection */}
              {selectedId === 'ruinas' && (
                <line x1="50" y1="50" x2="23" y2="33" stroke="#b59441" strokeWidth="1.2" strokeLinecap="round" className="animate-pulse" />
              )}
              {selectedId === 'ninja' && (
                <line x1="50" y1="50" x2="78" y2="56" stroke="#a855f7" strokeWidth="1.2" strokeLinecap="round" className="animate-pulse" />
              )}
            </svg>
          </div>

          {/* ASTROLABE FILTER TABS ON TOP-LEFT */}
          <div className="absolute top-4 left-4 bg-black/60 border border-indigo-950 rounded-xl px-2.5 py-1.5 flex gap-1.5 z-20 text-[7.5px] uppercase font-black tracking-wider">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'regions', label: 'Regiões' },
              { key: 'campaigns', label: 'Campanhas' },
              { key: 'events', label: 'Eventos' },
              { key: 'pvp', label: 'PvP' }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key as any)}
                className={`px-2 py-1 rounded transition-all ${
                  activeFilter === f.key ? 'bg-indigo-950 text-white border border-indigo-800' : 'text-gray-550 hover:text-gray-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Rotation guidelines instruction top-right */}
          <div className="absolute top-4 right-4 text-[7px] text-gray-550 font-bold uppercase tracking-widest z-20">
            Q/E: Girar Atlas
          </div>

          {/* RENDER NODE CIRCLES */}
          {filteredNodes.map(node => {
            const isSelected = selectedId === node.id;
            
            return (
              <button
                key={node.id}
                onClick={() => setSelectedId(node.id)}
                className={`absolute w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 z-20 ${
                  node.status === 'locked' 
                    ? 'bg-slate-950 border border-slate-800 text-slate-700 opacity-60 cursor-not-allowed' 
                    : isSelected 
                      ? 'bg-indigo-950/80 border-2 border-[#b59441] text-white scale-110 shadow-[0_0_15px_rgba(181,148,65,0.45)]' 
                      : 'bg-indigo-955/70 border border-indigo-900 text-gray-200 hover:border-indigo-400 hover:scale-105 shadow-md'
                } ${node.aura || ''}`}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                <span className="text-base leading-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  {node.icon}
                </span>

                {/* Subtext info under node label */}
                <div className="absolute -bottom-6 w-32 text-center pointer-events-none select-none">
                  <span className={`block text-[7.5px] uppercase font-black truncate ${isSelected ? 'text-[#ffe082]' : 'text-gray-400'}`}>
                    {node.name.replace('Cidade-Portal de ', '').replace('Coliseu dos ', '')}
                  </span>
                  {node.bossHp && (
                    <span className="block text-[6.5px] font-bold text-red-500 uppercase tracking-wide">HP: {node.bossHp}%</span>
                  )}
                  {node.status === 'locked' ? (
                    <span className="block text-[6.5px] text-rose-500 font-bold uppercase tracking-widest mt-0.5">Requer Nv. 80</span>
                  ) : (
                    node.players > 0 && (
                      <span className="block text-[6.5px] text-gray-550 mt-0.5 font-medium">{node.players} Jogadores</span>
                    )
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT SIDEBAR: Selected Node detailed panel */}
        <section className="w-72 shrink-0 bg-[#121226]/55 border border-indigo-950 rounded-3xl p-5 flex flex-col justify-between text-left overflow-y-auto relative">
          <div>
            <div className="border-b border-indigo-950/40 pb-2.5 mb-3 flex justify-between items-start">
              <div>
                <h3 className="text-[#ffe082] text-xs font-black uppercase tracking-wider">{selectedNode.name}</h3>
                <span className="text-[7.5px] text-gray-550 font-bold uppercase tracking-wide block mt-1">
                  {selectedNode.type === 'hub' ? 'Cidade Principal' : selectedNode.type === 'pvp' ? 'Arena de Batalha' : 'Campanha / Região'}
                </span>
              </div>
              {selectedNode.activeCampaign && (
                <span className="text-[6.5px] bg-blue-955 border border-blue-900/60 text-blue-400 px-1.5 py-0.5 rounded font-black uppercase">
                  Campanha Ativa
                </span>
              )}
            </div>

            {/* Environmental preview mock */}
            <div className="w-full h-24 bg-black/40 border border-indigo-950 rounded-2xl mb-4 overflow-hidden flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent z-1" />
              <span className="text-4xl filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] z-2">{selectedNode.icon}</span>
              <span className="absolute bottom-2 left-3 text-[7.5px] text-gray-400 uppercase font-black z-2 tracking-wide">Fenda Ativa</span>
            </div>

            {/* Core Stats */}
            <div className="space-y-1.5 text-[8.5px] border-b border-indigo-950/20 pb-3 mb-3 text-gray-400 leading-relaxed font-semibold">
              <p className="flex justify-between border-b border-indigo-950/10 pb-1">
                <span>🛡️ Nv. Recomendado:</span>
                <strong className="text-white font-extrabold">{selectedNode.recommendedLevel}</strong>
              </p>
              <p className="flex justify-between border-b border-indigo-950/10 pb-1">
                <span>👥 Jogadores Presentes:</span>
                <strong className="text-white">{selectedNode.players}</strong>
              </p>
              <p className="flex justify-between border-b border-indigo-950/10 pb-1">
                <span>👥 Amigos Presentes:</span>
                <strong className="text-[#ffe082]">
                  {selectedNode.friends.length > 0 ? selectedNode.friends.join(', ') : 'Nenhum'}
                </strong>
              </p>
              <p className="flex justify-between border-b border-indigo-950/10 pb-1">
                <span>🌀 Spawn de Chegada:</span>
                <strong className="text-white">{selectedNode.spawnPoint}</strong>
              </p>
            </div>

            {/* Lore block */}
            <p className="text-[8.5px] text-gray-500 italic leading-relaxed border-b border-indigo-950/20 pb-3.5 mb-3.5">
              "{selectedNode.lore}"
            </p>

            {/* Recompensas lists */}
            {selectedNode.recompensas.length > 0 && (
              <div className="mb-4">
                <span className="text-[#ffe082] text-[8px] font-black uppercase tracking-widest block mb-2 leading-none">
                  Recompensas Possíveis
                </span>
                <div className="grid grid-cols-2 gap-2 text-[8px]">
                  {selectedNode.recompensas.map((rec, rIdx) => (
                    <div key={rIdx} className="p-2 bg-black/20 border border-indigo-950 rounded-xl flex items-center gap-2">
                      <span className="text-base shrink-0">{rec.icon}</span>
                      <div>
                        <span className="block font-black text-white uppercase leading-none">{rec.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Campaign details */}
            {selectedNode.activeCampaign && (
              <div className="bg-indigo-955/15 border border-indigo-900/40 rounded-xl p-3 text-[8.5px] leading-relaxed">
                <span className="font-extrabold text-[8px] text-indigo-400 uppercase tracking-widest block mb-1">
                  Campanha Atual
                </span>
                <p>Nome: <strong className="text-white">{selectedNode.activeCampaign.name}</strong></p>
                <div className="flex items-center gap-1.5 my-1 leading-none">
                  <span>Progresso:</span>
                  <div className="h-1.5 bg-indigo-950 rounded-full flex-grow overflow-hidden">
                    <div className="h-full bg-blue-400" style={{ width: `${selectedNode.activeCampaign.progress}%` }} />
                  </div>
                  <span className="font-bold">{selectedNode.activeCampaign.progress}%</span>
                </div>
                <p>Próximo Objetivo: <strong className="text-white">{selectedNode.activeCampaign.objective}</strong></p>
                <p>Chefe / Mini-Chefe: <strong className="text-white">{selectedNode.activeCampaign.boss}</strong></p>
              </div>
            )}

            {/* Boss Global status */}
            {selectedNode.bossHp && (
              <div className="bg-rose-955/15 border border-rose-900/40 rounded-xl p-3 text-[8.5px] leading-relaxed">
                <span className="font-extrabold text-[8px] text-rose-400 uppercase tracking-widest block mb-1">
                  Confronto de Chefe
                </span>
                <p>Chefe Global: <strong className="text-white">Devorador de Ecos</strong></p>
                <div className="flex items-center gap-1.5 my-1.5 leading-none">
                  <span>HP Restante:</span>
                  <div className="h-1.5 bg-rose-950 rounded-full flex-grow overflow-hidden">
                    <div className="h-full bg-rose-500 animate-pulse" style={{ width: `${selectedNode.bossHp}%` }} />
                  </div>
                  <strong className="text-rose-400 font-extrabold">{selectedNode.bossHp}%</strong>
                </div>
                <p>Status: <strong className="text-rose-300 font-bold uppercase tracking-wider animate-pulse">Confronto Ativo</strong></p>
              </div>
            )}
          </div>

          {/* Travel action button */}
          <button
            onClick={handleEntrarDimensao}
            disabled={selectedNode.status === 'locked'}
            className={`w-full py-3 mt-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${
              selectedNode.status === 'locked' 
                ? 'bg-slate-900 border-slate-950 text-slate-650 cursor-not-allowed opacity-50' 
                : 'bg-indigo-955 hover:bg-indigo-900 border-[#b59441] text-[#ffe082] shadow-lg active:scale-95'
            }`}
          >
            {selectedNode.status === 'locked' ? '🚫 Dimensão Bloqueada' : '🌌 Entrar na Dimensão'}
          </button>
        </section>

      </div>

      {/* 3. FOOTER PANEL AND BUTTON ACTIONS */}
      <footer className="w-full bg-[#121226]/50 border border-indigo-950 rounded-2xl p-4 shrink-0 flex justify-between items-center gap-4 relative z-10">
        <button
          onClick={handleEntrarDimensao}
          disabled={selectedNode.status === 'locked'}
          className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-955/40 hover:bg-indigo-900 border border-indigo-850 text-indigo-300 transition-all hover:scale-103"
        >
          🌌 Entrar na Dimensão
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => alert(`Rastreando a campanha: ${selectedNode.activeCampaign ? selectedNode.activeCampaign.name : 'Nenhuma selecionada'}`)}
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-955/40 hover:bg-indigo-900 border border-indigo-850 text-indigo-300 transition-all hover:scale-103"
          >
            🎯 Rastrear Campanha
          </button>

          <button
            onClick={() => alert(`Visualizando lista de drops da dimensão.`)}
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-955/40 hover:bg-indigo-900 border border-indigo-850 text-indigo-300 transition-all hover:scale-103"
          >
            📦 Ver Recompensas
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-black/35 hover:bg-black/80 border border-gray-800 text-gray-400 transition-all hover:scale-103"
          >
            ↩ Voltar
          </button>
        </div>
      </footer>

      {/* Keyboard Shortcuts guidelines */}
      <div className="w-full text-center text-[7.5px] text-gray-600 font-bold uppercase tracking-widest pt-2.5 mt-2.5 border-t border-indigo-950/30 shrink-0 relative z-10">
        Enter: Selecionar | Q/E: Girar Atlas | Tab: Alternar Filtro | Esc: Voltar
      </div>
    </div>
  );
};
