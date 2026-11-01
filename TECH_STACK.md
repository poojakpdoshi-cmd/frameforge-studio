# FrameForge Studio: Technology Stack Specification

**Document Version:** 1.0.0  
**Classification:** Engineering Specification  

---

## 1. System Overview & Technology Selection Rationale

FrameForge Studio is engineered as an ultra-responsive, local-first professional creative workstation. The selection of every framework, runtime, library, and system boundary has been chosen based on real-world engineering constraints: memory efficiency, determinism, audio-visual synchrony, cross-platform portability, and license hygiene.

---

## 2. Comprehensive Technology Matrix

| Layer / Subsystem | Selected Technology | Version / Spec | Primary Rationale | Evaluated Alternatives & Reason for Rejection |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop Shell** | **Electron** | `^35.0.0` | Mature desktop platform with native windowing, raw hardware GPU access via ANGLE/Vulkan/DirectX 12, seamless WebGPU & WebCodecs integration, and direct Node 24 worker multithreading. | **Tauri 2 (Rust):** Evaluated favorably, but on environments lacking local MSVC/Rust build tools, Electron enables immediate zero-overhead local build, debugging, and cross-platform native execution without sacrificing high-performance GPU or native FFmpeg acceleration. |
| **Frontend Framework** | **React 19** | `^19.0.0` | Concurrent rendering transitions, compiler optimizations, exceptional UI component lifecycle management, and high-frequency virtualized DOM updates. | **Vue 3 / Svelte 5:** While performant, React has the deepest ecosystem of precision timeline, canvas, and audio tooling and enables Remotion-compatible component authoring. |
| **Language & Typings** | **TypeScript** | `^5.7.0` | End-to-end strict static typing, complete interface contracts across IPC boundaries, rational-time numeric precision, and refactoring safety. | **Pure JavaScript:** Unacceptable for a professional NLE; lack of type safety leads to catastrophic runtime regressions in complex frame-math pipelines. |
| **Styling & Design System** | **Tailwind CSS + Lucide Icons** | `^4.0.0` | Zero-runtime CSS extraction, pixel-accurate dark mode design tokens, high contrast creative suite aesthetic, and rapid UI composition. | **MUI / Ant Design:** Too opinionated, heavy runtime CSS-in-JS overhead, inappropriate aesthetic for professional video editing suites. |
| **Timeline Virtualization** | **Custom Canvas + CSS Grid Engine** | In-House | Capable of rendering 10,000+ clips across 64+ tracks at 60fps with zero layout thrashing or garbage collection stutter. | **Generic Virtual Lists:** Do not handle multi-track two-dimensional continuous zooming, magnetic snapping, and sub-frame scrubbing. |
| **Interactive GPU Shaders** | **WebGL2 / WebGPU + GLSL/WGSL** | WebGL 2.0 / WebGPU Standard | Real-time multi-pass GPU fragment shaders for color grading, blurs, halation, film grain, bloom, and transitions directly on the canvas. | **CSS Filters / SVG Filters:** Far too slow for 4K 60fps video compositing; lack custom multi-buffer ping-pong passes and LUT sampling. |
| **Video Decoding & Display** | **HTML5 Video & WebCodecs API** | W3C Standard | Direct zero-copy hardware video decoding via local GPU decoders (NVDEC, Intel QuickSync, AMD). | **Pure Software Canvas Painting:** Insufficient framerates for 4K video scrubbing. |
| **Export & Transcoding** | **FFmpeg 9.0 CLI / Process Engine** | `9.0 full build` (gyan.dev) | Industry-standard Swiss Army knife for audio/video muxing, demuxing, filtergraph execution, and NVENC/QSV/AMF hardware encoding. | **In-Browser WebAssembly FFmpeg:** Restricted to single-threaded 32-bit memory boundaries, unable to access host GPU hardware encoding engines. |
| **Audio Processing (DSP)** | **Web Audio API + AudioWorklet** | W3C Recommendation | Sample-accurate scheduling, multi-bus routing, gain automation, biquad parametric filtering, dynamic range compression, and zero-latency meter visualization. | **OS-Native PortAudio / ALSA:** Complex cross-platform native bindings; Web Audio API provides built-in sample-accurate DSP with zero extra C++ compilation risks. |
| **Data Persistence** | **SQLite + Versioned JSON Schema** | SQLite3 / `node:sqlite` | ACID-compliant project transaction logging, instant autosave, crash recovery, and single-file portable `.frameforge` project bundles. | **Flat JSON Files:** High risk of file corruption during power cuts or abrupt application termination during active edits. |
| **State & Command Bus** | **Zustand + Custom Invertible Command Bus** | `^5.0.0` | Minimal boilerplate, instantaneous reactivity outside React render loops, zero-copy selectors, and strict command-pattern encapsulation. | **Redux Toolkit:** Overly verbose boilerplate; unnecessary overhead for high-frequency 60fps playback timecode state. |
| **AI Protocol & Automation** | **Model Context Protocol (MCP)** | Spec 2024-11-05 | Standardized agent-to-application RPC protocol enabling Claude, Gemini, and GPT-based editing copilots to execute verified editing commands. | **Custom Proprietary REST API:** Lacks industry standardization and standardized client discovery tools. |

---

## 3. Architecture Boundary & Decoupling Strategy

To ensure FrameForge Studio can evolve into a native Rust or C++ engine in future releases without touching the user interface:

1. **`@frameforge/core`** contains pure domain entities:
   - `RationalTime` & `TimeRange`
   - `TimelineSequence`, `Track`, `Clip`, `Marker`
   - `CommandBus`, `UndoManager`
   - `OTIOSerializer`
   - **Zero DOM, zero Electron, zero Web Audio dependencies.**

2. **`@frameforge/engine`** contains rendering & compositing pipelines:
   - Compositing DAG (Directed Acyclic Graph)
   - WebGL2 / WebGPU shader library
   - Off-screen ping-pong render targets
   - Color transform engines (sRGB, Rec.709, Linear, Log, ACEScg)

3. **`@frameforge/audio`** contains non-destructive sound architecture:
   - Multitrack virtual mixer
   - Parametric 4-band EQ
   - Compressor & Limiter
   - Waveform peak cache generator

4. **`apps/desktop`** provides the host shell:
   - Electron window management
   - Native file dialogues
   - FFmpeg process orchestrator
   - Hardware capability detection
