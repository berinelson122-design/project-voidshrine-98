import React, { useState, useRef, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameStats } from './types';
import { Play, Pause, Upload, Volume2 } from 'lucide-react';
import { PALETTE, BOSS_MAX_HEALTH } from './constants';

const App: React.FC = () => {
  const [stats, setStats] = useState<GameStats>({ score: 0, lives: 3, bombs: 3, power: 0, graze: 0, bossHealth: BOSS_MAX_HEALTH, bossPhase: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [customAudio, setCustomAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setCustomAudio(URL.createObjectURL(file));
  };

  useEffect(() => {
      if (customAudio && isPlaying) {
          if (!audioRef.current) audioRef.current = new Audio(customAudio);
          audioRef.current.loop = true;
          isPaused ? audioRef.current.pause() : audioRef.current.play();
      }
      return () => { audioRef.current?.pause(); };
  }, [customAudio, isPlaying, isPaused]);

  return (
    <div className="h-screen bg-black flex items-center justify-center overflow-hidden touch-none font-mono text-[#E056FD]">
      
      {/* GAME CONTAINER */}
      <div className="relative w-full max-w-[100vh] aspect-[4/3] bg-[#050505] border-2 border-[#333] shadow-[0_0_50px_rgba(224,86,253,0.1)]">
        
        {isPlaying ? (
            <GameCanvas 
                customAudioSrc={customAudio} 
                setStats={setStats} 
                onGameOver={() => setIsPlaying(false)} 
                isPaused={isPaused}
            />
        ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50">
                <h1 className="text-6xl font-bold tracking-tighter mb-8 text-[#FF003C] animate-pulse">SHRINE-98</h1>
                <button 
                    onClick={() => setIsPlaying(true)}
                    className="px-8 py-3 bg-[#E056FD] text-black font-bold text-xl hover:scale-105 transition-transform"
                >
                    INITIATE PROTOCOL
                </button>
                <div className="mt-8 flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer border border-[#333] px-4 py-2 hover:border-[#E056FD]">
                        <Upload size={16}/> Load MP3
                        <input type="file" accept="audio/*" onChange={handleFile} className="hidden"/>
                    </label>
                </div>
            </div>
        )}

        {/* SIDEBAR UI (DESKTOP) */}
        <div className="absolute top-0 right-[-200px] w-[180px] h-full hidden md:flex flex-col gap-4 text-xs">
            <div className="bg-[#111] border border-[#333] p-4">
                <div className="text-[#FF003C] font-bold text-xl mb-2">{stats.score.toString().padStart(9, '0')}</div>
                <div className="mb-1">LIVES: {"♥".repeat(Math.max(0, stats.lives))}</div>
                <div className="mb-1">BOMBS: {"★".repeat(Math.max(0, stats.bombs))}</div>
                <div className="mb-1">POWER: {stats.power}/128</div>
                <div className="mb-1">GRAZE: {stats.graze}</div>
            </div>
            
            {/* BOSS BAR */}
            <div className="bg-[#111] border border-[#333] p-4">
                <div className="mb-1 text-[#FF003C]">BOSS PHASE {stats.bossPhase + 1}</div>
                <div className="w-full h-2 bg-[#333]">
                    <div className="h-full bg-[#FF003C]" style={{width: `${Math.max(0, (stats.bossHealth % 4000) / 4000 * 100)}%`}}></div>
                </div>
            </div>

            <button onClick={() => setIsPaused(!isPaused)} className="mt-auto border border-[#333] p-2 hover:bg-[#222]">
                {isPaused ? "RESUME" : "PAUSE"}
            </button>
        </div>

        {/* MOBILE CONTROLS OVERLAY */}
        <div className="absolute inset-0 md:hidden pointer-events-none z-40 flex flex-col justify-end p-4">
            <div className="flex justify-between items-end w-full pointer-events-auto">
                <div className="w-32 h-32 bg-white/5 border border-white/20 rounded-full flex items-center justify-center">MOVE</div>
                <div className="flex gap-4">
                    <div className="w-16 h-16 bg-red-900/50 rounded-full border border-red-500 flex items-center justify-center text-xs">BOMB</div>
                    <div className="w-20 h-20 bg-purple-900/50 rounded-full border border-purple-500 flex items-center justify-center text-xs">FIRE</div>
                </div>
            </div>
        </div>

        {/* WATERMARK */}
        <div className="absolute bottom-2 right-2 text-[10px] text-[#E056FD] opacity-50 pointer-events-none">
            ARCHITECT // VOID_WEAVER
        </div>

      </div>
    </div>
  );
};

export default App;