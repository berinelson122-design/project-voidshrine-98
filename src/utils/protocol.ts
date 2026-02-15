/**
 * VOID_WEAVER // PROTOCOL_SERIALIZER
 * PACKET_SIZE: 8 BYTES (2x Float32)
 */
export const encodeCoord = (x: number, y: number): ArrayBuffer => {
  const buf = new ArrayBuffer(8);
  const view = new Float32Array(buf);
  view[0] = x;
  view[1] = y;
  return buf;
};

export const decodeCoord = (buf: ArrayBuffer): { x: number; y: number } => {
  const view = new Float32Array(buf);
  return { x: view[0], y: view[1] };
};