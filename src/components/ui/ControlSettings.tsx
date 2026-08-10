// --- START NEW CODE: HARDWARE CONTROL PROTOCOL SETTINGS FOR MOBILE, PC, AND CONSOLE ---
import React from 'react';
import { Monitor, Smartphone, Gamepad2 } from 'lucide-react';

export const ControlSettings: React.FC = () => {
    return (
        <div className="p-4 bg-black border border-[#E056FD] text-[#E056FD] font-mono text-xs uppercase tracking-widest shadow-[0_0_20px_#E056FD33]">
            <h3 className="mb-4 border-b border-[#E056FD] pb-2 font-bold text-sm">System // Input_Mapping</h3>
            
            <div className="space-y-4">
                {/* PC HARDWARE */}
                <div className="border border-[#333] p-2 bg-black/60">
                    <div className="flex items-center gap-2 text-[#00F3FF] font-bold text-[10px] mb-2 border-b border-[#333] pb-1">
                        <Monitor size={14} /> PC Architecture (Keyboard / Mouse)
                    </div>
                    <div className="space-y-1 text-[10px]">
                        <div className="flex justify-between gap-4"><span>Move:</span><span className="text-white">[WASD] / [ARROWS]</span></div>
                        <div className="flex justify-between gap-4"><span>Focus:</span><span className="text-white">[SHIFT]</span></div>
                        <div className="flex justify-between gap-4"><span>Fire:</span><span className="text-white">[Z] / [SPACE]</span></div>
                        <div className="flex justify-between gap-4"><span>Bomb:</span><span className="text-white">[X] / [B]</span></div>
                    </div>
                </div>

                {/* MOBILE HARDWARE */}
                <div className="border border-[#333] p-2 bg-black/60">
                    <div className="flex items-center gap-2 text-[#E056FD] font-bold text-[10px] mb-2 border-b border-[#333] pb-1">
                        <Smartphone size={14} /> Mobile Haptic Engine (Touch Interface)
                    </div>
                    <div className="space-y-1 text-[10px]">
                        <div className="flex justify-between gap-4"><span>Move:</span><span className="text-white">[VIRTUAL JOYSTICK]</span></div>
                        <div className="flex justify-between gap-4"><span>Focus:</span><span className="text-white">[FOCUS NODE]</span></div>
                        <div className="flex justify-between gap-4"><span>Fire:</span><span className="text-white">[FIRE NODE]</span></div>
                        <div className="flex justify-between gap-4"><span>Bomb:</span><span className="text-white">[BOMB NODE]</span></div>
                    </div>
                </div>

                {/* CONSOLE HARDWARE */}
                <div className="border border-[#333] p-2 bg-black/60">
                    <div className="flex items-center gap-2 text-[#FF003C] font-bold text-[10px] mb-2 border-b border-[#333] pb-1">
                        <Gamepad2 size={14} /> Console Protocol (Gamepad / Controller)
                    </div>
                    <div className="space-y-1 text-[10px]">
                        <div className="flex justify-between gap-4"><span>Move:</span><span className="text-white">[D-PAD / L-STICK]</span></div>
                        <div className="flex justify-between gap-4"><span>Focus:</span><span className="text-white">[BTN X / R1]</span></div>
                        <div className="flex justify-between gap-4"><span>Fire:</span><span className="text-white">[BTN A / R2]</span></div>
                        <div className="flex justify-between gap-4"><span>Bomb:</span><span className="text-white">[BTN B / L2]</span></div>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-2 border-t border-[#333] text-[8px] opacity-40">
                UPLINK_STATUS: ACTIVE // MULTI_DEVICE_POLLING_ON
            </div>
        </div>
    );
};
// --- END NEW CODE ---
