# Changelog

All notable changes to **FrameForge Studio** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0-alpha.1] - 2026-11-01

### Added
- **Stage 0 Research & Architecture Completion:**
  - Published master system architecture (`ARCHITECTURE.md`).
  - Published technology stack specification and trade-off analysis (`TECH_STACK.md`).
  - Published open-source dependency license audit with Apache 2.0 and LGPL/GPL segregation (`DEPENDENCY_AUDIT.md`).
  - Published 8-stage engineering roadmap (`ROADMAP.md`).
  - Published shader & VFX math specification (`EFFECTS_SYSTEM.md`).
  - Published dual-path rendering and hardware encoding specification (`RENDERING_PIPELINE.md`).
- **Core Engine Foundation (`@frameforge/core`):**
  - High-precision `RationalTime` and `TimeRange` arithmetic engine supporting exact drop-frame and non-drop-frame timebases.
  - Non-destructive multitrack timeline data model (`TimelineSequence`, `TimelineTrack`, `TimelineClip`, `Marker`).
  - Atomic, invertible `CommandBus` with bidirectional `ICommand` undo/redo history manager.
  - Serialization and OpenTimelineIO (OTIO) compatibility schema.
- **Rendering & GPU Pipeline (`@frameforge/engine`):**
  - Directed Acyclic Graph (DAG) compositing engine.
  - Multi-pass WebGL2/WebGPU shader pipeline with linear color blending and alpha pre-multiplication.
  - Standard Transform, Crop, Separable Gaussian Blur, Film Grain, Halation, Vignette, and Color Grading shaders.
- **Desktop Creative Suite Workspace (`apps/desktop`):**
  - Professional dark workspace design system with custom panels.
  - Source Monitor and Program Monitor with 60fps playhead scrubbing and timecode HUD.
  - Interactive multitrack timeline with continuous zoom, clip selection, dragging, and blade split tool.
  - Media browser supporting file ingestion, media metadata probing, and thumbnail caching.
  - Real-time inspector panel for transform properties, blend modes, and opacity adjustments.
