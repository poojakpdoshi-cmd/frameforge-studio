# FrameForge Studio: Architectural Blueprint & System Design

**Version:** 0.1.0-alpha  
**Status:** Approved Architectural Specification  
**Classification:** Core System Architecture  
**Author:** FrameForge Architecture & Systems Engineering Team  

---

## 1. Executive Summary & Architectural Philosophy

**FrameForge Studio** is an open-source, local-first, professional-grade non-linear video editing (NLE), motion graphics, and visual effects (VFX) application. Unlike lightweight consumer video tools, FrameForge Studio is engineered from first principles as a serious digital workstation.

### Fundamental Architectural Tenets:
1. **Decoupled Engine Core:** The editing, compositing, and audio calculation engines have zero dependencies on the user interface (UI) and zero direct coupling to AI agent frameworks. The engine operates headlessly as a deterministic state machine.
2. **Non-Destructive Rational-Time Data Model:** All edits, trims, cuts, splits, time-remaps, and grade operations are pure non-destructive transformations over immutable source media descriptors. Every frame calculation uses exact rational arithmetic (`RationalTime: numerator / denominator`) to eliminate floating-point frame drift.
3. **Dual-Path Render Architecture:**
   - **Interactive Preview Path:** Ultra-low latency (<16ms frame budget @ 60fps), GPU-accelerated shader composition via WebGPU / WebGL2 / Canvas2D, multi-level LRU frame caching, dynamic resolution scaling, and proxy generation.
   - **Production Export Path:** Deterministic frame-accurate render graph evaluation with FFmpeg hardware-accelerated encoding pipelines (NVENC, Intel QSV, AMD AMF, Apple VideoToolbox, and fallback CPU `libx264`/`librav1e`).
4. **Command-Bus & Reversible State Transactionality:** Every human action and every AI agent invocation is reified into an atomic, validated, invertible `Command` object on a centralized Command Bus, enabling infinite non-destructive Undo/Redo, persistent action journaling, and complete project recovery.
5. **AI-Native via Open Protocols:** Full programmatic control through a native Model Context Protocol (MCP) server that exercises identical command interfaces as the human desktop operator—ensuring zero privilege disparity, full validation, and complete human inspectability.

---

## 2. Comparative Analysis of Prior Art & Open-Source Editing Engines

Before writing production code, we conducted an exhaustive investigation into existing open-source video editing, compositing, and media frameworks:

| Project | Core Strengths | Critical Weaknesses & Architectural Bottlenecks | FrameForge Design Decision |
| :--- | :--- | :--- | :--- |
| **OpenTimelineIO (OTIO)** | Industry-standard interchange format (Pixar/ASWF), clean track/clip/gap/marker hierarchy, rational time (`RationalTime`, `TimeRange`). | Interchange format only; no rendering, compositing, playback, or audio DSP capabilities. | **Adopt OTIO-compatible schema** for FrameForge project hierarchy and interchange, guaranteeing seamless import/export to Premiere, DaVinci Resolve, and Final Cut Pro. |
| **MLT Framework (Kdenlive / Shotcut)** | Mature multitrack C library, extensive frei0r/ladspa effect integration, proven production stability. | Heavily coupled C/C++ architecture; difficult cross-language bindings; outdated single-threaded bottlenecks; GPL v2/v3 contamination. | **Do not embed MLT directly.** Instead, emulate MLT's tractor/multitrack abstraction in modern modular TypeScript/Rust with modern GPU shaders. |
| **Natron / OpenFX** | Node-based VFX compositing, OFX plugin standard support, deep color pipelines. | Abandoned codebase; heavyweight legacy C++ GUI (Qt4/5); lack of responsive real-time timeline editing; poor video track ergonomics. | **Incorporate Natron’s directed acyclic graph (DAG) compositing model** into FrameForge's VFX workspace while maintaining a fast timeline NLE core. |
| **Remotion** | React-based programmatic video creation, pristine SVG/CSS/Canvas animation, React component reusability. | Web-only rendering model; slow frame-by-frame Puppeteer rendering; no native real-time multitrack scrubbing or sample-accurate audio mixer. | **Integrate Remotion-compatible declarative component syntax** for programmatic titles and kinetic motion graphics, backed by our real-time GPU engine. |
| **Blender VSE & Compositor** | Powerful internal dependency graph, Cycles/EEVEE 3D integration, rock-solid color management (OCIO). | Clunky VSE interface, high learning curve, bloated footprint for pure video editing, monolithic C/C++ codebase. | **Adopt Blender’s node evaluation principles and OpenColorIO-compatible ACES/Rec.709 color transform standards.** |
| **FFmpeg / libav** | Universal codec support, unmatched demuxing/muxing performance, hardware acceleration (NVENC/QSV/AMF), robust filtergraph. | Not an interactive playback engine; asynchronous process overhead; seeking latency; filtergraph compilation latency unsuitable for 60fps scrubbing. | **Use FFmpeg as the master export, proxy generation, and media probe engine**, while utilizing real-time GPU shader pipelines and WebCodecs/Canvas for the 60fps interactive preview viewport. |
| **WebGPU / wgpu** | Modern compute and graphics API, portable across Vulkan, DirectX 12, and Metal, zero-overhead compute shaders. | Developing ecosystem in browsers/Node; requires robust fallback to WebGL2 and Canvas2D for broad hardware support. | **Primary shader and compositing pipeline built with WebGPU/WebGL2 shaders** with a guaranteed Canvas2D fallback matrix. |

---

## 3. High-Level System Architecture

FrameForge Studio is structured into five distinct, loosely coupled architectural tiers:

```mermaid
graph TD
    subgraph UI_Layer ["1. Presentation & Interaction Tier (React 19 + TypeScript + Tailwind)"]
        UI_TL[Multitrack Timeline View]
        UI_Mon[Dual Monitor: Source & Program]
        UI_Insp[Unified Inspector & Keyframe Curve Editor]
        UI_Node[Node-based VFX Compositor Workspace]
        UI_Aud[Professional Multitrack Audio Mixer]
        UI_Exp[Export & Queue Management Workspace]
    end

    subgraph Desktop_Shell ["2. Desktop Shell & System Bridge (Electron / Native Node 24)"]
        IPC_Bridge[Secure Typed IPC Bridge]
        FS_Storage[Project File SQLite & JSON Engine]
        Media_Probe[FFprobe / Media Ingestion Inspector]
        Native_Dialogs[Native OS File Pickers & Hardware Prober]
    end

    subgraph Core_Engine ["3. Core Editing & State Tier (@frameforge/core)"]
        Cmd_Bus[Command Bus & Transaction Manager]
        Undo_Redo[Bidirectional Invertible History Stack]
        Timeline_Model[Non-Destructive Timeline Graph]
        Rational_Time[SMPTE & RationalTime Arithmetic Engine]
        OTIO_Adapter[OTIO Serializer & Deserializer]
    end

    subgraph Media_Pipeline ["4. Media, GPU & DSP Tier (@frameforge/engine & audio)"]
        Render_Graph[DAG Compositing & Blend Mode Graph]
        GPU_Compositor[WebGPU / WebGL2 Custom Shader Pipeline]
        Effects_Lib[50+ Parameterized Cinematic VFX & Color Shaders]
        Audio_Mixer[Web Audio Multitrack DSP & Waveform Cache]
        FFmpeg_Export[FFmpeg NVENC/QSV/CPU Production Exporter]
    end

    subgraph AI_Tier ["5. AI Orchestration Tier (@frameforge/mcp)"]
        MCP_Server[Model Context Protocol (MCP) Server]
        Agent_Guard[Safety & Validation Policy Interceptor]
        Script_Aligner[Script-to-Visual Alignment Planner]
    end

    UI_Layer <-->|Actions / Selectors| Core_Engine
    UI_Layer <-->|Events & Context| Desktop_Shell
    Core_Engine <-->|Render Tree| Media_Pipeline
    Desktop_Shell <-->|Hardware & Process Spawning| Media_Pipeline
    AI_Tier <-->|MCP JSON-RPC Commands| Cmd_Bus
```

---

## 4. Subsystem Specifications

### 4.1. Core Timeline Data Model (`@frameforge/core`)

The timeline model represents a non-destructive edit decision list structured as a hierarchical tree:

```typescript
export interface RationalTime {
  value: bigint;       // Exact numerator (e.g. frames, ticks)
  timescale: number;   // Denominator (e.g. 24, 25, 30000/1001, 60, 48000)
}

export interface TimeRange {
  start: RationalTime;
  duration: RationalTime;
}

export interface MediaSource {
  id: string;
  uri: string;
  filePath: string;
  duration: RationalTime;
  videoTracks: VideoStreamDescriptor[];
  audioTracks: AudioStreamDescriptor[];
  metadata: Record<string, unknown>;
}

export interface TimelineClip {
  id: string;
  name: string;
  sourceId: string;
  sourceRange: TimeRange;     // In-point and Out-point within source media
  timelineRange: TimeRange;   // Placement and duration on the timeline track
  speed: number;              // 1.0 = normal, negative = reverse
  effects: EffectInstance[];
  transitions: {
    in?: TransitionInstance;
    out?: TransitionInstance;
  };
  audioGain: number;          // Linear gain factor
  audioPan: number;           // -1.0 (Left) to +1.0 (Right)
  enabled: boolean;
  locked: boolean;
}

export interface TimelineTrack {
  id: string;
  name: string;
  kind: 'video' | 'audio' | 'overlay' | 'vfx';
  index: number;
  clips: TimelineClip[];
  muted: boolean;
  solo: boolean;
  locked: boolean;
  height: number;
}

export interface TimelineSequence {
  id: string;
  name: string;
  timebase: number;           // Standard FPS (e.g., 24, 25, 29.97, 30, 60)
  resolution: { width: number; height: number };
  sampleRate: number;         // 48000 Hz standard
  tracks: TimelineTrack[];
  markers: Marker[];
}
```

### 4.2. Command Bus and Atomic History (Undo/Redo)

Every state change conforms to the `ICommand` contract:

```typescript
export interface ICommand<TContext = unknown> {
  readonly id: string;
  readonly name: string;
  readonly timestamp: number;
  execute(context: TContext): Promise<void> | void;
  undo(context: TContext): Promise<void> | void;
  serialize(): Record<string, unknown>;
}
```

- **Atomic Transactions:** Compound operations (e.g. "Ripple Delete": trim clip + shift downstream clips + ripple markers) execute as a single composite atomic transaction.
- **Audit Logging:** Every command execution emits an immutable JSON log event accessible to both the local SQLite audit log and external AI agents.

### 4.3. Real-Time Viewport & GPU Shader Pipeline (`@frameforge/engine`)

Interactive preview requires sub-16ms latency. The engine uses a layered rendering strategy:
1. **Source Demuxing & Decoding:**
   - HTML5 Video / WebCodecs `VideoDecoder` hardware-backed frame extraction.
   - Background FFmpeg proxy generation (`360p / 720p ProRes / DNxHR / H.264 intra`) for complex high-bitrate 4K/8K formats.
2. **GPU Compositing Pass:**
   - Multi-layer canvas compositing with custom WebGL2 / WebGPU fragment shaders.
   - Linear color-space blend modes (Normal, Multiply, Screen, Overlay, Soft Light, Color Dodge, etc.).
   - Off-screen Ping-Pong framebuffers for multi-pass effects (e.g., Gaussian blur downsample/upsample pyramids).
3. **Audio-Video Synchronization:**
   - Master clock driven by high-resolution audio context (`AudioContext.currentTime`) with jitter-compensation and frame-snapping.

---

## 5. Security & Isolation Model

- **Context Isolation:** The desktop frontend runs in a sandboxed renderer process with zero direct Node.js access.
- **Typed Secure IPC:** All communication with native binaries (FFmpeg, FFprobe, SQLite) flows through an explicitly audited preload bridge with strict schema validation.
- **AI Agent Guardrails:** The MCP server rejects commands attempting arbitrary shell execution or filesystem access outside authorized project workspace directories.

---

## 6. Target Platform Support Matrix

- **Tier 1 (Launch Target):** Windows 10 & Windows 11 (x86_64, DirectX 12 / Vulkan via Chromium Angle/WebGPU).
- **Tier 2 (Post-Launch Expansion):** macOS 13+ (Apple Silicon Metal & x86_64), Ubuntu Linux 22.04+ (Vulkan / VAAPI).

