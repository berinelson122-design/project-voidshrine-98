/**
 * VOID_WEAVER // VICTORY_PROTOCOL
 * ARCHITECT: NELSON BERI
 */
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../services/supabaseClient';

export const VictoryScreen: React.FC<{ score: number, onRestart: () => void }> = ({ score, onRestart }) => {
  const syncScore = useGameStore(state => state.syncScore);
  const [handle, setHandle] = useState("");
  const [board, setBoard] = useState<{name: string, score: number}[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const fetchBoard = async () => {
    const { data } = await supabase
      .from('leaderboard')
      .select('name, score')
      .order('score', { ascending: false })
      .limit(10);
    if (data) setBoard(data);
  };

  useEffect(() => { fetchBoard(); }, []);

  const handleSubmit = async () => {
    if (handle.length !== 3) return;
    await syncScore(handle, score);
    setSubmitted(true);
    fetchBoard();
  };

  return (
    <div className="absolute inset-0 z-[120] bg-black flex flex-col items-center justify-center p-8 font-mono animate-in fade-in duration-500">
      <div className="max-w-xl w-full border-2 border-[#E056FD] bg-[#0a0010] p-10 shadow-[0_0_50px_rgba(224,86,253,0.4)] text-center">
        <h1 className="text-4xl font-black text-[#E056FD] tracking-tighter mb-4 uppercase">
          System Reclaimed
        </h1>
        
        <div className="h-px w-full bg-[#333] mb-6"></div>
        
        {/* INPUT ZONE */}
        {!submitted ? (
            <div className="bg-black/50 border border-[#FF003C] p-6 mb-8 text-center animate-pulse">
                <p className="text-[#FF003C] text-[10px] font-bold mb-4 uppercase tracking-widest">Identify Yourself, Operator:</p>
                <input 
                    maxLength={3}
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toUpperCase())}
                    className="bg-transparent border-b-2 border-[#E056FD] text-5xl text-center w-32 focus:outline-none text-[#E056FD] tracking-[0.2em]"
                    placeholder="???"
                />
                <button onClick={handleSubmit} className="block mx-auto mt-6 px-8 py-2 bg-[#E056FD] text-black font-black hover:bg-white transition-all uppercase text-xs">
                    Uplink Score
                </button>
            </div>
        ) : (
            <div className="space-y-2 mb-8">
               <div className="text-[#39ff14] text-[10px] uppercase font-bold mb-2">Global_Grid // Top_10</div>
               {board.map((entry, i) => (
                   <div key={i} className="flex justify-between text-xs border-b border-white/5 py-1">
                       <span className="text-white/40">{i+1}. {entry.name}</span>
                       <span className="text-[#E056FD]">{entry.score.toLocaleString()}</span>
                   </div>
               ))}
            </div>
        )}

        <button
          onClick={onRestart}
          className="w-full py-4 bg-[#E056FD] text-black font-black text-lg hover:bg-white transition-all uppercase tracking-widest"
        >
          Reboot Simulation
        </button>
      </div>
    </div>
  );
};