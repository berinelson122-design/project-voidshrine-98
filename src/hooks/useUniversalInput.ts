import { useEffect } from 'react';
import { useInputStore, CommandNode } from '../store/useInputStore';

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

        // --- START NEW CODE: NULL OMEN SPELL CARD KEYBOARD TRIGGER ---
        case 'KeyP':
        case 'KeyC':
          setCommand('SPELL', isDown);
          break;
        // --- END NEW CODE ---
      }
    };

    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));

    return () => {
      window.removeEventListener('keydown', (e) => handleKey(e, true));
      window.removeEventListener('keyup', (e) => handleKey(e, false));
    };
  }, [setCommand]);

  // Console Controller Polling Loop
  useEffect(() => {
    let animId: number;
    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0] || gamepads[1];
      if (gp) {
        const axisX = gp.axes[0] || 0;
        const axisY = gp.axes[1] || 0;
        const dUp = gp.buttons[12]?.pressed;
        const dDown = gp.buttons[13]?.pressed;
        const dLeft = gp.buttons[14]?.pressed;
        const dRight = gp.buttons[15]?.pressed;

        setCommand('UP', Boolean(dUp || axisY < -0.3));
        setCommand('DOWN', Boolean(dDown || axisY > 0.3));
        setCommand('LEFT', Boolean(dLeft || axisX < -0.3));
        setCommand('RIGHT', Boolean(dRight || axisX > 0.3));

        const btnAction = gp.buttons[0]?.pressed || gp.buttons[7]?.pressed;
        const btnBomb = gp.buttons[1]?.pressed || gp.buttons[6]?.pressed;
        const btnFocus = gp.buttons[2]?.pressed || gp.buttons[5]?.pressed;

        // --- START NEW CODE: CONSOLE NULL OMEN TRIGGER (Button Y / Triangle / L1) ---
        const btnSpell = gp.buttons[3]?.pressed || gp.buttons[4]?.pressed;
        if (btnSpell !== undefined) setCommand('SPELL', Boolean(btnSpell));
        // --- END NEW CODE ---

        if (btnAction !== undefined) setCommand('ACTION', Boolean(btnAction));
        if (btnBomb !== undefined) setCommand('BOMB', Boolean(btnBomb));
        if (btnFocus !== undefined) setCommand('FOCUS', Boolean(btnFocus));
      }
      animId = requestAnimationFrame(pollGamepad);
    };

    pollGamepad();
    return () => cancelAnimationFrame(animId);
  }, [setCommand]);

  return { setCommand };
};