import React, { useEffect } from 'react';
import { useMenuData, MenuTabType } from './useMenuData';
import { MenuHeader } from './MenuHeader';
import { MenuSidebar } from './MenuSidebar';
import { MenuFooter } from './MenuFooter';
import { MenuHotkeys } from './MenuHotkeys';
import {
  TeamTab, CharactersTab, InventoryTab, SkillsTab,
  EquipmentTab, QuestsTab, MapTab, MemoryBookTab, SettingsTab
} from './tabs';
import './styles/menu.css';

interface GameMenuProps {
  onClose: () => void;
}

const TAB_ORDER: MenuTabType[] = [
  'team', 'characters', 'inventory', 'skills', 'equipment', 'quests', 'map', 'memories', 'settings'
];

export const GameMenu: React.FC<GameMenuProps> = ({ onClose }) => {
  const menu = useMenuData(onClose);

  // ─── Keyboard Navigation (Q/E to switch tabs, Escape to close) ─────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Q: Tab left
      if (e.key === 'q' || e.key === 'Q') {
        menu.setActiveTab(prev => {
          const idx = TAB_ORDER.indexOf(prev);
          const nextIdx = idx === 0 ? TAB_ORDER.length - 1 : idx - 1;
          return TAB_ORDER[nextIdx];
        });
      }

      // E: Tab right
      if (e.key === 'e' || e.key === 'E') {
        menu.setActiveTab(prev => {
          const idx = TAB_ORDER.indexOf(prev);
          const nextIdx = idx === TAB_ORDER.length - 1 ? 0 : idx + 1;
          return TAB_ORDER[nextIdx];
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, menu]);

  const renderTabContent = () => {
    if (menu.loading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <svg className="animate-spin h-10 w-10 text-[#ffe082]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest animate-pulse">
            Carregando Dimensões...
          </span>
        </div>
      );
    }

    switch (menu.activeTab) {
      case 'team':
        return (
          <TeamTab
            activeTeam={menu.activeTeam} reserveTeam={menu.reserveTeam}
            selectedMemberId={menu.selectedMemberId} setSelectedMemberId={menu.setSelectedMemberId}
            onSwapMember={menu.handleSwapMember}
            availablePoints={menu.availablePoints} setAvailablePoints={menu.setAvailablePoints}
            bonusStrength={menu.bonusStrength} setBonusStrength={menu.setBonusStrength}
            bonusDefense={menu.bonusDefense} setBonusDefense={menu.setBonusDefense}
            bonusSpeed={menu.bonusSpeed} setBonusSpeed={menu.setBonusSpeed}
            statsSaving={menu.statsSaving} onConfirmStats={menu.handleConfirmStats}
          />
        );
      case 'characters':
        return <CharactersTab />;
      case 'inventory':
        return (
          <InventoryTab
            inventoryList={menu.inventoryList} selectedItemId={menu.selectedItemId}
            setSelectedItemId={menu.setSelectedItemId} gold={menu.gold} soulOrbs={menu.soulOrbs}
            handleFuseItem={menu.handleFuseItem} handleEvolveItem={menu.handleEvolveItem}
          />
        );
      case 'skills':
        return <SkillsTab />;
      case 'equipment':
        return <EquipmentTab />;
      case 'quests':
        return <QuestsTab />;
      case 'map':
        return <MapTab />;
      case 'memories':
        return <MemoryBookTab />;
      case 'settings':
        return <SettingsTab />;
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/85 z-[45] p-6 game-menu-container select-none">
      <div className="menu-gold-frame w-full h-full max-w-5xl rounded-3xl flex flex-col justify-between overflow-hidden shadow-2xl relative">
        {/* Corner Decors */}
        <div className="menu-corner corner-tl rounded-tl-2xl" />
        <div className="menu-corner corner-tr rounded-tr-2xl" />
        <div className="menu-corner corner-bl rounded-bl-2xl" />
        <div className="menu-corner corner-br rounded-br-2xl" />

        {/* 1. Header (Title & Zone) */}
        <MenuHeader locationName={menu.locationName} />

        {/* 2. Middle Row (Sidebar + Content Panel) */}
        <div className="flex-1 flex min-h-0 relative">
          <MenuSidebar activeTab={menu.activeTab} setActiveTab={menu.setActiveTab} />
          
          <main className="flex-1 p-6 flex flex-col min-h-0 bg-gradient-to-br from-[#0c0c16]/30 to-[#06060c]/60 overflow-y-auto">
            {renderTabContent()}
          </main>
        </div>

        {/* 3. Footer Panels */}
        <MenuFooter
          gold={menu.gold} soulOrbs={menu.soulOrbs}
          dimCrystals={menu.dimCrystals} meritPoints={menu.meritPoints}
          playTime={menu.playTime} gameDate={menu.gameDate}
          locationName={menu.locationName} onOpenMemories={() => menu.setActiveTab('memories')}
        />

        {/* 4. Bottom Hotkeys Bar */}
        <MenuHotkeys />
      </div>
    </div>
  );
};

export default GameMenu;
