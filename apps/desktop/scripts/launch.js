import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(__dirname, '..');
const rootDir = path.resolve(desktopRoot, '../..');

// Locate electron binary across potential pnpm paths
const candidatePaths = [
  path.resolve(rootDir, 'node_modules/.pnpm/electron@45.2.1/node_modules/electron/dist/electron.exe'),
  path.resolve(desktopRoot, 'node_modules/electron/dist/electron.exe'),
  path.resolve(rootDir, 'node_modules/electron/dist/electron.exe'),
];

const electronBin = candidatePaths.find((p) => fs.existsSync(p));

if (!electronBin) {
  console.error('[FrameForge Studio] Could not locate installed Electron binary.');
  process.exit(1);
}

const cleanEnv = { ...process.env };
// Critical: Clear IDE-inherited ELECTRON_RUN_AS_NODE so Electron runs as a desktop GUI app
delete cleanEnv.ELECTRON_RUN_AS_NODE;

const userDataDir = path.resolve(rootDir, '.user-data');
if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

console.log('[FrameForge Studio] Launching creative desktop workstation...');
console.log(`[FrameForge Studio] Executable: ${electronBin}`);
console.log(`[FrameForge Studio] App Path:   ${desktopRoot}`);

const child = spawn(
  electronBin,
  ['--no-sandbox', `--user-data-dir=${userDataDir}`, desktopRoot, ...process.argv.slice(2)],
  {
    cwd: desktopRoot,
    stdio: 'inherit',
    env: cleanEnv,
  }
);

child.on('exit', (code) => {
  console.log(`[FrameForge Studio] Workstation session ended. Code: ${code}`);
  process.exit(code ?? 0);
});
