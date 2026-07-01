import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  username: string | null;
  characterId: string | null;
  setAuth: (token: string, username: string, characterId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      characterId: null,
      setAuth: (token, username, characterId) => set({ token, username, characterId }),
      logout: () => set({ token: null, username: null, characterId: null }),
    }),
    {
      name: 'megacoliseum-auth', // chave no localStorage
    }
  )
);
