import React, { useState, useRef, useEffect } from 'react';
import { GameStats, GameMode } from './types';
import { BOSS_MAX_HEALTH } from './constants';
import { GameCanvas } from './components/GameCanvas';
import { DialogueOverlay } from './components/DialogueOverlay';
import { VictoryScreen } from './components/VictoryScreen';
import { DuelLink } from './components/DuelLink';
import { Upload, Volume2, VolumeX, Power, Ghost, Save, Play, Gamepad2, Trophy, Music, Network, Tv } from 'lucide-react';
import { useUniversalInput } from './hooks/useUniversalInput';
import { ModeSelector } from './components/ui/ModeSelector';
import { ControlSettings } from './components/ui/ControlSettings';
import { ScoreboardModal } from './components/ui/ScoreboardModal';
import { audioSynth } from './services/AudioSynth';
import { useGhostRun } from './hooks/useGhostRun';

export const App: React.FC = () => {
  useUniversalInput();
  const { isRecording, startRecording, stopAndExport, loadGhostData } = useGhostRun();

  const [stats, setStats] = useState<GameStats>({
    score: 0, lives: 3, bombs: 3, power: 0, graze: 0,
    bossHealth: BOSS_MAX_HEALTH, bossPhase: 0, fps: 60, hiscore: 0
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.NORMAL);
  const [showStory, setShowStory] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [showControlsModal, setShowControlsModal] = useState(false);
  const [showScoreboardModal, setShowScoreboardModal] = useState(false);
  const [showDuelLink, setShowDuelLink] = useState(false);

  // --- START NEW CODE: SCANLINES CONFIGURATION PROTOCOL ---
  const [scanlinesEnabled, setScanlinesEnabled] = useState<boolean>(() => {
    return localStorage.getItem('SHRINE98_SCANLINES') !== 'false';
  });

  const toggleScanlines = () => {
    setScanlinesEnabled(prev => {
      const next = !prev;
      localStorage.setItem('SHRINE98_SCANLINES', String(next));
      return next;
    });
  };
  // --- END NEW CODE: SCANLINES CONFIGURATION PROTOCOL ---

  const [customAudio, setCustomAudio] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFileName(file.name);
      setCustomAudio(URL.createObjectURL(file));
      audioSynth.playExtend();
    }
  };

  useEffect(() => {
    audioSynth.setVolume(volume);
    audioSynth.setMuted(isMuted);
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'c' && !isPlaying && !showStory && !isVictory) {
        setShowDuelLink(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, showStory, isVictory]);

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
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.muted = isMuted;
      audioSynth.resumeContext().then(() => {
        audioRef.current?.play().catch(console.error);
      });
    }
    return () => {
      if (audioRef.current && !isPlaying) audioRef.current.pause();
    };
  }, [customAudio, isPlaying, volume, isMuted]);

  const startSequence = () => setShowStory(true);
  const concludeStory = () => { setShowStory(false); setIsPlaying(true); };
  const handleReboot = () => {
    setIsVictory(false);
    setIsPlaying(false);
    setShowStory(false);
  };
  const handleRemoteCursor = (_pos: { x: number, y: number }) => {};

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden touch-none font-mono selection:bg-[#E056FD]">
      <div className="relative w-full h-full max-w-[1600px] flex items-center justify-center bg-[#000]">

        {showStory && <DialogueOverlay onComplete={concludeStory} />}

        {isVictory && <VictoryScreen score={stats.score} onRestart={handleReboot} />}

        {isPlaying ? (
          <>
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
          <div className="relative z-50 p-0.5 sm:p-1 bg-black border-2 border-[#E056FD] shadow-[0_0_40px_rgba(224,86,253,0.3)] animate-in fade-in zoom-in duration-500 w-[94vw] max-w-[420px] max-h-[95vh] flex flex-col my-auto">
            <div className="bg-black border border-[#E056FD] p-3 sm:p-5 md:p-6 flex flex-col items-center gap-2 sm:gap-3 overflow-y-auto custom-scrollbar w-full">
              <div className="text-center shrink-0">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_#E056FD]">SHRINE-98</h1>
                <p className="text-[8px] sm:text-[10px] text-[#E056FD] tracking-[0.3em] sm:tracking-[0.4em] uppercase mt-0.5 sm:mt-1 font-bold">Sovereignty Protocol // v3.8</p>
              </div>

              <ModeSelector selectedMode={gameMode} onSelect={setGameMode} />

              <button
                onClick={startSequence}
                className="w-full py-2.5 sm:py-3 bg-[#E056FD] text-black font-black text-sm sm:text-base md:text-lg hover:bg-white hover:scale-[1.01] active:scale-95 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(224,86,253,0.5)] shrink-0"
              >
                Initialize Flight
              </button>

              {/* SCOREBOARD & CSV EXPORT BUTTON */}
              <button
                onClick={() => setShowScoreboardModal(true)}
                className="w-full py-2 sm:py-2.5 bg-black border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black font-bold text-[10px] sm:text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(255,215,0,0.25)] shrink-0"
              >
                <Trophy size={13} />
                <span>Scoreboard // CSV Export</span>
              </button>

              {/* UNIVERSAL ARK AUDIO BUFFER (Supports MP3, M4A, OGG, WAV, FLAC, AAC, WEBM) */}
              <div className="w-full space-y-2 border-t border-[#222] pt-2 sm:pt-3 shrink-0">
                <label className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 cursor-pointer text-[9px] sm:text-[10px] text-[#E056FD] hover:text-white transition-all border border-[#333] hover:border-[#E056FD] py-1.5 sm:py-2 bg-[#050505] uppercase font-bold">
                  <div className="flex items-center gap-1.5">
                    <Music size={12} className="text-[#00F3FF]" />
                    <span className="truncate">[ LOAD ARK AUDIO (MP3/M4A/OGG/WAV) ]</span>
                  </div>
                  {audioFileName && (
                    <span className="text-[8px] sm:text-[9px] text-[#39FF14] truncate max-w-[260px]">
                      ACTIVE: {audioFileName}
                    </span>
                  )}
                  <input
                    type="file"
                    accept=".mp3,.m4a,.ogg,.wav,.flac,.aac,.webm,audio/*"
                    onChange={handleAudioUpload}
                    className="hidden"
                  />
                </label>

                <div className="flex items-center gap-2 px-1">
                  <button
                    type="button"
                    onClick={() => {
                      const nextMuted = !isMuted;
                      setIsMuted(nextMuted);
                      audioSynth.setMuted(nextMuted);
                    }}
                    title={isMuted ? "UNMUTE ALL AUDIO" : "MUTE ALL AUDIO"}
                    className={`p-1.5 border transition-all flex items-center justify-center shrink-0 ${
                      isMuted
                        ? 'border-[#FF003C] bg-[#FF003C]/20 text-[#FF003C] shadow-[0_0_10px_rgba(255,0,60,0.5)]'
                        : 'border-[#333] bg-black text-[#E056FD] hover:border-[#E056FD] hover:text-white'
                    }`}
                  >
                    {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  </button>
                  <input
                    type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume}
                    disabled={isMuted}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      audioSynth.setVolume(v);
                      if (isMuted) setIsMuted(false);
                    }}
                    className={`flex-1 accent-[#E056FD] bg-[#333] h-1 appearance-none cursor-pointer ${isMuted ? 'opacity-30 cursor-not-allowed' : ''}`}
                  />
                  <span className={`text-[8px] sm:text-[9px] font-bold w-9 text-right font-mono ${isMuted ? 'text-[#FF003C]' : 'text-gray-400'}`}>
                    {isMuted ? 'MUTE' : `${Math.round(volume * 100)}%`}
                  </span>
                </div>
              </div>

              {/* HARDWARE MAPPING & GHOST CONTROLS */}
              <div className="w-full space-y-1.5 border-t border-[#222] pt-2 shrink-0">
                <div className="flex justify-between items-center gap-1.5">
                  {isRecording ? (
                    <button onClick={stopAndExport} className="flex-1 py-1.5 bg-[#FF003C] text-black font-black text-[8px] sm:text-[9px] uppercase animate-pulse flex items-center justify-center gap-1">
                      <Save size={10} /> [ EXPORT GHOST ]
                    </button>
                  ) : (
                    <button onClick={startRecording} className="flex-1 py-1.5 bg-transparent text-[#FF003C] font-bold text-[8px] sm:text-[9px] uppercase hover:bg-[#FF003C]/20 border border-[#FF003C] transition-all flex items-center justify-center gap-1">
                      <Ghost size={10} /> [ RECORD RUN ]
                    </button>
                  )}

                  <label className="flex-1 py-1.5 text-center bg-transparent text-[#00F3FF] font-bold text-[8px] sm:text-[9px] uppercase hover:bg-[#00F3FF]/20 border border-[#00F3FF] cursor-pointer transition-all flex items-center justify-center gap-1">
                    <Play size={10} /> [ LOAD GHOST ]
                    <input type="file" accept=".json" onChange={loadGhostData} className="hidden" />
                  </label>
                </div>

                {/* --- START NEW CODE: SCANLINES TOGGLE & CONTROL MAPPING ROW --- */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleScanlines}
                    title={scanlinesEnabled ? "DISABLE CRT SCANLINE EFFECT" : "ENABLE CRT SCANLINE EFFECT"}
                    className={`flex-1 py-1.5 border font-bold text-[8px] sm:text-[9px] uppercase transition-all flex items-center justify-center gap-1.5 ${
                      scanlinesEnabled
                        ? 'border-[#00F3FF] bg-[#00F3FF]/15 text-[#00F3FF] shadow-[0_0_10px_rgba(0,243,255,0.25)]'
                        : 'border-[#333] bg-black text-gray-500 hover:text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <Tv size={11} className={scanlinesEnabled ? 'text-[#00F3FF]' : 'text-gray-500'} />
                    <span>SCANLINES: {scanlinesEnabled ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    onClick={() => setShowControlsModal(!showControlsModal)}
                    className="flex-1 py-1.5 bg-transparent text-gray-400 hover:text-white font-bold text-[8px] sm:text-[9px] uppercase hover:bg-[#E056FD]/10 border border-[#333] hover:border-[#E056FD] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Gamepad2 size={11} /> [ CONTROLS ]
                  </button>
                </div>
                {/* --- END NEW CODE: SCANLINES TOGGLE & CONTROL MAPPING ROW --- */}

                <button
                  onClick={() => setShowDuelLink(true)}
                  className="w-full py-1.5 bg-transparent text-[#39FF14] hover:text-white font-bold text-[8px] sm:text-[9px] uppercase hover:bg-[#39FF14]/10 border border-[#333] hover:border-[#39FF14] transition-all flex items-center justify-center gap-1.5"
                >
                  <Network size={11} /> [ P2P DUEL NETWORK (PRESS C) ]
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- START NEW CODE: CONDITIONAL SCANLINE & CRT FLICKER OVERLAY --- */}
        {scanlinesEnabled && <div className="scanlines crt-flicker" />}
        {/* --- END NEW CODE: CONDITIONAL SCANLINE & CRT FLICKER OVERLAY --- */}

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

        <ScoreboardModal
          isOpen={showScoreboardModal}
          onClose={() => setShowScoreboardModal(false)}
        />

        {showDuelLink && !isPlaying && !isVictory && !showStory && (
          <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative">
              <DuelLink onPositionUpdate={handleRemoteCursor} />
              <button
                onClick={() => setShowDuelLink(false)}
                className="w-full mt-3 py-2 bg-[#FF003C] text-black font-black text-xs hover:bg-white uppercase tracking-widest"
              >
                CLOSE NETWORK
              </button>
            </div>
          </div>
        )}

        <div className="fixed bottom-4 right-4 flex flex-col items-end opacity-40 pointer-events-none z-[200]">
          <span className="text-[10px] text-[#E056FD] font-bold tracking-tighter">ARCHITECT // VOID_WEAVER</span>
          <span className="text-[8px] text-[#E056FD] opacity-50 font-mono tracking-widest uppercase">sys // shrine_98_m2_v3.8</span>
        </div>
      </div>
    </div>
  );
};

export default App;