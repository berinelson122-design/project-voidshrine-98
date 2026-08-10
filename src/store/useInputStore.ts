import { create } from 'zustand';

export type CommandNode = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'ACTION' | 'BOMB' | 'FOCUS';
export type InputCommands = Record<CommandNode, boolean>;

interface InputState {
    commands: InputCommands;
    setCommand: (cmd: CommandNode, active: boolean) => void;
    deviceType: 'PC' | 'MOBILE' | 'CONSOLE' | 'GHOST';
    setDevice: (type: 'PC' | 'MOBILE' | 'CONSOLE' | 'GHOST') => void;

    // GHOST NODE VARIABLES
    isGhostMode: boolean;
    isRecording: boolean;
    ghostData: InputCommands[];
    setGhostMode: (active: boolean, data?: InputCommands[]) => void;
    setRecording: (active: boolean) => void;
    recordFrame: (cmds: InputCommands) => void;
    clearRecording: () => void;
}

const emptyCommands: InputCommands = { UP: false, DOWN: false, LEFT: false, RIGHT: false, ACTION: false, BOMB: false, FOCUS: false };

export const useInputStore = create<InputState>((set) => ({
    commands: { ...emptyCommands },
    deviceType: 'PC',

    isGhostMode: false,
    isRecording: false,
    ghostData: [],

    setDevice: (deviceType) => set({ deviceType }),
    setCommand: (cmd, active) => set((state) => ({ commands: { ...state.commands, [cmd]: active } })),

    // GHOST ACTIONS
    setGhostMode: (active, data = []) => set({ isGhostMode: active, ghostData: data, deviceType: active ? 'GHOST' : 'PC' }),
    setRecording: (active) => set({ isRecording: active }),
    recordFrame: (cmds) => set((state) => ({ ghostData: [...state.ghostData, { ...cmds }] })),
    clearRecording: () => set({ ghostData: [] })
}));