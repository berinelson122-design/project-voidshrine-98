import React from 'react';

export const ControlSettings: React.FC = () => {
    return (
        <div className="p-4 bg-black border border-[#E056FD] text-[#E056FD] font-mono text-xs uppercase tracking-widest shadow-[0_0_20px_#E056FD33]">
            <h3 className="mb-4 border-b border-[#E056FD] pb-2 font-bold text-sm">System // Input_Mapping</h3>
            <div className="space-y-2">
                <div className="flex justify-between gap-8">
                    <span>Movement</span>
                    <span className="text-white">[WASD] / [Arrows]</span>
                </div>
                <div className="flex justify-between gap-8">
                    <span>Focus / Slow</span>
                    <span className="text-white">[Shift]</span>
                </div>
                <div className="flex justify-between gap-8">
                    <span>Primary Fire</span>
                    <span className="text-white">[Z] / [Space]</span>
                </div>
                <div className="flex justify-between gap-8">
                    <span>Logic Bomb</span>
                    <span className="text-white">[X] / [B]</span>
                </div>
            </div>
            <div className="mt-6 pt-2 border-t border-[#333] text-[8px] opacity-40">
                UPLINK_STATUS: ACTIVE // LOW_LATENCY_ON
            </div>
        </div>
    );
};
