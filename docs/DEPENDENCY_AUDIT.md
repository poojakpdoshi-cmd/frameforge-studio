# FrameForge Studio: Open-Source Dependency & License Compliance Audit

**Document Version:** 1.0.0  
**Compliance Standard:** OSI (Open Source Initiative) & FSF (Free Software Foundation)  
**Selected Project License:** **Apache License, Version 2.0**  

---

## 1. Project Licensing Strategy

FrameForge Studio is released under the **Apache License 2.0**.
- **Commercial & Individual Freedom:** Users and organizations are free to use, modify, distribute, and commercialize derivative workflows without copyleft viral contamination of user projects or custom private plugins.
- **Patent Grant:** Apache 2.0 provides explicit contributor patent grants, protecting contributors and users from patent litigation.
- **Clean Room Assurance:** Absolutely zero proprietary code, reverse-engineered algorithms, binary blobs, or trademarked assets from Adobe Premiere Pro, After Effects, DaVinci Resolve, Final Cut Pro, or CapCut are included.

---

## 2. Dependency Audit & License Compatibility Matrix

Every dependency evaluated for inclusion in FrameForge Studio has been vetted for legal compatibility with Apache 2.0:

| Dependency / Component | Origin / Project | Upstream License | Usage in FrameForge Studio | Compatibility Assessment |
| :--- | :--- | :--- | :--- | :--- |
| **Electron** | OpenJS Foundation / GitHub | MIT | Desktop runtime shell & native windowing. | **Fully Compatible.** MIT license allows unrestricted integration and sublicensing. |
| **React 19 & React-DOM** | Meta Platforms, Inc. | MIT | Presentation and interactive UI tree. | **Fully Compatible.** Zero copyleft encumbrance. |
| **TypeScript** | Microsoft Corp. | Apache 2.0 | Language compiler and typechecker. | **Identical License.** Perfect synergy. |
| **Tailwind CSS** | Tailwind Labs Inc. | MIT | Utility styling & design tokens. | **Fully Compatible.** |
| **Lucide Icons** | Lucide Project | ISC (Permissive, BSD-equivalent) | Creative suite vector iconography. | **Fully Compatible.** |
| **Zustand** | Poimandres | MIT | Reactive store and transient state management. | **Fully Compatible.** |
| **FFmpeg (CLI Process Engine)** | FFmpeg Team / Gyan.dev | LGPL v2.1+ / GPL v3 (depending on build flags) | Standalone external executable spawned via secure IPC for export, transcoding, and probing. | **Legally Segregated (Arms-Length Inter-Process Communication).** By invoking FFmpeg as an independent subprocess over stdin/stdout/CLI flags rather than statically or dynamically linking `libavcodec`/`libavformat` into the same binary address space, FrameForge Studio maintains complete license boundary compliance under LGPL/GPL guidelines. |
| **OpenTimelineIO (OTIO) Spec** | Academy Software Foundation (ASWF) / Pixar | Apache 2.0 | Interchange data schema for timeline persistence. | **Identical License.** Full interoperability with professional VFX pipelines. |
| **Three.js** | Mr.doob & Contributors | MIT | 3D scene compositing, particle simulation, and camera mapping in the VFX workspace. | **Fully Compatible.** |
| **WebGPU / WebGL2 APIs** | W3C / Khronos Group | Open Web Standards | In-browser & Electron hardware GPU access. | **Royalty-Free Open Specification.** |
| **SQLite (Built-in / Native)** | SQLite Consortium | Public Domain (Blessing) | High-reliability ACID project transaction logging and autosave. | **Unrestricted.** Pure Public Domain. |

---

## 3. Strict Boundary Rules & Isolation Protocols

To prevent inadvertent copyright infringement or license violations:

1. **Subprocess Boundary Isolation:**
   - FFmpeg and FFprobe run strictly as isolated external subprocesses.
   - The application does not compile against or statically link GPL-licensed C/C++ libraries.
   - Users are empowered to point FrameForge Studio to their own custom or system-installed FFmpeg binaries (e.g., custom LGPL-only or GPL builds with proprietary NVENC hardware encoding).

2. **Clean-Room Implementation of Creative Tools:**
   - All effects, transitions, shaders, curves, and blend modes are authored from first-principles mathematics, academic computer graphics literature (Bézier curves, Hermite splines, Box-Muller transform for film grain, Box/Gaussian blur decomposition), and open Khronos GLSL specifications.
   - No decompilation or reverse-engineering of commercial proprietary binaries has been or will ever be permitted.

3. **Asset & Typography Compliance:**
   - All bundled fonts in templates and titles must be licensed under SIL Open Font License (OFL) or Apache 2.0 (e.g., Inter, JetBrains Mono, Roboto, Outfit).
   - Test footage and sample media included in tests and examples are public domain (CC0) or generated procedurally via algorithmic canvas test patterns (SMPTE color bars, zone plates, sine sweeps).
