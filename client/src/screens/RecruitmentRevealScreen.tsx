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
  const [selectedReplaceId, setSelectedReplaceId] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Source context strings
  const getSourceConfig = (type: RecruitmentSource) => {
    switch (type) {
      case 'post_battle_offer':
        return {
          title: 'NOVO COMPANHEIRO',
          subtitle: 'Oferta de Recrutamento Pós-Combate',
          introText: 'Um inimigo derrotado reconheceu sua força e deseja se unir à sua jornada.',
          characterSpeak: '“Reconheço sua força. Permita-me caminhar ao seu lado.”',
          bgStyle: 'bg-radial-battle'
        };
      case 'dimensional_chest':
        return {
          title: 'REVELAÇÃO DIMENSIONAL',
          subtitle: 'Abertura de Baú Dimensional',
          introText: 'A fenda responde ao seu chamado e um novo eco atravessou o véu.',
          characterSpeak: '“A fenda revelou um novo destino. Vim ao seu chamado.”',
          bgStyle: 'bg-radial-rift'
        };
      case 'fragment_summon':
        return {
          title: 'ENCANTAMENTO RÚNICO',
          subtitle: 'Invocação por Fragmentos',
          introText: 'Os fragmentos rúnicos se unem e um guerreiro antigo tomou forma.',
          characterSpeak: '“Um eco perdido tomou forma mais uma vez.”',
          bgStyle: 'bg-radial-magic'
        };
      case 'mercenary_contract':
        return {
          title: 'CONTRATO DE MERCENÁRIO',
          subtitle: 'Contratação da Taverna',
          introText: 'Um profissional aceitou lutar em sua equipe sob acordo permanente.',
          characterSpeak: '“Meu preço foi pago. Minha lâmina é sua.”',
          bgStyle: 'bg-radial-gold'
        };
      default:
        return {
          title: 'RECOMPENSA DE CAMPANHA',
          subtitle: 'Aliança Narrativa',
          introText: 'Após os eventos cruciais da jornada, este companheiro decidiu segui-lo.',
          characterSpeak: '“Nossa jornada agora segue o mesmo caminho.”',
          bgStyle: 'bg-radial-magic'
        };
    }
  };

  const config = getSourceConfig(sourceType);
  const isTeamFull = teamMembers.length >= 6;

  // Rarity Colors
  const getRarityColorClass = (r: string) => {
    if (r === 'S+') return 'text-[#ea580c] text-glow-orange';
    if (r === 'S') return 'text-[#dc2626] text-glow-red';
    if (r === 'A') return 'text-[#eab308] text-glow-gold';
    if (r === 'B') return 'text-[#a855f7] text-glow-purple';
    if (r === 'C') return 'text-[#06b6d4] text-glow-cyan';
    if (r === 'D') return 'text-[#10b981] text-glow-green';
    return 'text-gray-400';
  };

  // Element Icon
  const getElementIcon = (el: string) => {
    const e = el.toLowerCase();
    if (e === 'fogo') return '🔥';
    if (e === 'água' || e === 'agua') return '💧';
    if (e === 'terra') return '⛰️';
    if (e === 'vento') return '🍃';
    if (e === 'sombra') return '🔮';
    return '🛡️';
  };

  // Handle final replace confirmation
  const handleConfirmReplace = () => {
    if (!selectedReplaceId) {
      alert("Por favor, escolha um companheiro atual da sua equipe para substituir!");
      return;
    }
    setShowConfirmModal(true);
  };

  // Selected character from team to compare
  const compareTarget = teamMembers.find(m => m.id === selectedReplaceId);

  // Mock stats translator for side-by-side comparison
  const getComparisonStats = (char: any) => {
    if (!char) return null;
    return {
      name: char.name,
      level: char.level,
      rarity: char.rarity || 'D',
      element: char.element || 'none',
      class: char.class || 'Companheiro',
      stats: char.stats || { hp: 100, mp: 50, strength: 10, defense: 10, speed: 10 }
    };
  };

  const leftChar = getComparisonStats(compareTarget);

  return (
    <div className="recruit-fullscreen-wrapper w-full h-full min-h-[580px] bg-[#06060c] border border-indigo-950/60 rounded-3xl overflow-hidden p-6 flex flex-col justify-between select-none">
      
      {/* ─── Styles ─── */}
      <style>{`
        .recruit-fullscreen-wrapper {
          box-shadow: 0 0 40px rgba(0,0,0,0.85);
        }
        .glowing-circle {
          background: radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, rgba(0,0,0,0) 70%);
          border-radius: 50%;
          animation: pulseRift 3s infinite ease-in-out;
        }
        .gold-border-glow {
          border: 1px solid #b59441;
          box-shadow: 0 0 15px rgba(181, 148, 65, 0.35);
        }
        .stat-bar-fill {
          height: 100%;
          background: linear-gradient(to right, #4338ca, #6366f1);
          border-radius: 99px;
        }
        .stat-bar-bg {
          height: 6px;
          background: #1e1e38;
          border-radius: 99px;
          overflow: hidden;
        }
        @keyframes pulseRift {
          0% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 1.0; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
        .text-glow-purple { text-shadow: 0 0 10px rgba(168, 85, 247, 0.6); }
        .text-glow-gold { text-shadow: 0 0 10px rgba(234, 179, 8, 0.6); }
        .text-glow-red { text-shadow: 0 0 10px rgba(220, 38, 38, 0.6); }
        .text-glow-cyan { text-shadow: 0 0 10px rgba(6, 182, 212, 0.6); }
        .text-glow-green { text-shadow: 0 0 10px rgba(16, 185, 129, 0.6); }
        .text-glow-orange { text-shadow: 0 0 10px rgba(234, 88, 12, 0.6); }
      `}</style>

      {/* HEADER */}
      <header className="flex justify-between items-center border-b border-indigo-950/40 pb-4 mb-4 shrink-0">
        <div>
          <h1 className="text-lg font-black tracking-widest text-[#ffe082] uppercase leading-none">{config.title}</h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">{config.subtitle}</p>
        </div>
        <div className="bg-[#121226] border border-indigo-900/60 px-3 py-1 rounded-xl text-[9px] font-bold text-gray-400">
          Equipe: {teamMembers.length}/6
        </div>
      </header>

      {/* STATE A: REVEAL/INITIAL EXPECTANCY */}
      {step === 'reveal' && (
        <div className="flex-grow flex flex-col justify-center items-center py-6 text-center">
          <div className="w-60 h-60 glowing-circle flex items-center justify-center relative mb-8">
            <span className="text-7xl animate-bounce">🔮</span>
            <div className="absolute inset-0 border border-indigo-500/20 rounded-full animate-ping" />
          </div>
          <div className="max-w-md">
            <p className="text-xs text-gray-300 font-medium leading-relaxed mb-6">
              {config.introText}
            </p>
            <button
              onClick={() => setStep('details')}
              className="px-8 py-3 bg-[#b59441] hover:bg-[#cbb062] active:scale-95 text-black font-black uppercase text-xs rounded-full tracking-widest transition-all shadow-lg gold-border-glow"
            >
              Revelar Companheiro
            </button>
          </div>
        </div>
      )}

      {/* STATE B: DETAILS REVEALED */}
      {step === 'details' && !substituteMode && (
        <div className="flex-grow flex flex-col lg:flex-row gap-6 overflow-hidden py-2">
          
          {/* Central Banner: Pose / Character Graphic */}
          <div className="flex-1 bg-black/45 border border-indigo-950/40 rounded-2xl p-6 flex flex-col justify-center items-center relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-purple-500/5 rounded-full filter blur-xl" />
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-blue-500/5 rounded-full filter blur-xl" />
            
            {/* Character Graphic Mock */}
            <div className="w-48 h-48 bg-[#0a0a14] border border-[#b59441]/20 rounded-3xl flex items-center justify-center text-7xl shadow-inner mb-6 relative">
              {character.name.includes('Thorn') ? '🛡️' : '🐺'}
              <div className="absolute bottom-2 px-3 py-0.5 bg-black/80 rounded-full border border-gray-800 text-[8px] text-gray-400">
                {character.role}
              </div>
            </div>

            <div className="text-center max-w-sm">
              <span className="text-[9px] uppercase font-bold tracking-widest text-[#d1b894] px-3 py-1 bg-[#5c4535]/20 border border-[#5c4535]/40 rounded-full">
                Vínculo Disponível
              </span>
              <p className="text-xs text-gray-200 font-medium italic mt-4 px-4 leading-relaxed">
                {config.characterSpeak}
              </p>
            </div>
          </div>

          {/* Right Panel: Character Stats Sheet */}
          <div className="w-full lg:w-80 bg-[#121226]/50 border border-indigo-950/60 rounded-2xl p-5 flex flex-col justify-between shrink-0">
            <div>
              <div className="flex justify-between items-start border-b border-indigo-950/40 pb-3 mb-4">
                <div>
                  <h2 className="text-lg font-black text-white leading-none">{character.name}</h2>
                  <span className="text-[10px] text-gray-500 font-semibold mt-1 block">Nível Inicial: {character.level}</span>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-black ${getRarityColorClass(character.rarity)}`}>Rank {character.rarity}</span>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5 text-[10px]">
                <p className="flex justify-between border-b border-indigo-950/20 pb-1">
                  <span className="text-gray-400">Função:</span>
                  <strong className="text-white">{character.role}</strong>
                </p>
                <p className="flex justify-between border-b border-indigo-950/20 pb-1">
                  <span className="text-gray-400">Elemento:</span>
                  <strong className="text-white">{getElementIcon(character.element)} {character.element}</strong>
                </p>
                <p className="flex justify-between border-b border-indigo-950/20 pb-1 col-span-2">
                  <span className="text-gray-400">Passiva:</span>
                  <strong className="text-[#a855f7]">{character.passive}</strong>
                </p>
                <p className="flex justify-between border-b border-indigo-950/20 pb-1 col-span-2">
                  <span className="text-gray-400">Habilidade:</span>
                  <strong className="text-[#eab308]">{character.skill}</strong>
                </p>
              </div>

              {/* Stats Bar */}
              <div className="space-y-2 text-[9px]">
                <span className="text-gray-400 font-bold block mb-1">ATRIBUTOS BASE</span>
                {[
                  { label: 'HP', val: character.stats.hp, max: 2500 },
                  { label: 'MP', val: character.stats.mp, max: 150 },
                  { label: 'FORÇA', val: character.stats.strength, max: 100 },
                  { label: 'DEFESA', val: character.stats.defense, max: 100 },
                  { label: 'VELOCIDADE', val: character.stats.speed, max: 100 }
                ].map((stat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-gray-400">
                      <span>{stat.label}</span>
                      <span className="text-white font-bold">{stat.val}</span>
                    </div>
                    <div className="stat-bar-bg">
                      <div className="stat-bar-fill" style={{ width: `${(stat.val / stat.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warnings Alert */}
            {isTeamFull && (
              <div className="mt-4 p-3 bg-rose-950/25 border border-rose-900/40 rounded-xl text-center text-[9px] text-rose-300 font-medium">
                Sua equipe está cheia (6/6). Para aceitar Thorn, você precisará desencantar um companheiro atual.
              </div>
            )}
          </div>

        </div>
      )}

      {/* STATE C: SUBSTITUTION COMPARISON GRID */}
      {step === 'details' && substituteMode && (
        <div className="flex-grow flex flex-col lg:flex-row gap-6 overflow-hidden py-2">
          
          {/* LEFT COLUMN: Roster selections */}
          <div className="w-full lg:w-60 bg-black/45 border border-indigo-950/40 rounded-2xl p-4 flex flex-col justify-between shrink-0">
            <div>
              <span className="text-[10px] text-gray-400 font-bold block border-b border-indigo-950/30 pb-2 mb-3">
                SELECIONE UM COMPANHEIRO PARA SUBSTITUIR
              </span>
              <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
                {teamMembers.map((m: any) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedReplaceId(m.id)}
                    className={`bg-black/30 border p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:bg-black/50 ${
                      selectedReplaceId === m.id ? 'border-[#b59441] bg-black/60 shadow-md' : 'border-indigo-950/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {m.name.includes('Lobo') ? '🐺' : m.name.includes('Lyria') ? '🧝‍♀️' : m.name.includes('Caelum') ? '🛡️' : '👤'}
                      </span>
                      <div>
                        <p className="text-xs font-black text-white leading-none">{m.name}</p>
                        <p className="text-[8px] text-gray-500 mt-1">Nível {m.level} • {m.element}</p>
                      </div>
                    </div>
                    {m.id === 'char-lobo' && (
                      <span className="px-1.5 py-0.5 bg-yellow-950 text-[#eab308] border border-yellow-800 rounded text-[7px] font-bold uppercase">
                        Vínculo
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-[8px] text-gray-500 italic mt-3 leading-relaxed border-t border-indigo-950/20 pt-2">
              ⚠️ O companheiro substituído irá se despedir e será registrado no Livro de Memórias.
            </div>
          </div>

          {/* CENTER PANEL: Comparison stats side-by-side */}
          <div className="flex-1 bg-[#121226]/30 border border-indigo-950/50 rounded-2xl p-5 flex flex-col justify-between">
            {leftChar ? (
              <div className="flex flex-col h-full justify-between">
                
                {/* VS Header */}
                <div className="grid grid-cols-3 items-center border-b border-indigo-950/30 pb-3 mb-3">
                  <div className="text-right">
                    <h3 className="font-extrabold text-sm text-white">{leftChar.name}</h3>
                    <span className="text-[9px] text-[#eab308] font-bold">Rank {leftChar.rarity}</span>
                  </div>
                  <div className="text-center text-rose-500 font-black text-sm italic font-mono">VS</div>
                  <div className="text-left">
                    <h3 className="font-extrabold text-sm text-white">{character.name}</h3>
                    <span className="text-[9px] text-indigo-400 font-bold">Rank {character.rarity}</span>
                  </div>
                </div>

                {/* Compare Grid */}
                <div className="flex-1 overflow-y-auto space-y-2 text-[10px] pr-1">
                  {[
                    { label: 'Nível', left: leftChar.level, right: character.level, imp: character.level > leftChar.level },
                    { label: 'Elemento', left: leftChar.element, right: character.element },
                    { label: 'Função', left: leftChar.class, right: character.role },
                    { label: 'HP', left: leftChar.stats.hp, right: character.stats.hp, imp: character.stats.hp > leftChar.stats.hp },
                    { label: 'MP', left: leftChar.stats.mp, right: character.stats.mp, imp: character.stats.mp > leftChar.stats.mp },
                    { label: 'FORÇA', left: leftChar.stats.strength, right: character.stats.strength, imp: character.stats.strength > leftChar.stats.strength },
                    { label: 'DEFESA', left: leftChar.stats.defense, right: character.stats.defense, imp: character.stats.defense > leftChar.stats.defense },
                    { label: 'VELOCIDADE', left: leftChar.stats.speed, right: character.stats.speed, imp: character.stats.speed > leftChar.stats.speed }
                  ].map((row, idx) => (
                    <div key={idx} className="grid grid-cols-5 items-center py-1.5 border-b border-indigo-950/20">
                      <div className="col-span-2 text-right text-gray-300 font-semibold">{row.left}</div>
                      <div className="col-span-1 text-center text-gray-500 text-[8px] font-bold uppercase">{row.label}</div>
                      <div className={`col-span-2 text-left font-semibold ${row.imp ? 'text-emerald-400 font-black' : 'text-gray-300'}`}>
                        {row.right}
                        {row.imp && <span className="text-[8px] ml-1 text-emerald-400">^</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Warning Alert context box */}
                <div className="p-3 bg-yellow-950/15 border border-yellow-900/30 rounded-xl mt-3 text-[8.5px] text-yellow-300/80 leading-normal">
                  💡 <strong>Legado Emocional:</strong> Desencantar {leftChar.name} irá liberar orbes e eternizá-lo em seu Livro de Memórias.
                </div>

              </div>
            ) : (
              <div className="flex-grow flex flex-col justify-center items-center text-gray-500 text-xs italic">
                <span>Seleccione um companheiro na lista esquerda para comparar</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* FOOTER ACTIONS */}
      <footer className="w-full bg-[#121226]/50 border border-indigo-950 rounded-2xl p-4 shrink-0 flex justify-end items-center gap-4 mt-4">
        <div className="flex gap-3">
          {step === 'reveal' ? (
            <button
              onClick={onDecline}
              className="px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-black/35 hover:bg-black/80 border border-gray-800 text-gray-400"
            >
              Recusar
            </button>
          ) : substituteMode ? (
            <>
              <button
                onClick={() => setSubstituteMode(false)}
                className="px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-black/35 hover:bg-black/80 border border-gray-800 text-gray-400"
              >
                Voltar aos Detalhes
              </button>
              <button
                onClick={handleConfirmReplace}
                disabled={!selectedReplaceId}
                className="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-[#b59441] hover:bg-[#cbb062] active:scale-95 text-black font-black shadow-md disabled:opacity-40"
              >
                Substituir Companheiro
              </button>
            </>
          ) : (
            <>
              {isTeamFull ? (
                <>
                  <button
                    onClick={() => setSubstituteMode(true)}
                    className="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-[#b59441] hover:bg-[#cbb062] active:scale-95 text-black font-black shadow-md"
                  >
                    Substituir Companheiro
                  </button>
                  <button
                    onClick={onConvert}
                    className="px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-950/40 hover:bg-indigo-900 border border-indigo-850 text-indigo-300"
                  >
                    Converter em Orbes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onAccept}
                    className="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-[#b59441] hover:bg-[#cbb062] active:scale-95 text-black font-black shadow-md"
                  >
                    Adicionar à Equipe
                  </button>
                  <button
                    onClick={onConvert}
                    className="px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-950/40 hover:bg-indigo-900 border border-indigo-850 text-indigo-300"
                  >
                    Converter em Orbes
                  </button>
                </>
              )}
              <button
                onClick={onDecline}
                className="px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider bg-black/35 hover:bg-black/80 border border-gray-800 text-rose-400 border-rose-955/20"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </footer>

      {/* EMOTIONAL CONFIRMATION MODAL */}
      {showConfirmModal && compareTarget && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="bg-[#121226] border-2 border-[#b59441] rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col justify-between relative overflow-hidden text-gray-200">
            
            {/* Background glowing particles effect */}
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

              {/* Extra emotional warning for favorite or high bond (like Lobo Cinzento) */}
              {(compareTarget.id === 'char-lobo' || compareTarget.level >= 120) && (
                <div className="p-3 bg-rose-955/25 border border-rose-900/50 rounded-xl text-[9px] text-rose-300 font-bold leading-normal flex items-start gap-2 shadow-inner">
                  <span>⚠️</span>
                  <p>
                    Atenção: <strong>{compareTarget.name}</strong> possui <strong>Vínculo Lendário/Alto</strong>. Este companheiro marcou sua jornada. Deseja mesmo desencantá-lo?
                  </p>
                </div>
              )}

              {/* Memory summary details preview */}
              <div className="bg-[#1a1a35] border border-indigo-950/40 rounded-xl p-3 text-[9px] text-gray-400 space-y-1.5">
                <span className="font-extrabold text-[8px] text-indigo-400 uppercase tracking-widest block mb-1">REGISTRO DE MEMÓRIA</span>
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <p>Nível Final: <strong className="text-white">{compareTarget.level}</strong></p>
                  <p>Tempo na Equipe: <strong className="text-white">{compareTarget.id === 'char-lobo' ? 'Início da Jornada' : 'Campanha 1'}</strong></p>
                  <p>Batalhas: <strong className="text-white">{compareTarget.id === 'char-lobo' ? 418 : 120}</strong></p>
                  <p>Substituído por: <strong className="text-white">Thorn</strong></p>
                </div>
              </div>
            </div>

            {/* Modal Buttons */}
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
                className="px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-900 hover:bg-rose-800 text-white font-bold shadow-lg shadow-rose-950/50"
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
