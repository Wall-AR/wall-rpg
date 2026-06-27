import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/auth';
import { Character } from '../types';
import { client } from '../game/colyseus';

type TabType = 'home' | 'profile' | 'inventory' | 'friends' | 'battles' | 'quests' | 'settings';

interface LobbyScreenProps {
  onStartGame: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onStartGame }) => {
  const { token, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [retiredList, setRetiredList] = useState<any[]>([]);
  const [isDismissing, setIsDismissing] = useState(false);

  // Settings mock state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(80);

  // Colyseus Presence connection
  useEffect(() => {
    let activeRoom: any = null;

    const connectToPresence = async () => {
      try {
        activeRoom = await client.joinOrCreate("game", { token });
        
        const updateCount = () => {
          setOnlineCount(activeRoom.state.players.size);
        };

        activeRoom.state.players.onAdd = updateCount;
        activeRoom.state.players.onRemove = updateCount;
        activeRoom.onStateChange(() => {
          updateCount();
        });
        updateCount();
      } catch (err) {
        console.warn("Failed to connect to Colyseus presence room:", err);
      }
    };

    if (token) {
      connectToPresence();
    }

    return () => {
      if (activeRoom) {
        activeRoom.leave();
      }
    };
  }, [token]);

  // Fetch character stats
  useEffect(() => {
    const fetchCharacter = async () => {
      try {
        const response = await fetch('/character/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Falha ao carregar dados do personagem.');
        }

        const data = await response.json();
        
        // Map backend schema stats structure to frontend Character format
        const charData: Character = {
          id: data.id,
          name: data.name,
          level: data.level,
          xp: data.xp,
          hp: data.stats.hp,
          maxHp: data.stats.hp, // simplification
          mp: data.stats.mp,
          maxMp: data.stats.mp,
          sp: 0,
          maxSp: 100,
          at: data.stats.strength,
          df: data.stats.defense,
          mat: data.stats.strength, // placeholder
          mdf: data.stats.defense, // placeholder
          speed: data.stats.speed,
          element: data.element,
          dragoonLevel: data.dragoonLevel,
          additions: [],
          equipment: {
            weapon: null,
            armor: null,
            accessory: null,
          },
          soulOrbs: data.soulOrbs
        };

        setCharacter(charData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCharacter();
    }
  }, [token]);

  // Fetch retired characters list when Profile tab is active
  useEffect(() => {
    if (activeTab === 'profile') {
      const fetchRetired = async () => {
        try {
          const res = await fetch('/character/retired', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setRetiredList(data);
          }
        } catch (err) {
          console.error("Error fetching retired characters:", err);
        }
      };
      fetchRetired();
    }
  }, [activeTab, token]);

  const handleDismissCharacter = async () => {
    if (!character) return;
    const confirm = window.confirm(
      `Tem certeza que deseja se despedir de ${character.name}? Esta ação é irreversível e ele será enviado para o Mural de Lembranças.`
    );
    if (!confirm) return;

    setIsDismissing(true);
    try {
      const res = await fetch('/character/dismiss', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ characterId: character.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`${data.message}\nVocê recebeu +${data.orbsAwarded} Orbes de Alma!`);
        logout();
      } else {
        alert(data.error || 'Erro ao despedir guerreiro.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao despedir guerreiro.');
    } finally {
      setIsDismissing(false);
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center p-12">
          <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      );
    }

    if (error || !character) {
      return (
        <div className="p-8 text-center text-rose-400 bg-rose-950/20 border border-rose-900/40 rounded-xl max-w-md mx-auto my-8">
          <span className="text-3xl block mb-2">⚠️</span>
          <p>{error || 'Erro ao carregar dados do lobby.'}</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Banner/Card Boas vindas */}
            <div className="p-8 rounded-2xl bg-gradient-to-r from-indigo-950 to-indigo-900/60 border border-indigo-800/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h2 className="text-3xl font-extrabold tracking-wide text-indigo-300">Pronto para a Arena, {character.name}?</h2>
                <p className="text-gray-400 text-sm max-w-lg">
                  Explore o mapa do mundo 2D, interaja com outros guerreiros e desafie monstros para evoluir seus poderes de Dragoon.
                </p>
              </div>
              <button
                onClick={onStartGame}
                className="px-8 py-4 bg-gradient-to-r from-[#e94560] to-[#ff6b81] hover:from-[#d13750] hover:to-[#e0546a] text-white font-bold rounded-xl shadow-lg hover:shadow-[#e94560]/30 transition-all text-base uppercase tracking-wider whitespace-nowrap scale-105 active:scale-100"
              >
                🎮 Entrar no Jogo
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-[#16162a] border border-indigo-950 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-gray-400">
                  <span className="text-sm font-semibold uppercase tracking-wider text-indigo-300">Status Geral</span>
                  <span>Lv. {character.level}</span>
                </div>
                <div className="text-3xl font-extrabold">{character.hp} HP</div>
                <div className="text-sm text-gray-400">Poder de Ataque: <span className="text-indigo-200">{character.at}</span></div>
              </div>

              <div className="p-6 bg-[#16162a] border border-indigo-950 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-gray-400">
                  <span className="text-sm font-semibold uppercase tracking-wider text-indigo-300">Elemento Dragoon</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 uppercase font-bold">{character.element}</span>
                </div>
                <div className="text-3xl font-extrabold">Classe {character.dragoonLevel > 0 ? `Dragoon Lvl ${character.dragoonLevel}` : 'Humano'}</div>
                <div className="text-sm text-gray-400">SP Acumulado: <span className="text-indigo-200">{character.sp} / {character.maxSp}</span></div>
              </div>

              <div className="p-6 bg-[#16162a] border border-indigo-950 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-gray-400">
                  <span className="text-sm font-semibold uppercase tracking-wider text-indigo-300">Amigos & Duelos</span>
                  <span className="text-green-400 text-xs flex items-center gap-1.5 font-bold">● Online</span>
                </div>
                <div className="text-3xl font-extrabold">{onlineCount} {onlineCount === 1 ? 'Jogador' : 'Jogadores'}</div>
                <div className="text-sm text-gray-400">Duelos Ganhos: <span className="text-indigo-200">5 vitórias</span></div>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="max-w-3xl mx-auto bg-[#16162a] border border-indigo-950 rounded-2xl p-8 space-y-8 shadow-xl">
            <div className="flex items-center gap-6 border-b border-indigo-950/80 pb-6 font-sans">
              <div className="w-20 h-20 bg-indigo-900/60 rounded-full flex items-center justify-center border-2 border-indigo-500 shadow-md">
                <span className="text-4xl">👤</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-gray-100">{character.name}</h3>
                <p className="text-sm text-indigo-400 uppercase font-semibold tracking-wider">Guerreiro do Elemento {character.element}</p>
                {character.soulOrbs !== undefined && (
                  <p className="text-xs text-yellow-400 font-bold flex items-center gap-1.5 pt-1">
                    ✨ {character.soulOrbs} Orbes de Alma
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
              <div className="space-y-5">
                <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-300 border-b border-indigo-950 pb-2">Atributos Básicos</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Nível</span>
                    <span className="font-bold text-gray-200">{character.level}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Experiência (XP)</span>
                    <span className="font-bold text-gray-200">{character.xp}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-medium">HP (Vida)</span>
                    <span className="font-bold text-emerald-400">{character.hp} / {character.maxHp}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-medium">MP (Magia)</span>
                    <span className="font-bold text-blue-400">{character.mp} / {character.maxMp}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-300 border-b border-indigo-950 pb-2">Status de Combate</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Força (Ataque)</span>
                    <span className="font-bold text-gray-200">{character.at}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Defesa</span>
                    <span className="font-bold text-gray-200">{character.df}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Velocidade</span>
                    <span className="font-bold text-gray-200">{character.speed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Nível Dragoon</span>
                    <span className="font-bold text-indigo-300">{character.dragoonLevel > 0 ? `Lvl ${character.dragoonLevel}` : 'Não Desbloqueado'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Despedida de Guerreiro */}
            <div className="border-t border-indigo-950/80 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 font-sans">
              <div className="space-y-1 text-center md:text-left">
                <h4 className="font-bold text-gray-200">Despedida de Guerreiro</h4>
                <p className="text-xs text-gray-400 max-w-md">
                  Se você desejar abrir mão deste personagem (limite de 6 ativos), poderá despedir-se dele. A experiência acumulada será convertida em <b>Orbes de Alma</b> e ele será registrado no seu Álbum.
                </p>
              </div>
              <button
                onClick={handleDismissCharacter}
                disabled={isDismissing}
                className="px-5 py-2.5 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-900/50 hover:border-rose-500 text-rose-300 text-xs font-bold rounded-lg transition-all whitespace-nowrap"
              >
                {isDismissing ? 'Despedindo...' : 'Despedir-se do Guerreiro'}
              </button>
            </div>

            {/* Álbum de Lembranças / Mural de Heróis Aposentados */}
            <div className="border-t border-indigo-950/80 pt-6 space-y-4 font-sans">
              <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-300">Álbum de Lembranças (Mural de Heróis)</h4>
              {retiredList.length === 0 ? (
                <p className="text-xs text-gray-500 italic">Você não se despediu de nenhum guerreiro nesta conta ainda.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {retiredList.map((ret: any) => (
                    <div key={ret.id} className="p-4 bg-[#0d0d1e]/90 border border-indigo-950 rounded-xl space-y-2 relative overflow-hidden group">
                      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-indigo-500/20 to-transparent"></div>
                      <div className="flex justify-between items-start">
                        <h5 className="font-bold text-gray-200 truncate pr-2">{ret.name}</h5>
                        <span className="text-[9px] uppercase font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-900 px-1.5 py-0.5 rounded shrink-0">
                          {ret.element}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 space-y-0.5">
                        <p>Nível Aposentado: <span className="text-white font-medium">{ret.level}</span></p>
                        <p>XP Acumulado: <span className="text-white font-medium">{ret.xp}</span></p>
                        <p>Aposentado em: <span className="text-slate-500 font-medium">{new Date(ret.retiredAt).toLocaleDateString()}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'inventory':
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-indigo-950 pb-4">
              <h3 className="text-xl font-bold">Mochila & Equipamento</h3>
              <span className="text-xs text-gray-400">Capacidade: 2 / 20 slots</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
              {/* Armas/Itens mockados */}
              <div className="aspect-square bg-[#16162a] border border-indigo-950 rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:border-indigo-500/50 transition-colors group cursor-pointer relative">
                <span className="text-3xl group-hover:scale-110 transition-transform">⚔️</span>
                <span className="text-[10px] text-gray-300 font-semibold truncate max-w-full text-center">Espada Larga</span>
                <span className="absolute top-1 right-2 text-[9px] px-1 bg-indigo-950 rounded text-indigo-400 border border-indigo-900 font-bold">LV.1</span>
              </div>

              <div className="aspect-square bg-[#16162a] border border-indigo-950 rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:border-indigo-500/50 transition-colors group cursor-pointer relative">
                <span className="text-3xl group-hover:scale-110 transition-transform">🧪</span>
                <span className="text-[10px] text-gray-300 font-semibold truncate max-w-full text-center">Poção de HP</span>
                <span className="absolute bottom-1.5 right-2 text-xs text-emerald-400 font-bold">x5</span>
              </div>

              {/* Slots vazios */}
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="aspect-square bg-[#16162a]/30 border border-indigo-950/60 rounded-xl flex items-center justify-center text-gray-800 text-2xl font-bold border-dashed">
                  +
                </div>
              ))}
            </div>
          </div>
        );

      case 'friends':
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-indigo-950 pb-4">
              <h3 className="text-xl font-bold">Lista de Amigos</h3>
              <button className="px-3.5 py-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 rounded-md text-xs font-semibold tracking-wide text-indigo-300 transition-colors">
                + Adicionar Amigo
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-[#16162a] border border-indigo-950 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="font-semibold text-gray-200">GuerreiroLendario</span>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-[#e94560]/10 hover:bg-[#e94560]/20 border border-[#e94560]/30 hover:border-[#e94560]/60 rounded text-xs text-[#e94560] font-medium transition-colors">
                    ⚔️ Desafiar Duelo
                  </button>
                </div>
              </div>

              <div className="p-4 bg-[#16162a] border border-indigo-950 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="font-semibold text-gray-200">MagoDoVento</span>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-[#e94560]/10 hover:bg-[#e94560]/20 border border-[#e94560]/30 hover:border-[#e94560]/60 rounded text-xs text-[#e94560] font-medium transition-colors">
                    ⚔️ Desafiar Duelo
                  </button>
                </div>
              </div>

              <div className="p-4 bg-[#16162a]/50 border border-indigo-950/60 rounded-xl flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gray-600" />
                  <span className="font-semibold text-gray-300">RoseFan</span>
                </div>
                <span className="text-xs text-gray-500">Offline há 2 horas</span>
              </div>
            </div>
          </div>
        );

      case 'battles':
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-xl font-bold border-b border-indigo-950 pb-4">Histórico de Batalhas</h3>
            <div className="space-y-4">
              <div className="p-5 bg-[#16162a] border border-indigo-950 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Vitória</div>
                  <div className="font-bold">vs GuerreiroLendario</div>
                  <div className="text-xs text-gray-400">26/06/2026 às 20:15</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-indigo-300">+45 XP</div>
                  <div className="text-xs text-gray-400">Addition: Double Smash</div>
                </div>
              </div>

              <div className="p-5 bg-[#16162a] border border-indigo-950 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-rose-400 uppercase tracking-wider">Derrota</div>
                  <div className="font-bold">vs MagoDoVento</div>
                  <div className="text-xs text-gray-400">26/06/2026 às 19:40</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-indigo-400/50">+10 XP</div>
                  <div className="text-xs text-gray-500">QTE falhou no counter</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'quests':
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-xl font-bold border-b border-indigo-950 pb-4">Diário de Missões</h3>
            <div className="space-y-4">
              <div className="p-5 bg-[#16162a] border border-indigo-950 rounded-xl relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-500" />
                <div className="flex justify-between items-start">
                  <div className="space-y-1 pl-2">
                    <h4 className="font-bold text-gray-100 group-hover:text-yellow-400 transition-colors">A Prova de Fogo</h4>
                    <p className="text-sm text-gray-400">Derrote 3 Slimes de Fogo nos arredores do coliseu.</p>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-950/60 border border-yellow-800 text-yellow-300 font-bold uppercase">Ativa</span>
                </div>
                <div className="mt-4 pt-3 border-t border-indigo-950/80 flex items-center justify-between text-xs text-gray-400">
                  <span>Recompensa: 100 XP + Espada Rústica</span>
                  <span>Progresso: 1 / 3 derrotados</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="max-w-xl mx-auto bg-[#16162a] border border-indigo-950 rounded-2xl p-8 space-y-6 shadow-xl">
            <h3 className="text-xl font-bold border-b border-indigo-950 pb-3">Configurações Gerais</h3>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <div className="font-semibold text-gray-200">Efeitos Sonoros</div>
                  <div className="text-xs text-gray-400">Habilita/Desabilita música e efeitos sonoros.</div>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-14 h-8 rounded-full transition-colors flex items-center p-1 ${soundEnabled ? 'bg-indigo-600' : 'bg-gray-800'}`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-gray-200">Volume</span>
                  <span className="text-indigo-400">{volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  disabled={!soundEnabled}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-2 bg-[#0f0f1a] rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed"
                />
              </div>

              <div className="pt-6 border-t border-indigo-950/80 flex justify-between items-center text-sm">
                <span className="text-gray-400">Licença de Uso</span>
                <span className="text-gray-400">RPG de Mesa Privado v0.1.0</span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#16162a] border-b border-indigo-900/40 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-extrabold text-indigo-400 tracking-widest bg-gradient-to-r from-indigo-400 to-indigo-500 bg-clip-text">
            MEGACOLISEUM
          </span>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
            Lobby
          </span>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 bg-rose-950/30 hover:bg-rose-950/80 text-rose-300 border border-rose-900/50 rounded-lg text-sm font-medium transition-all"
        >
          Sair da Conta
        </button>
      </header>

      {/* Navigation tabs & Content */}
      <div className="flex-1 flex flex-col md:flex-row p-6 gap-6 max-w-6xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-60 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-2 bg-[#16162a] border border-indigo-950 p-2 rounded-2xl shadow-md shrink-0 h-fit">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 md:flex-none px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all whitespace-nowrap ${
              activeTab === 'home' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-indigo-950/50 hover:text-gray-200'
            }`}
          >
            <span>🏠</span> Início
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 md:flex-none px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all whitespace-nowrap ${
              activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-indigo-950/50 hover:text-gray-200'
            }`}
          >
            <span>👤</span> Perfil
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 md:flex-none px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all whitespace-nowrap ${
              activeTab === 'inventory' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-indigo-950/50 hover:text-gray-200'
            }`}
          >
            <span>🎒</span> Inventário
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 md:flex-none px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all whitespace-nowrap ${
              activeTab === 'friends' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-indigo-950/50 hover:text-gray-200'
            }`}
          >
            <span>👥</span> Amigos
          </button>
          <button
            onClick={() => setActiveTab('battles')}
            className={`flex-1 md:flex-none px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all whitespace-nowrap ${
              activeTab === 'battles' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-indigo-950/50 hover:text-gray-200'
            }`}
          >
            <span>⚔️</span> Batalhas
          </button>
          <button
            onClick={() => setActiveTab('quests')}
            className={`flex-1 md:flex-none px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all whitespace-nowrap ${
              activeTab === 'quests' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-indigo-950/50 hover:text-gray-200'
            }`}
          >
            <span>📜</span> Missões
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 md:flex-none px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all whitespace-nowrap ${
              activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-indigo-950/50 hover:text-gray-200'
            }`}
          >
            <span>⚙️</span> Ajustes
          </button>
        </aside>

        {/* Tab Content Panel */}
        <main className="flex-1 bg-[#121224]/30 border border-indigo-950/50 p-8 rounded-2xl min-h-[450px] shadow-inner flex flex-col justify-start">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};
