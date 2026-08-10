import React from 'react';
import { useInputStore } from '../store/useInputStore';

export const useGhostRun = () => {
  const { isRecording, setRecording, ghostData, clearRecording, setGhostMode } = useInputStore();

  const startRecording = () => {
    clearRecording();
    setRecording(true);
    console.log("--> [GHOST_NODE]: RECORDING_INITIALIZED");
  };

  const stopAndExport = () => {
    setRecording(false);
    const blob = new Blob([JSON.stringify(ghostData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VOID_GHOST_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log("--> [GHOST_NODE]: DATA_EXPORTED_TO_HARDWARE");
  };

  const loadGhostData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setGhostMode(true, data);
        console.log("--> [GHOST_NODE]: UPLINK_SUCCESSFUL. READY FOR PLAYBACK.");
      } catch (err) {
        console.error("--> [GHOST_NODE]: CORRUPTED_DATA_FILE.");
      }
    };
    reader.readAsText(file);
  };

  return { isRecording, startRecording, stopAndExport, loadGhostData };
};