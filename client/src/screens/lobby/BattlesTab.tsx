import React from 'react';

export const BattlesTab: React.FC = () => (
  <div className="max-w-2xl mx-auto space-y-6 font-sans">
    <h3 className="text-xl font-bold border-b border-indigo-950 pb-4">Histórico de Batalhas</h3>
    <div className="space-y-4">
      <div className="p-5 bg-[#16162a] border border-indigo-950 rounded-xl flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Vitória</div>
          <div className="font-bold text-gray-200">vs GuerreiroLendario</div>
          <div className="text-[10px] text-gray-500">26/06/2026 às 20:15</div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold text-indigo-300">+45 XP</div>
          <div className="text-[10px] text-gray-500">Arma: Fogo 🔥</div>
        </div>
      </div>
      <div className="p-5 bg-[#16162a] border border-indigo-950 rounded-xl flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">Derrota (Desmaio)</div>
          <div className="font-bold text-gray-200">vs MagoDoVento</div>
          <div className="text-[10px] text-gray-500">26/06/2026 às 19:40</div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold text-indigo-400/50">+0 XP</div>
          <div className="text-[10px] text-gray-500">Arma: Neutra 🛡️</div>
        </div>
      </div>
    </div>
  </div>
);
