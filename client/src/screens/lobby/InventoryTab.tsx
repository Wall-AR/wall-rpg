import React from 'react';
import { LobbyData } from './useLobbyData';

type InventoryTabProps = Pick<LobbyData,
  'inventoryList' | 'selectedItem' | 'setSelectedItem' |
  'transferTarget' | 'setTransferTarget' | 'isTransferring' | 'handleTransferItem' |
  'fuseTargetId' | 'setFuseTargetId' | 'isFusing' | 'handleFuseItems' |
  'isEvolvingRarity' | 'handleEvolveRarityAction'
>;

export const InventoryTab: React.FC<InventoryTabProps> = ({
  inventoryList, selectedItem, setSelectedItem,
  transferTarget, setTransferTarget, isTransferring, handleTransferItem,
  fuseTargetId, setFuseTargetId, isFusing, handleFuseItems,
  isEvolvingRarity, handleEvolveRarityAction,
}) => (
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
              {item.type === 'weapon' && item.level > 1 && (
                <span className="absolute bottom-1 left-1 text-[7px] px-1 bg-amber-900/80 border border-amber-700 text-amber-300 font-bold rounded">
                  Lv.{item.level}
                </span>
              )}
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
              {selectedItem.type === 'weapon' ? (
                <>
                  <p>Nível da Arma: <span className="text-amber-400 font-semibold">Lv. {selectedItem.level || 1} ∞</span></p>
                  <div className="w-full bg-slate-800 rounded-full h-2 mt-1 mb-1">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(((selectedItem.xp || 0) / ((selectedItem.level || 1) * 100)) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-gray-500">XP: {selectedItem.xp || 0} / {(selectedItem.level || 1) * 100}</p>
                </>
              ) : (
                <p>Nível: <span className="text-white font-semibold">Lv. {selectedItem.metadata?.level || 1} / 10</span></p>
              )}
              <p>Bônus de Ataque: <span className="text-emerald-400 font-semibold">+{selectedItem.metadata?.atkBonus || 0} ATK</span></p>
              <p>Equipado: <span className="text-white font-semibold">{selectedItem.equippedCharacterId ? "Sim" : "Não"}</span></p>
              {selectedItem.metadata?.element && (
                <p>Encanto: <span className="text-indigo-400 font-semibold capitalize">{selectedItem.metadata.element}</span></p>
              )}
            </div>

            {!selectedItem.equippedCharacterId ? (
              <div className="space-y-4 border-t border-indigo-950 pt-3">
                {/* Transfer */}
                <form onSubmit={handleTransferItem} className="space-y-1.5">
                  <span className="text-[9px] text-indigo-350 font-bold uppercase block">Transferir para Amigo (Gift)</span>
                  <div className="flex gap-1.5">
                    <input type="text" required placeholder="Username" value={transferTarget}
                      onChange={(e) => setTransferTarget(e.target.value)}
                      className="flex-1 bg-slate-950 border border-indigo-950 text-[10px] rounded-lg px-2.5 py-1.5 text-indigo-200 outline-none focus:border-indigo-600 transition-all"
                    />
                    <button type="submit" disabled={isTransferring}
                      className="px-2.5 bg-indigo-900/40 hover:bg-indigo-800 border border-indigo-700 text-indigo-300 text-[10px] font-bold rounded-lg transition-colors shrink-0"
                    >Enviar</button>
                  </div>
                </form>

                {/* Fusion */}
                {(() => {
                  const identicalItems = inventoryList.filter(
                    (i: any) => i.itemId === selectedItem.itemId && i.id !== selectedItem.id && !i.equippedCharacterId
                  );
                  // Armas evoluem infinitamente via batalha, não por fusão
                  if (selectedItem.type === 'weapon') {
                    return <p className="text-[9px] text-amber-400 italic">⚔️ Armas evoluem infinitamente ao ganhar batalhas.</p>;
                  }
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
                          <select required value={fuseTargetId} onChange={(e) => setFuseTargetId(e.target.value)}
                            className="flex-1 bg-slate-950 border border-indigo-950 text-[10px] rounded-lg px-2 py-1.5 text-indigo-250 outline-none focus:border-indigo-600"
                          >
                            <option value="">Selecione o item base...</option>
                            {identicalItems.map((item: any) => (
                              <option key={item.id} value={item.id}>{item.name} (Lv. {item.metadata?.level || 1})</option>
                            ))}
                          </select>
                          <button type="submit" disabled={isFusing || !fuseTargetId}
                            className="px-2.5 bg-indigo-900/40 hover:bg-indigo-800 border border-indigo-700 text-indigo-300 text-[10px] font-bold rounded-lg transition-colors shrink-0"
                          >Mesclar</button>
                        </div>
                      )}
                    </form>
                  );
                })()}

                {/* Evolve Rarity */}
                {(() => {
                  const currentRar = selectedItem.metadata?.rarity || 'comum';
                  if (currentRar === 'lendário') {
                    return <p className="text-[9px] text-yellow-400 italic">✨ Item atingiu a raridade máxima (Lendário)</p>;
                  }
                  return (
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-yellow-500 font-bold uppercase block">Evoluir Raridade</span>
                      <button onClick={handleEvolveRarityAction} disabled={isEvolvingRarity}
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
