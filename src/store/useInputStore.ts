import { create } from 'zustand';

/**
 * ARCHITECT // VOID_WEAVER
 * PROTOCOL: UNIFIED_INPUT_STATE
 */

export type CommandNode = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'ACTION' | 'BOMB' | 'FOCUS';

interface InputState {
    commands: Record<CommandNode, boolean>;
    setCommand: (cmd: CommandNode, active: boolean) => void;
    deviceType: 'PC' | 'MOBILE' | 'CONSOLE';
    setDevice: (type: 'PC' | 'MOBILE' | 'CONSOLE') => void;
}

export const useInputStore = create<InputState>((set) => ({
    commands: {
        UP: false, DOWN: false, LEFT: false, RIGHT: false,
        ACTION: false, BOMB: false, FOCUS: false
    },
    deviceType: 'PC',
    setDevice: (deviceType) => set({ deviceType }),
    setCommand: (cmd, active) => set((state) => ({
        commands: { ...state.commands, [cmd]: active }
    })),
}));