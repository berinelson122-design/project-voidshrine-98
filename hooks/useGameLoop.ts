import { useEffect, useRef } from 'react';

export const useGameLoop = (
  callback: (deltaTime: number) => void,
  isRunning: boolean
) => {
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);

  const animate = (time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime);
    }
    previousTimeRef.current = time;
    if (isRunning) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isRunning) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
      previousTimeRef.current = 0;
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning, callback]); // Callback should be memoized by consumer
};