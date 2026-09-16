import React, { useState, useRef, useEffect } from 'react';
import { GameStats, GameMode } from './types';
import { BOSS_MAX_HEALTH } from './constants';
import { GameCanvas } from './components/GameCanvas';
import { DialogueOverlay } from './components/DialogueOverlay';
import { VictoryScreen } from './components/VictoryScreen';
import { DuelLink } from './components/DuelLink';
import { Upload, Volume2, Power, Ghost, Save, Play, Gamepad2, Trophy, Music, Network } from 'lucide-react';
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

  const [customAudio, setCustomAudio] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
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
      audioRef.current.volume = volume;
      audioSynth.resumeContext().then(() => {
        audioRef.current?.play().catch(console.error);
      });
    }
    return () => {
      if (audioRef.current && !isPlaying) audioRef.current.pause();
    };
  }, [customAudio, isPlaying, volume]);

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
          <div className="relative z-50 p-1 bg-black border-2 border-[#E056FD] shadow-[0_0_40px_rgba(224,86,253,0.3)] animate-in fade-in zoom-in duration-500">
            <div className="bg-black border border-[#E056FD] p-8 flex flex-col items-center gap-4 w-[420px]">
              <div className="text-center">
                <h1 className="text-5xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_#E056FD]">SHRINE-98</h1>
                <p className="text-[10px] text-[#E056FD] tracking-[0.4em] uppercase mt-1">Sovereignty Protocol // v3.8</p>
              </div>

              <ModeSelector selectedMode={gameMode} onSelect={setGameMode} />

              <button
                onClick={startSequence}
                className="w-full py-3.5 bg-[#E056FD] text-black font-black text-lg hover:bg-white hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(224,86,253,0.5)]"
              >
                Initialize Flight
              </button>

              {/* SCOREBOARD & CSV EXPORT BUTTON */}
              <button
                onClick={() => setShowScoreboardModal(true)}
                className="w-full py-2.5 bg-black border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(255,215,0,0.25)]"
              >
                <Trophy size={14} />
                <span>Scoreboard // CSV Export</span>
              </button>

              {/* UNIVERSAL ARK AUDIO BUFFER (Supports MP3, M4A, OGG, WAV, FLAC, AAC, WEBM) */}
              <div className="w-full space-y-3 border-t border-[#222] pt-4">
                <label className="flex flex-col items-center justify-center gap-1 cursor-pointer text-[10px] text-[#E056FD] hover:text-white transition-all border border-[#333] hover:border-[#E056FD] py-2 bg-[#050505] uppercase font-bold">
                  <div className="flex items-center gap-2">
                    <Music size={13} className="text-[#00F3FF]" />
                    <span>[ LOAD ARK AUDIO (MP3/M4A/OGG/WAV/FLAC) ]</span>
                  </div>
                  {audioFileName && (
                    <span className="text-[9px] text-[#39FF14] truncate max-w-[280px]">
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

                <div className="flex items-center gap-3 px-2">
                  <Volume2 size={14} className="text-[#E056FD]" />
                  <input
                    type="range" min="0" max="1" step="0.01" value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="flex-1 accent-[#E056FD] bg-[#333] h-1 appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* HARDWARE MAPPING & GHOST CONTROLS */}
              <div className="w-full space-y-2 border-t border-[#222] pt-3">
                <div className="flex justify-between items-center gap-2">
                  {isRecording ? (
                    <button onClick={stopAndExport} className="flex-1 py-1.5 bg-[#FF003C] text-black font-black text-[9px] uppercase animate-pulse flex items-center justify-center gap-1">
                      <Save size={11} /> [ EXPORT GHOST ]
                    </button>
                  ) : (
                    <button onClick={startRecording} className="flex-1 py-1.5 bg-transparent text-[#FF003C] font-bold text-[9px] uppercase hover:bg-[#FF003C]/20 border border-[#FF003C] transition-all flex items-center justify-center gap-1">
                      <Ghost size={11} /> [ RECORD RUN ]
                    </button>
                  )}

                  <label className="flex-1 py-1.5 text-center bg-transparent text-[#00F3FF] font-bold text-[9px] uppercase hover:bg-[#00F3FF]/20 border border-[#00F3FF] cursor-pointer transition-all flex items-center justify-center gap-1">
                    <Play size={11} /> [ LOAD GHOST ]
                    <input type="file" accept=".json" onChange={loadGhostData} className="hidden" />
                  </label>
                </div>

                <button
                  onClick={() => setShowControlsModal(!showControlsModal)}
                  className="w-full py-1.5 bg-transparent text-gray-400 hover:text-white font-bold text-[9px] uppercase hover:bg-[#E056FD]/10 border border-[#333] hover:border-[#E056FD] transition-all flex items-center justify-center gap-1.5"
                >
                  <Gamepad2 size={12} /> [ DEVICE CONTROL MAPPING ]
                </button>
                <button
                  onClick={() => setShowDuelLink(true)}
                  className="w-full py-1.5 bg-transparent text-[#39FF14] hover:text-white font-bold text-[9px] uppercase hover:bg-[#39FF14]/10 border border-[#333] hover:border-[#39FF14] transition-all flex items-center justify-center gap-1.5"
                >
                  <Network size={12} /> [ P2P DUEL NETWORK (PRESS C) ]
                </button>
              </div>
            </div>
          </div>
        )}

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