import { useState, useEffect } from 'react';

export interface ViewportMetrics {
    width: number;
    height: number;
    scale: number;
    isLandscape: boolean;
    deviceType: 'MOBILE' | 'PC' | 'CONSOLE';
}

export const useViewport = (targetWidth = 1920, targetHeight = 1080) => {
    const [metrics, setMetrics] = useState<ViewportMetrics>({
        width: window.innerWidth,
        height: window.innerHeight,
        scale: 1,
        isLandscape: window.innerWidth > window.innerHeight,
        deviceType: 'PC'
    });

    useEffect(() => {
        const calibrate = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;

            // Calculate scale to fit target resolution while maintaining aspect ratio
            const scaleW = w / targetWidth;
            const scaleH = h / targetHeight;
            const scale = Math.min(scaleW, scaleH);

            // Detect hardware profile
            const userAgent = navigator.userAgent.toLowerCase();
            let type: 'MOBILE' | 'PC' | 'CONSOLE' = 'PC';
            if (/mobile|android|iphone|ipad/.test(userAgent)) type = 'MOBILE';
            if (/xbox|playstation|nintendo/.test(userAgent)) type = 'CONSOLE';

            setMetrics({
                width: w,
                height: h,
                scale: scale,
                isLandscape: w > h,
                deviceType: type
            });
        };

        window.addEventListener('resize', calibrate);
        calibrate();
        return () => window.removeEventListener('resize', calibrate);
    }, [targetWidth, targetHeight]);

    return metrics;
};