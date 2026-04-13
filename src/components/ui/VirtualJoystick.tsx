import React, { useState, useRef, useEffect } from 'react';
import { useInputStore } from '../../store/useInputStore';

interface Props {
  size?: number;
  stickSize?: number;
}

export const VirtualJoystick: React.FC<Props> = ({ size = 120, stickSize = 50 }) => {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const setCommand = useInputStore((state) => state.setCommand);

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    setActive(true);
    handleMove(e);
  };

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!active && e.type !== 'touchstart' && e.type !== 'mousedown') return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = clientX - centerX;
      let dy = clientY - centerY;

      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = size / 2;

      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }

      setPos({ x: dx, y: dy });

      // Update store commands based on position
      const deadzone = 0.2;
      const normX = dx / maxDist;
      const normY = dy / maxDist;

      setCommand('LEFT', normX < -deadzone);
      setCommand('RIGHT', normX > deadzone);
      setCommand('UP', normY < -deadzone);
      setCommand('DOWN', normY > deadzone);
    }
  };

  const handleEnd = () => {
    setActive(false);
    setPos({ x: 0, y: 0 });
    setCommand('LEFT', false);
    setCommand('RIGHT', false);
    setCommand('UP', false);
    setCommand('DOWN', false);
  };

  useEffect(() => {
    if (active) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [active]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-full border-2 border-[#E056FD] bg-black/40 backdrop-blur-md pointer-events-auto select-none overflow-visible"
      style={{ width: size, height: size }}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
      <div
        className="absolute top-1/2 left-1/2 bg-[#E056FD] rounded-full shadow-[0_0_15px_#E056FD] transition-transform duration-75 flex items-center justify-center"
        style={{
          width: stickSize,
          height: stickSize,
          marginLeft: -stickSize / 2,
          marginTop: -stickSize / 2,
          transform: `translate(${pos.x}px, ${pos.y}px)`
        }}
      >
        <div className="w-1/2 h-1/2 bg-white/20 rounded-full animate-pulse" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
        <span className="text-[10px] text-[#E056FD] uppercase tracking-tighter font-black">VOID // CTRL</span>
      </div>
    </div>
  );
};
