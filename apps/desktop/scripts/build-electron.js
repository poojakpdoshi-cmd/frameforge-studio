import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(__dirname, '..');

async function buildElectron() {
  // 1. Build Main Process
  await esbuild.build({
    entryPoints: [path.join(desktopRoot, 'src/main/index.ts')],
    outfile: path.join(desktopRoot, 'dist-electron/main.cjs'),
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    external: ['electron'],
  });

  // 2. Build Preload Script
  await esbuild.build({
    entryPoints: [path.join(desktopRoot, 'src/preload/index.ts')],
    outfile: path.join(desktopRoot, 'dist-electron/preload.cjs'),
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    external: ['electron'],
  });

  console.log('Successfully compiled Electron main and preload bundles.');
}

buildElectron().catch((err) => {
  console.error(err);
  process.exit(1);
});
