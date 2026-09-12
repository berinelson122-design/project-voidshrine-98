import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';
import { GameMode, RunRecord } from '../types';

interface GameState {
  score: number;
  lives: number;
  bombs: number;
  power: number;
  graze: number;
  bossHealth: number;
  bossPhase: number;
  hiscore: number;
  runHistory: RunRecord[];

  setStats: (newStats: Partial<GameState>) => void;
  resetGame: () => void;
  syncScore: (name: string, score: number) => Promise<void>;
  recordRun: (record: Omit<RunRecord, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  exportHistoryCSV: () => void;
}

const STORAGE_RUN_KEY = 'SHRINE98_RUN_HISTORY';

const loadStoredRuns = (): RunRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_RUN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load run history:", e);
    return [];
  }
};

const saveRunsToStorage = (runs: RunRecord[]) => {
  try {
    localStorage.setItem(STORAGE_RUN_KEY, JSON.stringify(runs));
  } catch (e) {
    console.error("Failed to persist run history:", e);
  }
};

export const useGameStore = create<GameState>((set, get) => ({
  score: 0,
  lives: 3,
  bombs: 3,
  power: 0,
  graze: 0,
  bossHealth: 20000,
  bossPhase: 0,
  hiscore: parseInt(localStorage.getItem('SHRINE98_HI') || '0', 10),
  runHistory: loadStoredRuns(),

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

  recordRun: (runData) => {
    const newEntry: RunRecord = {
      ...runData,
      id: `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };

    const currentRuns = get().runHistory;
    const updated = [newEntry, ...currentRuns].slice(0, 100); // Retain last 100 runs

    saveRunsToStorage(updated);

    const currentHi = get().hiscore;
    if (runData.score > currentHi) {
      localStorage.setItem('SHRINE98_HI', runData.score.toString());
      set({ hiscore: runData.score, runHistory: updated });
    } else {
      set({ runHistory: updated });
    }
  },

  clearHistory: () => {
    saveRunsToStorage([]);
    set({ runHistory: [] });
  },

  exportHistoryCSV: () => {
    const runs = get().runHistory;
    if (runs.length === 0) return;

    const headers = [
      "INDEX",
      "RUN_ID",
      "TIMESTAMP_ISO",
      "LOCAL_TIME",
      "PROTOCOL_MODE",
      "FINAL_SCORE",
      "BOSS_PHASE_REACHED",
      "GRAZE_COUNT",
      "MAX_POWER",
      "MISSION_STATUS"
    ];

    const escapeCell = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;

    const rows = runs.map((run, index) => [
      escapeCell(index + 1),
      escapeCell(run.id),
      escapeCell(run.timestamp),
      escapeCell(new Date(run.timestamp).toLocaleString()),
      escapeCell(run.mode),
      escapeCell(run.score),
      escapeCell(run.bossPhase + 1),
      escapeCell(run.graze),
      escapeCell(run.maxPower),
      escapeCell(run.status)
    ].join(','));

    const csvContent = '\uFEFF' + [headers.map(escapeCell).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VOIDMAIDEN_SCOREBOARD_LEDGER_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  syncScore: async (name, score) => {
    const currentHi = get().hiscore;
    if (score > currentHi) {
      localStorage.setItem('SHRINE98_HI', score.toString());
      set({ hiscore: score });
    }

    try {
      const { error } = await supabase
        .from('leaderboard')
        .insert([{ name: name.toUpperCase(), score }]);

      if (error) throw error;
      console.log("--> [UPLINK]: SCORE SECURED ON THE GRID.");
    } catch (err) {
      console.warn("--> [OFFLINE]: CLOUD SYNC FAILED. LOCAL CACHE ACTIVE.");
    }
  }
}));