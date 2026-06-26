import { create } from 'zustand';

interface AuthState {
  token: string | null;
  username: string | null;
  characterId: string | null;
  setAuth: (token: string, username: string, characterId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  username: null,
  characterId: null,
  setAuth: (token, username, characterId) => set({ token, username, characterId }),
  logout: () => set({ token: null, username: null, characterId: null }),
}));
