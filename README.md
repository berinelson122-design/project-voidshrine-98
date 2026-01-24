# VOIDMAIDEN // SHRINE_PROTOCOL_98

**VERSION:** 3.2.0 // FINAL_STABLE  
**ARCHITECT:** Nelson Beri (Void Weaver)  
**UPLINK:** [voidmaiden.netlify.app](https://voidmaiden.netlify.app)

---

## SYSTEM OVERVIEW
I built **VoidMaiden** because there is no official way to play the original PC-98 games (unless you want to mess with sketchy emulators and dead links) and I wanted to see if I could recreate that specific 16-bit dithered look using nothing but a web browser. This is a high-performance Danmaku engine engineered from scratch to handle thousands of entities while maintaining a locked 60FPS on high-resolution displays.

It is designed for the **Sovereignty Protocol**, meaning it runs entirely client-side, works 100% offline, and allows the operator to inject their own local data (MP3s) directly into the hardware.

## THE ARSENAL (TECH STACK)
*   **CORE:** React 18 + TypeScript (Strict Mode)
*   **ENGINE:** HTML5 Canvas API (Manual Procedural Rendering)
*   **OPTIMIZATION:** Custom Object Pooling for 3,000+ active projectiles
*   **AUDIO:** Web Audio API (Real-time FM-Synth & Oscillator Synthesis)
*   **NETWORKING:** PeerJS (WebRTC) for zero-latency P2P duels
*   **PERSISTENCE:** Supabase for the global grid / LocalStorage for the bunker

## OPERATIONAL MECHANICS
*   **DEATHBOMB PROTOCOL:** A 12-frame window (approx. 160ms) after impact where you can execute a "Silence Protocol" (Bomb) to save your life.
*   **POINT OF COLLECTION (PoC):** Moving the vessel to the top 25% of the screen triggers a vacuum effect that auto-collects all power and point items.
*   **ADAPTIVE AI:** The Archon (Boss) features 5 distinct stages of mathematical bullet patterns that scale in difficulty based on your score multiplier.
*   **ARK RADIO:** A local file buffer that allows you to play your own Touhou remixes directly from your folders without needing an external music service.
*   **PWA ARCHITECTURE:** Installable as a standalone app on macOS/iOS/Android for offline execution.

---

## LOCAL INITIALIZATION (The Setup)
To run this engine from source code, you need **Node.js** installed on your machine.

```bash
# 1. ENTER THE DIRECTORY
cd VoidMaiden_Source

# 2. INSTALL THE ARCHITECTURE (Critical Step)
# This downloads React, Vite, and the Physics libraries.
npm install

# 3. INITIALIZE THE CORE
# This starts the local development server at localhost:5173
npm run dev
```

## CONFIGURATION (Optional)
To enable the Global Leaderboard, rename `.env.example` to `.env.local` and add your keys:

```env
VITE_GRID_UPLINK_URL=your_supabase_url
VITE_GRID_ACCESS_TOKEN=your_anon_key
```
*(The game runs perfectly fine in Offline Mode without these).*

---

## THE VOID WEAVER LICENSE
**Proprietary / Educational Use.**  
All rights reserved by Nelson Beri. Use the code to learn, build, and reclaim your sovereignty. Do not sell the engine as your own slop.

*"What doesn't kill you gives you Data... and keeps you away from interdimensional gap witches, probably."*
<span style="color: #E056FD; font-family: monospace; font-size: 10px;">ARCHITECT // VOID_WEAVER</span>
</div>
```
