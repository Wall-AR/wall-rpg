import React from 'react';
import { MenuTabType } from './useMenuData';

interface MenuSidebarProps {
  activeTab: MenuTabType;
  setActiveTab: (tab: MenuTabType) => void;
}

const MENU_ITEMS: { key: MenuTabType; icon: string; label: string }[] = [
  { key: 'team', icon: '👥', label: 'Equipe' },
  { key: 'characters', icon: '👤', label: 'Personagens' },
  { key: 'inventory', icon: '🎒', label: 'Mochila' },
  { key: 'skills', icon: '✨', label: 'Habilidades' },
  { key: 'equipment', icon: '🛡️', label: 'Equipamentos' },
  { key: 'quests', icon: '📜', label: 'Missões' },
  { key: 'map', icon: '🗺️', label: 'Mapa Dimensional' },
  { key: 'memories', icon: '📖', label: 'Livro de Memórias' },
  { key: 'settings', icon: '⚙️', label: 'Configurações' },
];

export const MenuSidebar: React.FC<MenuSidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="w-56 bg-black/40 border-r border-indigo-950/60 p-4 flex flex-col gap-1.5 shrink-0 z-10">
      {/* Decorative Compass Rose at the top of Sidebar */}
      <div className="flex items-center justify-center py-4 mb-2">
        <div className="w-14 h-14 rounded-full border-2 border-[#b59441] flex items-center justify-center bg-indigo-950/20 shadow-inner relative animate-[spin_120s_linear_infinite]">
          <span className="text-[#f5d67b] text-2xl">🧭</span>
        </div>
      </div>

      {MENU_ITEMS.map((item) => {
        const isActive = activeTab === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={`menu-nav-btn w-full px-4 py-3 rounded-lg text-left text-xs font-bold flex items-center gap-3 tracking-wider ${
              isActive
                ? 'active text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-indigo-950/10'
            }`}
          >
            <span className="text-sm filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
};
