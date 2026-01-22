/**
 * VOID_WEAVER // DUEL_LINK_INTERFACE
 * ARCHITECT: NELSON BERI
 */
import React, { useState, useEffect, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { Share2, Zap, ShieldAlert, Terminal } from 'lucide-react';
import { encodeCoord, decodeCoord } from '../utils/protocol';

export const DuelLink: React.FC<{ onPositionUpdate: (pos: {x: number, y: number}) => void }> = ({ onPositionUpdate }) => {
  const [peerId, setPeerId] = useState<string>("");
  const [targetId, setTargetId] = useState<string>("");
  const [status, setStatus] = useState<"IDLE" | "CONNECTING" | "ACTIVE">("IDLE");
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);

  useEffect(() => {
    // Initialize Peer Node
    const peer = new Peer(`VOID_${Math.random().toString(36).substr(2, 5)}`);
    peerRef.current = peer;

    peer.on('open', (id) => setPeerId(id));

    peer.on('connection', (conn) => {
      connRef.current = conn;
      setupConnection(conn);
    });

    return () => peer.destroy();
  }, []);

  const setupConnection = (conn: DataConnection) => {
    conn.on('data', (data: any) => {
      if (data instanceof ArrayBuffer) {
        onPositionUpdate(decodeCoord(data));
      }
    });
    conn.on('open', () => setStatus("ACTIVE"));
  };

  const connectToInvader = () => {
    if (!peerRef.current || !targetId) return;
    setStatus("CONNECTING");
    const conn = peerRef.current.connect(targetId, { serialization: 'none' });
    connRef.current = conn;
    setupConnection(conn);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (status === "ACTIVE" && connRef.current?.open) {
        connRef.current.send(encodeCoord(e.clientX, e.clientY));
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [status]);

  return (
    <div className="p-4 bg-black border-2 border-[#E056FD] font-mono text-[10px] w-64 shadow-[0_0_20px_rgba(224,86,253,0.2)]">
      <div className="flex items-center gap-2 text-[#E056FD] mb-4 border-b border-[#E056FD]/30 pb-2">
        <Terminal size={14} />
        <span className="font-black tracking-widest uppercase">Duel_Protocol_V1</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-gray-500 block mb-1 uppercase">Local_Node_ID</label>
          <div className="bg-[#111] p-2 border border-[#333] text-white flex justify-between items-center">
            <span className="text-[#39ff14]">{peerId || "INITIALIZING..."}</span>
            <button onClick={() => navigator.clipboard.writeText(peerId)} className="hover:text-[#E056FD]"><Share2 size={12}/></button>
          </div>
        </div>

        <div>
          <label className="text-gray-500 block mb-1 uppercase">Target_ID (Invader)</label>
          <input 
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full bg-[#111] border border-[#333] p-2 text-[#E056FD] focus:border-[#E056FD] outline-none"
            placeholder="VOID_XXXXX"
          />
        </div>

        <button 
          onClick={connectToInvader}
          disabled={status !== "IDLE"}
          className={`w-full py-2 flex items-center justify-center gap-2 font-black transition-all ${
            status === "ACTIVE" ? "bg-[#39ff14] text-black" : "bg-[#FF003C] text-white hover:bg-white hover:text-black"
          }`}
        >
          <Zap size={14} />
          {status === "IDLE" ? "INITIATE LINK" : status}
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2 text-gray-600 text-[8px]">
        <ShieldAlert size={10} />
        <span>ENCRYPTED_P2P_TUNNEL_ACTIVE</span>
      </div>
    </div>
  );
};