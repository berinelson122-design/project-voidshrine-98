# VoidMaiden: High-Performance Bullet-Hell Engine

A 60 FPS bullet-hell engine built entirely in the browser. This project focuses on high-performance rendering and memory management using the HTML5 Canvas API.

### [Live Demo](https://project-voidshrine-98.vercel.app/)

![VoidMaiden Gameplay](<img width="563" height="1218" alt="Image" src="https://github.com/user-attachments/assets/2dd58f05-e3a6-417a-b4fc-6e08edd6be52" />)

### Tech Stack
* **Language:** TypeScript
* **Rendering:** HTML5 Canvas API (Procedural rendering)
* **Architecture:** React 18 / Zustand
* **Audio:** Web Audio API (Synthesized in real-time)

### How It Works
* **Entity Pooling:** To maintain 60 FPS, the engine uses a custom `EntityPool` class. Instead of creating and destroying thousands of bullet objects (which triggers garbage collection spikes), objects are pre-allocated and recycled in memory.
* **Procedural Generation:** All sprites and visual effects are drawn directly to the canvas context, removing the need for external asset loading and enabling instant startup times.
* **Audio Synthesis:** Sound effects are generated mathematically using the Web Audio API (Oscillators/GainNodes), ensuring the audio engine has zero file-size overhead.

### Setup
```bash
git clone https://github.com/berinelson122-design/voidmaiden-danmaku-engine
npm install
npm run dev
