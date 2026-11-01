import { _electron as electron } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const desktopDir = path.resolve(rootDir, 'apps/desktop');
const userDataDir = path.resolve(rootDir, '.user-data-test');
if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

const electronPath = path.resolve(
  rootDir,
  'node_modules/.pnpm/electron@45.2.1/node_modules/electron/dist/electron.exe'
);

console.log('Testing Playwright Electron launch...');
console.log('Electron Path:', electronPath);
console.log('Desktop Dir:', desktopDir);

const cleanEnv = { ...process.env };
delete cleanEnv.ELECTRON_RUN_AS_NODE;

try {
  const app = await electron.launch({
    executablePath: electronPath,
    args: [
      '--no-sandbox',
      `--user-data-dir=${userDataDir}`,
      desktopDir,
    ],
    env: cleanEnv,
    recordVideo: {
      dir: path.resolve(rootDir, 'tests/artifacts/raw_video'),
      size: { width: 1600, height: 960 },
    },
    timeout: 30000,
  });

  console.log('Electron app launched successfully!');
  const page = await app.firstWindow();
  console.log('Got first window, title:', await page.title());
  console.log('Window URL:', page.url());

  await page.waitForSelector('#import-media-btn', { timeout: 10000 });
  console.log('Found #import-media-btn!');

  await page.waitForTimeout(2000);
  await app.close();
  console.log('Test completed successfully. Raw video written.');
} catch (err) {
  console.error('Launch test failed:', err);
  process.exit(1);
}
