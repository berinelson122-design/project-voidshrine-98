/**
 * VOID_WEAVER // CENTRAL_COMMAND
 * STATE_MANAGER: ZUSTAND_v4
 */
import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';

interface GameState {
  // Stats
  score: number;
  lives: number;
  bombs: number;
  power: number;
  graze: number;
  bossHealth: number;
  bossPhase: number;
  hiscore: number;

  // Actions
  setStats: (newStats: Partial<GameState>) => void;
  resetGame: () => void;
  syncScore: (name: string, score: number) => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial State
  score: 0,
  lives: 3,
  bombs: 3,
  power: 0,
  graze: 0,
  bossHealth: 20000,
  bossPhase: 0,
  hiscore: parseInt(localStorage.getItem('SHRINE98_HI') || '0'),

  // Actions
  setStats: (newStats) => set((state) => ({ ...state, ...newStats })),
  
  resetGame: () => set({
    score: 0,
    lives: 3,
    bombs: 3,
    power: 0,
    graze: 0,
    bossHealth: 20000,
    bossPhase: 0
  }),

  // The Leaderboard Uplink
  syncScore: async (name, score) => {
    const currentHi = get().hiscore;
    if (score > currentHi) {
        localStorage.setItem('SHRINE98_HI', score.toString());
        set({ hiscore: score });
    }

    try {
        const { error } = await supabase
            .from('leaderboard')
            .insert([{ name: name.toUpperCase(), score: score }]);
        
        if (error) throw error;
        console.log("--> [UPLINK]: SCORE SECURED ON THE GRID.");
    } catch (err) {
        console.warn("--> [OFFLINE]: CLOUD SYNC FAILED. LOCAL CACHE ONLY.");
    }
  }
}));