
export interface DuelPacketData {
  normX: number; // 0.0 to 1.0 normalized screen position
  normY: number; // 0.0 to 1.0 normalized screen position
  power?: number;
  lives?: number;
  score?: number;
  isFiring?: boolean;
  spellCardActive?: boolean;
  timestamp?: number;
}

export const encodeCoord = (x: number, y: number, extra?: Partial<DuelPacketData>): ArrayBuffer => {
  // 32-byte Binary Packet for low-latency WebRTC DataChannel transfer
  const buf = new ArrayBuffer(32);
  const floatView = new Float32Array(buf, 0, 6);
  const intView = new Int32Array(buf, 24, 2);

  floatView[0] = x;
  floatView[1] = y;
  floatView[2] = extra?.normX ?? (typeof window !== 'undefined' ? x / window.innerWidth : x);
  floatView[3] = extra?.normY ?? (typeof window !== 'undefined' ? y / window.innerHeight : y);
  floatView[4] = extra?.power ?? 0;
  floatView[5] = extra?.score ?? 0;

  intView[0] = extra?.lives ?? 3;
  intView[1] = (extra?.isFiring ? 1 : 0) | (extra?.spellCardActive ? 2 : 0);

  return buf;
};

export const decodeCoord = (buf: ArrayBuffer): DuelPacketData & { x: number; y: number } => {
  if (buf.byteLength < 8) {
    return { x: 0, y: 0, normX: 0.5, normY: 0.5 };
  }
  const floatView = new Float32Array(buf, 0, Math.min(6, Math.floor(buf.byteLength / 4)));
  const x = floatView[0] || 0;
  const y = floatView[1] || 0;

  if (buf.byteLength >= 32) {
    const intView = new Int32Array(buf, 24, 2);
    return {
      x,
      y,
      normX: floatView[2] ?? 0.5,
      normY: floatView[3] ?? 0.5,
      power: floatView[4] ?? 0,
      score: floatView[5] ?? 0,
      lives: intView[0] ?? 3,
      isFiring: (intView[1] & 1) !== 0,
      spellCardActive: (intView[1] & 2) !== 0,
    };
  }

  return {
    x,
    y,
    normX: typeof window !== 'undefined' ? x / window.innerWidth : 0.5,
    normY: typeof window !== 'undefined' ? y / window.innerHeight : 0.5,
  };
};