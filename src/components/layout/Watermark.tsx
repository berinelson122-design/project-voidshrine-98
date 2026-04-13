import React from 'react';

export const Watermark: React.FC = () => {
    return (
        <div className="fixed bottom-6 right-6 flex flex-col items-end pointer-events-none z-[1000] opacity-40">
            <span className="text-[10px] text-neon-violet font-bold tracking-tighter">
                ARCHITECT // VOID_WEAVER
            </span>
            <span className="text-[8px] text-white opacity-50 tracking-widest font-mono">
                SOVEREIGN_SYSTEMS_GRID
            </span>
        </div>
    );
};