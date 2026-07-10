import React from 'react';

interface BattleResultsProps {
  isWinner: boolean;
  onFinishBattle: () => void;
  room: any;
  totalDamage: string;
  totalHealing: string;
  totalShields: string;
}

export const BattleResults: React.FC<BattleResultsProps> = ({
  isWinner,
  onFinishBattle,
  room,
  totalDamage,
  totalHealing,
  totalShields,
}) => {
  const resultTitle = isWinner ? "VITÓRIA" : "DERROTA";

  return (
    <div className="w-full bg-[#06060c] flex flex-col p-6 border border-[#b59441]/40 rounded-3xl overflow-hidden shadow-2xl min-h-[580px] results-container select-none font-sans relative">
      
      {/* Decorative background visual effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(27,61,109,0.06)_0%,_transparent_75%)] pointer-events-none" />

      {/* 1. TOP HEADER SECTION */}
      <header className="flex justify-between items-center border-b border-indigo-950/40 pb-4 mb-5 shrink-0 relative z-10">
        {/* Left Player Profile */}
        <div className="flex flex-col text-left max-w-[200px]">
          <div className="flex items-center gap-2">
            <span className="text-[#ffe082] text-[8px] bg-indigo-955 px-2 py-0.5 rounded border border-blue-900 uppercase font-black tracking-wider shadow">Vencedor</span>
            <span className="text-indigo-400 text-sm font-black uppercase blue-glow-text">Wall</span>
          </div>
          <span className="text-[7.5px] text-gray-500 font-bold uppercase mt-1">Poder da Equipe 52.843</span>
        </div>

        {/* Center Title & Info */}
        <div className="text-center flex flex-col items-center">
          <h1 className={`victory-title leading-none ${isWinner ? 'text-[#ffe082]' : 'text-rose-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]'}`}>
            {resultTitle}
          </h1>
          <p className="text-[8.5px] text-gray-400 font-bold uppercase tracking-wider mt-1.5 leading-none">
            {isWinner ? "Wall venceu o confronto dimensional contra Isaac" : "Sua formação foi derrotada no confronto"}
          </p>
          <div className="text-[7px] text-gray-500 font-bold uppercase tracking-widest mt-2 flex gap-3.5 leading-none bg-black/40 px-3 py-1 rounded-full border border-indigo-950/30">
            <span>Turno final: 8</span>
            <span>Duração: 03:42</span>
            <span>Arena das Fendas</span>
          </div>
        </div>

        {/* Right Rival Profile */}
        <div className="flex flex-col text-right max-w-[200px]">
          <div className="flex items-center gap-2 justify-end">
            <span className="text-rose-400 text-sm font-black uppercase red-glow-text">Isaac</span>
            <span className="text-rose-400 text-[8px] bg-rose-955 px-2 py-0.5 rounded border border-rose-900 uppercase font-black tracking-wider shadow">Derrotado</span>
          </div>
          <span className="text-[7.5px] text-gray-500 font-bold uppercase mt-1">Poder da Equipe 51.276</span>
        </div>
      </header>

      {/* 2. CORE LAYOUT COLUMNS (Sua Equipe vs Equipe Derrotada) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-5 flex-1 min-h-0 relative z-10">
        {/* Left Column: SUA EQUIPE */}
        <div className="bg-[#0b0b18]/65 border border-indigo-950/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-indigo-950/50 pb-2 mb-3">
            <h3 className="text-[9.5px] font-black text-[#ffe082] uppercase tracking-widest leading-none">Sua Equipe</h3>
            <span className="text-[7px] text-gray-500 uppercase font-bold tracking-widest">3 Combatentes</span>
          </div>

          <div className="grid grid-cols-3 gap-3.5">
            {/* Card 1: Caelum */}
            <div className="results-card-glow rounded-xl p-3 flex flex-col justify-between text-left min-h-[160px]">
              <div className="flex justify-between items-center text-[7px] text-gray-500 font-bold uppercase leading-none">
                <span className="text-blue-400 font-black">S</span>
                <span>Lv. 128</span>
                <span className="text-blue-400">🛡️ Tanque</span>
              </div>

              <div className="my-2.5 flex flex-col items-center">
                <img 
                  src="/assets/characters/caelum_face.png" 
                  alt="Caelum" 
                  className="w-12 h-12 object-contain rounded-lg border border-indigo-900/60 shadow-md"
                />
                <h5 className="font-extrabold text-[9px] text-white mt-1.5 leading-none">Caelum</h5>
              </div>

              <div className="space-y-1.5 pt-1.5 border-t border-indigo-950/30">
                <div className="flex justify-between text-[6.5px] text-gray-500 font-bold leading-none">
                  <span>HP</span>
                  <span className="text-emerald-400">8.645 / 8.645</span>
                </div>
                <span className="results-badge results-badge-survived block text-center py-0.5 leading-none">
                  🛡️ Sobreviveu
                </span>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[6px] text-blue-400 font-black uppercase leading-none">
                    <span>+683 EXP</span>
                    <span>MAX</span>
                  </div>
                  <div className="w-full h-1 bg-black/60 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Raven */}
            <div className="results-card-glow rounded-xl p-3 flex flex-col justify-between text-left min-h-[160px]">
              <div className="flex justify-between items-center text-[7px] text-gray-500 font-bold uppercase leading-none">
                <span className="text-purple-400 font-black">S</span>
                <span>Lv. 127</span>
                <span className="text-emerald-400">🗡️ Assassino</span>
              </div>

              <div className="my-2.5 flex flex-col items-center">
                <img 
                  src="/assets/characters/raven_face.png" 
                  alt="Raven" 
                  className="w-12 h-12 object-contain rounded-lg border border-indigo-900/60 shadow-md"
                />
                <h5 className="font-extrabold text-[9px] text-white mt-1.5 leading-none">Raven</h5>
              </div>

              <div className="space-y-1.5 pt-1.5 border-t border-indigo-950/30">
                <div className="flex justify-between text-[6.5px] text-gray-500 font-bold leading-none">
                  <span>HP</span>
                  <span className="text-amber-500">100 / 250</span>
                </div>
                <span className="results-badge results-badge-survived block text-center py-0.5 leading-none">
                  🛡️ Sobreviveu
                </span>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[6px] text-blue-400 font-black uppercase leading-none">
                    <span>+683 EXP</span>
                    <span>MAX</span>
                  </div>
                  <div className="w-full h-1 bg-black/60 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: '40%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Lyria (MVP Highlighted) */}
            <div className="results-card-glow results-mvp-card rounded-xl p-3 flex flex-col justify-between text-left min-h-[160px]">
              <div className="flex justify-between items-center text-[7px] text-gray-500 font-bold uppercase leading-none">
                <span className="text-yellow-400 font-black">S+</span>
                <span className="text-yellow-400">Lv. 124 ➔ 125</span>
                <span className="text-purple-400">🧙‍♀️ Mago</span>
              </div>

              <div className="my-2.5 flex flex-col items-center">
                <img 
                  src="/assets/characters/lyria_face.png" 
                  alt="Lyria" 
                  className="w-12 h-12 object-contain rounded-lg border border-yellow-500/40 shadow-[0_0_10px_rgba(253,224,71,0.25)]"
                />
                <h5 className="font-extrabold text-[9px] text-white mt-1.5 leading-none">Lyria</h5>
              </div>

              <div className="space-y-1.5 pt-1.5 border-t border-indigo-950/30">
                <div className="flex justify-between text-[6.5px] text-gray-500 font-bold leading-none">
                  <span>HP</span>
                  <span className="text-emerald-400">270 / 650</span>
                </div>
                <span className="results-badge results-badge-survived block text-center py-0.5 leading-none animate-pulse">
                  🛡️ Sobreviveu
                </span>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[6px] text-yellow-400 font-black uppercase leading-none">
                    <span>+684 EXP</span>
                    <span>🎉 UP!</span>
                  </div>
                  <div className="w-full h-1 bg-black/60 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: EQUIPE DERROTADA */}
        <div className="bg-[#0b0b18]/65 border border-indigo-950/80 rounded-2xl p-4 flex flex-col justify-between opacity-75">
          <div className="flex justify-between items-center border-b border-indigo-950/50 pb-2 mb-3">
            <h3 className="text-[9.5px] font-black text-rose-400 uppercase tracking-widest leading-none">Equipe Derrotada</h3>
            <span className="text-[7px] text-gray-500 uppercase font-bold tracking-widest">Inimigo</span>
          </div>

          <div className="grid grid-cols-3 gap-3.5">
            {/* Card 1: Korr */}
            <div className="results-card-glow rounded-xl p-3 flex flex-col justify-between text-left min-h-[160px] opacity-60">
              <div className="flex justify-between items-center text-[7px] text-gray-500 font-bold uppercase leading-none">
                <span className="text-gray-400 font-black">A</span>
                <span>Lv. 119</span>
                <span className="text-rose-400">🗡️ Lanceiro</span>
              </div>

              <div className="my-2.5 flex flex-col items-center">
                <img 
                  src="/assets/characters/korr_face.png" 
                  alt="Korr" 
                  className="w-12 h-12 object-contain rounded-lg border border-indigo-900/60 shadow-md grayscale"
                />
                <h5 className="font-extrabold text-[9px] text-gray-400 mt-1.5 leading-none">Korr</h5>
              </div>

              <div className="space-y-1.5 pt-1.5 border-t border-indigo-950/30">
                <div className="flex justify-between text-[6.5px] text-gray-500 font-bold leading-none">
                  <span>HP</span>
                  <span className="text-rose-500">0 / 250</span>
                </div>
                <span className="results-badge results-badge-defeated block text-center py-0.5 leading-none">
                  ☠️ Derrotado
                </span>
                <div className="h-4" />
              </div>
            </div>

            {/* Card 2: Thorn */}
            <div className="results-card-glow rounded-xl p-3 flex flex-col justify-between text-left min-h-[160px] opacity-60">
              <div className="flex justify-between items-center text-[7px] text-gray-500 font-bold uppercase leading-none">
                <span className="text-gray-400 font-black">A</span>
                <span>Lv. 121</span>
                <span className="text-rose-400">🔮 Feiticeiro</span>
              </div>

              <div className="my-2.5 flex flex-col items-center">
                <img 
                  src="/assets/characters/thorn_face.png" 
                  alt="Thorn" 
                  className="w-12 h-12 object-contain rounded-lg border border-indigo-900/60 shadow-md grayscale"
                />
                <h5 className="font-extrabold text-[9px] text-gray-400 mt-1.5 leading-none">Thorn</h5>
              </div>

              <div className="space-y-1.5 pt-1.5 border-t border-indigo-950/30">
                <div className="flex justify-between text-[6.5px] text-gray-500 font-bold leading-none">
                  <span>HP</span>
                  <span className="text-rose-500">0 / 240</span>
                </div>
                <span className="results-badge results-badge-defeated block text-center py-0.5 leading-none">
                  ☠️ Derrotado
                </span>
                <div className="h-4" />
              </div>
            </div>

            {/* Card 3: Nyxara */}
            <div className="results-card-glow rounded-xl p-3 flex flex-col justify-between text-left min-h-[160px] opacity-60">
              <div className="flex justify-between items-center text-[7px] text-gray-500 font-bold uppercase leading-none">
                <span className="text-gray-400 font-black">A</span>
                <span>Lv. 125</span>
                <span className="text-purple-400">🧙‍♀️ Invocadora</span>
              </div>

              <div className="my-2.5 flex flex-col items-center">
                <img 
                  src="/assets/characters/nyxara_face.png" 
                  alt="Nyxara" 
                  className="w-12 h-12 object-contain rounded-lg border border-indigo-900/60 shadow-md grayscale"
                />
                <h5 className="font-extrabold text-[9px] text-gray-400 mt-1.5 leading-none">Nyxara</h5>
              </div>

              <div className="space-y-1.5 pt-1.5 border-t border-indigo-950/30">
                <div className="flex justify-between text-[6.5px] text-gray-500 font-bold leading-none">
                  <span>HP</span>
                  <span className="text-rose-500">0 / 320</span>
                </div>
                <span className="results-badge results-badge-defeated block text-center py-0.5 leading-none">
                  ☠️ Derrotado
                </span>
                <div className="h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MIDDLE PANELS ROW (Recompensas, Loot/Drop, Quest, Destaques) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6 relative z-10">
        {/* Recompensas */}
        <div className="bg-[#121226]/40 border border-indigo-950/80 rounded-2xl p-4 text-left flex flex-col justify-between">
          <h4 className="text-[9px] uppercase font-black text-[#ffe082] tracking-widest border-b border-indigo-950/50 pb-1.5 mb-2.5 leading-none">Recompensas</h4>
          <div className="space-y-2 text-[9px] font-bold">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 flex items-center gap-1.5">🔷 XP Total</span>
              <span className="text-emerald-400">2.050</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 flex items-center gap-1.5">🔮 Orbes de Alma</span>
              <span className="text-purple-400">+18</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 flex items-center gap-1.5">⚜️ Pontos de Mérito</span>
              <span className="text-[#ffe082]">+12</span>
            </div>
          </div>
        </div>

        {/* Loot / Drop */}
        <div className="bg-[#121226]/40 border border-indigo-950/80 rounded-2xl p-4 text-left flex flex-col justify-between">
          <h4 className="text-[9px] uppercase font-black text-[#ffe082] tracking-widest border-b border-indigo-950/50 pb-1.5 mb-2.5 leading-none">Loot / Drop</h4>
          <div className="grid grid-cols-4 gap-2">
            <div className="loot-card rounded-xl p-1.5 flex flex-col items-center justify-between text-center min-h-[65px] border border-indigo-955">
              <span className="text-lg leading-none">💎</span>
              <span className="text-[6.5px] text-gray-500 font-extrabold uppercase leading-none block">Cristal x3</span>
            </div>
            <div className="loot-card rounded-xl p-1.5 flex flex-col items-center justify-between text-center min-h-[65px] border border-indigo-955">
              <span className="text-lg leading-none">🔮</span>
              <span className="text-[6.5px] text-gray-500 font-extrabold uppercase leading-none block">Essência x1</span>
            </div>
            <div className="loot-card rounded-xl p-1.5 flex flex-col items-center justify-between text-center min-h-[65px] border border-indigo-955">
              <span className="text-lg leading-none">🧪</span>
              <span className="text-[6.5px] text-gray-500 font-extrabold uppercase leading-none block">Poção x2</span>
            </div>
            <div className="loot-card loot-card-rare rounded-xl p-1.5 flex flex-col items-center justify-between text-center min-h-[65px]">
              <span className="loot-rare-tag">Raro</span>
              <span className="text-lg leading-none">🏅</span>
              <span className="text-[5.5px] text-yellow-400 font-extrabold uppercase leading-none block">Medalhão x1</span>
            </div>
          </div>
        </div>

        {/* Progresso de Missão */}
        <div className="bg-[#121226]/40 border border-indigo-950/80 rounded-2xl p-4 text-left flex flex-col justify-between">
          <h4 className="text-[9px] uppercase font-black text-[#ffe082] tracking-widest border-b border-indigo-950/50 pb-1.5 mb-2.5 leading-none">Progresso de Missão</h4>
          <div className="space-y-2">
            <h5 className="font-extrabold text-[9px] text-white truncate leading-none">Ecos de Outra Dimensão</h5>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-950 border border-indigo-950 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '60%' }} />
              </div>
              <span className="text-[7.5px] font-black text-blue-400 shrink-0">3 / 5</span>
            </div>
            <p className="text-[7px] text-gray-500 leading-snug">
              Derrote ameaças ligadas à rachadura dimensional.
            </p>
          </div>
        </div>

        {/* Destaques da Batalha */}
        <div className="bg-[#121226]/40 border border-indigo-950/80 rounded-2xl p-4 text-left flex flex-col justify-between">
          <h4 className="text-[9px] uppercase font-black text-[#ffe082] tracking-widest border-b border-indigo-950/50 pb-1.5 mb-2.5 leading-none">Destaques da Batalha</h4>
          <div className="space-y-1.5 text-[8px] font-bold">
            <div className="flex justify-between items-center border-b border-indigo-950/20 pb-0.5">
              <span className="text-gray-400">⚔️ Maior Dano</span>
              <span className="text-[#ffe082] flex items-center gap-1">
                <span>Raven</span>
                <span className="text-gray-500 font-semibold">5.980</span>
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-indigo-950/20 pb-0.5">
              <span className="text-gray-400">🌿 Maior Cura</span>
              <span className="text-purple-300 flex items-center gap-1">
                <span>Lyria</span>
                <span className="text-gray-500 font-semibold">4.220</span>
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-indigo-950/20 pb-0.5">
              <span className="text-gray-400">🛡️ Maior Resistência</span>
              <span className="text-blue-400 flex items-center gap-1">
                <span>Caelum</span>
                <span className="text-gray-500 font-semibold">1.820</span>
              </span>
            </div>
            <div className="flex justify-between items-center leading-none">
              <span className="text-gray-400">🎯 Golpe Final</span>
              <span className="text-emerald-400">Raven</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. FOOTER CONTROLS & ACTION BUTTONS */}
      <footer className="w-full bg-[#121226]/50 border border-indigo-950 rounded-2xl p-4 shrink-0 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
        {/* Summary stats */}
        <div className="flex gap-6 text-left shrink-0">
          <div>
            <span className="text-[7.5px] text-gray-500 font-bold block uppercase leading-none">Dano Causado</span>
            <span className="text-sm font-black text-rose-400 leading-none block mt-1">{totalDamage}</span>
          </div>
          <div className="border-l border-indigo-950/60 pl-6">
            <span className="text-[7.5px] text-gray-500 font-bold block uppercase leading-none">Cura Feita</span>
            <span className="text-sm font-black text-emerald-400 leading-none block mt-1">{totalHealing}</span>
          </div>
          <div className="border-l border-indigo-950/60 pl-6">
            <span className="text-[7.5px] text-gray-500 font-bold block uppercase leading-none">Escudos Absorvidos</span>
            <span className="text-sm font-black text-blue-400 leading-none block mt-1">{totalShields}</span>
          </div>
        </div>

        {/* Buttons action layout */}
        <div className="flex gap-3">
          <button
            onClick={onFinishBattle}
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider results-btn-main shadow-md flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            🧭 Voltar ao Mapa
          </button>
          
          <button
            onClick={() => alert(`Revanche solicitada para Isaac.`)}
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider results-btn-sub shadow-sm flex items-center gap-2 hover:bg-indigo-950/80 active:scale-95 transition-all"
          >
            ⚔️ Revanche PvP
          </button>

          <button
            onClick={() => alert("Detalhamento de logs táticos carregado.")}
            className="px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider results-btn-sub shadow-sm flex items-center gap-2"
          >
            📖 Ver Detalhes
          </button>
        </div>
      </footer>

      {/* Footer hotkeys */}
      <div className="w-full text-center text-[7.5px] text-gray-600 font-bold uppercase tracking-widest pt-2.5 mt-2.5 border-t border-indigo-950/30 shrink-0">
        Enter: Selecionar | Tab: Ver Resumo | Esc: Fechar
      </div>

    </div>
  );
};
