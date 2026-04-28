import { PALETTE } from '../constants';
import { PatternConfig } from '../types';

export const generateInfinitePattern = (phase: number): PatternConfig => {
    const types: PatternConfig['type'][] = ['FAN', 'SPIRAL', 'AIMED', 'BURST'];
    const colors = [PALETTE.BULLET_ENEMY, '#E056FD', '#00F3FF', '#FFFFFF'];

    // COMPOUNDING DIFFICULTY LOGIC
    return {
        type: types[Math.floor(Math.random() * types.length)],
        count: 10 + Math.min(phase * 2, 50),
        speed: 2 + Math.min(phase * 0.1, 8),
        spread: Math.random() * Math.PI,
        rotationSpeed: 0.02 + (phase * 0.005),
        color: colors[phase % colors.length]
    };
};