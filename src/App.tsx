import React, { useState, useRef, useEffect } from 'react';
import { GameStats, GameMode } from './types';
import { BOSS_MAX_HEALTH } from './constants';
import { GameCanvas } from './components/GameCanvas';
import { DialogueOverlay } from './components/DialogueOverlay';
import { VictoryScreen } from './components/VictoryScreen';
import { DuelLink } from './components/DuelLink';
import { Upload, Volume2 } from 'lucide-react';
import { ControlSettings } from './components/ui/ControlSettings';
import { useUniversalInput } from './hooks/useUniversalInput';
import { ViewportShield } from './components/layout/ViewportShield';
import { ModeSelector } from './components/ui/ModeSelector';
import { audioSynth } from './services/AudioSynth';
import { Terminal, Shield, Zap } from 'lucide-react';


export const App: React.FC = () => {
    useUniversalInput(); // Initialize global input listeners
    const [stats, setStats] = useState<GameStats>({ score: 0, lives: 3, bombs: 3, power: 0, graze: 0, bossHealth: BOSS_MAX_HEALTH, bossPhase: 0, fps: 60, hiscore: 0, pressure: 0, topography: 0 });
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameMode, setGameMode] = useState<GameMode>(GameMode.NORMAL);
    const [showStory, setShowStory] = useState(false);
    const [isVictory, setIsVictory] = useState(false);
    const [customAudio, setCustomAudio] = useState<string | null>(null);
    const [volume, setVolume] = useState(0.5);
    const audioRef = useRef<HTMLAudioElement | null>(null);


    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setCustomAudio(URL.createObjectURL(file));
    };


    useEffect(() => {
        if (customAudio && isPlaying) {
            if (!audioRef.current) {
                audioRef.current = new Audio(customAudio);
                audioSynth.init();
                audioSynth.connectExternalAudio(audioRef.current);
            }
            audioRef.current.src = customAudio;
            audioRef.current.loop = true;
            audioRef.current.volume = volume;

            // Re-init audioSynth directly on play gesture to ensure context isn't suspended
            audioRef.current.play().then(() => {
                let Ctx = window.AudioContext || (window as any).webkitAudioContext;
            }).catch(console.error);
        }
        return () => { audioRef.current?.pause(); };
    }, [customAudio, isPlaying, volume]);




    const startSequence = () => setShowStory(true);
    const concludeStory = () => { setShowStory(false); setIsPlaying(true); };
    const handleReboot = () => { setIsVictory(false); setIsPlaying(false); setShowStory(false); };
    const handleRemoteCursor = (pos: { x: number, y: number }) => { console.log("Remote signal:", pos); };


    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden touch-none font-mono selection:bg-[#E056FD]">
            <div className="relative w-full h-full max-w-[1600px] flex items-center justify-center bg-[#000]">


                {showStory && <DialogueOverlay onComplete={concludeStory} />}
                {isVictory && <VictoryScreen score={stats.score} onRestart={handleReboot} />}


                {isPlaying ? (
                    <GameCanvas
                        customAudioSrc={customAudio}
                        setStats={setStats}
                        onGameOver={() => setIsPlaying(false)}
                        isPaused={false}
                        mode={gameMode}
                    />
                ) : !isVictory && !showStory && (
                    <div className="relative z-50 p-1 bg-black border-2 border-[#E056FD] shadow-[0_0_30px_#E056FD66] animate-in fade-in zoom-in">
                        <div className="bg-black border border-[#E056FD] p-10 flex flex-col items-center gap-6">
                            <h1 className="text-6xl font-bold tracking-tighter text-white drop-shadow-[0_0_10px_#E056FD]">SHRINE-98</h1>
                            <p className="text-[10px] text-[#E056FD] tracking-[0.4em] uppercase">Vertical Danmaku Engine // v3.5</p>
                            <ModeSelector selectedMode={gameMode} onSelect={setGameMode} />
                            <button onClick={startSequence} className="w-full py-4 bg-[#E056FD] text-black font-black text-xl hover:bg-white hover:scale-105 transition-all uppercase tracking-widest">Initialize</button>
                            <div className="w-full space-y-4 border-t border-[#333] pt-6">
                                <label className="flex items-center justify-center gap-3 cursor-pointer text-xs text-[#E056FD] hover:text-white transition-all border border-[#333] py-2 hover:border-[#E056FD]">
                                    <Upload size={14} /> [ LOAD ARK MP3 ]
                                    <input type="file" accept="audio/*" onChange={handleFile} className="hidden" />
                                </label>
                                <div className="flex items-center gap-4">
                                    <Volume2 size={14} className="text-[#E056FD]" />
                                    <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="flex-1 accent-[#E056FD] h-1 bg-[#222] rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {!isPlaying && !isVictory && !showStory && <div className="absolute top-4 left-4 z-50"><DuelLink onPositionUpdate={handleRemoteCursor} /></div>}


                <div className="fixed bottom-4 right-4 flex flex-col items-end opacity-60 pointer-events-none z-[200]">
                    <span className="text-[10px] text-[#E056FD] font-bold tracking-tighter">ARCHITECT // VOID_WEAVER</span>
                    <span className="text-[8px] text-[#E056FD] opacity-50">SYS // SHRINE_98_REDUX</span>
                </div>
            </div>
        </div>
    );
};


export default App;