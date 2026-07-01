import React from 'react';

interface FriendsTabProps {
  character: { id: string };
  username: string | null;
  friendsList: any[];
  onlinePlayers: Record<string, string>;
  presenceRoom: any;
  addFriendName: string;
  setAddFriendName: (v: string) => void;
  onAddFriend: (e: React.FormEvent) => void;
  onAcceptFriend: (friendId: string) => void;
  onRequestDuel: (username: string) => void;
  onInviteParty: (username: string) => void;
  onLeaveParty: () => void;
}

export const FriendsTab: React.FC<FriendsTabProps> = ({
  character, username, friendsList, onlinePlayers, presenceRoom,
  addFriendName, setAddFriendName,
  onAddFriend, onAcceptFriend, onRequestDuel, onInviteParty, onLeaveParty,
}) => {
  const myPartyId = presenceRoom?.state?.players?.get(presenceRoom.sessionId)?.partyId;
  const partyMembers: string[] = [];
  if (myPartyId && presenceRoom?.state?.players) {
    presenceRoom.state.players.forEach((p: any) => {
      if (p.partyId === myPartyId) partyMembers.push(p.username);
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-indigo-950 pb-4 gap-4">
        <h3 className="text-xl font-bold">Amigos & Duelos</h3>
        <form onSubmit={onAddFriend} className="flex gap-2 w-full sm:w-auto">
          <input type="text" required placeholder="Username do Amigo" value={addFriendName}
            onChange={(e) => setAddFriendName(e.target.value)}
            className="bg-slate-950 border border-indigo-950 text-xs rounded-lg px-3 py-1.5 text-indigo-200 outline-none focus:border-indigo-600 transition-all w-full sm:w-44"
          />
          <button type="submit" className="px-4 py-1.5 bg-indigo-900/40 hover:bg-indigo-800 border border-indigo-700 rounded-lg text-xs font-bold text-indigo-300 transition-colors whitespace-nowrap">
            Adicionar
          </button>
        </form>
      </div>

      {/* Active Party Panel */}
      {myPartyId && (
        <div className="p-5 bg-indigo-950/20 border border-indigo-900/50 rounded-2xl space-y-3 shadow-md">
          <div className="flex justify-between items-center border-b border-indigo-950 pb-2">
            <h4 className="font-bold text-indigo-300 text-sm flex items-center gap-1.5">👥 Seu Grupo Ativo</h4>
            <button onClick={onLeaveParty}
              className="text-[10px] text-rose-400 hover:text-rose-300 font-bold border border-rose-950 bg-rose-950/30 px-2 py-0.5 rounded transition-all"
            >Sair do Grupo</button>
          </div>
          <ul className="text-xs text-gray-300 space-y-1.5 pl-1">
            {partyMembers.map((m, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="text-emerald-500 font-extrabold">●</span> {m} {m === username ? '(Você)' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {friendsList.length === 0 ? (
          <p className="text-sm text-gray-500 italic py-4">Você ainda não tem amigos adicionados.</p>
        ) : (
          friendsList.map((friend: any) => {
            const isOnline = Object.values(onlinePlayers).includes(friend.username);
            return (
              <div key={friend.friendId} className="p-4 bg-[#16162a] border border-indigo-950 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                  <div>
                    <span className="font-semibold text-gray-200 text-sm block">{friend.username}</span>
                    <span className="text-[10px] text-gray-500 capitalize">{friend.status === 'pending' ? 'Pedido Pendente' : 'Amigos'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {friend.status === 'pending' && friend.friendId !== character.id && (
                    <button onClick={() => onAcceptFriend(friend.friendId)}
                      className="px-3 py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 text-xs font-bold rounded transition-colors"
                    >Aceitar Pedido</button>
                  )}
                  {friend.status === 'accepted' && isOnline && (
                    <div className="flex gap-1.5">
                      <button onClick={() => onInviteParty(friend.username)}
                        className="px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 text-xs font-bold rounded transition-colors"
                      >Convidar Grupo</button>
                      <button onClick={() => onRequestDuel(friend.username)}
                        className="px-3 py-1.5 bg-rose-950/30 hover:bg-rose-950/80 border border-rose-900 text-rose-300 text-xs font-bold rounded transition-colors"
                      >⚔️ Desafiar Duelo</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
