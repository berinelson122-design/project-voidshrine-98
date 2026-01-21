import { useEffect, useRef } from 'react';

export const useGameLoop = (
  callback: (dt: number) => void,
  isRunning: boolean
) => {
  const reqIdRef = useRef<number>(0); // Fix: Initialize with 0
  const prevTimeRef = useRef<number>(0); // Fix: Initialize with 0

  const loop = (time: number) => {
    if (prevTimeRef.current !== 0) { // Check against 0
      const dt = time - prevTimeRef.current;
      callback(dt);
    }
    prevTimeRef.current = time;
    reqIdRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    if (isRunning) {
      reqIdRef.current = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(reqIdRef.current);
      prevTimeRef.current = 0;
    }
    return () => cancelAnimationFrame(reqIdRef.current);
  }, [isRunning, callback]);
};