import { PALETTE } from '../constants';
import { PatternConfig } from '../types';

export const generateInfinitePattern = (phase: number): PatternConfig => {
    const types: PatternConfig['type'][] = ['FAN', 'SPIRAL', 'AIMED', 'BURST'];
    const enemyColor = (PALETTE as any).BULLET_ENEMY || (PALETTE as any)['BULLET ENEMY'] || '#FF003C';
    const colors = [enemyColor, '#E056FD', '#00F3FF', '#FFFFFF', '#39FF14', '#FFD700', '#FF003C'];

    return {
        type: types[Math.floor((phase + Math.random() * 2) % types.length)],
        count: 12 + Math.min(phase * 4, 80),
        speed: 2.2 + Math.min(phase * 0.25, 9.5),
        spread: (Math.PI / 4) + Math.min(phase * 0.1, Math.PI * 1.5),
        rotationSpeed: 0.025 + (phase * 0.007),
        color: colors[phase % colors.length],
    };
};