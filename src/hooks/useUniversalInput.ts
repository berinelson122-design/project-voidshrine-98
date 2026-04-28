import { useEffect } from 'react';
import { useInputStore } from '../store/useInputStore';


/**
* Universal Input Hook
* Maps keyboard events to the global CommandState.
*/
export const useUniversalInput = () => {
  const setCommand = useInputStore((state) => state.setCommand);


  useEffect(() => {
    const handleKey = (e: KeyboardEvent, isDown: boolean) => {
      switch (e.code) {
        // Movement
        case 'ArrowUp':
        case 'KeyW':
          setCommand('UP', isDown);
          break;
        case 'ArrowDown':
        case 'KeyS':
          setCommand('DOWN', isDown);
          break;
        case 'ArrowLeft':
        case 'KeyA':
          setCommand('LEFT', isDown);
          break;
        case 'ArrowRight':
        case 'KeyD':
          setCommand('RIGHT', isDown);
          break;


        // Modifiers
        case 'ShiftLeft':
        case 'ShiftRight':
          setCommand('FOCUS', isDown);
          break;


        // Action Buttons
        case 'KeyZ':
        case 'Space':
          setCommand('ACTION', isDown);
          break;
        case 'KeyX':
        case 'KeyB':
          setCommand('BOMB', isDown);
          break;
      }
    };


    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));

    return () => {
      window.removeEventListener('keydown', (e) => handleKey(e, true));
      window.removeEventListener('keyup', (e) => handleKey(e, false));
    };
  }, [setCommand]);


  return { setCommand };
};