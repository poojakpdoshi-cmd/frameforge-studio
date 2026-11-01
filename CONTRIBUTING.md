# Contributing to FrameForge Studio

Thank you for your interest in contributing to **FrameForge Studio**! We are building an open-source, local-first, professional-grade non-linear video editing workstation.

---

## 1. Code of Conduct

All contributors and maintainers are expected to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it to understand expectations for communication and collaboration.

---

## 2. Clean-Room Implementation & Intellectual Property Policy

**Strict Rule:** FrameForge Studio has a zero-tolerance clean-room policy regarding proprietary software.
- Do **not** inspect, reverse-engineer, decompile, or copy code, formulas, binary assets, or UI shaders from Adobe Premiere Pro, After Effects, DaVinci Resolve, Final Cut Pro, Avid Media Composer, or CapCut.
- All algorithms must be derived from first-principles mathematics, open academic papers, Khronos/W3C specifications, or clean-room implementations.
- All dependencies must be audited for license compatibility with the **Apache License 2.0**.

---

## 3. Development Workflow

### Prerequisites
- Node.js 20+ (LTS) or 22+
- `pnpm` 9+ or modern npm
- FFmpeg installed in system PATH

### Local Setup
```bash
# Fork & clone the repo
git clone https://github.com/poojakpdoshi-cmd/frameforge-studio.git
cd frameforge-studio

# Install dependencies
pnpm install

# Run test suite
pnpm test

# Launch dev environment
pnpm run dev
```

---

## 4. Submitting Pull Requests

1. **Branch Naming:**
   - `feat/feature-name` for new capabilities.
   - `fix/bug-description` for bug fixes.
   - `perf/optimization` for rendering/performance improvements.
   - `docs/topic` for documentation updates.
2. **Commit Messages:**
   Follow Conventional Commits: `feat(timeline): implement magnetic snapping for ripple edits`.
3. **Tests Required:**
   Every PR modifying `@frameforge/core` or `@frameforge/engine` must include automated unit or integration tests verifying correctness and preventing regressions.
4. **Format & Lint:**
   Ensure `pnpm lint` passes with zero errors before submitting.

