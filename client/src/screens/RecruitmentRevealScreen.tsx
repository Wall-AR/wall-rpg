import React, { useState } from 'react';

export type RecruitmentSource = 
  | 'post_battle_offer' 
  | 'dimensional_chest' 
  | 'fragment_summon' 
  | 'mercenary_contract' 
  | 'quest_reward' 
  | 'campaign_reward' 
  | 'gm_event';

export interface NewCompanionData {
  id: string;
  name: string;
  rarity: 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S+';
  element: string;
  role: string;
  level: number;
  passive: string;
  skill: string;
  stats: {
    hp: number;
    mp: number;
    strength: number;
    defense: number;
    speed: number;
  };
}

interface RecruitmentRevealScreenProps {
  sourceType: RecruitmentSource;
  character: NewCompanionData;
  teamMembers: any[]; // Current team (max 6)
  onAccept: () => void;
  onConvert: () => void;
  onReplace: (substituteCharacterId: string) => void;
  onDecline: () => void;
}

export const RecruitmentRevealScreen: React.FC<RecruitmentRevealScreenProps> = ({
  sourceType,
  character,
  teamMembers,
  onAccept,
  onConvert,
  onReplace,
  onDecline
}) => {
  const [step, setStep] = useState<'reveal' | 'details'>('reveal');
  const [substituteMode, setSubstituteMode] = useState(false);
  const [selectedReplaceId, setSelectedReplaceId] = useState<string>('char-lobo'); // Default selected companion for substitution matches mockup
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Source context configuration
  const getSourceConfig = (type: RecruitmentSource) => {
    switch (type) {
      case 'post_battle_offer':
        return {
          title: 'ESCOLHA DE COMPANHEIRO',
          subtitle: 'Sua equipe está cheia. Escolha quem será desencantado para aceitar Thorn.',
          originLabel: 'Pós-combate',
          localLabel: 'Arena das Feridas',
          introText: 'Um inimigo derrotado reconheceu sua força e deseja se juntar à sua jornada.',
          characterSpeak: '“Derrotado, mas não quebrado. Reconheço sua força e a liderança que carrega. Se aceitar meu aço, jurarei lutar ao seu lado. ❞',
          portalGlow: 'from-purple-600/35 to-indigo-950/20',
          portalBorder: 'border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
        };
      case 'dimensional_chest':
        return {
          title: 'ESCOLHA DE COMPANHEIRO',
          subtitle: 'Sua equipe está cheia. Escolha quem será desencantado para aceitar Thorn.',
          originLabel: 'Baú Dimensional',
          localLabel: 'Fenda Dimensional',
          introText: 'A fenda responde ao seu chamado e um novo eco atravessou o véu.',
          characterSpeak: '“A fenda revelou um novo destino. Vim ao seu chamado.”',
          portalGlow: 'from-blue-600/35 to-indigo-950/20',
          portalBorder: 'border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
        };
      case 'fragment_summon':
        return {
          title: 'ESCOLHA DE COMPANHEIRO',
          subtitle: 'Sua equipe está cheia. Escolha quem será desencantado para aceitar Thorn.',
          originLabel: 'Fragmentos',
          localLabel: 'Altar Astral',
          introText: 'Os fragmentos se unem em uma forma viva. Um eco antigo foi restaurado.',
          characterSpeak: '“Um eco perdido tomou forma mais uma vez.”',
          portalGlow: 'from-emerald-600/35 to-indigo-950/20',
          portalBorder: 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
        };
      case 'mercenary_contract':
        return {
          title: 'ESCOLHA DE COMPANHEIRO',
          subtitle: 'Sua equipe está cheia. Escolha quem será desencantado para aceitar Thorn.',
          originLabel: 'Mercenário',
          localLabel: 'Taverna do Porto',
          introText: 'Um mercenário aceitou lutar em sua equipe sob contrato permanente.',
          characterSpeak: '“Meu preço foi pago. Minha lâmina é sua.”',
          portalGlow: 'from-amber-600/35 to-indigo-950/20',
          portalBorder: 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
        };
      default:
        return {
          title: 'ESCOLHA DE COMPANHEIRO',
          subtitle: 'Sua equipe está cheia. Escolha quem será desencantado para aceitar Thorn.',
          originLabel: 'Campanha',
          localLabel: 'Bosque de Veylar',
          introText: 'Após os eventos cruciais da jornada, este companheiro decidiu segui-lo.',
          characterSpeak: '“Nossa jornada agora segue o mesmo caminho.”',
          portalGlow: 'from-indigo-600/35 to-indigo-950/20',
          portalBorder: 'border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
        };
    }
  };

  const config = getSourceConfig(sourceType);
  const isTeamFull = teamMembers.length >= 6;

  // Companion meta records mapping JRPG statistics & values
  const getCompanionMeta = (id: string) => {
    const cleanId = id.replace('char-', '').toLowerCase();
    switch (cleanId) {
      case 'caelum':
        return {
          bond: 10,
          bondLabel: 'Vínculo 10',
          sinceText: 'Desde o início da jornada',
          battles: 418,
          campaigns: 12,
          watermark: '🛡️',
          historyText: 'Desde o início da jornada / 418 batalhas',
          phrase: 'Primeiro defensor da jornada',
          mag: 210,
          atq: 1254,
          def: 1486,
          vel: 1307,
          passive: 'Barreira Sagrada',
          skill: 'Proteção Divina'
        };
      case 'lyria':
        return {
          bond: 9,
          bondLabel: 'Vínculo 9',
          sinceText: 'Desde o Capítulo 2',
          battles: 350,
          campaigns: 10,
          watermark: '🧙‍♀️',
          historyText: 'Desde o Capítulo 2 / 350 batalhas',
          phrase: 'Sua aliada rúnica mais fiel',
          mag: 420,
          atq: 1482,
          def: 950,
          vel: 1102,
          passive: 'Nova Astral',
          skill: 'Chama Curativa'
        };
      case 'raven':
        return {
          bond: 10,
          bondLabel: 'Vínculo 10',
          sinceText: 'Desde o Capítulo 3',
          battles: 280,
          campaigns: 8,
          watermark: '🗡️',
          historyText: 'Desde o Capítulo 3 / 280 batalhas',
          phrase: 'Sombra silenciosa do coliseu',
          mag: 200,
          atq: 1980,
          def: 820,
          vel: 1642,
          passive: 'Golpe Sombrio',
          skill: 'Passo das Sombras'
        };
      case 'seraphina':
        return {
          bond: 8,
          bondLabel: 'Vínculo 8',
          sinceText: 'Desde o Capítulo 4',
          battles: 150,
          campaigns: 4,
          watermark: '🌿',
          historyText: 'Desde o Capítulo 4 / 150 batalhas',
          phrase: 'Clériga do Templo de Veylar',
          mag: 180,
          atq: 910,
          def: 1120,
          vel: 980,
          passive: 'Impacto Sísmico',
          skill: 'Prece da Terra'
        };
      case 'lobo':
      case 'lobo cinzento':
        return {
          bond: 10,
          bondLabel: 'VÍNCULO LENDÁRIO',
          sinceText: 'Desde o início da jornada',
          battles: 418,
          campaigns: 12,
          watermark: '🐺',
          historyText: 'Desde o início da jornada / 418 batalhas',
          phrase: 'Primeiro companheiro da jornada',
          mag: 1102,
          atq: 1254,
          def: 1486,
          vel: 1307,
          passive: 'Instinto de Lealdade',
          skill: 'Proteção Instintiva'
        };
      case 'korr':
        return {
          bond: 9,
          bondLabel: 'Vínculo 9',
          sinceText: 'Desde o Capítulo 5',
          battles: 90,
          campaigns: 2,
          watermark: '🦁',
          historyText: 'Desde o Capítulo 5 / 90 batalhas',
          phrase: 'Fera guerreira do coliseu',
          mag: 180,
          atq: 1720,
          def: 1220,
          vel: 1120,
          passive: 'Investida Ígnea',
          skill: 'Sopro de Fogo'
        };
      default:
        return {
          bond: 5,
          bondLabel: 'Vínculo Novo',
          sinceText: 'Recém-chegado',
          battles: 0,
          campaigns: 0,
          watermark: '👤',
          historyText: 'Novo recrutamento / 0 batalhas',
          phrase: 'Um eco recém-sincronizado',
          mag: 50,
          atq: 100,
          def: 100,
          vel: 100,
          passive: 'Nenhuma',
          skill: 'Nenhuma'
        };
    }
  };

  // Rank / Rarity color maps
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
    if (r === 'tanque') return '🛡️';
    if (r === 'assassino') return '🗡️';
    if (r === 'mago') return '🧙‍♀️';
    if (r === 'lanceiro') return '⚔️';
    if (r === 'clériga' || r === 'clérigo' || r === 'suporte') return '🌿';
    return '👤';
  };

  // Safe portrait mappings
  const getCharacterFace = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('caelum')) return '/assets/characters/caelum_face.png';
    if (n.includes('lyria')) return '/assets/characters/lyria_face.png';
    if (n.includes('raven')) return '/assets/characters/raven_face.png';
    if (n.includes('seraphina')) return '/assets/characters/seraphina_face.png';
    if (n.includes('korr')) return '/assets/characters/korr_face.png';
    if (n.includes('thorn')) return '/assets/characters/thorn_face.png';
    if (n.includes('nyxara')) return '/assets/characters/nyxara_face.png';
    return null;
  };

  const getCharacterBust = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('caelum')) return '/assets/characters/caelum_bust.png';
    if (n.includes('lyria')) return '/assets/characters/lyria_bust.png';
    if (n.includes('raven')) return '/assets/characters/raven_bust.png';
    if (n.includes('seraphina')) return '/assets/characters/seraphina_bust.png';
    if (n.includes('korr')) return '/assets/characters/korr_bust.png';
    if (n.includes('thorn')) return '/assets/characters/thorn_bust.png';
    if (n.includes('nyxara')) return '/assets/characters/nyxara_bust.png';
    return null;
  };

  const handleConfirmReplace = () => {
    if (!selectedReplaceId) {
      alert("Selecione um companheiro para substituir!");
      return;
    }
    setShowConfirmModal(true);
  };

  const compareTarget = teamMembers.find(m => m.id === selectedReplaceId);
  const compareMeta = compareTarget ? getCompanionMeta(compareTarget.name) : null;
  const thornMeta = getCompanionMeta('thorn');

  return (
    <div className="recruit-fullscreen-wrapper w-full h-full min-h-[580px] bg-[#06060c] border border-[#b59441]/40 rounded-3xl overflow-hidden p-6 flex flex-col justify-between select-none relative font-sans">
      
      {/* Background radial-gradient effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(27,61,109,0.04)_0%,_transparent_75%)] pointer-events-none" />

      {/* 1. TOP HEADER SECTION */}
      <header className="flex justify-between items-center border-b border-indigo-950/40 pb-4 mb-4 shrink-0 relative z-10">
        {/* Left Profile Details */}
        <div className="flex flex-col text-left max-w-[200px]">
          <div className="flex items-center gap-2">
            <span className="text-[#ffe082] text-[8px] bg-indigo-955 px-2 py-0.5 rounded border border-blue-900 uppercase font-black tracking-wider shadow">Vencedor</span>
            <span className="text-indigo-400 text-sm font-black uppercase blue-glow-text">Wall</span>
          </div>
          <span className="text-[7.5px] text-gray-500 font-bold uppercase mt-1">Poder da Equipe 52.843</span>
        </div>

        {/* Center Main Title */}
        <div className="text-center">
          <h1 className="text-[#ffe082] text-xl font-black uppercase tracking-widest leading-none filter drop-shadow-[0_2px_8px_rgba(255,224,130,0.35)]">
            {substituteMode ? "ESCOLHA DE COMPANHEIRO" : config.title}
          </h1>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1.5 leading-none">
            {substituteMode ? "Sua equipe está cheia. Escolha quem será desencantado para aceitar Thorn." : config.subtitle}
          </p>
        </div>

        {/* Right Location Details */}
        <div className="flex items-center gap-3 text-right">
          <div className="flex flex-col">
            <span className="text-gray-400 text-[9px] font-bold leading-none">Local: <strong className="text-gray-200">{config.localLabel}</strong></span>
            <span className="text-[8px] text-gray-500 uppercase font-bold mt-1.5 block tracking-wide font-sans">Origem: {config.originLabel}</span>
          </div>
          {/* Animated portal element */}
          <div className="relative w-8 h-8 rounded-full border border-indigo-900/60 overflow-hidden flex items-center justify-center bg-black/60 shadow-[0_0_8px_rgba(99,102,241,0.25)]">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-800 to-indigo-950 animate-spin duration-3000" />
            <span className="text-xs relative z-10">🌀</span>
          </div>
        </div>
      </header>

      {/* 2. STATE A: REVEAL INITIAL AURA */}
      {step === 'reveal' && (
        <div className="flex-grow flex flex-col justify-center items-center py-6 text-center relative z-10">
          <div className="w-56 h-56 flex items-center justify-center relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-800/25 to-indigo-900/5 rounded-full animate-pulse border border-purple-500/20" />
            <div className="absolute inset-2 bg-gradient-to-bl from-indigo-800/10 to-transparent rounded-full animate-ping duration-2000" />
            <span className="text-7xl relative z-10 filter drop-shadow-[0_0_20px_rgba(168,85,247,0.4)] animate-bounce duration-1500">🔮</span>
          </div>
          <div className="max-w-md space-y-5">
            <p className="text-xs text-gray-300 font-medium leading-relaxed bg-[#0b0b18]/60 p-4 rounded-2xl border border-indigo-950/60">
              {config.introText}
            </p>
            <button
              onClick={() => {
                setStep('details');
                // If team is full, automatically go to substituteMode to fit mockup Flow
                if (isTeamFull) setSubstituteMode(true);
              }}
              className="px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-[#b59441] hover:bg-[#cbb062] active:scale-95 text-black shadow-lg transition-all border border-[#b59441] shadow-[0_0_15px_rgba(181,148,65,0.25)]"
            >
              Revelar Companheiro
            </button>
          </div>
        </div>
      )}

      {/* STATE B & C: CORE PANEL COLUMNS */}
      {step === 'details' && (
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch mb-4 min-h-0 relative z-10">
          
          {/* COLUMN 1: EQUIPE ATUAL (6/6) */}
          <div className="bg-[#0b0b18]/65 border border-indigo-950/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="border-b border-indigo-950/50 pb-2 mb-3 flex justify-between items-center">
              <h3 className="text-[9.5px] font-black text-[#ffe082] uppercase tracking-widest leading-none">
                Equipe Atual
              </h3>
              <span className="text-[8px] bg-indigo-950 text-indigo-300 font-extrabold px-1.5 py-0.5 rounded border border-indigo-900 leading-none">
                {teamMembers.length}/6
              </span>
            </div>

            {/* List Selection Grid */}
            <div className="flex-1 grid grid-cols-2 gap-3.5 overflow-y-auto pr-1">
              {teamMembers.map((m: any) => {
                const isSelected = selectedReplaceId === m.id;
                const meta = getCompanionMeta(m.name);
                const face = getCharacterFace(m.name);
                
                return (
                  <div
                    key={m.id}
                    onClick={() => { setSubstituteMode(true); setSelectedReplaceId(m.id); }}
                    className={`rounded-xl p-2.5 flex flex-col justify-between text-left relative transition-all min-h-[95px] cursor-pointer ${
                      isSelected
                        ? 'border border-[#b59441] bg-[#1c1810]/50 shadow-[0_0_12px_rgba(181,148,65,0.25)]'
                        : 'border border-indigo-950/40 bg-black/30 hover:bg-indigo-955/15'
                    }`}
                  >
                    <div className="flex justify-between items-center leading-none">
                      <span className={`text-[9px] font-black uppercase ${m.rarity === 'S+' ? 'text-orange-400' : m.rarity === 'S' ? 'text-rose-400' : m.rarity === 'A' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                        {m.rarity}
                      </span>
                      <span className="text-[7.5px] text-gray-500 font-bold">Lv. {m.level}</span>
                    </div>

                    <div className="flex justify-between items-end mt-1">
                      <div>
                        <h5 className="font-extrabold text-[8.5px] text-white truncate max-w-[55px] leading-none">{m.name}</h5>
                        <span className="text-[6.5px] text-[#ffe082]/65 font-bold uppercase mt-1 block leading-none">
                          {meta.bondLabel === 'VÍNCULO LENDÁRIO' ? '👑 ' : '❤ '}{m.class || m.role}
                        </span>
                      </div>

                      <div className="w-8 h-8 rounded overflow-hidden border border-indigo-950 bg-slate-900 shrink-0 flex items-center justify-center">
                        {face ? (
                          <img src={face} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-base">{m.name.includes('Lobo') ? '🐺' : '👤'}</span>
                        )}
                      </div>
                    </div>

                    {/* Vínculo description inside selected card */}
                    {isSelected && (
                      <div className="absolute inset-x-0 bottom-0 bg-black/90 text-[5.5px] font-black text-center py-0.5 rounded-b-xl text-yellow-400 uppercase tracking-widest leading-none">
                        {meta.bondLabel}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <p className="text-[7px] text-gray-500 italic mt-3 leading-none text-center">
              Apenas 6 companheiros podem permanecer ativos.
            </p>
          </div>

          {/* COLUMN 2 & 3: CENTER DYNAMIC COMPARISON VIEW */}
          <div className="lg:col-span-2 bg-[#0b0b18]/45 border border-indigo-950/50 rounded-2xl p-5 flex flex-col justify-between overflow-hidden relative">
            {/* Background glowing portal elements */}
            <div className={`absolute w-72 h-72 rounded-full bg-gradient-to-tr ${config.portalGlow} filter blur-xl opacity-50 pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`} />

            {compareTarget && compareMeta ? (
              <div className="flex flex-col h-full justify-between relative z-10">
                {/* VS Header Portraits */}
                <div className="grid grid-cols-5 items-center border-b border-indigo-950/30 pb-3 mb-3">
                  <div className="col-span-2 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-lg border border-indigo-950 overflow-hidden bg-slate-900 flex items-center justify-center relative shadow-md">
                      {getCharacterFace(compareTarget.name) ? (
                        <img src={getCharacterFace(compareTarget.name)!} alt={compareTarget.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{compareMeta.watermark}</span>
                      )}
                      <span className="absolute bottom-0 right-0 bg-slate-950/80 px-1 py-0.5 rounded text-[6.5px] font-black text-gray-300 leading-none">{compareTarget.rarity}</span>
                    </div>
                    <span className="text-[8px] font-bold text-gray-400 mt-1 leading-none">{compareTarget.name}</span>
                  </div>

                  <div className="col-span-1 text-center text-rose-500 font-black text-sm italic font-mono leading-none">VS</div>

                  <div className="col-span-2 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-lg border border-[#b59441]/40 overflow-hidden bg-slate-900 flex items-center justify-center relative shadow-md">
                      {getCharacterFace(character.name) ? (
                        <img src={getCharacterFace(character.name)!} alt={character.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">⚔️</span>
                      )}
                      <span className="absolute bottom-0 right-0 bg-slate-950/80 px-1 py-0.5 rounded text-[6.5px] font-black text-yellow-400 leading-none">{character.rarity}</span>
                    </div>
                    <span className="text-[8px] font-bold text-gray-400 mt-1 leading-none">{character.name}</span>
                  </div>
                </div>

                {/* Compare Stats Table */}
                <div className="flex-1 overflow-y-auto space-y-2 text-[9.5px] pr-1">
                  {[
                    { label: 'Raridade', left: compareTarget.rarity, right: character.rarity, imp: character.rarity === 'B' && compareTarget.rarity === 'D' },
                    { label: 'Nível', left: compareTarget.level, right: character.level, imp: compareTarget.level < character.level, dec: compareTarget.level > character.level },
                    { label: 'Função', left: compareTarget.class || compareTarget.role, right: character.role },
                    { label: 'Elemento', left: `${getElementIcon(compareTarget.element)} ${compareTarget.element}`, right: `${getElementIcon(character.element)} ${character.element}` },
                    { label: 'ATQ', left: compareMeta.atq.toLocaleString(), right: thornMeta.atq.toLocaleString(), imp: thornMeta.atq > compareMeta.atq },
                    { label: 'DEF', left: compareMeta.def.toLocaleString(), right: thornMeta.def.toLocaleString(), imp: thornMeta.def > compareMeta.def },
                    { label: 'MAG', left: compareMeta.mag.toLocaleString(), right: thornMeta.mag.toLocaleString(), imp: thornMeta.mag > compareMeta.mag },
                    { label: 'VEL', left: compareMeta.vel.toLocaleString(), right: thornMeta.vel.toLocaleString(), imp: thornMeta.vel > compareMeta.vel },
                    { label: 'Passiva', left: compareMeta.passive, right: character.passive },
                    { label: 'Habilidade', left: compareMeta.skill, right: character.skill, imp: true },
                    { label: 'Histórico', left: compareMeta.historyText, right: `Novo recrutamento / 0 batalhas` }
                  ].map((row, idx) => (
                    <div key={idx} className="grid grid-cols-5 items-center py-1.5 border-b border-indigo-950/20 leading-none">
                      <div className={`col-span-2 text-right font-bold ${row.dec ? 'text-emerald-400 flex items-center justify-end gap-1.5' : 'text-gray-300'}`}>
                        <span>{row.left}</span>
                        {row.dec && <span className="text-[7.5px] text-emerald-400 font-black">▲</span>}
                      </div>
                      <div className="col-span-1 text-center text-gray-500 text-[6.5px] font-black uppercase tracking-wider">{row.label}</div>
                      <div className={`col-span-2 text-left font-bold ${row.imp ? 'text-emerald-400 flex items-center gap-1.5' : 'text-gray-300'}`}>
                        <span>{row.right}</span>
                        {row.imp && <span className="text-[7.5px] text-emerald-400 font-black">▲</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sub-modes bond tag text */}
                <div className="grid grid-cols-2 gap-4 mt-3 border-t border-indigo-950/30 pt-3">
                  <div className="text-right text-[8.5px] font-black text-yellow-500 flex justify-end items-center gap-1.5">
                    <span>💛 {compareMeta.bondLabel}</span>
                  </div>
                  <div className="text-left text-[8.5px] font-black text-indigo-400 flex items-center gap-1.5">
                    <span>✨ Potencial Maior</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col justify-center items-center text-gray-500 text-xs italic text-center p-6 border border-dashed border-indigo-950 rounded-2xl">
                <span>Selecione um companheiro da equipe na lista lateral para comparar</span>
              </div>
            )}
          </div>

          {/* COLUMN 4: NEW COMPANHEIRO PREVIEW (THORN) */}
          <div className="bg-[#121226]/50 border border-indigo-950/60 rounded-2xl p-5 flex flex-col justify-between shrink-0">
            <div>
              {/* Sheet header */}
              <div className="flex justify-between items-start border-b border-indigo-950/40 pb-3.5 mb-4">
                <div>
                  <h2 className="text-base font-black text-white leading-none">{character.name}</h2>
                  <span className="text-[7.5px] text-gray-500 font-bold uppercase tracking-wider mt-1.5 block">Nível Inicial: {character.level}</span>
                </div>
                <span className={`text-[13px] font-black font-mono border rounded px-2.5 py-0.5 leading-none shrink-0 ${getRarityBadgeStyle(character.rarity)}`}>
                  {character.rarity}
                </span>
              </div>

              {/* Specs parameters lists */}
              <div className="space-y-2 mb-4 text-[9.5px]">
                <div className="flex justify-between border-b border-indigo-950/20 pb-1">
                  <span className="text-gray-400">Raridade:</span>
                  <strong className="text-white font-bold">{character.rarity}</strong>
                </div>
                <div className="flex justify-between border-b border-indigo-950/20 pb-1">
                  <span className="text-gray-400 flex items-center gap-1">Elemento:</span>
                  <strong className={`font-bold flex items-center gap-1 ${getElementBadgeColor(character.element)}`}>
                    {getElementIcon(character.element)} {character.element}
                  </strong>
                </div>
                <div className="flex justify-between border-b border-indigo-950/20 pb-1">
                  <span className="text-gray-400">Função:</span>
                  <strong className="text-white font-bold">{getRoleIcon(character.role)} {character.role}</strong>
                </div>
                <div className="flex justify-between border-b border-indigo-950/20 pb-1">
                  <span className="text-gray-400">Nível Inicial:</span>
                  <strong className="text-white font-bold">{character.level}</strong>
                </div>
                <div className="flex justify-between border-b border-indigo-950/20 pb-1">
                  <span className="text-gray-400">Origem:</span>
                  <strong className="text-white font-semibold">{config.originLabel}</strong>
                </div>
              </div>

              {/* Trait & Skills description blocks */}
              <div className="space-y-3 pt-3 border-t border-indigo-950/30 text-[9.5px]">
                <div className="flex flex-col text-left">
                  <span className="text-gray-400 font-bold block mb-1">Traço:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-emerald-400">🌿</span>
                    <strong className="text-[#34d399] font-extrabold">{character.passive}</strong>
                  </div>
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-gray-400 font-bold block mb-1">Habilidade:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-rose-400">🔥</span>
                    <strong className="text-[#f87171] font-extrabold">{character.skill}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Emblem watermark overlay */}
            <div className="flex justify-center border-t border-indigo-950/30 pt-4 opacity-35">
              <span className="text-3xl">🛡️</span>
            </div>
          </div>

        </div>
      )}

      {/* 3. BOTTOM WARNING BANNERS */}
      {step === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 relative z-10">
          <div className="bg-rose-955/25 border border-rose-900/50 rounded-xl p-3.5 flex items-center gap-3 text-left">
            <span className="text-rose-400 text-lg">⚠️</span>
            <div>
              <p className="text-[8.5px] text-rose-400/90 leading-snug">
                O personagem desencantado será enviado ao Livro de Memórias e não poderá mais lutar.
              </p>
            </div>
          </div>

          {compareTarget && compareMeta ? (
            <div className="bg-indigo-955/25 border border-indigo-900/50 rounded-xl p-3.5 flex items-center gap-3 text-left">
              <span className="text-indigo-400 text-lg">📖</span>
              <div>
                <p className="text-[8.5px] text-indigo-300 font-medium leading-snug">
                  {compareTarget.name} acompanha sua jornada desde o início. Se for desencantado, seu legado será preservado no Livro de Memórias.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#121226]/50 border border-indigo-950 rounded-xl p-3.5 flex items-center gap-3 text-left text-gray-500 italic text-[8.5px]">
              Selecione um companheiro para visualizar seu legado.
            </div>
          )}
        </div>
      )}

      {/* 4. FOOTER CONTROLS & ACTION BUTTONS */}
      <footer className="w-full bg-[#121226]/50 border border-indigo-950 rounded-2xl p-4 shrink-0 flex justify-end items-center gap-4 relative z-10">
        <div className="flex gap-3">
          {step === 'reveal' ? (
            <button
              onClick={onDecline}
              className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-black/35 hover:bg-black/80 border border-gray-800 text-gray-400"
            >
              Cancelar
            </button>
          ) : (
            <>
              <button
                onClick={onDecline}
                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#101c38]/40 border border-indigo-850 text-indigo-300 hover:bg-[#1a2c56]/60 transition-all hover:scale-103"
              >
                🛡️ Manter Equipe Atual
              </button>
              
              <button
                onClick={handleConfirmReplace}
                disabled={!selectedReplaceId}
                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#b59441] hover:bg-[#cbb062] active:scale-95 text-black shadow-md disabled:opacity-40 transition-all hover:scale-103"
              >
                🐾 Substituir {compareTarget ? compareTarget.name : "Companheiro"}
              </button>

              <button
                onClick={() => alert("Exibindo Livro de Memórias...")}
                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-955/40 hover:bg-indigo-900 border border-indigo-850 text-indigo-300 transition-all hover:scale-103 animate-pulse"
              >
                📖 Ver Detalhes
              </button>

              <button
                onClick={onDecline}
                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-black/35 hover:bg-black/80 border border-gray-800 text-rose-400 border-rose-955/20 transition-all hover:scale-103"
              >
                ❌ Cancelar
              </button>
            </>
          )}
        </div>
      </footer>

      {/* Footer shortcuts guidelines */}
      <div className="w-full text-center text-[7.5px] text-gray-600 font-bold uppercase tracking-widest pt-2.5 mt-2.5 border-t border-indigo-950/30 shrink-0 relative z-10">
        Enter: Confirmar | Tab: Inspecionar | Esc: Cancelar
      </div>

      {/* EMOTIONAL CONFIRMATION MODAL */}
      {showConfirmModal && compareTarget && compareMeta && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="bg-[#121226] border-2 border-[#b59441] rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col justify-between relative overflow-hidden text-gray-200 animate-scaleIn">
            
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-rose-500/10 rounded-full filter blur-xl" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full filter blur-xl" />

            <div className="text-center mb-5 border-b border-indigo-950/40 pb-4">
              <span className="text-2xl mb-2 block">🔔</span>
              <h3 className="text-sm font-black text-rose-450 tracking-wider uppercase">Confirmar Desencantamento</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">Essa decisão é permanente</p>
            </div>

            <div className="space-y-4 text-left">
              <p className="text-xs text-gray-300 leading-relaxed">
                Você está prestes a desencantar <strong className="text-white">{compareTarget.name}</strong>.
              </p>
              
              <p className="text-[10px] text-gray-400 leading-relaxed bg-black/30 p-3 rounded-xl border border-indigo-950/30">
                Ele será registrado no <strong>Livro de Memórias</strong> com todo o seu histórico, mas <strong>não poderá mais retornar à equipe nem lutar novamente</strong>.
              </p>

              {(compareTarget.id === 'char-lobo' || compareTarget.level >= 120) && (
                <div className="p-3 bg-rose-955/25 border border-rose-900/50 rounded-xl text-[9px] text-rose-300 font-bold leading-normal flex items-start gap-2 shadow-inner">
                  <span>⚠️</span>
                  <p>
                    Atenção: <strong>{compareTarget.name}</strong> possui <strong>{compareMeta.bondLabel}</strong>. Este companheiro marcou sua jornada. Deseja mesmo desencantá-lo?
                  </p>
                </div>
              )}

              <div className="bg-[#1a1a35] border border-indigo-950/40 rounded-xl p-3 text-[9px] text-gray-400 space-y-1.5">
                <span className="font-extrabold text-[8px] text-indigo-400 uppercase tracking-widest block mb-1">REGISTRO DE MEMÓRIA</span>
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <p>Nível Final: <strong className="text-white">{compareTarget.level}</strong></p>
                  <p>Tempo na Equipe: <strong className="text-white">{compareMeta.sinceText}</strong></p>
                  <p>Batalhas: <strong className="text-white">{compareMeta.battles}</strong></p>
                  <p>Feitos marcantes: <strong className="text-white">"{compareMeta.phrase}"</strong></p>
                  <p>Substituído por: <strong className="text-white">Thorn</strong></p>
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
                  onReplace(selectedReplaceId);
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
