import React, { useState, useRef, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { DialogueOverlay } from './components/DialogueOverlay'; // NEW IMPORT
import { GameStats } from './types';
import { Upload, Volume2 } from 'lucide-react';
import { PALETTE, BOSS_MAX_HEALTH } from './constants';

const App: React.FC = () => {
  const [stats, setStats] = useState<GameStats>({ score: 0, lives: 3, bombs: 3, power: 0, graze: 0, bossHealth: BOSS_MAX_HEALTH, bossPhase: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showStory, setShowStory] = useState(false); // NEW STATE
  const [customAudio, setCustomAudio] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setCustomAudio(URL.createObjectURL(file));
  };

  useEffect(() => {
      if (customAudio && isPlaying) {
          if (!audioRef.current) audioRef.current = new Audio(customAudio);
          audioRef.current.src = customAudio;
          audioRef.current.loop = true;
          audioRef.current.volume = volume;
          audioRef.current.play();
      }
      return () => { audioRef.current?.pause(); };
  }, [customAudio, isPlaying, volume]);

  // NEW HANDLERS
  const startSequence = () => setShowStory(true);
  const concludeStory = () => {
      setShowStory(false);
      setIsPlaying(true);
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden touch-none font-mono selection:bg-[#E056FD]">
      
      {/* UNIVERSAL WIDESCREEN CONTAINER */}
      <div className="relative w-full h-full max-w-[1600px] flex items-center justify-center bg-[#000]">
        
        {/* STORY OVERLAY */}
        {showStory && <DialogueOverlay onComplete={concludeStory} />}

        {isPlaying ? (
            <GameCanvas 
                customAudioSrc={customAudio} 
                setStats={setStats} 
                onGameOver={() => setIsPlaying(false)} 
                isPaused={false}
            />
        ) : (
            <div className="relative z-50 p-1 bg-black border-2 border-[#E056FD] shadow-[0_0_30px_#E056FD66] transition-opacity duration-500">
                <div className="bg-black border border-[#E056FD] p-10 flex flex-col items-center">
                    <h1 className="text-5xl font-bold tracking-tighter mb-2 text-white">SHRINE-98</h1>
                    <p className="text-[10px] text-[#E056FD] mb-8 tracking-[0.4em] uppercase">Vertical Danmaku Engine</p>
                    
                    <button 
                        onClick={startSequence} // UPDATED
                        className="w-full py-4 bg-[#E056FD] text-black font-black text-xl hover:bg-white transition-colors uppercase mb-6"
                    >
                        Initialize
                    </button>

                    <div className="w-full space-y-4 border-t border-[#333] pt-6">
                        <label className="flex items-center justify-center gap-3 cursor-pointer text-xs text-[#E056FD] hover:text-white transition-all">
                            <Upload size={14}/> [ LOAD ARK MP3 ]
                            <input type="file" accept="audio/*" onChange={handleFile} className="hidden"/>
                        </label>
                        <div className="flex items-center gap-4">
                            <Volume2 size={14} className="text-[#E056FD]"/>
                            <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e)=>setVolume(parseFloat(e.target.value))} className="flex-1 accent-[#E056FD] h-1 bg-[#222] rounded-full"/>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* PERSISTENT WATERMARK */}
        <div className="fixed bottom-4 right-4 flex flex-col items-end opacity-60 pointer-events-none z-[110]">
            <span className="text-[10px] text-[#E056FD] font-bold tracking-tighter">ARCHITECT // VOID_WEAVER</span>
            <span className="text-[8px] text-[#E056FD] opacity-50">SYS // SHRINE_98_REDUX</span>
        </div>
      </div>
    </div>
  );
};

export default App;