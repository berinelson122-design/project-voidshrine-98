import React, { useState, useRef, useEffect } from 'react';
import { GameStats, GameMode } from './types';
import { BOSS_MAX_HEALTH } from './constants';
import { GameCanvas } from './components/GameCanvas';
import { DialogueOverlay } from './components/DialogueOverlay';
import { VictoryScreen } from './components/VictoryScreen';
import { DuelLink } from './components/DuelLink';
import { Upload, Volume2, Power, Ghost, Save, Play, Gamepad2 } from 'lucide-react';
import { useUniversalInput } from './hooks/useUniversalInput';
import { ModeSelector } from './components/ui/ModeSelector';
import { ControlSettings } from './components/ui/ControlSettings';
import { audioSynth } from './services/AudioSynth';
import { useGhostRun } from './hooks/useGhostRun';

/**
 * ARCHITECT // VOID_WEAVER
 * MAIN_CONTROL_CORE // v3.6
 */

export const App: React.FC = () => {
    useUniversalInput(); // Initialize global command bridge
    const { isRecording, startRecording, stopAndExport, loadGhostData } = useGhostRun();

    // REGISTRY_STATE
    const [stats, setStats] = useState<GameStats>({
        score: 0, lives: 3, bombs: 3, power: 0, graze: 0,
        bossHealth: BOSS_MAX_HEALTH, bossPhase: 0, fps: 60, hiscore: 0
    });
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameMode, setGameMode] = useState<GameMode>(GameMode.NORMAL);
    const [showStory, setShowStory] = useState(false);
    const [isVictory, setIsVictory] = useState(false);
    // --- START NEW CODE: HARDWARE CONTROL SETTINGS STATE ---
    const [showControlsModal, setShowControlsModal] = useState(false);
    // --- END NEW CODE ---
    const [customAudio, setCustomAudio] = useState<string | null>(null);
    const [volume, setVolume] = useState(0.5);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // RESOURCE_UPLINK: ARK MP3
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setCustomAudio(URL.createObjectURL(file));
    };

    useEffect(() => {
        if (customAudio && isPlaying) {
            audioSynth.init();
            if (!audioRef.current) {
                audioRef.current = new Audio(customAudio);
                audioRef.current.crossOrigin = "anonymous";
                audioSynth.connectExternalAudio(audioRef.current);
            }
            audioRef.current.src = customAudio;
            audioRef.current.loop = true;
            audioRef.current.volume = volume;
            audioSynth.resumeContext().then(() => {
                audioRef.current?.play().catch(console.error);
            });
        }
        return () => {
            if (audioRef.current && !isPlaying) audioRef.current.pause();
        };
    }, [customAudio, isPlaying, volume]);

    // LOGIC_HANDSHAKES
    const startSequence = () => setShowStory(true);
    const concludeStory = () => { setShowStory(false); setIsPlaying(true); };
    const handleReboot = () => {
        setIsVictory(false);
        setIsPlaying(false);
        setShowStory(false);
        console.log("--> [SYSTEM]: REBOOTING_TITLE_NODE");
    };
    const handleRemoteCursor = (pos: { x: number, y: number }) => { /* P2P logic placeholder */ };

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden touch-none font-mono selection:bg-[#E056FD]">
            <div className="relative w-full h-full max-w-[1600px] flex items-center justify-center bg-[#000]">

                {/* OVERLAY: STORY_PROTOCOL */}
                {showStory && <DialogueOverlay onComplete={concludeStory} />}

                {/* OVERLAY: VICTORY_DATA */}
                {isVictory && <VictoryScreen score={stats.score} onRestart={handleReboot} />}

                {isPlaying ? (
                    <>
                        {/* EMERGENCY ESCAPE NODE */}
                        <button
                            onClick={handleReboot}
                            className="absolute top-6 right-6 z-[200] flex items-center gap-2 px-4 py-2 bg-black/50 border border-[#FF003C] text-[#FF003C] hover:bg-[#FF003C] hover:text-black font-black text-[10px] uppercase tracking-widest transition-all"
                        >
                            <Power size={12} /> [ TERMINATE_UPLINK ]
                        </button>

                        <GameCanvas
                            customAudioSrc={customAudio}
                            setStats={setStats}
                            onGameOver={() => setIsPlaying(false)}
                            isPaused={false}
                            mode={gameMode}
                        />
                    </>
                ) : !isVictory && !showStory && (
                    /* --- MAIN MENU INTERFACE --- */
                    <div className="relative z-50 p-1 bg-black border-2 border-[#E056FD] shadow-[0_0_40px_rgba(224,86,253,0.3)] animate-in fade-in zoom-in duration-500">
                        <div className="bg-black border border-[#E056FD] p-10 flex flex-col items-center gap-6 w-[400px]">
                            <div className="text-center">
                                <h1 className="text-6xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_#E056FD]">SHRINE-98</h1>
                                <p className="text-[10px] text-[#E056FD] tracking-[0.4em] uppercase mt-2">Sovereignty Protocol // v4.0</p>
                            </div>

                            <ModeSelector selectedMode={gameMode} onSelect={setGameMode} />

                            <button
                                onClick={startSequence}
                                className="w-full py-4 bg-[#E056FD] text-black font-black text-xl hover:bg-white hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest"
                            >
                                Initialize
                            </button>

                            {/* ARK RADIO & VOLUME */}
                            <div className="w-full space-y-4 border-t border-[#333] pt-6">
                                <label className="flex items-center justify-center gap-3 cursor-pointer text-[10px] text-[#E056FD] hover:text-white transition-all border border-[#333] py-2 hover:border-[#E056FD] uppercase font-bold">
                                    <Upload size={14} /> [ LOAD ARK MP3 ]
                                    <input type="file" accept="audio/*" onChange={handleFile} className="hidden" />
                                </label>
                                <div className="flex items-center gap-4 px-2">
                                    <Volume2 size={14} className="text-[#E056FD]" />
                                    <input
                                        type="range" min="0" max="1" step="0.01" value={volume}
                                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                                        className="flex-1 accent-[#E056FD] bg-[#333] h-1 appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* GHOST NODE CONTROLS */}
                            <div className="w-full space-y-2 border-t border-[#333] pt-4">
                                <div className="flex justify-between items-center gap-2">
                                    {isRecording ? (
                                        <button onClick={stopAndExport} className="flex-1 py-2 bg-[#FF003C] text-black font-black text-[10px] uppercase animate-pulse flex items-center justify-center gap-2">
                                            <Save size={12} /> [ EXPORT GHOST ]
                                        </button>
                                    ) : (
                                        <button onClick={startRecording} className="flex-1 py-2 bg-transparent text-[#FF003C] font-bold text-[10px] uppercase hover:bg-[#FF003C]/20 border border-[#FF003C] transition-all flex items-center justify-center gap-2">
                                            <Ghost size={12} /> [ RECORD RUN ]
                                        </button>
                                    )}

                                    <label className="flex-1 py-2 text-center bg-transparent text-[#00F3FF] font-bold text-[10px] uppercase hover:bg-[#00F3FF]/20 border border-[#00F3FF] cursor-pointer transition-all flex items-center justify-center gap-2">
                                        <Play size={12} /> [ LOAD GHOST ]
                                        <input type="file" accept=".json" onChange={loadGhostData} className="hidden" />
                                    </label>
                                </div>

                                {/* --- START NEW CODE: HARDWARE CONTROL SETTINGS BUTTON --- */}
                                <button
                                    onClick={() => setShowControlsModal(!showControlsModal)}
                                    className="w-full py-2 bg-transparent text-[#E056FD] font-bold text-[10px] uppercase hover:bg-[#E056FD]/20 border border-[#E056FD] transition-all flex items-center justify-center gap-2"
                                >
                                    <Gamepad2 size={12} /> [ DEVICE CONTROL MAPPING ]
                                </button>
                                {/* --- END NEW CODE --- */}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- START NEW CODE: HARDWARE CONTROLS OVERLAY MODAL --- */}
                {showControlsModal && (
                    <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="relative max-w-lg w-full">
                            <ControlSettings />
                            <button
                                onClick={() => setShowControlsModal(false)}
                                className="w-full mt-3 py-2 bg-[#E056FD] text-black font-black text-xs hover:bg-white uppercase tracking-widest"
                            >
                                CLOSE CONTROLS
                            </button>
                        </div>
                    </div>
                )}
                {/* --- END NEW CODE --- */}

                {/* BACKGROUND P2P NODE */}
                {!isPlaying && !isVictory && !showStory && (
                    <div className="absolute top-4 left-4 z-50">
                        <DuelLink onPositionUpdate={handleRemoteCursor} />
                    </div>
                )}

                {/* SIGNATURE_WATERMARK */}
                <div className="fixed bottom-6 right-6 flex flex-col items-end opacity-40 pointer-events-none z-[200]">
                    <span className="text-[10px] text-[#E056FD] font-bold tracking-tighter">ARCHITECT // VOID_WEAVER</span>
                    <span className="text-[8px] text-[#E056FD] opacity-50 font-mono tracking-widest uppercase">sys // shrine_98_m2_final</span>
                </div>
            </div>
        </div>
    );
};

export default App;