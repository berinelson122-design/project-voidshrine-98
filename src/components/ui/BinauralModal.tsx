// --- START NEW CODE: BINAURAL BEATS, SMOOTH CROSSFADE, MASTER SYNC & FOCUS PRESETS UI ---
import React, { useState, useEffect, useRef } from 'react';
import { FocusLevelPreset, BrainwaveBand, SavedFocusPreset, RhythmSyncHarmonic } from '../../types';
import {
  FOCUS_PRESETS,
  BRAINWAVE_BANDS,
  RHYTHM_SYNC_HARMONICS,
  getBandForFrequency,
  getSavedFocusPresets,
  saveFocusPreset,
  deleteFocusPreset
} from '../../utils/binauralPresets';
import { audioSynth } from '../../services/AudioSynth';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Activity,
  Headphones,
  Sliders,
  Sparkles,
  Info,
  Waves,
  X,
  Radio,
  Save,
  Trash2,
  Zap,
  Disc,
  Bookmark,
  RefreshCw,
  SlidersHorizontal,
  Gauge,
  Layers,
  ArrowRightLeft,
  ShieldCheck,
  Timer,
  RotateCcw,
  Plus,
  Minus,
  MousePointerClick
} from 'lucide-react';

interface BinauralModalProps {
  isOpen: boolean;
  onClose: () => void;
  binauralVolume: number;
  onVolumeChange: (vol: number) => void;
  isBinauralMuted: boolean;
  onMuteToggle: () => void;
}

export const BinauralModal: React.FC<BinauralModalProps> = ({
  isOpen,
  onClose,
  binauralVolume,
  onVolumeChange,
  isBinauralMuted,
  onMuteToggle,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(() => audioSynth.isBinauralActive());
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>('focus-10');
  const [carrierFreq, setCarrierFreq] = useState<number>(136.1);
  const [beatFreq, setBeatFreq] = useState<number>(7.0);
  const [waveform, setWaveform] = useState<OscillatorType>('sine');
  const [noiseLevel, setNoiseLevel] = useState<number>(0.12);
  const [subHarmonics, setSubHarmonics] = useState<boolean>(true);
  const [customMode, setCustomMode] = useState<boolean>(false);

  // --- START NEW CODE: MASTER SYNC & RHYTHM SYNC STATE ---
  const [masterSyncEnabled, setMasterSyncEnabled] = useState<boolean>(() => audioSynth.getMasterSyncState().enabled);
  const [rhythmSyncEnabled, setRhythmSyncEnabled] = useState<boolean>(() => audioSynth.getRhythmSyncState().enabled);
  const [rhythmHarmonic, setRhythmHarmonic] = useState<RhythmSyncHarmonic>(() => audioSynth.getRhythmSyncState().harmonic);
  const [detectedBpm, setDetectedBpm] = useState<number>(120);
  const [isBpmLocked, setIsBpmLocked] = useState<boolean>(false);
  const [isExternalTrack, setIsExternalTrack] = useState<boolean>(false);
  const [beatFlash, setBeatFlash] = useState<boolean>(false);
  const [tempoRatio, setTempoRatio] = useState<number>(1.0);
  const [syncedCarrierFreq, setSyncedCarrierFreq] = useState<number>(136.1);
  const [isManualOverride, setIsManualOverride] = useState<boolean>(() => audioSynth.getManualBpmState().isManualOverride);
  const [tapCount, setTapCount] = useState<number>(() => audioSynth.getManualBpmState().tapCount);
  const [tapFlash, setTapFlash] = useState<boolean>(false);
  const [tapFeedbackMsg, setTapFeedbackMsg] = useState<string | null>(null);
  // --- END NEW CODE: MASTER SYNC & RHYTHM SYNC STATE ---

  // --- START NEW CODE: SMOOTH CROSSFADE & SAVED PRESETS STATE ---
  const [crossfadeEnabled, setCrossfadeEnabled] = useState<boolean>(() => audioSynth.getCrossfadeConfig().enabled);
  const [crossfadeDurationMs, setCrossfadeDurationMs] = useState<number>(() => audioSynth.getCrossfadeConfig().durationMs);
  const [isCrossfading, setIsCrossfading] = useState<boolean>(false);
  const [savedPresets, setSavedPresets] = useState<SavedFocusPreset[]>(() => getSavedFocusPresets());
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'PRESETS' | 'RHYTHM_SYNC' | 'MANUAL_TUNING'>('PRESETS');
  // --- END NEW CODE: SMOOTH CROSSFADE & SAVED PRESETS STATE ---

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sync state with audioSynth on modal open
  useEffect(() => {
    if (isOpen) {
      const state = audioSynth.getBinauralState();
      setIsPlaying(state.isPlaying);
      const syncState = audioSynth.getRhythmSyncState();
      setRhythmSyncEnabled(syncState.enabled);
      setRhythmHarmonic(syncState.harmonic);

      const mSync = audioSynth.getMasterSyncState();
      setMasterSyncEnabled(mSync.enabled);
      setTempoRatio(mSync.tempoRatio);
      setSyncedCarrierFreq(mSync.syncedCarrierFreq);

      const xFade = audioSynth.getCrossfadeConfig();
      setCrossfadeEnabled(xFade.enabled);
      setCrossfadeDurationMs(xFade.durationMs);

      const manualBpm = audioSynth.getManualBpmState();
      setIsManualOverride(manualBpm.isManualOverride);
      setTapCount(manualBpm.tapCount);

      setSavedPresets(getSavedFocusPresets());

      if (state.activePresetId) {
        setSelectedPresetId(state.activePresetId);
        const preset = FOCUS_PRESETS.find(p => p.id === state.activePresetId);
        if (preset) {
          setCarrierFreq(preset.carrierFreq);
          setBeatFreq(preset.beatFreq);
          setWaveform(preset.waveform);
          setNoiseLevel(preset.noiseLevel);
          setSubHarmonics(preset.subHarmonics);
          setCustomMode(false);
        }
      } else {
        setCarrierFreq(state.carrierFreq);
        setBeatFreq(state.beatFreq);
        setWaveform(state.waveform);
        setNoiseLevel(state.noiseLevel);
        setSubHarmonics(state.subHarmonics);
        setCustomMode(true);
      }
    }
  }, [isOpen]);

  // Real-time BPM polling, Master Sync proportional scaling, and Crossfade state tracking
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const rhythm = audioSynth.getRhythmData();
      setDetectedBpm(rhythm.bpm);
      setIsBpmLocked(rhythm.isBpmLocked);
      setIsExternalTrack(rhythm.isExternalTrack);
      setIsCrossfading(audioSynth.getIsCrossfading());

      const manualBpm = audioSynth.getManualBpmState();
      setIsManualOverride(manualBpm.isManualOverride);
      setTapCount(manualBpm.tapCount);

      const mSync = audioSynth.getMasterSyncState();
      setTempoRatio(mSync.tempoRatio);
      setSyncedCarrierFreq(mSync.syncedCarrierFreq);

      if (rhythm.isBeat) {
        setBeatFlash(true);
        setTimeout(() => setBeatFlash(false), 90);
      }

      if (rhythmSyncEnabled || masterSyncEnabled) {
        const syncFreq = audioSynth.getDynamicRhythmSyncBeatFreq(rhythm.bpm, rhythmHarmonic);
        setBeatFreq(syncFreq);
      }
    }, 60);

    return () => clearInterval(interval);
  }, [isOpen, rhythmSyncEnabled, masterSyncEnabled, rhythmHarmonic]);

  const activeBand: BrainwaveBand = getBandForFrequency(beatFreq);
  const bandInfo = BRAINWAVE_BANDS[activeBand];
  const effectiveCarrier = masterSyncEnabled ? syncedCarrierFreq : carrierFreq;

  // Real-time canvas oscilloscope showing the binaural pulsation & crossfade envelope
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const render = () => {
      time += 0.035;
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, w, h);

      // Grid backdrop
      ctx.strokeStyle = '#151515';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      if (!isPlaying) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();

        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('// SYNTHESIS GENERATOR IDLE - PRESS ENGAGE TUNE //', w / 2, h / 2 - 8);
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const activeCarrier = masterSyncEnabled ? syncedCarrierFreq : carrierFreq;

      // Draw Left Channel Wave (Cyber-Red)
      ctx.strokeStyle = isCrossfading ? 'rgba(255, 0, 60, 0.4)' : 'rgba(255, 0, 60, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const leftFreq = activeCarrier - beatFreq / 2;
        const normX = x / w;
        const phase = time * 2.5 + normX * (leftFreq / 12);
        const y = h / 2 + Math.sin(phase) * (h * (isCrossfading ? 0.12 : 0.22));
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw Right Channel Wave (Cyan)
      ctx.strokeStyle = isCrossfading ? 'rgba(0, 243, 255, 0.4)' : 'rgba(0, 243, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const rightFreq = activeCarrier + beatFreq / 2;
        const normX = x / w;
        const phase = time * 2.5 + normX * (rightFreq / 12);
        const y = h / 2 + Math.sin(phase) * (h * (isCrossfading ? 0.12 : 0.22));
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw Resulting Binaural Envelope (Modulation Beat Wave)
      ctx.strokeStyle = isCrossfading ? '#FFD700' : bandInfo.color;
      ctx.lineWidth = isCrossfading ? 3.0 : 2.5;
      ctx.shadowColor = isCrossfading ? '#FFD700' : bandInfo.color;
      ctx.shadowBlur = isCrossfading ? 14 : 8;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const normX = x / w;
        const beatEnvelope = Math.cos((normX * 4 + time * (beatFreq * 0.25)) * Math.PI);
        const carrierSignal = Math.sin((normX * 30 + time * 10) * Math.PI);
        const crossfadeScale = isCrossfading ? (0.2 + 0.15 * Math.sin(time * 8)) : 0.38;
        const y = h / 2 + beatEnvelope * carrierSignal * (h * crossfadeScale);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Telemetry text overlay
      ctx.fillStyle = isCrossfading ? '#FFD700' : bandInfo.color;
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        isCrossfading
          ? `[SMOOTH CROSSFADE ACTIVE // ADAPTING INTENSITY] ${beatFreq.toFixed(1)} Hz`
          : `BEAT: ${beatFreq.toFixed(1)} Hz [${activeBand}] ${masterSyncEnabled ? '• [MASTER SYNC LOCKED]' : rhythmSyncEnabled ? '• [RHYTHM SYNC ACTIVE]' : ''}`,
        8,
        14
      );

      ctx.fillStyle = '#aaa';
      ctx.textAlign = 'right';
      ctx.fillText(
        `BPM: ${detectedBpm} | CARRIER: ${activeCarrier.toFixed(1)} Hz ${masterSyncEnabled ? `(${tempoRatio.toFixed(2)}x)` : ''} | L: ${(activeCarrier - beatFreq / 2).toFixed(1)} Hz | R: ${(activeCarrier + beatFreq / 2).toFixed(1)} Hz`,
        w - 8,
        14
      );

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, isPlaying, carrierFreq, syncedCarrierFreq, beatFreq, activeBand, bandInfo.color, rhythmSyncEnabled, masterSyncEnabled, detectedBpm, isCrossfading, tempoRatio]);

  if (!isOpen) return null;

  // Smooth Crossfade Handler for Monroe Gateway Presets
  const handleSelectMonroePreset = (preset: FocusLevelPreset) => {
    setSelectedPresetId(preset.id);
    setCarrierFreq(preset.carrierFreq);
    setBeatFreq(preset.beatFreq);
    setWaveform(preset.waveform);
    setNoiseLevel(preset.noiseLevel);
    setSubHarmonics(preset.subHarmonics);
    setCustomMode(false);

    audioSynth.switchPresetWithCrossfade(
      preset.carrierFreq,
      preset.beatFreq,
      preset.waveform,
      preset.noiseLevel,
      preset.subHarmonics,
      preset.id,
      crossfadeDurationMs
    );

    setSaveSuccessMsg(`CROSSFADED: ${preset.focusLevel} // ${preset.name.toUpperCase()}`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  // Smooth Crossfade Handler for Saved Focus Profiles
  const handleLoadSavedPreset = (preset: SavedFocusPreset) => {
    setSelectedPresetId(preset.id);
    setCarrierFreq(preset.carrierFreq);
    setBeatFreq(preset.beatFreq);
    setWaveform(preset.waveform);
    setNoiseLevel(preset.noiseLevel);
    setSubHarmonics(preset.subHarmonics);
    setCustomMode(false);

    audioSynth.switchPresetWithCrossfade(
      preset.carrierFreq,
      preset.beatFreq,
      preset.waveform,
      preset.noiseLevel,
      preset.subHarmonics,
      preset.id,
      crossfadeDurationMs
    );

    setSaveSuccessMsg(`CROSSFADED: ${preset.name.toUpperCase()}`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  const handleSaveCurrentPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const updated = saveFocusPreset({
      name: newPresetName.trim(),
      carrierFreq,
      beatFreq,
      band: activeBand,
      waveform,
      noiseLevel,
      subHarmonics
    });

    setSavedPresets(updated);
    setSaveSuccessMsg(`SAVED: ${newPresetName.trim().toUpperCase()}`);
    setNewPresetName('');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleDeleteSavedPreset = (id: string, name: string) => {
    const updated = deleteFocusPreset(id);
    setSavedPresets(updated);
    setSaveSuccessMsg(`PURGED: ${name.toUpperCase()}`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioSynth.stopBinaural();
      setIsPlaying(false);
    } else {
      audioSynth.startBinaural(
        carrierFreq,
        beatFreq,
        waveform,
        noiseLevel,
        subHarmonics,
        selectedPresetId
      );
      setIsPlaying(true);
      if (masterSyncEnabled) {
        audioSynth.setMasterSync(true);
      } else if (rhythmSyncEnabled) {
        audioSynth.setRhythmSync(true, rhythmHarmonic);
      }
    }
  };

  const handleToggleMasterSync = () => {
    const next = !masterSyncEnabled;
    setMasterSyncEnabled(next);
    audioSynth.setMasterSync(next);
    if (next) {
      setRhythmSyncEnabled(true);
      const syncFreq = audioSynth.getDynamicRhythmSyncBeatFreq(detectedBpm, rhythmHarmonic);
      setBeatFreq(syncFreq);
    }
  };

  const handleToggleRhythmSync = () => {
    const next = !rhythmSyncEnabled;
    setRhythmSyncEnabled(next);
    audioSynth.setRhythmSync(next, rhythmHarmonic);
    if (next) {
      const syncFreq = audioSynth.getDynamicRhythmSyncBeatFreq(detectedBpm, rhythmHarmonic);
      setBeatFreq(syncFreq);
      if (isPlaying) {
        audioSynth.updateBinaural(effectiveCarrier, syncFreq);
      }
    }
  };

  const handleToggleCrossfade = () => {
    const next = !crossfadeEnabled;
    setCrossfadeEnabled(next);
    audioSynth.setCrossfadeConfig(next, crossfadeDurationMs);
  };

  const handleCrossfadeDurationChange = (dur: number) => {
    setCrossfadeDurationMs(dur);
    audioSynth.setCrossfadeConfig(crossfadeEnabled, dur);
  };

  const handleHarmonicChange = (harmonic: RhythmSyncHarmonic) => {
    setRhythmHarmonic(harmonic);
    audioSynth.setRhythmSync(rhythmSyncEnabled || masterSyncEnabled, harmonic);
    if (rhythmSyncEnabled || masterSyncEnabled) {
      const syncFreq = audioSynth.getDynamicRhythmSyncBeatFreq(detectedBpm, harmonic);
      setBeatFreq(syncFreq);
      if (isPlaying) {
        audioSynth.updateBinaural(effectiveCarrier, syncFreq);
      }
    }
  };

  // --- START NEW CODE: TAP TEMPO & MANUAL RHYTHM FALLBACK HANDLERS ---
  const handleTapTempo = () => {
    const res = audioSynth.tapTempo();
    setDetectedBpm(res.bpm);
    setIsBpmLocked(true);
    setIsManualOverride(true);
    setTapCount(res.tapCount);
    setTapFlash(true);
    setTimeout(() => setTapFlash(false), 120);

    if (res.tapCount >= 2) {
      setTapFeedbackMsg(`TEMPO LOCKED: ${res.bpm} BPM [${res.tapCount} TAPS]`);
      if (rhythmSyncEnabled || masterSyncEnabled) {
        const syncFreq = audioSynth.getDynamicRhythmSyncBeatFreq(res.bpm, rhythmHarmonic);
        setBeatFreq(syncFreq);
      }
    } else {
      setTapFeedbackMsg(`TAP DETECTED [1/2] - TAP ONCE MORE`);
    }
    setTimeout(() => setTapFeedbackMsg(null), 3000);
  };

  const handleResetManualBpm = () => {
    audioSynth.resetManualBpm();
    setIsManualOverride(false);
    setTapCount(0);
    const rhythm = audioSynth.getRhythmData();
    setDetectedBpm(rhythm.bpm);
    setIsBpmLocked(rhythm.isBpmLocked);
    setTapFeedbackMsg('RESET // AUTO-DETECT RESTORED');
    setTimeout(() => setTapFeedbackMsg(null), 2500);
  };

  const handleNudgeBpm = (delta: number) => {
    const next = Math.max(40, Math.min(240, detectedBpm + delta));
    audioSynth.setManualBpm(next);
    setDetectedBpm(next);
    setIsBpmLocked(true);
    setIsManualOverride(true);
    if (rhythmSyncEnabled || masterSyncEnabled) {
      const syncFreq = audioSynth.getDynamicRhythmSyncBeatFreq(next, rhythmHarmonic);
      setBeatFreq(syncFreq);
    }
    setTapFeedbackMsg(`MANUAL: ${next} BPM`);
    setTimeout(() => setTapFeedbackMsg(null), 2000);
  };

  const handleManualBpmSlider = (val: number) => {
    audioSynth.setManualBpm(val);
    setDetectedBpm(val);
    setIsBpmLocked(true);
    setIsManualOverride(true);
    if (rhythmSyncEnabled || masterSyncEnabled) {
      const syncFreq = audioSynth.getDynamicRhythmSyncBeatFreq(val, rhythmHarmonic);
      setBeatFreq(syncFreq);
    }
  };

  // Keyboard shortcut listener for Tap Tempo ([T] key)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleTapTempo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, rhythmSyncEnabled, masterSyncEnabled, rhythmHarmonic, detectedBpm]);
  // --- END NEW CODE: TAP TEMPO & MANUAL RHYTHM FALLBACK HANDLERS ---

  const handleCarrierChange = (val: number) => {
    setCarrierFreq(val);
    setSelectedPresetId(null);
    setCustomMode(true);
    if (isPlaying) {
      audioSynth.updateBinaural(val, beatFreq, waveform, noiseLevel, subHarmonics);
    }
  };

  const handleBeatChange = (val: number) => {
    if (rhythmSyncEnabled || masterSyncEnabled) {
      setRhythmSyncEnabled(false);
      setMasterSyncEnabled(false);
      audioSynth.setRhythmSync(false);
      audioSynth.setMasterSync(false);
    }
    setBeatFreq(val);
    setSelectedPresetId(null);
    setCustomMode(true);
    if (isPlaying) {
      audioSynth.updateBinaural(carrierFreq, val, waveform, noiseLevel, subHarmonics);
    }
  };

  const handleWaveformChange = (type: OscillatorType) => {
    setWaveform(type);
    setSelectedPresetId(null);
    setCustomMode(true);
    if (isPlaying) {
      audioSynth.startBinaural(carrierFreq, beatFreq, type, noiseLevel, subHarmonics, null);
    }
  };

  const handleNoiseChange = (val: number) => {
    setNoiseLevel(val);
    if (isPlaying) {
      audioSynth.updateBinaural(effectiveCarrier, beatFreq, waveform, val, subHarmonics);
    }
  };

  const handleSubHarmonicsToggle = () => {
    const next = !subHarmonics;
    setSubHarmonics(next);
    if (isPlaying) {
      audioSynth.startBinaural(effectiveCarrier, beatFreq, waveform, noiseLevel, next, selectedPresetId);
    }
  };

  const activePreset = FOCUS_PRESETS.find(p => p.id === selectedPresetId);

  return (
    <div className="fixed inset-0 z-[260] bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 font-mono select-none">
      <div className="relative w-full max-w-4xl max-h-[96vh] bg-black border-2 border-[#E056FD] shadow-[0_0_50px_rgba(224,86,253,0.35)] flex flex-col overflow-hidden">

        {/* TOP HEADER */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b border-[#333] bg-[#050505]">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-[#FF003C] animate-pulse" />
            <div>
              <h2 className="text-xs sm:text-sm md:text-base font-black uppercase text-white tracking-widest flex items-center gap-2">
                BIOELECTRIC TUNES // BINAURAL FOCUS ENGINE
              </h2>
              <p className="text-[8px] sm:text-[9px] text-[#E056FD] tracking-wider uppercase">
                Smooth Crossfade & Master Sync Telemetry // v3.8
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-[#FF003C] transition-all border border-[#333] hover:border-[#FF003C]"
            title="CLOSE GENERATOR"
          >
            <X size={15} />
          </button>
        </div>

        {/* MODAL MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-5 space-y-3 sm:space-y-4">

          {/* DUAL VOLUME MASTER & STATUS BAR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-[#0a0a0a] border border-[#222]">
            {/* SECONDARY VOLUME SLIDER (BINAURAL FOCUS ENGINE) */}
            <div className="space-y-1.5 border border-[#E056FD]/40 p-2 sm:p-2.5 bg-black/80 shadow-[0_0_15px_rgba(224,86,253,0.15)]">
              <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
                <span className="font-bold text-[#E056FD] flex items-center gap-1.5">
                  <Headphones size={13} className="text-[#00F3FF]" />
                  SECONDARY AUDIO // BINAURAL FOCUS VOLUME
                </span>
                <span className={`font-bold font-mono ${isBinauralMuted ? 'text-[#FF003C]' : 'text-white'}`}>
                  {isBinauralMuted ? 'MUTED' : `${Math.round(binauralVolume * 100)}%`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onMuteToggle}
                  className={`p-1.5 border transition-all shrink-0 ${
                    isBinauralMuted
                      ? 'border-[#FF003C] bg-[#FF003C]/20 text-[#FF003C]'
                      : 'border-[#333] bg-black text-[#E056FD] hover:border-[#E056FD] hover:text-white'
                  }`}
                  title={isBinauralMuted ? 'UNMUTE BINAURAL' : 'MUTE BINAURAL'}
                >
                  {isBinauralMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isBinauralMuted ? 0 : binauralVolume}
                  disabled={isBinauralMuted}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    onVolumeChange(v);
                  }}
                  className={`flex-1 accent-[#E056FD] bg-[#222] h-1.5 appearance-none cursor-pointer ${
                    isBinauralMuted ? 'opacity-30 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            {/* MASTER ACTIVATION & STATUS TOGGLE */}
            <div className="flex items-center justify-between gap-2 border border-[#333] p-2 sm:p-2.5 bg-black/80">
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1.5">
                  <Activity size={12} className={isPlaying ? 'text-[#39FF14]' : 'text-gray-500'} />
                  SYNTHESIS ENGINE STATUS
                </span>
                <span className="text-[10px] sm:text-xs font-black truncate max-w-[200px]" style={{ color: isPlaying ? bandInfo.color : '#666' }}>
                  {isPlaying
                    ? masterSyncEnabled
                      ? `MASTER-SYNC: ${detectedBpm} BPM [${effectiveCarrier.toFixed(1)}Hz // ${beatFreq.toFixed(1)}Hz]`
                      : rhythmSyncEnabled
                      ? `RHYTHM-LOCKED: ${detectedBpm} BPM [${rhythmHarmonic}]`
                      : `GENERATING: ${customMode ? 'CUSTOM SYNTHESIS' : activePreset?.name || 'ACTIVE'}`
                    : 'STOPPED // STANDBY'}
                </span>
              </div>

              <button
                onClick={handleTogglePlay}
                className={`px-3 sm:px-4 py-2 font-black text-xs uppercase tracking-widest flex items-center gap-2 border transition-all ${
                  isPlaying
                    ? 'border-[#FF003C] bg-[#FF003C] text-black shadow-[0_0_20px_#FF003C]'
                    : 'border-[#39FF14] bg-[#39FF14]/15 text-[#39FF14] hover:bg-[#39FF14] hover:text-black shadow-[0_0_15px_rgba(57,255,20,0.3)]'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Square size={13} className="fill-current" />
                    <span>STOP TUNE</span>
                  </>
                ) : (
                  <>
                    <Play size={13} className="fill-current" />
                    <span>ENGAGE TUNE</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* MASTER SYNC & SMOOTH CROSSFADE GLOBAL CONTROLS BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#080808] p-2.5 border border-[#333]">
            {/* MASTER SYNC TOGGLE */}
            <div className="flex items-center justify-between gap-2 p-2 bg-black border border-[#222]">
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase flex items-center gap-1.5">
                  <Gauge size={12} className={masterSyncEnabled ? 'text-[#39FF14]' : 'text-gray-400'} />
                  MASTER SYNC (TEMPO & PITCH LINK)
                </span>
                <span className="text-[8px] text-gray-400">
                  {masterSyncEnabled
                    ? `Carrier scaled to tempo (${tempoRatio.toFixed(2)}x): ${effectiveCarrier.toFixed(1)} Hz`
                    : 'Uncoupled // Fixed preset carrier frequency'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleMasterSync}
                className={`px-2.5 py-1 text-[8px] sm:text-[9px] uppercase font-black border transition-all ${
                  masterSyncEnabled
                    ? 'border-[#39FF14] bg-[#39FF14]/20 text-[#39FF14] shadow-[0_0_12px_rgba(57,255,20,0.3)]'
                    : 'border-[#333] bg-black text-gray-500 hover:border-gray-400 hover:text-gray-200'
                }`}
              >
                {masterSyncEnabled ? 'LINKED [ON]' : 'LINK [OFF]'}
              </button>
            </div>

            {/* SMOOTH VOLUME CROSSFADE CONTROLLER */}
            <div className="flex items-center justify-between gap-2 p-2 bg-black border border-[#222]">
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase flex items-center gap-1.5">
                  <ShieldCheck size={12} className={crossfadeEnabled ? 'text-[#E056FD]' : 'text-gray-400'} />
                  SMOOTH CROSSFADE (ANTI-FATIGUE)
                </span>
                <span className="text-[8px] text-gray-400">
                  {crossfadeEnabled
                    ? `Adaptive crossfade ramp (${crossfadeDurationMs}ms) to prevent acoustic fatigue`
                    : 'Instant jump (Crossfade disabled)'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleToggleCrossfade}
                  className={`px-2 py-1 text-[8px] sm:text-[9px] uppercase font-bold border transition-all ${
                    crossfadeEnabled
                      ? 'border-[#E056FD] bg-[#E056FD]/20 text-white'
                      : 'border-[#333] text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {crossfadeEnabled ? 'ON' : 'OFF'}
                </button>

                {crossfadeEnabled && (
                  <select
                    value={crossfadeDurationMs}
                    onChange={(e) => handleCrossfadeDurationChange(parseInt(e.target.value, 10))}
                    className="bg-[#111] border border-[#333] text-[8px] text-gray-300 px-1 py-1 uppercase outline-none"
                  >
                    <option value={200}>200ms</option>
                    <option value={350}>350ms</option>
                    <option value={600}>600ms</option>
                    <option value={1000}>1.0s</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* REAL-TIME BIOELECTRIC OSCILLOSCOPE CANVAS */}
          <div className="relative border border-[#333] bg-[#050505] p-1 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
            <canvas
              ref={canvasRef}
              width={750}
              height={90}
              className="w-full h-20 sm:h-24 block bg-[#050505]"
            />
            <div className="absolute bottom-1.5 right-2 text-[7px] sm:text-[8px] text-gray-500 font-mono pointer-events-none uppercase">
              STEREO INTERFEROMETRY // DUAL-EAR COUPLING
            </div>
            {isCrossfading && (
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#FFD700]/20 border border-[#FFD700] text-[#FFD700] text-[8px] font-black uppercase animate-pulse flex items-center gap-1">
                <ArrowRightLeft size={10} />
                <span>CROSSFADING FOCUS STATE // SOFTENING INTENSITY</span>
              </div>
            )}
          </div>

          {/* NAVIGATION TABS: FOCUS PRESETS | DYNAMIC RHYTHM SYNC | MANUAL TUNING */}
          <div className="grid grid-cols-3 gap-1 border-b border-[#333] pb-2">
            <button
              onClick={() => setActiveTab('PRESETS')}
              className={`py-2 text-[9px] sm:text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 border ${
                activeTab === 'PRESETS'
                  ? 'border-[#E056FD] bg-[#E056FD]/20 text-white shadow-[0_0_12px_rgba(224,86,253,0.3)]'
                  : 'border-[#222] bg-black text-gray-400 hover:border-[#444] hover:text-gray-200'
              }`}
            >
              <Bookmark size={12} className={activeTab === 'PRESETS' ? 'text-[#E056FD]' : ''} />
              <span>FOCUS PRESETS</span>
            </button>

            <button
              onClick={() => setActiveTab('RHYTHM_SYNC')}
              className={`py-2 text-[9px] sm:text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 border ${
                activeTab === 'RHYTHM_SYNC'
                  ? 'border-[#00F3FF] bg-[#00F3FF]/20 text-white shadow-[0_0_12px_rgba(0,243,255,0.3)]'
                  : 'border-[#222] bg-black text-gray-400 hover:border-[#444] hover:text-gray-200'
              }`}
            >
              <Zap size={12} className={masterSyncEnabled || rhythmSyncEnabled ? 'text-[#39FF14] animate-bounce' : 'text-[#00F3FF]'} />
              <span>MASTER & RHYTHM SYNC</span>
              {(masterSyncEnabled || rhythmSyncEnabled) && <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-ping" />}
            </button>

            <button
              onClick={() => setActiveTab('MANUAL_TUNING')}
              className={`py-2 text-[9px] sm:text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 border ${
                activeTab === 'MANUAL_TUNING'
                  ? 'border-[#FFD700] bg-[#FFD700]/20 text-white shadow-[0_0_12px_rgba(255,215,0,0.3)]'
                  : 'border-[#222] bg-black text-gray-400 hover:border-[#444] hover:text-gray-200'
              }`}
            >
              <Sliders size={12} className={activeTab === 'MANUAL_TUNING' ? 'text-[#FFD700]' : ''} />
              <span>MANUAL MATRIX</span>
            </button>
          </div>

          {/* TAB 1: FOCUS PRESETS (NAMED PROFILES & MONROE LEVELS WITH SMOOTH CROSSFADE) */}
          {activeTab === 'PRESETS' && (
            <div className="space-y-4">
              {/* SAVED NAMED FOCUS PROFILES (DEEP WORK, MEDITATION, HIGH-ENERGY, ETC.) */}
              <div className="border border-[#222] bg-[#080808] p-3 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222] pb-2">
                  <div>
                    <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#FFD700]" />
                      NAMED FOCUS PROFILES (SMOOTH CROSSFADE ACTIVE)
                    </span>
                    <p className="text-[8px] sm:text-[9px] text-gray-400 mt-0.5">
                      Switch seamlessly between Deep Work, Meditation, and High-Energy states with automatic fatigue dampening.
                    </p>
                  </div>
                  {saveSuccessMsg && (
                    <span className="text-[9px] text-[#39FF14] font-bold border border-[#39FF14]/50 bg-[#39FF14]/10 px-2 py-0.5 animate-pulse">
                      {saveSuccessMsg}
                    </span>
                  )}
                </div>

                {/* SAVE CURRENT PROFILE FORM */}
                <form onSubmit={handleSaveCurrentPreset} className="flex gap-2">
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="ENTER PROFILE NAME (E.G. 'DEEP WORK', 'NIGHT TRANQUILITY')..."
                    className="flex-1 bg-black border border-[#333] focus:border-[#E056FD] px-2.5 py-1.5 text-xs text-white placeholder-gray-600 outline-none uppercase font-mono"
                    maxLength={32}
                  />
                  <button
                    type="submit"
                    disabled={!newPresetName.trim()}
                    className="px-3 py-1.5 bg-[#E056FD] text-black hover:bg-white disabled:opacity-30 disabled:hover:bg-[#E056FD] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0"
                  >
                    <Save size={13} />
                    <span>SAVE PROFILE</span>
                  </button>
                </form>

                {/* SAVED PRESETS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                  {savedPresets.map((preset) => {
                    const pBand = BRAINWAVE_BANDS[preset.band];
                    const isCurrent =
                      Math.abs(carrierFreq - preset.carrierFreq) < 0.2 &&
                      Math.abs(beatFreq - preset.beatFreq) < 0.2 &&
                      waveform === preset.waveform;

                    return (
                      <div
                        key={preset.id}
                        className={`p-2.5 border transition-all flex flex-col justify-between ${
                          isCurrent
                            ? 'border-[#39FF14] bg-[#39FF14]/10 shadow-[0_0_15px_rgba(57,255,20,0.2)]'
                            : 'border-[#222] bg-black hover:border-[#444]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 text-[8px]">
                            <span className="font-bold text-white uppercase text-[10px] truncate">
                              {preset.name}
                            </span>
                            <span
                              className="px-1.5 py-0.5 border text-[7px] uppercase font-bold"
                              style={{ borderColor: pBand.color, color: pBand.color }}
                            >
                              {preset.band} {preset.beatFreq.toFixed(1)}Hz
                            </span>
                          </div>

                          <div className="text-[8px] text-gray-400 mt-1 space-y-0.5 font-mono">
                            <div>Carrier: <span className="text-[#00F3FF]">{preset.carrierFreq.toFixed(1)} Hz</span></div>
                            <div>Wave: <span className="text-gray-300 uppercase">{preset.waveform}</span> | Noise: <span className="text-gray-300">{Math.round(preset.noiseLevel * 100)}%</span></div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 mt-2.5 pt-1.5 border-t border-[#1a1a1a]">
                          <button
                            type="button"
                            onClick={() => handleLoadSavedPreset(preset)}
                            className="flex-1 py-1 bg-[#00F3FF]/15 border border-[#00F3FF] hover:bg-[#00F3FF] hover:text-black text-[#00F3FF] font-bold text-[8px] uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                          >
                            <Disc size={10} className={isCurrent ? 'animate-spin' : ''} />
                            <span>{isCurrent ? 'ACTIVE STATE' : 'CROSSFADE LOAD'}</span>
                          </button>

                          {!preset.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSavedPreset(preset.id, preset.name)}
                              title="DELETE PROFILE"
                              className="p-1 border border-[#333] hover:border-[#FF003C] hover:bg-[#FF003C] text-gray-500 hover:text-black transition-all"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MONROE GATEWAY EXPERIENCE FOCUS LEVELS */}
              <div className="space-y-1.5">
                <span className="text-[10px] sm:text-xs font-bold text-[#E056FD] tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles size={13} />
                  MONROE GATEWAY EXPERIENCE PROTOCOLS (FATIGUE-SAFE CROSSFADE)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2">
                  {FOCUS_PRESETS.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    const pBand = BRAINWAVE_BANDS[preset.band];
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectMonroePreset(preset)}
                        className={`p-2 border text-left flex flex-col justify-between transition-all group relative overflow-hidden ${
                          isSelected
                            ? 'border-[#FF003C] bg-[#FF003C]/15 shadow-[0_0_15px_rgba(255,0,60,0.25)] text-white'
                            : 'border-[#222] bg-[#080808] hover:border-[#E056FD] hover:bg-[#E056FD]/10 text-gray-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-bold">
                            <span className="text-[#FF003C] font-mono">{preset.focusLevel}</span>
                            <span
                              className="px-1 py-0.5 border text-[7px] uppercase"
                              style={{ borderColor: pBand.color, color: pBand.color }}
                            >
                              {preset.band} {preset.beatFreq}Hz
                            </span>
                          </div>
                          <div className="text-[10px] sm:text-[11px] font-bold mt-1 leading-snug truncate text-white">
                            {preset.name}
                          </div>
                          <div className="text-[8px] text-gray-400 mt-0.5 leading-tight line-clamp-2">
                            {preset.subtitle}
                          </div>
                        </div>

                        <div className="mt-2 pt-1 border-t border-[#222] flex items-center justify-between text-[7px] sm:text-[8px] text-gray-500">
                          <span>Carrier: {preset.carrierFreq}Hz</span>
                          <span className="text-gray-400">{preset.waveform}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DYNAMIC RHYTHM SYNC & MASTER SYNC */}
          {activeTab === 'RHYTHM_SYNC' && (
            <div className="border border-[#00F3FF]/40 bg-[#06080a] p-3 sm:p-4 space-y-4 shadow-[0_0_30px_rgba(0,243,255,0.15)]">
              {/* TOP TOGGLE AND TELEMETRY */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#222] pb-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase flex items-center gap-2">
                    <Zap size={15} className="text-[#00F3FF]" />
                    MASTER SYNC & DYNAMIC RHYTHM LINK
                  </h3>
                  <p className="text-[8px] sm:text-[9px] text-gray-400 mt-0.5">
                    Locks both the carrier frequency and beat pulse proportionally to the primary game audio tempo.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleMasterSync}
                    className={`px-3 py-1.5 border font-black text-xs uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                      masterSyncEnabled
                        ? 'border-[#39FF14] bg-[#39FF14] text-black shadow-[0_0_20px_#39FF14]'
                        : 'border-[#333] bg-black text-gray-400 hover:border-[#00F3FF] hover:text-white'
                    }`}
                  >
                    <Gauge size={12} />
                    <span>MASTER SYNC: {masterSyncEnabled ? 'ONLINE' : 'OFFLINE'}</span>
                  </button>
                </div>
              </div>

              {/* LIVE TEMPO MONITOR & PROPORTIONAL SCALING TELEMETRY */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* BPM MONITOR */}
                <div className={`p-2.5 border bg-black transition-all ${beatFlash || tapFlash ? 'border-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.5)]' : isManualOverride ? 'border-[#00F3FF]' : 'border-[#333]'}`}>
                  <div className="flex items-center justify-between text-[8px] text-gray-400 uppercase font-bold">
                    <span>{isManualOverride ? 'MANUAL TAP TEMPO' : 'DETECTED AUDIO TEMPO'}</span>
                    <span className={`px-1 py-0.2 border text-[7px] ${isManualOverride ? 'border-[#00F3FF] text-[#00F3FF]' : 'border-gray-600 text-gray-400'}`}>
                      {isManualOverride ? 'MANUAL LOCK' : 'AUTO-FFT'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-white font-mono">{detectedBpm}</span>
                    <span className="text-xs font-bold text-[#00F3FF]">BPM</span>
                    <span className={`w-2 h-2 rounded-full ${beatFlash || tapFlash ? 'bg-[#39FF14] scale-125' : isManualOverride ? 'bg-[#00F3FF]' : 'bg-gray-700'} transition-all`} />
                  </div>
                  <span className="text-[8px] text-gray-500 block mt-1">
                    {isManualOverride
                      ? `[TAP OVERRIDE: ${tapCount > 0 ? `${tapCount} TAPS` : 'ACTIVE'}]`
                      : isExternalTrack
                      ? '[EXTERNAL ARK AUDIO TRACK]'
                      : '[PROCEDURAL METRONOME 130]'}
                  </span>
                </div>

                {/* MASTER PROPORTIONAL CARRIER SCALING */}
                <div className="p-2.5 border border-[#333] bg-black">
                  <span className="text-[8px] text-gray-400 uppercase font-bold block">PROPORTIONAL CARRIER FREQ</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black text-[#00F3FF] font-mono">
                      {effectiveCarrier.toFixed(1)}
                    </span>
                    <span className="text-xs font-bold text-gray-300">Hz</span>
                    <span className="text-[9px] uppercase px-1 py-0.5 border border-[#00F3FF] text-[#00F3FF]">
                      {masterSyncEnabled ? `${tempoRatio.toFixed(2)}x PITCH` : 'BASE'}
                    </span>
                  </div>
                  <span className="text-[8px] text-gray-500 block mt-1">
                    Base Carrier: {carrierFreq.toFixed(1)} Hz (Ref: 120 BPM)
                  </span>
                </div>

                {/* COMPUTED BINAURAL FREQUENCY */}
                <div className="p-2.5 border border-[#333] bg-black">
                  <span className="text-[8px] text-gray-400 uppercase font-bold block">DYNAMIC BINAURAL BEAT</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black font-mono" style={{ color: bandInfo.color }}>
                      {beatFreq.toFixed(1)}
                    </span>
                    <span className="text-xs font-bold text-gray-300">Hz</span>
                    <span className="text-[9px] uppercase px-1 py-0.5 border" style={{ borderColor: bandInfo.color, color: bandInfo.color }}>
                      {activeBand}
                    </span>
                  </div>
                  <span className="text-[8px] text-gray-500 block mt-1">
                    Mode: {RHYTHM_SYNC_HARMONICS[rhythmHarmonic].ratio}
                  </span>
                </div>
              </div>

              {/* --- START NEW CODE: TAP TEMPO & MANUAL RHYTHM FALLBACK SECTION --- */}
              <div className="p-3 border border-[#333] bg-black/90 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222] pb-2">
                  <div className="flex items-center gap-2">
                    <Timer size={14} className="text-[#FF003C]" />
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        TAP TEMPO & MANUAL SYNC FALLBACK
                      </span>
                      <p className="text-[8px] text-gray-400">
                        Manually tap rhythm or adjust tempo when track transients are undetected or ambient.
                      </p>
                    </div>
                  </div>

                  {tapFeedbackMsg && (
                    <span className="text-[9px] text-[#39FF14] font-bold border border-[#39FF14]/50 bg-[#39FF14]/10 px-2 py-0.5 animate-pulse shrink-0">
                      {tapFeedbackMsg}
                    </span>
                  )}
                </div>

                {/* BIG TAP BUTTON */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleTapTempo}
                    className={`sm:col-span-2 py-3 sm:py-3.5 border-2 font-mono font-black text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] select-none ${
                      tapFlash
                        ? 'border-[#FF003C] bg-[#FF003C] text-black shadow-[0_0_35px_#FF003C]'
                        : isManualOverride
                        ? 'border-[#00F3FF] bg-[#00F3FF]/20 text-[#00F3FF] hover:bg-[#00F3FF] hover:text-black shadow-[0_0_20px_rgba(0,243,255,0.3)]'
                        : 'border-[#FF003C] bg-[#FF003C]/15 text-[#FF003C] hover:bg-[#FF003C] hover:text-black shadow-[0_0_15px_rgba(255,0,60,0.25)]'
                    }`}
                  >
                    <MousePointerClick size={16} className={tapFlash ? 'scale-125' : ''} />
                    <span>TAP TEMPO</span>
                    <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 border border-current font-normal opacity-90">
                      CLICK OR [T] KEY
                    </span>
                  </button>

                  {/* RESET & RESTORE BUTTON */}
                  <button
                    type="button"
                    onClick={handleResetManualBpm}
                    className="py-2 sm:py-3 border border-[#333] hover:border-gray-400 bg-[#111] hover:bg-[#222] text-gray-300 font-bold text-[9px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RotateCcw size={13} />
                    <span>RESTORE AUTO-DETECT</span>
                  </button>
                </div>

                {/* FINE BPM NUDGE CONTROLS & DIRECT RANGE SLIDER */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* NUDGE BUTTONS */}
                  <div className="space-y-1">
                    <span className="text-[8px] sm:text-[9px] text-gray-400 uppercase">QUICK BPM CALIBRATION:</span>
                    <div className="grid grid-cols-4 gap-1">
                      {[-5, -1, 1, 5].map((delta) => (
                        <button
                          key={delta}
                          type="button"
                          onClick={() => handleNudgeBpm(delta)}
                          className="py-1 border border-[#333] hover:border-[#00F3FF] hover:bg-[#00F3FF]/15 text-gray-300 hover:text-white text-[9px] font-bold font-mono transition-all flex items-center justify-center gap-0.5"
                        >
                          {delta > 0 ? <Plus size={9} /> : <Minus size={9} />}
                          <span>{Math.abs(delta)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* MANUAL BPM RANGE SLIDER */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] sm:text-[9px] text-gray-400">
                      <span>MANUAL BPM SLIDER:</span>
                      <span className="text-[#00F3FF] font-bold font-mono">{detectedBpm} BPM</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="240"
                      step="1"
                      value={detectedBpm}
                      onChange={(e) => handleManualBpmSlider(parseInt(e.target.value, 10))}
                      className="w-full accent-[#00F3FF] bg-[#222] h-1.5 appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[7px] text-gray-500 font-mono">
                      <span>40 (Ambient)</span>
                      <span>120 (Standard)</span>
                      <span>174 (DnB)</span>
                      <span>240 (Speedcore)</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* --- END NEW CODE: TAP TEMPO & MANUAL RHYTHM FALLBACK SECTION --- */}

              {/* RHYTHM HARMONIC SELECTOR CARDS */}
              <div className="space-y-2">
                <span className="text-[9px] sm:text-[10px] font-bold text-[#00F3FF] uppercase tracking-wider">
                  SELECT TARGET BRAINWAVE RHYTHM HARMONIC:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {(Object.keys(RHYTHM_SYNC_HARMONICS) as RhythmSyncHarmonic[]).map((key) => {
                    const h = RHYTHM_SYNC_HARMONICS[key];
                    const isSelected = rhythmHarmonic === key;
                    const bColor = BRAINWAVE_BANDS[h.band].color;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleHarmonicChange(key)}
                        className={`p-2.5 border text-left transition-all ${
                          isSelected
                            ? 'border-[#00F3FF] bg-[#00F3FF]/15 shadow-[0_0_15px_rgba(0,243,255,0.25)] text-white'
                            : 'border-[#222] bg-black hover:border-[#444] text-gray-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[8px] font-bold">
                          <span style={{ color: bColor }}>{h.band}</span>
                          <span className="text-gray-500 font-mono">{h.ratio}</span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] font-bold text-white mt-0.5">
                          {h.label}
                        </div>
                        <p className="text-[8px] text-gray-400 mt-1 leading-tight">
                          {h.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL TUNING MATRIX */}
          {activeTab === 'MANUAL_TUNING' && (
            <div className="border border-[#222] bg-[#080808] p-3 sm:p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-[#222] pb-2">
                <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <Sliders size={13} className="text-[#FFD700]" />
                  MANUAL FREQUENCY & ACOUSTIC CALIBRATION MATRIX
                </span>
                <span
                  className="px-2 py-0.5 text-[8px] font-bold uppercase border"
                  style={{ borderColor: bandInfo.color, color: bandInfo.color }}
                >
                  BAND: {bandInfo.label}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CARRIER FREQUENCY SLIDER */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] sm:text-[10px]">
                    <span className="text-gray-400">CARRIER BASE FREQUENCY (Hz)</span>
                    <span className="text-[#00F3FF] font-bold">{carrierFreq.toFixed(1)} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="600"
                    step="0.5"
                    value={carrierFreq}
                    onChange={(e) => handleCarrierChange(parseFloat(e.target.value))}
                    className="w-full accent-[#00F3FF] bg-[#222] h-1.5 appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[7px] text-gray-500">
                    <span>40 Hz (Sub-bass)</span>
                    <span>136.1 Hz (Om)</span>
                    <span>432 Hz (Verdi)</span>
                    <span>528 Hz (Solfeggio)</span>
                  </div>
                </div>

                {/* BINAURAL BEAT FREQUENCY SLIDER */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] sm:text-[10px]">
                    <span className="text-gray-400">BINAURAL BEAT FREQUENCY (Hz)</span>
                    <span className="font-bold" style={{ color: bandInfo.color }}>
                      {beatFreq.toFixed(1)} Hz [{activeBand}]
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="45"
                    step="0.1"
                    value={beatFreq}
                    onChange={(e) => handleBeatChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 appearance-none cursor-pointer"
                    style={{ accentColor: bandInfo.color }}
                  />
                  <div className="flex justify-between text-[7px] text-gray-500">
                    <span>Delta (0.5-4)</span>
                    <span>Theta (4-8)</span>
                    <span>Alpha (8-12)</span>
                    <span>Beta (12-30)</span>
                    <span>Gamma (40)</span>
                  </div>
                </div>
              </div>

              {/* WAVEFORM, NOISE FLOOR, & SUB-HARMONICS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#222]">
                {/* WAVEFORM SELECTOR */}
                <div className="space-y-1">
                  <span className="text-[8px] sm:text-[9px] text-gray-400 uppercase">Oscillator Waveform:</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['sine', 'triangle', 'sawtooth'] as OscillatorType[]).map((w) => (
                      <button
                        key={w}
                        onClick={() => handleWaveformChange(w)}
                        className={`py-1 text-[8px] sm:text-[9px] uppercase font-bold border transition-all ${
                          waveform === w
                            ? 'border-[#E056FD] bg-[#E056FD]/20 text-white'
                            : 'border-[#333] text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PINK NOISE SENSORY MASKING FLOOR */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] sm:text-[9px] text-gray-400">
                    <span>PINK NOISE MASK:</span>
                    <span className="text-[#39FF14]">{Math.round(noiseLevel * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.4"
                    step="0.02"
                    value={noiseLevel}
                    onChange={(e) => handleNoiseChange(parseFloat(e.target.value))}
                    className="w-full accent-[#39FF14] bg-[#222] h-1.5 appearance-none cursor-pointer"
                  />
                  <span className="text-[7px] text-gray-500 block">Dampens room noise / prevents sensory fatigue</span>
                </div>

                {/* SUB-HARMONIC GROUNDING DRONE */}
                <div className="space-y-1 flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={handleSubHarmonicsToggle}
                    className={`w-full py-2 border text-[8px] sm:text-[9px] uppercase font-bold transition-all flex items-center justify-center gap-1.5 ${
                      subHarmonics
                        ? 'border-[#00F3FF] bg-[#00F3FF]/15 text-[#00F3FF]'
                        : 'border-[#333] text-gray-500 hover:border-gray-500'
                    }`}
                  >
                    <Waves size={12} />
                    <span>SUB-OCTAVE DRONE: {subHarmonics ? 'ACTIVE' : 'OFF'}</span>
                  </button>
                  <span className="text-[7px] text-gray-500 text-center block">Adds warm acoustic grounding octave</span>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE PRESET CLINICAL / BIOELECTRIC INTEL */}
          {activePreset && !customMode && (
            <div className="border border-[#333] bg-[#060606] p-2.5 sm:p-3 text-[9px] sm:text-[10px] space-y-1.5">
              <div className="flex items-center justify-between text-[#00F3FF] font-bold border-b border-[#222] pb-1">
                <span className="flex items-center gap-1.5">
                  <Info size={12} />
                  BIOELECTRIC PROTOCOL INTEL: {activePreset.focusLevel} // {activePreset.name}
                </span>
                <span className="text-[#FFD700]">{activePreset.clinicalTarget}</span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                {activePreset.description}
              </p>
            </div>
          )}

          {/* HARDWARE & DEVICE COMPATIBILITY PROTOCOL */}
          <div className="p-2 sm:p-2.5 border border-[#222] bg-[#040404] text-[8px] sm:text-[9px] text-gray-400 space-y-1">
            <div className="text-[#FFD700] font-bold uppercase flex items-center gap-1.5">
              <Headphones size={11} />
              HARDWARE COMPLIANCE & HEADPHONE RECOMMENDATION
            </div>
            <p>
              Binaural beats require stereo acoustic separation. When Master Sync is active, carrier frequencies adapt proportionally to musical tempo while smooth crossfade protects against listening fatigue across profile changes.
            </p>
          </div>
        </div>

        {/* BOTTOM ACTION & WATERMARK FOOTER */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 border-t border-[#333] bg-[#050505]">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#E056FD] text-black font-black text-xs hover:bg-white uppercase tracking-widest transition-all"
            >
              RESUME TERMINAL
            </button>
          </div>

          <div className="flex flex-col items-end opacity-70 pointer-events-none">
            <span className="text-[9px] sm:text-[10px] text-[#E056FD] font-bold tracking-tighter">
              ARCHITECT // VOID_WEAVER
            </span>
            <span className="text-[7px] sm:text-[8px] text-[#E056FD] opacity-60 font-mono tracking-widest uppercase">
              sys // bioelectric_focus_v3.8
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
// --- END NEW CODE: BINAURAL BEATS, SMOOTH CROSSFADE, MASTER SYNC & FOCUS PRESETS UI ---
