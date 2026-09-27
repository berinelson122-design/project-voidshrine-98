import React, { useState, useEffect, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { Share2, Zap, ShieldAlert, Terminal, Wifi, Copy, Check, Smartphone, Monitor, Minimize2, Maximize2 } from 'lucide-react';
import { encodeCoord, decodeCoord, DuelPacketData } from '../utils/protocol';

interface DuelLinkProps {
  onPositionUpdate: (pos: DuelPacketData & { x: number; y: number }) => void;
  onClose?: () => void;
}

export const DuelLink: React.FC<DuelLinkProps> = ({ onPositionUpdate, onClose }) => {
  const [peerId, setPeerId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'ACTIVE'>('IDLE');
  const [copied, setCopied] = useState<boolean>(false);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [packetCount, setPacketCount] = useState<number>(0);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const pingTimerRef = useRef<number | null>(null);
  const pingStartRef = useRef<number>(0);

  // Auto-detect Target ID from URL Query Parameter (?duel=VOID_XXXXX)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlDuel = params.get('duel') || window.location.hash.replace('#', '');
      if (urlDuel && urlDuel.startsWith('VOID_')) {
        setTargetId(urlDuel.toUpperCase());
      }
    }
  }, []);

  useEffect(() => {
    // Initialize WebRTC Peer Node with random VOID hash
    const generatedId = `VOID_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const peer = new Peer(generatedId, {
      debug: 1
    });
    peerRef.current = peer;

    peer.on('open', (id) => setPeerId(id));

    peer.on('connection', (conn) => {
      connRef.current = conn;
      setupConnection(conn);
    });

    peer.on('error', (err) => {
      console.warn('--> [P2P_PEER_ERROR]:', err);
      setStatus('IDLE');
    });

    return () => {
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      peer.destroy();
    };
  }, []);

  const setupConnection = (conn: DataConnection) => {
    conn.on('data', (data: any) => {
      if (typeof data === 'string' && data.startsWith('PING:')) {
        conn.send('PONG:' + data.substring(5));
        return;
      }
      if (typeof data === 'string' && data.startsWith('PONG:')) {
        const sentTime = parseFloat(data.substring(5));
        const rtt = Math.round(performance.now() - sentTime);
        setPingMs(rtt);
        return;
      }

      if (data instanceof ArrayBuffer) {
        const decoded = decodeCoord(data);
        onPositionUpdate(decoded);
        setPacketCount(prev => prev + 1);
      }
    });

    conn.on('open', () => {
      setStatus('ACTIVE');
      // Trigger haptic vibration on mobile hardware
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate([30, 40, 30]); } catch {}
      }

      // Start ping/pong RTT latency monitoring
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      pingTimerRef.current = window.setInterval(() => {
        if (connRef.current?.open) {
          pingStartRef.current = performance.now();
          connRef.current.send('PING:' + pingStartRef.current);
        }
      }, 2000);
    });

    conn.on('close', () => {
      setStatus('IDLE');
      setPingMs(null);
    });
  };

  const connectToInvader = () => {
    if (!peerRef.current || !targetId.trim()) return;
    setStatus('CONNECTING');
    const conn = peerRef.current.connect(targetId.trim(), { serialization: 'none' });
    connRef.current = conn;
    setupConnection(conn);
  };

  // Dual Desktop Mouse & Mobile Touch Position Streamer
  useEffect(() => {
    if (status !== 'ACTIVE') return;

    const sendPosition = (clientX: number, clientY: number) => {
      if (connRef.current?.open) {
        const normX = Math.max(0, Math.min(1, clientX / window.innerWidth));
        const normY = Math.max(0, Math.min(1, clientY / window.innerHeight));
        const encoded = encodeCoord(clientX, clientY, { normX, normY });
        connRef.current.send(encoded);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      sendPosition(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        sendPosition(t.clientX, t.clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchMove);
    };
  }, [status]);

  const handleShareLink = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?duel=${peerId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SHRINE-98 P2P DANMAKU DUEL',
          text: `Challenge me to a P2P Danmaku duel! Room ID: ${peerId}`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed top-4 right-4 z-[220] flex items-center gap-2 bg-black/90 border border-[#E056FD] px-3 py-1.5 font-mono text-[9px] text-[#E056FD] shadow-[0_0_15px_rgba(224,86,253,0.3)] select-none">
        <span className={`w-2 h-2 rounded-full ${status === 'ACTIVE' ? 'bg-[#39FF14] animate-ping' : 'bg-[#FF003C]'}`} />
        <span>P2P DUEL: {status}</span>
        {pingMs !== null && <span className="text-white font-bold">[{pingMs}ms]</span>}
        <button onClick={() => setIsMinimized(false)} className="ml-1 text-white hover:text-[#00F3FF]">
          <Maximize2 size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 bg-black/95 border-2 border-[#E056FD] font-mono text-[10px] w-72 sm:w-80 shadow-[0_0_25px_rgba(224,86,253,0.35)] select-none relative">
      {/* HEADER & MINIMIZE BUTTON */}
      <div className="flex items-center justify-between text-[#E056FD] mb-3 border-b border-[#E056FD]/30 pb-2">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-[#00F3FF]" />
          <span className="font-black tracking-widest uppercase">DUEL PROTOCOL // P2P WebRTC</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:text-white hover:bg-[#E056FD]/20 border border-[#333] transition-all"
            title="Minimize Panel"
          >
            <Minimize2 size={12} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:text-white hover:bg-[#FF003C] border border-[#333] transition-all"
              title="Close Duel Modal"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* LOCAL PEER ID & ONE-TAP LINK SHARE */}
        <div>
          <div className="flex justify-between items-center text-gray-400 mb-1 uppercase text-[9px] font-bold">
            <span>Local Node ID (Your Room)</span>
            <span className="flex items-center gap-1 text-[#00F3FF]">
              <Monitor size={10} /> PC <Smartphone size={10} /> Mobile
            </span>
          </div>
          <div className="bg-[#080808] p-2 border border-[#333] text-white flex justify-between items-center">
            <span className="text-[#39FF14] font-bold font-mono text-xs">{peerId || 'INITIALIZING...'}</span>
            <button
              type="button"
              onClick={handleShareLink}
              className="p-1 bg-[#E056FD]/15 border border-[#E056FD] text-[#E056FD] hover:bg-[#E056FD] hover:text-black font-bold uppercase transition-all flex items-center gap-1 text-[8px]"
              title="Share / Copy Direct Room URL"
            >
              {copied ? <Check size={11} className="text-[#39FF14]" /> : <Share2 size={11} />}
              <span>{copied ? 'COPIED' : 'SHARE LINK'}</span>
            </button>
          </div>
        </div>

        {/* TARGET PEER INPUT & AUTO-LINK NOTIFIER */}
        <div>
          <label className="text-gray-400 block mb-1 uppercase text-[9px] font-bold">
            Target Invader Node ID
          </label>
          <div className="flex gap-1.5">
            <input
              value={targetId}
              onChange={(e) => setTargetId(e.target.value.toUpperCase())}
              className="flex-1 bg-[#080808] border border-[#333] p-2 text-[#00F3FF] focus:border-[#00F3FF] outline-none uppercase font-mono font-bold"
              placeholder="VOID_XXXXX"
              maxLength={12}
            />
          </div>
        </div>

        {/* CONNECT / STATUS BUTTON */}
        <button
          type="button"
          onClick={connectToInvader}
          disabled={status !== 'IDLE' || !targetId.trim()}
          className={`w-full py-2.5 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs transition-all border ${
            status === 'ACTIVE'
              ? 'bg-[#39FF14] border-[#39FF14] text-black shadow-[0_0_15px_#39FF14]'
              : status === 'CONNECTING'
              ? 'bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700] animate-pulse'
              : 'bg-[#FF003C] border-[#FF003C] text-white hover:bg-white hover:text-black shadow-[0_0_15px_rgba(255,0,60,0.3)] disabled:opacity-40'
          }`}
        >
          <Zap size={14} />
          <span>
            {status === 'IDLE' ? 'INITIATE P2P LINK' : status === 'CONNECTING' ? 'ESTABLISHING TUNNEL...' : 'TUNNEL ONLINE // ACTIVE'}
          </span>
        </button>

        {/* LATENCY & TELEMETRY BADGE */}
        {status === 'ACTIVE' && (
          <div className="p-2 border border-[#333] bg-[#050505] flex items-center justify-between text-[8px] text-gray-300">
            <span className="flex items-center gap-1.5 text-[#00F3FF] font-bold">
              <Wifi size={11} className="animate-pulse" />
              <span>RTT LATENCY: {pingMs !== null ? `${pingMs} ms` : 'MEASURING...'}</span>
            </span>
            <span className="text-gray-500 font-mono">PACKETS: {packetCount}</span>
          </div>
        )}
      </div>

      {/* FOOTER ENCRYPTION TELEMETRY */}
      <div className="mt-3 pt-2 border-t border-[#222] flex items-center justify-between text-gray-500 text-[8px]">
        <span className="flex items-center gap-1 text-[#39FF14]">
          <ShieldAlert size={10} />
          <span>ENCRYPTED_DATACHANNEL</span>
        </span>
        <span className="text-[#E056FD] font-mono font-bold">VOID_WEAVER</span>
      </div>
    </div>
  );
};