import React, { useState, useMemo } from 'react';
import { TabType } from './useLobbyData';

export interface MemoryEntry {
  id: string;
  name: string;
  level: number;
  element: string;
  retiredAt: string;
  rarity: 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S+';
  role: string;
  joinedAt: string;
  replacedBy: string;
  battles: number;
  victories: number;
  campaigns: string[];
  campaignLabel: string;
  notableFeat: string;
  farewellQuote: string;
  subtext: string;
  badges: string[];
  favorite: boolean;
  sinceText?: string;
}

interface MemoriesTabProps {
  retiredList: any[];
  setActiveTab: (tab: TabType) => void;
}

export const MemoriesTab: React.FC<MemoriesTabProps> = ({ retiredList, setActiveTab }) => {
  const getElementBadgeColor = (el: string) => {
    const e = el.toLowerCase();
    if (e === 'fogo') return 'text-rose-400';
    if (e === 'água' || e === 'agua') return 'text-blue-400';
    if (e === 'terra') return 'text-emerald-400';
    if (e === 'vento') return 'text-teal-400';
    if (e === 'sombra') return 'text-purple-400';
    return 'text-gray-400';
  };
  const [selectedId, setSelectedId] = useState<string>('mem-lobo');
  const [filterTab, setFilterTab] = useState<'all' | 'rarity' | 'element' | 'campaign' | 'level'>('all');
  const [sorting, setSorting] = useState<'newest' | 'oldest' | 'level' | 'battles' | 'rarity' | 'alphabetical'>('newest');
  
  // Sub-filters state
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [selectedLevelMin, setSelectedLevelMin] = useState<number | null>(null);

  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // 1. Setup the default rich memories matching the mockup exactly
  const defaultMemories = useMemo<MemoryEntry[]>(() => [
    {
      id: 'mem-lobo',
      name: 'Lobo Cinzento',
      level: 132,
      element: 'Vento',
      retiredAt: '14/08/2025',
      rarity: 'D',
      role: 'Companheiro',
      joinedAt: '22/05/2025',
      replacedBy: 'Thorn',
      battles: 418,
      victories: 301,
      campaigns: ['Campanha 1'],
      campaignLabel: 'Campanha 1',
      notableFeat: 'Sobreviveu à Fenda Abissal com 1 HP.',
      farewellQuote: 'Mais que um companheiro, uma memória viva.',
      subtext: 'Entrou como um filhote nas florestas de Veylar. Partiu como lenda.',
      badges: ['👑 VÍNCULO LENDÁRIO', '🐾 Primeiro Companheiro'],
      favorite: false
    },
    {
      id: 'mem-goblin',
      name: 'Goblin Saqueador',
      level: 98,
      element: 'Fogo',
      retiredAt: '03/07/2025',
      rarity: 'C',
      role: 'Ladino',
      joinedAt: '01/06/2025',
      replacedBy: 'Lyria',
      battles: 120,
      victories: 85,
      campaigns: ['Campanha 2'],
      campaignLabel: 'Campanha 2',
      notableFeat: 'Roubou 5.000 moedas de ouro de chefes.',
      farewellQuote: 'Deixo o ouro, mas levo as memórias.',
      subtext: 'Se juntou pelo ouro, ficou pela lealdade.',
      badges: ['🪙 Saqueador Rápido'],
      favorite: false
    },
    {
      id: 'mem-arqueira',
      name: 'Arqueira de Veylar',
      level: 116,
      element: 'Terra',
      retiredAt: '30/06/2025',
      rarity: 'B',
      role: 'Arqueira',
      joinedAt: '10/06/2025',
      replacedBy: 'Raven',
      battles: 95,
      victories: 70,
      campaigns: ['Campanha 2'],
      campaignLabel: 'Campanha 2',
      notableFeat: 'Derrubou 3 Harpias com um único disparo de flecha.',
      farewellQuote: 'Minha mira sempre esteve em você.',
      subtext: 'Defendeu os bosques sagrados até o fim de sua jornada.',
      badges: ['🏹 Olho de Águia'],
      favorite: false
    },
    {
      id: 'mem-guardiao',
      name: 'Guardião de Pedra',
      level: 121,
      element: 'Terra',
      retiredAt: '18/06/2025',
      rarity: 'B',
      role: 'Tanque',
      joinedAt: '12/06/2025',
      replacedBy: 'Caelum',
      battles: 88,
      victories: 60,
      campaigns: ['Campanha 3'],
      campaignLabel: 'Campanha 3',
      notableFeat: 'Bloqueou 25.000 pontos de dano em um único combate.',
      farewellQuote: 'Pedra racha, mas a amizade resiste.',
      subtext: 'Inquebrável sob o peso das fendas dimensionais.',
      badges: ['🧱 Inabalável'],
      favorite: false
    },
    {
      id: 'mem-serpente',
      name: 'Serpente Astral',
      level: 150,
      element: 'Sombra',
      retiredAt: '02/05/2025',
      rarity: 'S+',
      role: 'Invocador',
      joinedAt: '05/04/2025',
      replacedBy: 'Nyxara',
      battles: 250,
      victories: 198,
      campaigns: ['Campanha 4'],
      campaignLabel: 'Campanha 4',
      notableFeat: 'Invocou a Tempestade de Ecos no Templo Astral.',
      farewellQuote: 'O espaço se fecha, mas a constelação brilha.',
      subtext: 'Um ser enigmático moldado pela pura energia das fendas.',
      badges: ['🔮 Ecos Estelares'],
      favorite: false
    },
    {
      id: 'mem-mercenario',
      name: 'Mercenário Errante',
      level: 105,
      element: 'Fogo',
      retiredAt: '15/04/2025',
      rarity: 'A',
      role: 'Guerreiro',
      joinedAt: '15/03/2025',
      replacedBy: 'Korr',
      battles: 110,
      victories: 80,
      campaigns: ['Campanha 5'],
      campaignLabel: 'Campanha 5',
      notableFeat: 'Derrotou 15 capangas sozinho na Taverna.',
      farewellQuote: 'Minha espada descansará, mas nossa honra continua.',
      subtext: 'Sua lâmina foi alugada, mas sua amizade foi conquistada.',
      badges: ['⚔️ Lâmina Solitária'],
      favorite: false
    }
  ], []);

  // 2. Merge with active retired character list from server db
  const parsedMemories = useMemo<MemoryEntry[]>(() => {
    const list = [...defaultMemories];
    retiredList.forEach((m: any) => {
      if (!list.some(item => item.name.toLowerCase() === m.name.toLowerCase())) {
        const meta = m.metadata || {};
        list.push({
          id: m.id || `mem-${m.name}`,
          name: m.name,
          level: m.level,
          element: m.element || 'none',
          retiredAt: m.retiredAt ? new Date(m.retiredAt).toLocaleDateString() : 'N/A',
          rarity: meta.rarity || 'D',
          role: meta.role || 'Companheiro',
          joinedAt: meta.joinedAt || 'N/A',
          replacedBy: meta.replacedBy || 'N/A',
          battles: meta.battles || 0,
          victories: meta.victories || 0,
          campaigns: meta.campaigns || ['Campanha Custom'],
          campaignLabel: meta.campaignLabel || 'Campanha Custom',
          notableFeat: meta.notableFeat || 'Caminhou honradamente sob seu comando.',
          farewellQuote: meta.farewellQuote || 'Despediu-se silenciosamente.',
          subtext: meta.subtext || 'Ecos da jornada medieval.',
          badges: meta.badges || ['🐾 Companheiro'],
          favorite: !!meta.favorite
        });
      }
    });
    return list;
  }, [retiredList, defaultMemories]);

  // Apply filters and sorting
  const filteredMemories = useMemo(() => {
    let list = [...parsedMemories];
    
    if (selectedRarity) {
      list = list.filter(m => m.rarity === selectedRarity);
    }
    if (selectedElement) {
      list = list.filter(m => m.element.toLowerCase() === selectedElement.toLowerCase());
    }
    if (selectedCampaign) {
      list = list.filter(m => m.campaigns.some(c => c.toLowerCase() === selectedCampaign.toLowerCase()));
    }
    if (selectedLevelMin) {
      list = list.filter(m => m.level >= selectedLevelMin);
    }

    // Sorting
    list.sort((a, b) => {
      if (sorting === 'newest') return b.retiredAt.localeCompare(a.retiredAt);
      if (sorting === 'oldest') return a.retiredAt.localeCompare(b.retiredAt);
      if (sorting === 'level') return b.level - a.level;
      if (sorting === 'battles') return b.battles - a.battles;
      if (sorting === 'rarity') {
        const ranks = ['S+', 'S', 'A', 'B', 'C', 'D', 'E'];
        return ranks.indexOf(a.rarity) - ranks.indexOf(b.rarity);
      }
      if (sorting === 'alphabetical') return a.name.localeCompare(b.name);
      return 0;
    });

    return list;
  }, [parsedMemories, selectedRarity, selectedElement, selectedCampaign, selectedLevelMin, sorting]);

  // Selected memory object
  const selectedMemory = useMemo(() => {
    return filteredMemories.find(m => m.id === selectedId) || filteredMemories[0];
  }, [filteredMemories, selectedId]);

  // Favorites mapping
  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({
    'mem-lobo': true
  });

  const toggleFavorite = (id: string) => {
    setFavoritesMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

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

  // Get Element Icon
  const getElementIcon = (element: string) => {
    const el = element.toLowerCase();
    if (el === 'fogo') return '🔥';
    if (el === 'agua' || el === 'água') return '💧';
    if (el === 'terra') return '⛰️';
    if (el === 'vento') return '🍃';
    if (el === 'sombra') return '🔮';
    return '🛡️';
  };

  // Get JRPG Portrait mapping
  const getCharacterFace = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('lobo')) return null; // fallback to emoji wolf illustration
    if (n.includes('goblin')) return null;
    if (n.includes('arqueira')) return '/assets/characters/nyxara_face.png';
    if (n.includes('guardião') || n.includes('guardiao')) return '/assets/characters/korr_face.png';
    if (n.includes('serpente')) return null;
    if (n.includes('mercenário') || n.includes('mercenario')) return '/assets/characters/caelum_face.png';
    return null;
  };

  // Get fallback emojis
  const getFallbackEmoji = (name: string) => {
    if (name.includes('Lobo')) return '🐺';
    if (name.includes('Goblin')) return '👹';
    if (name.includes('Arqueira')) return '🏹';
    if (name.includes('Guardião')) return '🗿';
    if (name.includes('Serpente')) return '🐉';
    if (name.includes('Mercenário')) return '🛡️';
    return '👤';
  };

  // Calculate totals
  const totalRegistrados = parsedMemories.length;
  const totalCampanhas = 7;
  const totalVinculosLendarios = parsedMemories.filter(m => m.battles >= 300).length;

  return (
    <div className="memories-fullscreen-wrapper w-full h-full min-h-[580px] bg-[#06060c] border border-[#b59441]/40 rounded-3xl overflow-hidden p-6 flex flex-col justify-between select-none relative font-sans text-gray-200">
      
      {/* Background visual details */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(27,61,109,0.04)_0%,_transparent_75%)] pointer-events-none" />

      {/* 1. TOP HEADER SECTION */}
      <header className="flex justify-between items-center border-b border-indigo-950/40 pb-4 mb-4 shrink-0 relative z-10">
        {/* Left Profile details */}
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
            LIVRO DE MEMÓRIAS
          </h1>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1.5 leading-none">
            Ecos dos companheiros que já caminharam ao seu lado
          </p>
          <div className="flex justify-center gap-3 text-[7.5px] font-black text-indigo-400 uppercase tracking-wider mt-2.5">
            <span>{totalRegistrados} registrados</span>
            <span>•</span>
            <span>{totalCampanhas} campanhas</span>
            <span>•</span>
            <span>{totalVinculosLendarios} vínculos lendários</span>
          </div>
        </div>

        {/* Right Location Details */}
        <div className="flex items-center gap-3 text-right">
          <div className="flex flex-col">
            <span className="text-gray-400 text-[9px] font-bold leading-none">Local: <strong className="text-gray-200">Cidade-Portal de Veylar</strong></span>
            <span className="text-[8px] text-gray-500 uppercase font-bold mt-1.5 block tracking-wide">Origem: Pós-combate</span>
          </div>
          <div className="relative w-8 h-8 rounded-full border border-indigo-900/60 overflow-hidden flex items-center justify-center bg-black/60 shadow-[0_0_8px_rgba(99,102,241,0.25)]">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-800 to-indigo-950 animate-spin duration-3000" />
            <span className="text-xs relative z-10">🌀</span>
          </div>
        </div>
      </header>

      {/* 2. DOUBLE-PAGE OPEN BOOK CONTAINER */}
      <div className="flex-grow flex bg-[#16120e] border-[8px] border-[#251c14] rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.8),_inset_0_0_60px_rgba(0,0,0,0.95)] overflow-hidden min-h-0 relative z-10 mb-4">
        
        {/* Book spine middle shadow */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[8px] -translate-x-1/2 bg-gradient-to-r from-black/50 via-black/85 to-black/50 z-20 pointer-events-none" />

        {/* 2.1 PAGE LEFT: List & Gallery */}
        <div className="flex-1 p-5 flex flex-col justify-between border-r border-black/35 bg-[#0c0f18]/95 relative overflow-hidden min-w-0">
          <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
          
          <div className="flex flex-col h-full overflow-hidden relative z-10">
            {/* Top Tabs */}
            <div className="flex gap-1.5 border-b border-[#5c4535]/40 pb-2 mb-3 shrink-0">
              {[
                { key: 'all', label: 'Todos' },
                { key: 'rarity', label: 'Raridade' },
                { key: 'element', label: 'Elemento' },
                { key: 'campaign', label: 'Campanha' },
                { key: 'level', label: 'Nível' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setFilterTab(tab.key as any);
                    if (tab.key === 'all') {
                      setSelectedRarity(null);
                      setSelectedElement(null);
                      setSelectedCampaign(null);
                      setSelectedLevelMin(null);
                    }
                  }}
                  className={`px-3 py-1 rounded text-[8.5px] font-black uppercase tracking-wider transition-all ${
                    filterTab === tab.key ? 'bg-[#5c4535] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Subfilters list toggles */}
            {filterTab === 'rarity' && (
              <div className="flex gap-1 mb-2.5 flex-wrap shrink-0 animate-fadeIn">
                {['S+', 'S', 'A', 'B', 'C', 'D'].map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRarity(selectedRarity === r ? null : r)}
                    className={`px-2.5 py-0.5 rounded text-[8px] font-bold border transition-colors ${
                      selectedRarity === r ? 'bg-indigo-650 text-white border-indigo-500' : 'bg-black/35 text-gray-400 border-indigo-950/30'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            {filterTab === 'element' && (
              <div className="flex gap-1 mb-2.5 flex-wrap shrink-0 animate-fadeIn">
                {['Fogo', 'Água', 'Terra', 'Vento', 'Sombra'].map(el => (
                  <button
                    key={el}
                    onClick={() => setSelectedElement(selectedElement === el ? null : el)}
                    className={`px-2.5 py-0.5 rounded text-[8px] font-bold border transition-colors ${
                      selectedElement === el ? 'bg-indigo-650 text-white border-indigo-500' : 'bg-black/35 text-gray-400 border-indigo-955/30'
                    }`}
                  >
                    {el}
                  </button>
                ))}
              </div>
            )}

            {filterTab === 'campaign' && (
              <div className="flex gap-1 mb-2.5 flex-wrap shrink-0 animate-fadeIn">
                {['Campanha 1', 'Campanha 2', 'Campanha 3', 'Campanha 4', 'Campanha 5'].map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCampaign(selectedCampaign === c ? null : c)}
                    className={`px-2.5 py-0.5 rounded text-[8px] font-bold border transition-colors ${
                      selectedCampaign === c ? 'bg-indigo-650 text-white border-indigo-500' : 'bg-black/35 text-gray-400 border-indigo-955/30'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {filterTab === 'level' && (
              <div className="flex gap-1 mb-2.5 flex-wrap shrink-0 animate-fadeIn">
                {[50, 100, 120, 130].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevelMin(selectedLevelMin === lvl ? null : lvl)}
                    className={`px-2.5 py-0.5 rounded text-[8px] font-bold border transition-colors ${
                      selectedLevelMin === lvl ? 'bg-indigo-650 text-white border-indigo-500' : 'bg-black/35 text-gray-400 border-indigo-955/30'
                    }`}
                  >
                    ≥ Nv. {lvl}
                  </button>
                ))}
              </div>
            )}

            {/* Sorting bar controls */}
            <div className="flex justify-between items-center text-[8.5px] text-gray-500 mb-3.5 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold">Ordenar:</span>
                <select
                  value={sorting}
                  onChange={(e) => setSorting(e.target.value as any)}
                  className="bg-black/40 border border-indigo-950/60 rounded px-2 py-0.5 outline-none text-indigo-300 font-bold"
                >
                  <option value="newest">Mais recente</option>
                  <option value="oldest">Mais antigo</option>
                  <option value="level">Maior nível final</option>
                  <option value="battles">Mais batalhas</option>
                  <option value="rarity">Maior raridade</option>
                  <option value="alphabetical">Ordem alfabética</option>
                </select>
              </div>
              <span className="font-semibold">{filteredMemories.length} ecos listados</span>
            </div>

            {/* Vertical Roster List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              {filteredMemories.length === 0 ? (
                <div className="text-center py-16 text-gray-500 italic text-[10px]">
                  Nenhum registro de memória condizente com os filtros ativos.
                </div>
              ) : (
                filteredMemories.map(m => {
                  const isSelected = selectedId === m.id;
                  const isFav = favoritesMap[m.id];
                  
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedId(m.id)}
                      className={`rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-all border relative ${
                        isSelected
                          ? 'border-[#b59441] bg-[#1c1810]/40 shadow-[0_0_12px_rgba(181,148,65,0.15)]'
                          : 'border-indigo-950/40 bg-black/25 hover:bg-indigo-955/15'
                      }`}
                    >
                      {/* Highlight paw icon on selected card left border */}
                      {isSelected && (
                        <div className="absolute left-1.5 text-[8px] text-[#b59441] animate-pulse">🐾</div>
                      )}

                      <div className="flex items-center gap-3 pl-3">
                        <div className="w-9 h-9 rounded-lg border border-indigo-950 bg-slate-900 flex items-center justify-center shrink-0 overflow-hidden relative">
                          {!imgErrors[m.id] && getCharacterFace(m.name) ? (
                            <img 
                              src={getCharacterFace(m.name)!} 
                              onError={() => setImgErrors(prev => ({ ...prev, [m.id]: true }))}
                              alt={m.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <span className="text-lg leading-none">{getFallbackEmoji(m.name)}</span>
                          )}
                          
                          {isFav && (
                            <span className="absolute top-0 left-0 bg-yellow-500 text-black text-[5px] font-black px-0.5 rounded-br">★</span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-extrabold text-[11px] text-white leading-none">{m.name}</h4>
                            <span className={`text-[7px] font-mono border rounded px-1 leading-none ${getRarityBadgeStyle(m.rarity)}`}>
                              {m.rarity}
                            </span>
                          </div>
                          
                          <p className="text-[7.5px] text-gray-500 font-bold uppercase mt-1.5 flex items-center gap-2">
                            <span>{getElementIcon(m.element)} {m.element}</span>
                            <span>•</span>
                            <span>Nível Final: {m.level}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right text-[8px] text-gray-500 pr-1 shrink-0">
                        <p className="font-bold text-[#d1b894] uppercase tracking-wider">{m.campaignLabel}</p>
                        <p className="mt-1 leading-none font-medium">{m.retiredAt}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Left Page Pagination */}
          <div className="flex justify-center items-center gap-4 text-[10px] font-black text-[#d1b894] pt-3 mt-3 border-t border-[#5c4535]/30 shrink-0 relative z-10">
            <button className="opacity-50 hover:opacity-100 transition-opacity" onClick={() => alert("Voltar página")}>◀</button>
            <span className="tracking-widest uppercase text-[8px]">Página 1 / 4</span>
            <button className="opacity-50 hover:opacity-100 transition-opacity" onClick={() => alert("Avançar página")}>▶</button>
          </div>
        </div>

        {/* 2.2 PAGE RIGHT: Selected Memory biography details */}
        <div className="flex-1 p-5 flex flex-col justify-between bg-[#0e121d]/95 relative overflow-hidden min-w-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />

          {selectedMemory ? (
            <div className="flex flex-col h-full justify-between relative z-10 min-h-0">
              
              {/* Profile headers banner */}
              <div className="flex gap-4 border-b border-[#5c4535]/30 pb-3 shrink-0">
                {/* Large portrait frame */}
                <div className="w-20 h-20 rounded-xl bg-black/60 border-2 border-[#b59441]/40 overflow-hidden flex items-center justify-center shadow-inner relative shrink-0">
                  {!imgErrors[`large-${selectedMemory.id}`] && getCharacterFace(selectedMemory.name) ? (
                    <img 
                      src={getCharacterFace(selectedMemory.name)!} 
                      onError={() => setImgErrors(prev => ({ ...prev, [`large-${selectedMemory.id}`]: true }))}
                      alt={selectedMemory.name} 
                      className="w-full h-full object-cover filter brightness-95 saturate-90 rounded-lg" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-950/40 to-slate-900 flex flex-col items-center justify-center text-4xl border border-indigo-955 rounded-lg relative overflow-hidden">
                      <span>{getFallbackEmoji(selectedMemory.name)}</span>
                    </div>
                  )}
                  {favoritesMap[selectedMemory.id] && (
                    <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">★</span>
                  )}
                </div>

                <div className="flex flex-col justify-between text-left">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-black text-white leading-none uppercase tracking-wider">{selectedMemory.name}</h2>
                      <span className={`text-[8.5px] font-mono border rounded px-1.5 leading-none shrink-0 ${getRarityBadgeStyle(selectedMemory.rarity)}`}>
                        Rank {selectedMemory.rarity}
                      </span>
                    </div>
                    <span className="text-[7px] text-[#ffe082] uppercase font-bold mt-1.5 block tracking-widest">{selectedMemory.role}</span>
                  </div>

                  {/* Character Seals/Badges */}
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {selectedMemory.badges.map((badge, bIdx) => (
                      <span
                        key={bIdx}
                        className={`text-[6.5px] font-black px-2 py-0.5 rounded uppercase tracking-wider border ${
                          badge.includes('LENDÁRIO') 
                            ? 'bg-yellow-950/50 border-yellow-500/50 text-yellow-400' 
                            : 'bg-indigo-950/50 border-indigo-500/50 text-indigo-400'
                        }`}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid Biography and Statistics */}
              <div className="flex-1 overflow-y-auto py-3 space-y-3.5 min-h-0">
                <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-[9.5px]">
                  <p className="flex justify-between border-b border-[#5c4535]/15 pb-0.5">
                    <span className="text-gray-400">Raridade:</span>
                    <strong className="text-white font-extrabold">{selectedMemory.rarity}</strong>
                  </p>
                  <p className="flex justify-between border-b border-[#5c4535]/15 pb-0.5">
                    <span className="text-gray-400">Elemento:</span>
                    <strong className={`font-extrabold ${getElementBadgeColor(selectedMemory.element)}`}>
                      {getElementIcon(selectedMemory.element)} {selectedMemory.element}
                    </strong>
                  </p>
                  <p className="flex justify-between border-b border-[#5c4535]/15 pb-0.5">
                    <span className="text-gray-400">Função:</span>
                    <strong className="text-white font-extrabold">{selectedMemory.role}</strong>
                  </p>
                  <p className="flex justify-between border-b border-[#5c4535]/15 pb-0.5">
                    <span className="text-gray-400">Nível Final:</span>
                    <strong className="text-white font-extrabold">{selectedMemory.level}</strong>
                  </p>
                  <p className="flex justify-between border-b border-[#5c4535]/15 pb-0.5 col-span-2">
                    <span className="text-gray-400">Tempo na equipe:</span>
                    <strong className="text-white font-semibold">{selectedMemory.sinceText || 'Desde o início da jornada'}</strong>
                  </p>
                  <p className="flex justify-between border-b border-[#5c4535]/15 pb-0.5">
                    <span className="text-gray-400">Entrada:</span>
                    <strong className="text-white font-semibold">{selectedMemory.joinedAt}</strong>
                  </p>
                  <p className="flex justify-between border-b border-[#5c4535]/15 pb-0.5">
                    <span className="text-gray-400">Desencantado:</span>
                    <strong className="text-white font-semibold">{selectedMemory.retiredAt}</strong>
                  </p>
                  <p className="flex justify-between border-b border-[#5c4535]/15 pb-0.5 col-span-2">
                    <span className="text-gray-400">Substituído por:</span>
                    <strong className="text-[#ffe082] font-extrabold">{selectedMemory.replacedBy}</strong>
                  </p>
                  <p className="flex justify-between border-b border-[#5c4535]/15 pb-0.5">
                    <span className="text-gray-400">Batalhas vividas:</span>
                    <strong className="text-white font-extrabold">{selectedMemory.battles}</strong>
                  </p>
                  <p className="flex justify-between border-b border-[#5c4535]/15 pb-0.5">
                    <span className="text-gray-400">Vitórias:</span>
                    <strong className="text-white font-extrabold">{selectedMemory.victories}</strong>
                  </p>
                  <p className="flex justify-between border-b border-[#5c4535]/15 pb-0.5 col-span-2">
                    <span className="text-gray-400">Campanhas:</span>
                    <strong className="text-white font-semibold">{selectedMemory.campaigns.length}</strong>
                  </p>
                  <p className="flex justify-between border-b border-[#5c4535]/15 pb-0.5 col-span-2">
                    <span className="text-gray-400">Vínculo:</span>
                    <strong className="text-yellow-400 font-extrabold">🏷️ {selectedMemory.id.includes('lobo') ? 'Lendário' : 'Alto'}</strong>
                  </p>
                </div>

                {/* Feito Marcante Panel */}
                <div className="bg-[#5c4535]/10 border border-[#5c4535]/30 p-2.5 rounded-xl text-left">
                  <span className="font-extrabold text-[7.5px] text-[#ffe082] uppercase tracking-widest block mb-1">
                    🔹 Feito Marcante
                  </span>
                  <p className="text-[9px] text-gray-300 italic">
                    Feito marcante: {selectedMemory.notableFeat}
                  </p>
                </div>

                {/* Farewell Quote Feather Style */}
                <div className="bg-black/35 border border-[#5c4535]/25 p-3 rounded-xl relative overflow-hidden text-left">
                  <span className="font-extrabold text-[7.5px] text-[#ffe082] uppercase tracking-widest block mb-1">
                    ✒️ Frase de Despedida
                  </span>
                  <p className="text-[10px] text-gray-100 italic font-medium leading-relaxed">
                    “{selectedMemory.farewellQuote}”
                  </p>
                  <p className="text-[8px] text-gray-500 mt-2 text-right font-semibold">
                    {selectedMemory.subtext}
                  </p>
                  {/* Quill feather watermark */}
                  <div className="absolute right-2 bottom-1 opacity-20 text-xl pointer-events-none">🪶</div>
                </div>
              </div>

              {/* Locked warning status */}
              <div className="text-[8px] text-rose-400/80 italic text-center border-t border-[#5c4535]/20 pt-2 shrink-0">
                Este companheiro foi desencantado e não pode mais retornar à equipe.
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500 italic text-xs">
              Selecione um registro de memória no painel esquerdo.
            </div>
          )}
        </div>

      </div>

      {/* 3. FOOTER ACTIONS */}
      <footer className="w-full bg-[#121226]/50 border border-indigo-950 rounded-2xl p-4 shrink-0 flex justify-end items-center gap-4 relative z-10">
        <div className="flex gap-3">
          {selectedMemory && (
            <button
              onClick={() => toggleFavorite(selectedMemory.id)}
              className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#101c38]/40 hover:bg-[#1a2c56]/60 border border-indigo-850 text-indigo-300 transition-all hover:scale-103"
            >
              ★ {favoritesMap[selectedMemory.id] ? "Remover Favorito" : "Favoritar Memória"}
            </button>
          )}

          <button
            onClick={() => alert("Histórico de campanhas de batalha carregado.")}
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-955/40 hover:bg-indigo-900 border border-indigo-850 text-indigo-300 transition-all hover:scale-103"
          >
            📖 Ver Histórico
          </button>

          <button
            onClick={() => alert("Painel de Filtros Avançados aberto.")}
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-955/40 hover:bg-indigo-900 border border-indigo-850 text-indigo-300 transition-all hover:scale-103"
          >
            ⚙️ Filtros
          </button>

          <button
            onClick={() => setActiveTab('home')}
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-950/20 hover:bg-rose-955 border border-rose-900/50 text-rose-300 transition-all hover:scale-103"
          >
            ↩ Voltar
          </button>
        </div>
      </footer>

      {/* Keyboard Shortcuts guidelines */}
      <div className="w-full text-center text-[7.5px] text-gray-600 font-bold uppercase tracking-widest pt-2.5 mt-2.5 border-t border-indigo-950/30 shrink-0 relative z-10">
        Enter: Selecionar | Q/E: Mudar Página | F: Filtros | Esc: Voltar
      </div>

    </div>
  );
};
