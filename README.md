# VOIDMAIDEN // SHRINE_PROTOCOL_98

**VERSION:** 3.2.0 // FINAL_STABLE  
**ARCHITECT:** Nelson Beri (Void Weaver)  
**UPLINK:** [voidmaiden.netlify.app](https://voidmaiden.netlify.app) | [https://project-voidshrine-98.vercel.app/] | [voidmaiden.berinelson122.workers.dev]

---

## SYSTEM OVERVIEW
I built **VoidMaiden** because there is no official way to play the original PC-98 games (unless you want to mess with sketchy emulators and dead links) and I wanted to see if I could recreate that specific 16-bit dithered look using nothing but a web browser. This is a high-performance Danmaku engine engineered from scratch to handle thousands of entities while maintaining a locked 60FPS on high-resolution displays.

It is designed for the **Sovereignty Protocol**, meaning it runs entirely client-side, works 100% offline, and allows the operator to inject their own local data (MP3s) directly into the hardware.

## THE ARSENAL (TECH STACK)
* **Core Framework:** React 18 in Strict Mode.
* **Rendering Context:** HTML5 Canvas API with custom entity pooling.
* **State Management:** Zustand for centralized command polling.
* **Sound Synthesis:** Web Audio API for procedural sound design.
* **Network Protocol:** PeerJS for low-latency peer-to-peer duels.
* **Offline Manifest:** Progressive Web App with local caching.

---

## OPERATIONAL MECHANICS

### 1. Null Omen Spell Cards
Players can unlock distinct spell cards by accumulating power points. Activating a card consumes power to deploy an offensive payload.

* **Void Sign [Hollow Abyss] (32 Power):** Deploys a gravitational singularity that consumes hostile projectiles.
* **Entropy Sign [Tearing Darkness] (64 Power):** Fires twin laser beams that slice through all enemy vectors.
* **Virus Sign [Byte Basher] (96 Power):** Releases a swarm of homing needles targeting the boss core.
* **Void Sign [Thermodynamic Shatter] (128 Power):** Executes a total screen freeze that shatters the enemy hull.

### 2. Deathbomb Protocol
A twelve-frame window allows the operator to deploy a bomb after impact. This reflex mechanism cancels the death sequence.

### 3. Point of Collection
Navigating the vessel into the upper quadrant of the screen triggers a collection vacuum. All floating resources fly directly to the player.

### 4. Adaptive Boss Engine
The boss features fifteen sequential phases. The pattern engine scales projectile velocities dynamically.

### 5. Ghost Run Serialization
The interface records raw input streams into JSON data files. Operators can export these recordings to hardware. Loading a recording executes a deterministic playback of the run.

### 6. DEATHBOMB PROTOCOL
A 12-frame window (approx. 160ms) after impact where you can execute a "Silence Protocol" (Bomb) to save your life.

### 7. POINT OF COLLECTION (PoC)
Moving the vessel to the top 25% of the screen triggers a vacuum effect that auto-collects all power and point items.

### 8. ADAPTIVE AI
The Archon (Boss) features 5 distinct stages of mathematical bullet patterns that scale in difficulty based on your score multiplier.

### 9. ARK RADIO
A local file buffer that allows you to play your own Touhou remixes directly from your folders without needing an external music service.

### 10. PWA ARCHITECTURE
Installable as a standalone app on macOS/iOS/Android for offline execution.

---

## CROSS-DEVICE COMMAND MATRIX

| Action Node | PC Architecture | Mobile Haptic Engine | Console Protocol |
| :--- | :--- | :--- | :--- |
| **Vessel Movement** | `[WASD]` / `[Arrows]` | Virtual Touch Joystick | D-Pad / Left Stick |
| **Focus Shunt** | `[Shift]` | Touch Focus Node | Button X / R1 |
| **Primary Fire** | `[Z]` / `[Space]` | Touch Fire Node | Button A / R2 |
| **Silence Bomb** | `[X]` / `[B]` | Touch Bomb Node | Button B / L2 |
| **Launch Null Omen** | `[P]` / `[C]` | Dynamic Omen Popup | Button Y / L1 |

---

## LOCAL INITIALIZATION (The Setup)
To run this engine from source code, you need **Node.js** installed on your machine.

```bash
# 1. Clone the repository
git clone https://github.com/berinelson122-design/project-voidshrine-98.git

# 2. Enter directory
cd project-voidshrine-98

# 3. Install dependencies
npm install

# 4. Launch local engine
npm run dev
```

## CONFIGURATION (Optional)
To enable the Global Leaderboard, rename `.env.example` to `.env.local` and add your keys:

```env
VITE_GRID_UPLINK_URL=your_supabase_url
VITE_GRID_ACCESS_TOKEN=your_anon_key
```
*(The game runs perfectly fine in Offline Mode without these).*

## Troubleshooting: The "Black Screen"
If the game displays a black screen on launch:
1. Ensure you have renamed `.env.example` to `.env.local`.
2. Verify you have inserted a valid Supabase URL and Anon Key.
3. If playing offline, the engine will automatically enter 'Bunker Mode' and save data to your local hardware instead of the global grid.

---

## THE VOID WEAVER LICENSE
**Proprietary / Educational Use.**  
All rights reserved by Nelson Beri. Use the code to learn, build, and reclaim your sovereignty. Do not sell the engine as your own without the author's permission.

*"What doesn't kill you gives you Data... and keeps you away from interdimensional gap witches, probably."*

P.S: If you wish to download the full source code and modify the game to your own likeness, buy it here: https://berinelson.gumroad.com/l/kfwnem

<span style="color: #E056FD; font-family: monospace; font-size: 10px;">ARCHITECT // VOID_WEAVER</span>
</div>
```