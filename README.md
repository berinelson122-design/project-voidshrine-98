# VOIDMAIDEN // SHRINE_PROTOCOL_98
**Version:** 3.2.0 (STABLE)
**Architect:** Nelson Beri (Void Weaver)
**Logic:** React 18 + TypeScript (Strict Mode) + HTML5 Canvas

---

## SYSTEM MANIFESTO
"What doesn't kill you gives you Data."

VoidMaiden is a high-performance, browser-based Danmaku (Bullet Hell) engine engineered to test the limits of procedural generation, reflex latency, and local data sovereignty. Inspired by the PC-98 era of Japanese computing, this artifact rejects modern "Live-Service Slop" in favor of an air-gapped, high-fidelity experience.

## THE SOVEREIGN STACK
*   **Core:** React 18 / Vite 5 (Zero-latency UI state management)
*   **Rendering:** HTML5 Canvas API (Custom 60FPS tick-decoupled loop)
*   **Memory Architecture:** Manual Object Pooling for 3,000+ active entities
*   **Networking:** PeerJS (P2P WebRTC) for decentralized combat
*   **Persistence:** Supabase (Leaderboard Uplink) + LocalStorage (Offline Buffer)
*   **Audio Synthesis:** Web Audio API (FM-Synth SFX generation)

## OPERATIONAL FEATURES
*   **Ark Radio Interface:** Native file-linkage allowing users to inject local .MP3 files directly into the simulation's audio buffer.
*   **The 5-Phase Archon:** A procedurally scaling AI Boss with mathematical bullet patterns (Radial, Spiral, and Deterministic Chaos).
*   **Sovereignty Protocol:** Full PWA integration. Once loaded, the engine operates 100% offline. 
*   **Frame-Perfect Mechanics:** Functional Graze detection, Spell Card (Bomb) system, and a calibrated 12-frame deathbomb window.

---

## INITIALIZING THE NODE

Ensure your hardware (M2 Silicon or equivalent) has Node.js installed.

```bash
# 1. CLONE THE REPO
git clone https://github.com/berinelson122-design/project-voidshrine-98.git

# 2. INSTALL THE ARCHITECTURE
cd project-voidshrine-98
npm install

# 3. INITIALIZE THE CORE
npm run dev
