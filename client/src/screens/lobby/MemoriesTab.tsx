import React, { useState, useMemo } from 'react';
import { TabType } from './useLobbyData';

interface MemoriesTabProps {
  retiredList: any[];
  setActiveTab: (tab: TabType) => void;
}

export const MemoriesTab: React.FC<MemoriesTabProps> = ({ retiredList, setActiveTab }) => {
  const [selectedId, setSelectedId] = useState<string>('mem-1');
  const [filterTab, setFilterTab] = useState<'all' | 'rarity' | 'element' | 'level'>('all');
  const [sorting, setSorting] = useState<'newest' | 'oldest' | 'level' | 'battles'>('newest');
  
  // Rarity filter state
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  // Parse items
  const parsedMemories = useMemo(() => {
    return retiredList.map((m: any) => {
      const meta = m.metadata || {};
      return {
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
        campaigns: meta.campaigns || [],
        notableFeat: meta.notableFeat || 'Nenhum feito registrado.',
        farewellQuote: meta.farewellQuote || 'Despediu-se silenciosamente.',
        badges: meta.badges || [],
        favorite: !!meta.favorite
      };
    });
  }, [retiredList]);

  // Apply filters
  const filteredMemories = useMemo(() => {
    let list = [...parsedMemories];
    
    if (selectedRarity) {
      list = list.filter(m => m.rarity === selectedRarity);
    }
    if (selectedElement) {
      list = list.filter(m => m.element.toLowerCase() === selectedElement.toLowerCase());
    }

    // Sorting
    list.sort((a, b) => {
      if (sorting === 'newest') return b.id.localeCompare(a.id);
      if (sorting === 'oldest') return a.id.localeCompare(b.id);
      if (sorting === 'level') return b.level - a.level;
      if (sorting === 'battles') return b.battles - a.battles;
      return 0;
    });

    return list;
  }, [parsedMemories, selectedRarity, selectedElement, sorting]);

  // Get selected item details
  const selectedMemory = useMemo(() => {
    return filteredMemories.find(m => m.id === selectedId) || filteredMemories[0];
  }, [filteredMemories, selectedId]);

  // Toggle favorite locally
  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({
    'mem-1': true,
    'mem-5': true
  });

  const toggleFavorite = (id: string) => {
    setFavoritesMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
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

  // Get Portrait Emoji or character icon
  const getCharacterPortrait = (name: string) => {
    if (name.includes('Lobo')) return '🐺';
    if (name.includes('Goblin')) return '👺';
    if (name.includes('Arqueira')) return '🏹';
    if (name.includes('Guardião')) return '🪨';
    if (name.includes('Serpente')) return '🐍';
    if (name.includes('Mercenário')) return '⚔️';
    return '👤';
  };

  // Calculate totals
  const totalRegistrados = parsedMemories.length;
  const totalVinculosLendarios = parsedMemories.filter(m => m.battles >= 300).length;

  return (
    <div className="memories-book-wrapper font-sans w-full max-w-5xl mx-auto flex flex-col justify-between h-full min-h-[520px] text-gray-200">
      
      {/* ─── Styles ─── */}
      <style>{`
        .memories-book-wrapper {
          background: rgba(10, 10, 20, 0.4);
          border-radius: 20px;
        }
        .ancient-book-container {
          display: flex;
          background-size: cover;
          border: 10px solid #2d1f18;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.8), inset 0 0 100px rgba(0,0,0,0.8);
          min-height: 480px;
          position: relative;
          background-color: #1c1510;
        }
        .ancient-book-container::before {
          content: '';
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 6px;
          background: linear-gradient(to right, rgba(0,0,0,0.5), rgba(0,0,0,0.8), rgba(0,0,0,0.5));
          z-index: 10;
        }
        .book-page {
          flex: 1;
          padding: 24px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 1;
        }
        .book-page-left {
          border-right: 1px solid rgba(0,0,0,0.25);
          background: linear-gradient(to left, rgba(28,21,16,0.3) 0%, rgba(255,255,255,0.01) 8%);
        }
        .book-page-right {
          background: linear-gradient(to right, rgba(28,21,16,0.3) 0%, rgba(255,255,255,0.01) 8%);
        }
        .glowing-gold-border {
          outline: 2px solid #b58d3d;
          box-shadow: 0 0 12px rgba(181, 141, 61, 0.4);
        }
        .text-ancient {
          color: #d1b894;
        }
        .rarity-badge {
          font-size: 10px;
          font-weight: 900;
          padding: 1px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .rarity-S-plus { background: #6b21a8; color: #f3e8ff; border: 1px solid #a855f7; }
        .rarity-S { background: #b91c1c; color: #fee2e2; border: 1px solid #ef4444; }
        .rarity-A { background: #ea580c; color: #ffedd5; border: 1px solid #f97316; }
        .rarity-B { background: #0d9488; color: #ccfbf1; border: 1px solid #14b8a6; }
        .rarity-C { background: #16a34a; color: #dcfce7; border: 1px solid #22c55e; }
        .rarity-D { background: #2563eb; color: #dbeafe; border: 1px solid #3b82f6; }
        
        .gold-seal {
          background: radial-gradient(circle, #e2c079 0%, #b28a38 100%);
          border: 2px solid #fff3d1;
          box-shadow: 0 4px 8px rgba(0,0,0,0.4);
          color: #1a0f08;
          font-weight: 900;
        }
        .blue-tag {
          background: #1e293b;
          border: 1px solid #3b82f6;
          color: #60a5fa;
        }
        .scrolling-content::-webkit-scrollbar {
          width: 4px;
        }
        .scrolling-content::-webkit-scrollbar-thumb {
          background: #5c4535;
          border-radius: 4px;
        }
      `}</style>

      {/* ─── Header ─── */}
      <header className="flex justify-between items-center py-3 border-b border-indigo-950/40 mb-3 px-2">
        <div>
          <h1 className="text-xl font-extrabold text-ancient tracking-wider">LIVRO DE MEMÓRIAS</h1>
          <p className="text-[10px] text-gray-500 italic">Ecos dos companheiros que já caminharam ao seu lado</p>
        </div>
        <div className="flex gap-4 text-xs font-bold text-gray-400">
          <span>📊 {totalRegistrados} registrados</span>
          <span>•</span>
          <span>🏆 {totalVinculosLendarios} vínculos lendários</span>
        </div>
      </header>

      {/* ─── Main Ancient Book Frame ─── */}
      <div className="ancient-book-container flex-1">
        
        {/* PAGE LEFT: Gallery / Grid */}
        <div className="book-page book-page-left flex flex-col justify-between">
          <div className="w-full flex flex-col h-full overflow-hidden">
            {/* Filter Tabs */}
            <div className="flex gap-1.5 border-b border-[#5c4535]/40 pb-2 mb-3">
              {[
                { key: 'all', label: 'Todos' },
                { key: 'rarity', label: 'Raridade' },
                { key: 'element', label: 'Elemento' },
                { key: 'level', label: 'Nível' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setFilterTab(tab.key as any);
                    if (tab.key === 'all') {
                      setSelectedRarity(null);
                      setSelectedElement(null);
                    }
                  }}
                  className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                    filterTab === tab.key ? 'bg-[#5c4535] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Subfilters */}
            {filterTab === 'rarity' && (
              <div className="flex gap-1 mb-2.5 flex-wrap">
                {['S+', 'S', 'A', 'B', 'C', 'D'].map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRarity(selectedRarity === r ? null : r)}
                    className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                      selectedRarity === r ? 'bg-[#5c4535] text-white' : 'bg-black/30 text-gray-400'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            {filterTab === 'element' && (
              <div className="flex gap-1 mb-2.5 flex-wrap">
                {['Fogo', 'Agua', 'Terra', 'Vento', 'Sombra'].map(el => (
                  <button
                    key={el}
                    onClick={() => setSelectedElement(selectedElement === el ? null : el)}
                    className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                      selectedElement === el ? 'bg-[#5c4535] text-white' : 'bg-black/30 text-gray-400'
                    }`}
                  >
                    {el}
                  </button>
                ))}
              </div>
            )}

            {/* Sorting */}
            <div className="flex justify-between items-center text-[10px] text-gray-400 mb-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <span>Ordenar:</span>
                <select
                  value={sorting}
                  onChange={(e) => setSorting(e.target.value as any)}
                  className="bg-black/30 border border-[#5c4535]/30 rounded px-1.5 py-0.5 outline-none text-gray-300"
                >
                  <option value="newest">Mais recente</option>
                  <option value="oldest">Mais antigo</option>
                  <option value="level">Nível final</option>
                  <option value="battles">Mais batalhas</option>
                </select>
              </div>
              <span>Mostrando {filteredMemories.length} resultados</span>
            </div>

            {/* Scrollable list of cards */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrolling-content">
              {filteredMemories.length === 0 ? (
                <div className="text-center py-12 text-gray-400 italic text-[10px]">
                  Nenhum eco correspondente encontrado nesta página.
                </div>
              ) : (
                filteredMemories.map(m => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={`bg-black/25 border border-indigo-950/20 rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-all hover:bg-black/40 ${
                      selectedId === m.id ? 'glowing-gold-border' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-black/45 flex items-center justify-center text-lg border border-gray-800/40">
                        {getCharacterPortrait(m.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-white leading-none">{m.name}</span>
                          <span className={`rarity-badge rarity-${m.rarity.replace('+', '')}`}>{m.rarity}</span>
                        </div>
                        <p className="text-[9px] text-gray-400 mt-1 flex items-center gap-2">
                          <span>{getElementIcon(m.element)} {m.element}</span>
                          <span>•</span>
                          <span>Nível Final: {m.level}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-[8px] text-gray-400">
                      <p className="font-semibold text-ancient">Campanha 1</p>
                      <p className="mt-0.5">{m.retiredAt}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer page indicators */}
          <div className="flex justify-center items-center gap-4 text-xs font-bold text-[#d1b894] mt-2 shrink-0">
            <button className="opacity-50 hover:opacity-100" onClick={() => alert("Página anterior")}>&lt;</button>
            <span>Página 1 / 4</span>
            <button className="opacity-50 hover:opacity-100" onClick={() => alert("Próxima página")}>&gt;</button>
          </div>
        </div>

        {/* PAGE RIGHT: Details of Selected Memory */}
        <div className="book-page book-page-right flex flex-col justify-between">
          {selectedMemory ? (
            <div className="flex flex-col h-full justify-between">
              
              {/* Portrait + Core info block */}
              <div className="flex gap-4 border-b border-[#5c4535]/30 pb-3">
                <div className="w-20 h-20 rounded-2xl bg-black/50 border-2 border-[#b58d3d]/50 flex items-center justify-center text-4xl shadow-inner shrink-0 relative">
                  {getCharacterPortrait(selectedMemory.name)}
                  {favoritesMap[selectedMemory.id] && (
                    <span className="absolute -top-1.5 -right-1.5 text-xs">⭐</span>
                  )}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white">{selectedMemory.name}</h2>
                    <span className={`rarity-badge rarity-${selectedMemory.rarity.replace('+', '')}`}>{selectedMemory.rarity}</span>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {selectedMemory.battles >= 300 && (
                      <span className="gold-seal px-2 py-0.5 text-[8px] rounded flex items-center gap-1 uppercase tracking-wide">
                        🏆 Vínculo Lendário
                      </span>
                    )}
                    <span className="blue-tag px-2 py-0.5 text-[8px] rounded uppercase tracking-wide">
                      Primeiro Companheiro
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats & History Details List */}
              <div className="flex-1 overflow-y-auto py-2.5 space-y-1 text-[9px] scrolling-content">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-gray-400">
                  <p className="flex justify-between border-b border-[#5c4535]/10 pb-0.5">
                    <span>Elemento:</span>
                    <strong className="text-white">{getElementIcon(selectedMemory.element)} {selectedMemory.element}</strong>
                  </p>
                  <p className="flex justify-between border-b border-[#5c4535]/10 pb-0.5">
                    <span>Função:</span>
                    <strong className="text-white">{selectedMemory.role}</strong>
                  </p>
                  <p className="flex justify-between border-b border-[#5c4535]/10 pb-0.5">
                    <span>Nível Final:</span>
                    <strong className="text-white">{selectedMemory.level}</strong>
                  </p>
                  <p className="flex justify-between border-b border-[#5c4535]/10 pb-0.5">
                    <span>Tempo de Equipe:</span>
                    <strong className="text-white">Desde o início</strong>
                  </p>
                  <p className="flex justify-between border-b border-[#5c4535]/10 pb-0.5">
                    <span>Entrada:</span>
                    <strong className="text-white">{selectedMemory.joinedAt}</strong>
                  </p>
                  <p className="flex justify-between border-b border-[#5c4535]/10 pb-0.5">
                    <span>Desencantado:</span>
                    <strong className="text-white">{selectedMemory.retiredAt}</strong>
                  </p>
                  <p className="flex justify-between border-b border-[#5c4535]/10 pb-0.5">
                    <span>Substituído por:</span>
                    <strong className="text-white">{selectedMemory.replacedBy}</strong>
                  </p>
                  <p className="flex justify-between border-b border-[#5c4535]/10 pb-0.5">
                    <span>Batalhas vividas:</span>
                    <strong className="text-white">{selectedMemory.battles}</strong>
                  </p>
                  <p className="flex justify-between border-b border-[#5c4535]/10 pb-0.5">
                    <span>Vitórias acumuladas:</span>
                    <strong className="text-white">{selectedMemory.victories}</strong>
                  </p>
                  <p className="flex justify-between border-b border-[#5c4535]/10 pb-0.5">
                    <span>Campanhas:</span>
                    <strong className="text-white">{selectedMemory.campaigns.length}</strong>
                  </p>
                </div>

                {/* Feito Marcante Panel */}
                <div className="mt-3 bg-[#5c4535]/10 border border-[#5c4535]/30 p-2.5 rounded-xl">
                  <span className="font-extrabold text-[8px] text-[#d1b894] uppercase tracking-widest block mb-1">
                    🔹 Feito Marcante
                  </span>
                  <p className="text-[9px] text-gray-300 italic">{selectedMemory.notableFeat}</p>
                </div>

                {/* Farewell Quote Feather Style */}
                <div className="mt-3 bg-black/30 border border-[#5c4535]/30 p-2.5 rounded-xl relative overflow-hidden">
                  <span className="font-extrabold text-[8px] text-ancient uppercase tracking-widest block mb-1">
                    ✒️ Frase de Despedida
                  </span>
                  <p className="text-[10px] text-gray-100 italic font-medium leading-relaxed">
                    "{selectedMemory.farewellQuote}"
                  </p>
                  <p className="text-[8px] text-[#d1b894] mt-1 text-right italic">- Ecos de {selectedMemory.name}</p>
                </div>
              </div>

              {/* Action warnings inside book */}
              <div className="text-[8px] text-gray-500 italic text-center border-t border-[#5c4535]/20 pt-2 shrink-0">
                ⚠️ Este companheiro foi desencantado e não pode mais retornar à equipe de combate.
              </div>

            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500 italic text-xs">
              Nenhuma memória selecionada
            </div>
          )}
        </div>

      </div>

      {/* ─── Footer Action Buttons ─── */}
      <footer className="flex justify-end gap-3 mt-4 py-2 border-t border-indigo-950/40 px-1 shrink-0">
        {selectedMemory && (
          <button
            onClick={() => toggleFavorite(selectedMemory.id)}
            className="px-4 py-2 bg-indigo-950 hover:bg-indigo-900 border border-indigo-850 rounded-xl text-xs font-bold text-indigo-200 transition-colors flex items-center gap-1.5"
          >
            {favoritesMap[selectedMemory.id] ? '★ Remover Favorito' : '☆ Favoritar Memória'}
          </button>
        )}
        <button
          onClick={() => alert("Histórico de campanhas de batalha carregado.")}
          className="px-4 py-2 bg-indigo-950 hover:bg-indigo-900 border border-indigo-850 rounded-xl text-xs font-bold text-indigo-200 transition-colors flex items-center gap-1.5"
        >
          📖 Ver Histórico
        </button>
        <button
          onClick={() => setActiveTab('home')}
          className="px-5 py-2 bg-rose-950/20 hover:bg-rose-950 border border-rose-900/50 rounded-xl text-xs font-extrabold text-rose-300 transition-colors"
        >
          ↩ Voltar ao Menu
        </button>
      </footer>
    </div>
  );
};
