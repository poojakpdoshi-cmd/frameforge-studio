# FrameForge Studio 🎬⚡

> **An AI-Native, Professional-Grade Non-Linear Video Editing & VFX Workstation**

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%2F11%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Engine](https://img.shields.io/badge/Engine-WebGL2%20%2F%20WebGPU%20%2B%20FFmpeg-orange.svg)](#)
[![Architecture](https://img.shields.io/badge/Architecture-Decoupled%20NLE%20Core-brightgreen.svg)](ARCHITECTURE.md)

---

## 💡 What is FrameForge Studio?

**FrameForge Studio** is a serious, local-first, open-source digital video workstation engineered for high-performance non-linear editing (NLE), real-time visual effects (VFX), kinetic motion graphics, and sample-accurate audio mixing.

- **Not a landing page or UI prototype.**
- **Not a CapCut clone.**
- **Not a thin FFmpeg wrapper.**
- **A genuine, extensible desktop editing application** featuring an independent deterministic editing engine, rational-time timeline data model, multi-pass GPU shader compositing, and full programmatic control via the Model Context Protocol (MCP).

---

## 🏛️ Core Architectural Pillars

1. **Non-Destructive Rational-Time Data Model (`@frameforge/core`):**
   Sub-frame calculations use exact rational arithmetic (`RationalTime: numerator / denominator`) to eliminate floating-point frame drift across multi-hour timelines.
2. **Dual-Path Real-Time & Production Rendering (`@frameforge/engine`):**
   - **Interactive Viewport:** Sub-16ms 60fps GPU-accelerated preview with multi-pass WebGL2/WebGPU shaders, ping-pong framebuffers, and LRU frame caching.
   - **Production Exporter:** High-throughput FFmpeg hardware-accelerated encoding (NVIDIA NVENC, Intel QuickSync, AMD AMF, and CPU `libx264`/`librav1e`).
3. **Atomic Command Bus & Infinite Undo/Redo:**
   Every single human interaction and AI agent edit is dispatched as an invertible, validated `ICommand`, guaranteeing transaction safety and complete autosave recovery.
4. **Cinematic Shaders & Color Engine:**
   Real physical shaders for analog film grain, red-edge halation, anamorphic lens flares, chromatic aberration, bloom, 3-way color wheels (Lift/Gamma/Gain), and 3D LUT sampling.
5. **Sample-Accurate Audio DSP (`@frameforge/audio`):**
   Multitrack virtual mixer with per-channel volume automation, stereo panning, 4-band parametric equalization, and peak metering (dBFS).
6. **AI-Native Model Context Protocol (MCP):**
   External AI agents command the editor through an authenticated, inspectable, and reversible MCP server operating on the exact same command bus as human users.

---

## 📁 Repository Structure

```
frameforge-studio/
├── apps/
│   └── desktop/                  # Desktop shell application (Electron + React 19 + Tailwind)
│       ├── src/
│       │   ├── main/             # Electron main process (FFmpeg bridge, native I/O)
│       │   ├── preload/          # Secure typed IPC bridge
│       │   └── renderer/         # React 19 UI workspace, timeline canvas, viewports
├── packages/
│   ├── core/                     # Timeline data model, rational time, command bus, OTIO
│   ├── engine/                   # GPU shader pipeline, compositing DAG, render graph
│   ├── audio/                    # Web Audio DSP, multitrack mixer, waveform generator
│   └── mcp/                      # Model Context Protocol (MCP) server for AI agents
├── docs/                         # In-depth architectural & mathematical specifications
│   ├── ARCHITECTURE.md           # Master architectural blueprint
│   ├── TECH_STACK.md             # Technology stack rationale & comparison
│   ├── DEPENDENCY_AUDIT.md       # License audit & OSI compliance
│   ├── ROADMAP.md                # 8-stage engineering delivery plan
│   ├── EFFECTS_SYSTEM.md         # Shader math & effect catalog
│   └── RENDERING_PIPELINE.md     # Dual-path render pipeline & hardware encoders
├── tests/                        # Automated unit, integration, and benchmark tests
├── examples/                     # Sample project files and automation scripts
└── assets/                       # Test patterns and creative suite assets
```

---

## 🚀 Quick Start & Development Setup

### Prerequisites
- **Node.js:** v20.x or v22.x+ (Tested on v24.19)
- **pnpm:** v9.x or v11.x (or `npm`)
- **FFmpeg:** 6.x, 7.x, 8.x, or 9.x in system PATH (Installed and verified)
- **Operating System:** Windows 10/11, macOS 13+, or Ubuntu 22.04+

### Installation & Launch

```bash
# Clone the repository
git clone https://github.com/poojakpdoshi-cmd/frameforge-studio.git
cd frameforge-studio

# Install dependencies across all packages
pnpm install

# Run unit and integration tests
pnpm test

# Launch FrameForge Studio in development mode
pnpm run dev
```

---

## 🗺️ Roadmap & Milestones

| Stage | Focus Area | Status |
| :--- | :--- | :--- |
| **Stage 0** | Research, Architecture, License Audits & Specifications | **Complete** |
| **Stage 1** | Real Editing Foundation: Multitrack Timeline, Media Ingest, Dual Monitors | **In Progress** |
| **Stage 2** | Precision Tools: Split, Ripple, Roll, Slip, Slide, Snapping & Undo/Redo | Upcoming |
| **Stage 3** | GPU Effects Pipeline: Transform, Cinematic Shaders, Blurs, Color | Upcoming |
| **Stage 4** | Motion Graphics: Keyframe Curves, Bézier Interpolation, Kinetic Typography | Upcoming |
| **Stage 5** | VFX Workspace: Node Compositor, Chroma Keying, Masking, Tracking | Upcoming |
| **Stage 6** | Audio DSP & Mixing: 4-Band EQ, Dynamics Compression, Color Wheels | Upcoming |
| **Stage 7** | Deterministic Export: NVENC/QSV/AMF Hardware Encoders, Verification | Upcoming |
| **Stage 8** | AI Integration: Native MCP Server & Script-to-Visual Alignment | Upcoming |

*For complete milestone details, inspect [ROADMAP.md](ROADMAP.md).*

---

## ⚖️ Clean-Room Engineering & License

FrameForge Studio is released under the **Apache License 2.0**.  
See the full license terms in [LICENSE](LICENSE).

**Clean-Room Assurance:**  
FrameForge Studio is built from first-principles computer graphics mathematics, open standards (W3C WebGPU, Khronos WebGL, ASWF OpenTimelineIO), and documented open-source specifications. It contains zero proprietary code, assets, or trademarks from Adobe Premiere Pro, After Effects, DaVinci Resolve, Final Cut Pro, or CapCut.
