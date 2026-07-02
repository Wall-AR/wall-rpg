import React from 'react';

interface MenuHeaderProps {
  locationName: string;
}

export const MenuHeader: React.FC<MenuHeaderProps> = ({ locationName }) => {
  return (
    <header className="relative w-full text-center py-5 shrink-0 z-10 border-b border-indigo-950/30">
      {/* Decorative Golden Crest Top Line */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-[#b59441] to-transparent" />
      
      <div className="flex flex-col items-center justify-center">
        {/* Crest logo icon */}
        <div className="text-xl text-[#f5d67b] mb-1 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          ✦ ⚔️ ✦
        </div>
        
        <h1 className="menu-header-title text-3xl font-extrabold tracking-widest uppercase">
          Jogo de Dimensões
        </h1>
        
        <span className="text-[10px] uppercase font-bold text-indigo-400/80 tracking-[0.25em] mt-1">
          {locationName}
        </span>
      </div>
    </header>
  );
};
