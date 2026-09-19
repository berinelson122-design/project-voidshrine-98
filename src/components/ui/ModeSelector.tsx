import React from 'react';
import { GameMode } from '../../types';


export const ModeSelector: React.FC<{
    selectedMode: GameMode;
    onSelect: (mode: GameMode) => void;
}> = ({ selectedMode, onSelect }) => {

    const modes = [
        { id: GameMode.NORMAL, name: "STANDARD ARITHMETIC", desc: "Default logic loop // No overrides." },
        { id: GameMode.TELLURIC_RESONANCE, name: "TELLURIC RESONANCE", desc: "Rhythm-Bullet Hybrid // Synced to Loaded Ark MP3." },
        { id: GameMode.AETHER_OVERLOAD, name: "AETHER OVERLOAD", desc: "High-Risk/High-Reward // Auto-fire // Graze for pressure." },
        { id: GameMode.OBSIDIAN_SCRUBBER, name: "OBSIDIAN SCRUBBER", desc: "Procedural Bioremediation // Re-code the server." },
        { id: GameMode.PHASE_SHIFT, name: "PHASE SHIFT", desc: "Vector Manipulation // Energy Scavenging via Focus." },
        { id: GameMode.ENDLESS, name: "ENDLESS RECURSION", desc: "Infinite Procedural Danmaku // Scaling Difficulty." }
    ];

    return (
        <div className="w-full flex flex-col gap-1 sm:gap-2 mt-1 sm:mt-3 border-t border-[#333] pt-2 sm:pt-3 shrink-0">
            <h3 className="text-[#E056FD] text-[10px] sm:text-xs tracking-[0.2em] mb-0.5 sm:mb-1 text-center uppercase font-bold">Select Protocol</h3>
            <div className="flex flex-col gap-1 sm:gap-2 max-h-28 sm:max-h-36 md:max-h-44 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                {modes.map(m => (
                    <button
                        key={m.id}
                        onClick={() => onSelect(m.id)}
                        className={`text-left p-1.5 sm:p-2 border transition-all ${selectedMode === m.id
                            ? 'border-[#FF003C] bg-[#FF003C]/20 text-[#fff] shadow-[0_0_10px_#FF003C]'
                            : 'border-[#333] hover:border-[#E056FD] hover:bg-[#E056FD]/10 text-[#aaa]'
                            }`}
                    >
                        <div className="text-xs sm:text-sm font-bold truncate">{m.name}</div>
                        <div className="text-[8px] sm:text-[10px] opacity-70 leading-tight truncate">{m.desc}</div>
                    </button>
                ))}
            </div>
        </div>
    );
};