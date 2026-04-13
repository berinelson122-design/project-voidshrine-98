import React from 'react';
import { useViewport } from '../../hooks/useViewport';

interface Props {
    children: React.ReactNode;
    lockedAspect?: boolean;
}

export const ViewportShield: React.FC<Props> = ({ children, lockedAspect = true }) => {
    const { scale, deviceType, isLandscape } = useViewport();

    return (
        <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center">

            {/* THE SCALED STAGE */}
            <div
                style={{
                    transform: lockedAspect ? `scale(${scale})` : 'none',
                    width: lockedAspect ? '1920px' : '100%',
                    height: lockedAspect ? '1080px' : '100%',
                    transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className="relative bg-black flex items-center justify-center origin-center overflow-hidden"
            >
                {children}
            </div>

            {/* MOBILE HUD OVERRIDE */}
            {deviceType === 'MOBILE' && !isLandscape && (
                <div className="absolute inset-0 z-[500] bg-black flex flex-col items-center justify-center p-10 text-center">
                    <p className="text-[#FF003C] font-mono animate-pulse">
                        [ LOGIC ERROR: ORIENTATION_MISMATCH ]
                    </p>
                    <p className="text-white text-xs mt-4 uppercase tracking-widest">
                        Please rotate device to Landscape for optimal aetheric flow.
                    </p>
                </div>
            )}
        </div>
    );
};