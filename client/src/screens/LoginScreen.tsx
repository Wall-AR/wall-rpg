import React, { useState } from 'react';
import { useAuthStore } from '../stores/auth';

export const LoginScreen: React.FC = () => {
  const { setAuth } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister && password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const endpoint = isRegister ? '/auth/register' : '/auth/login';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Algo deu errado. Tente novamente.');
      }

      setAuth(data.token, data.username, data.characterId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4 text-white font-sans">
      <div className="max-w-md w-full bg-[#16162a] rounded-xl shadow-2xl p-8 border border-indigo-900/60 transition-all duration-300 hover:border-indigo-500/30">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-widest bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent drop-shadow-md mb-2">
            MEGACOLISEUM
          </h1>
          <p className="text-gray-400 text-sm">
            {isRegister ? 'Crie sua conta para entrar no RPG' : 'Entre na arena do Wall RPG'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-950/40 border border-rose-900/60 text-rose-300 text-sm rounded-lg flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">
              Usuário (Nome do Personagem)
            </label>
            <input
              id="username"
              type="text"
              required
              disabled={loading}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu nome de usuário..."
              autoComplete="username"
              className="w-full px-4 py-3 bg-[#0f0f1a] border border-indigo-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-600 text-sm transition-all"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              className="w-full px-4 py-3 bg-[#0f0f1a] border border-indigo-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-600 text-sm transition-all"
            />
          </div>

          {isRegister && (
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                disabled={loading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#0f0f1a] border border-indigo-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-600 text-sm transition-all"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 active:from-indigo-700 active:to-indigo-900 text-white font-bold rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm relative"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Carregando...
              </span>
            ) : (
              isRegister ? 'Registrar & Entrar' : 'Entrar na Arena'
            )}
          </button>
        </form>

        {!isRegister && (
          <div className="mt-5 rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4 text-left">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-emerald-300">Conta contínua de teste</p>
                <p className="mt-1 text-[11px] text-gray-400">Usuário: <strong className="text-white">zero</strong> · Senha: <strong className="text-white">zero</strong></p>
              </div>
              <button
                type="button"
                onClick={() => { setUsername('zero'); setPassword('zero'); setError(null); }}
                className="shrink-0 rounded-lg border border-emerald-700 bg-emerald-800/60 px-3 py-2 text-[10px] font-black uppercase text-emerald-100 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-400"
              >
                Usar zero
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center border-t border-indigo-950/80 pt-5 text-sm">
          <p className="text-gray-400">
            {isRegister ? 'Já possui uma conta?' : 'Não possui uma conta?'}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="ml-2 text-indigo-400 hover:text-indigo-300 font-semibold focus:outline-none transition-colors"
            >
              {isRegister ? 'Faça login' : 'Cadastre-se'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
