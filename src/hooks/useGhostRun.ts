import { useState, useRef } from 'react';


export const useGhostRun = () => {
 const [isRecording, setIsRecording] = useState(false);
 const history = useRef<{ x: number; y: number }[]>([]);


 const recordFrame = (x: number, y: number) => {
   if (!isRecording) return;
   history.current.push({ x, y });
 };


 const startRecording = () => {
   history.current = [];
   setIsRecording(true);
 };


 const stopAndExport = () => {
   setIsRecording(false);
   const blob = new Blob([JSON.stringify(history.current)], { type: 'application/json' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = `GHOST_${Date.now()}.void`;
   a.click();
 };


 return { recordFrame, startRecording, stopAndExport, isRecording };
};