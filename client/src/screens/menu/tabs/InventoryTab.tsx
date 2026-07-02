import React from 'react';

interface InventoryTabProps {
  inventoryList: any[];
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  gold: number;
  soulOrbs: number;
  handleFuseItem: (targetId: string) => void;
  handleEvolveItem: () => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  inventoryList, selectedItemId, setSelectedItemId,
  gold, soulOrbs, handleFuseItem, handleEvolveItem
}) => {

  const selectedItem = inventoryList.find(i => i.id === selectedItemId);

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
      
      {/* ─── LEFT: ITEMS GRID ─── */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        <div className="flex items-center justify-between border-b border-indigo-950/80 pb-2 mb-3">
          <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#ffe082]">Mochila & Inventário</h3>
          <span className="text-[9px] text-gray-500 font-bold">{inventoryList.length} Itens Armazenados</span>
        </div>

        {inventoryList.length === 0 ? (
          <p className="text-sm text-gray-500 italic py-6 text-center">Sua mochila está vazia.</p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 h-fit">
            {inventoryList.map((item: any) => {
              const isSelected = selectedItemId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`aspect-square bg-indigo-950/10 border rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 hover:border-indigo-500 transition-colors cursor-pointer relative group ${
                    isSelected ? 'pulse-selection-gold bg-indigo-950/20' : 'border-indigo-950'
                  }`}
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">
                    {item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : '🧪'}
                  </span>
                  <span className="text-[9px] text-gray-300 font-semibold truncate max-w-full text-center">
                    {item.name}
                  </span>
                  {item.equippedCharacterId && (
                    <span className="absolute top-1.5 right-1.5 text-[7px] px-1 bg-indigo-950 border border-indigo-800 text-indigo-400 font-extrabold rounded">
                      E
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── RIGHT: DETAIL PANEL ─── */}
      <div className="w-80 bg-[#121226]/50 border border-indigo-950/80 rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-xl shrink-0 overflow-y-auto">
        {selectedItem ? (
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider block mb-1">
                  {selectedItem.metadata?.rarity || selectedItem.rarity || 'comum'} {selectedItem.type}
                </span>
                <h4 className="font-extrabold text-white text-base leading-tight">
                  {selectedItem.name}
                  {selectedItem.metadata?.evolvedSuffix || ''}
                </h4>
              </div>

              <div className="text-xs text-gray-400 space-y-1.5 border-t border-indigo-950/60 pt-3 text-[10px] font-semibold">
                <p>Nível: <span className="text-white font-bold">Lv. {selectedItem.metadata?.level || 1} / 10</span></p>
                <p>Bônus de Ataque: <span className="text-emerald-400 font-bold">+{selectedItem.metadata?.atkBonus || 0} ATK</span></p>
                <p>Equipado: <span className="text-white font-bold">{selectedItem.equippedCharacterId ? "Sim" : "Não"}</span></p>
                {selectedItem.metadata?.element && (
                  <p>Encanto Elemental: <span className="text-indigo-400 uppercase font-bold">{selectedItem.metadata.element}</span></p>
                )}
              </div>

              {!selectedItem.equippedCharacterId ? (
                <div className="space-y-3 border-t border-indigo-950/60 pt-3">
                  {/* Fusion Upgrade */}
                  {(() => {
                    const identicalItems = inventoryList.filter(
                      (i: any) => i.itemId === selectedItem.itemId && i.id !== selectedItem.id && !i.equippedCharacterId
                    );
                    const currentLvl = selectedItem.metadata?.level || 1;

                    if (currentLvl >= 10) {
                      return <p className="text-[9px] text-emerald-400 italic">✓ Item atingiu o nível máximo (Lv. 10)</p>;
                    }

                    if (identicalItems.length === 0) {
                      return <p className="text-[8px] text-gray-500 italic">Fusão requer outro item idêntico não equipado na mochila.</p>;
                    }

                    return (
                      <div className="space-y-1.5">
                        <span className="text-[9px] text-[#ffe082] font-bold uppercase block leading-none">Fusão (Subir Nível)</span>
                        <button
                          onClick={() => handleFuseItem(identicalItems[0].id)}
                          className="w-full py-2 bg-indigo-900/60 hover:bg-indigo-700 border border-indigo-500 rounded-lg text-[9px] font-extrabold text-white transition-colors"
                        >
                          CONFIRMAR FUSÃO (+1 LV)
                        </button>
                      </div>
                    );
                  })()}

                  {/* Evolve Rarity */}
                  {(() => {
                    const currentRar = selectedItem.metadata?.rarity || selectedItem.rarity || 'comum';
                    if (currentRar === 'lendário') {
                      return <p className="text-[9px] text-yellow-400 italic">✨ Item atingiu a raridade máxima (Lendário)</p>;
                    }
                    return (
                      <div className="space-y-1.5">
                        <span className="text-[9px] text-yellow-500 font-bold uppercase block leading-none">Evoluir Raridade</span>
                        <button
                          onClick={handleEvolveItem}
                          className="w-full py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-extrabold rounded-lg text-[9px] uppercase tracking-wider transition-all"
                        >
                          SUBIR DE RARIDADE (10 ORBES)
                        </button>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <p className="text-[9px] text-amber-500 font-medium bg-amber-950/20 border border-amber-900/30 p-2.5 rounded-lg leading-normal">
                  ⚠️ Desequipe este item no menu do personagem para poder fundir, evoluir ou transferi-lo.
                </p>
              )}
            </div>
            
            <div className="bg-black/20 p-2.5 border border-indigo-950/40 rounded-lg text-[8px] text-gray-500 leading-normal italic">
              "Itens raros podem ser fundidos para aumentar seus atributos bônus. Utilize orbes de alma obtidos ao despedir guerreiros para evoluir a raridade."
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-8 text-gray-500">
            <span className="text-3xl mb-2">🎒</span>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Selecionar Item</p>
            <p className="text-[9px] text-gray-500 mt-1">Selecione um item da mochila para ver detalhes ou evoluir.</p>
          </div>
        )}
      </div>

    </div>
  );
};
