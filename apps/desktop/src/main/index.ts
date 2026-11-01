/**
 * FrameForge Studio: Electron Main Process
 * 
 * Provides native desktop window management, secure IPC, and FFmpeg/FFprobe process orchestration.
 */

import { app, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { runAcceptanceTest } from './acceptance-runner.js';

const execFileAsync = promisify(execFile);
let mainWindow: BrowserWindow | null = null;

// Ensure local workspace user-data directory for sandbox safety
try {
  const customUserData = path.resolve(__dirname, '../../.user-data');
  if (!fs.existsSync(customUserData)) fs.mkdirSync(customUserData, { recursive: true });
  app.setPath('userData', customUserData);
} catch {
  // Use default OS location
}

// Register custom privileged scheme for media streaming
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true,
    },
  },
]);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 960,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#090a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: false, // Allows typed IPC and local media streaming
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // Essential for loading local video/audio files directly
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  // Register media protocol for streaming local files
  protocol.handle('media', (request) => {
    let filePath = decodeURIComponent(request.url.replace(/^media:\/\//, ''));
    // Handle Windows drive paths like media://C:/path
    if (process.platform === 'win32' && /^[a-zA-Z]:/.test(filePath)) {
      filePath = filePath.replace(/\\/g, '/');
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });

  createWindow();

  if (process.argv.includes('--acceptance-test')) {
    runAcceptanceTest(mainWindow!);
  }

  // 1. Native File Open Dialog
  ipcMain.handle('dialog:openMediaFile', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Media — FrameForge Studio',
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'All Supported Media',
          extensions: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'wav', 'mp3', 'aac', 'png', 'jpg', 'jpeg'],
        },
        { name: 'Video Files', extensions: ['mp4', 'mov', 'webm', 'mkv', 'avi'] },
        { name: 'Audio Files', extensions: ['wav', 'mp3', 'aac', 'flac', 'ogg'] },
        { name: 'Image Overlays', extensions: ['png', 'jpg', 'jpeg', 'webp'] },
      ],
    });
    return result.filePaths;
  });

  // 1b. Native Export Destination Dialog
  ipcMain.handle('dialog:saveExportFile', async (_event, defaultName?: string) => {
    if (!mainWindow) return null;
    const saveRes = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Rendered Video — FrameForge Studio',
      defaultPath: defaultName || 'master_render.mp4',
      filters: [
        { name: 'MP4 Video', extensions: ['mp4'] },
        { name: 'QuickTime MOV', extensions: ['mov'] },
        { name: 'WebM Video', extensions: ['webm'] },
      ],
    });
    if (saveRes.canceled || !saveRes.filePath) return null;
    return saveRes.filePath;
  });

  // 2. Real FFprobe Media Inspection
  ipcMain.handle('media:probe', async (_event, filePath: string) => {
    try {
      const { stdout } = await execFileAsync('ffprobe', [
        '-v',
        'quiet',
        '-print_format',
        'json',
        '-show_format',
        '-show_streams',
        filePath,
      ]);
      return { success: true, metadata: JSON.parse(stdout) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // 3. Real FFmpeg Render Execution
  ipcMain.handle('render:export', async (_event, args: string[]) => {
    try {
      const { stdout, stderr } = await execFileAsync('ffmpeg', args);
      return { success: true, stdout, stderr };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // 4. Project File Persistence (Save & Load)
  ipcMain.handle('project:save', async (_event, filePath?: string, projectData?: string) => {
    try {
      let targetPath = filePath;
      if (!targetPath && mainWindow) {
        const saveRes = await dialog.showSaveDialog(mainWindow, {
          title: 'Save Project — FrameForge Studio',
          defaultPath: 'project.frameforge',
          filters: [{ name: 'FrameForge Project', extensions: ['frameforge', 'json'] }],
        });
        if (saveRes.canceled || !saveRes.filePath) return { success: false, canceled: true };
        targetPath = saveRes.filePath;
      }
      if (!targetPath || !projectData) return { success: false, error: 'No path or data provided' };
      await fs.promises.writeFile(targetPath, projectData, 'utf-8');
      return { success: true, filePath: targetPath };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('project:load', async (_event, filePath?: string) => {
    try {
      let targetPath = filePath;
      if (!targetPath && mainWindow) {
        const openRes = await dialog.showOpenDialog(mainWindow, {
          title: 'Open Project — FrameForge Studio',
          properties: ['openFile'],
          filters: [{ name: 'FrameForge Project', extensions: ['frameforge', 'json'] }],
        });
        if (openRes.canceled || !openRes.filePaths[0]) return { success: false, canceled: true };
        targetPath = openRes.filePaths[0];
      }
      if (!targetPath) return { success: false, error: 'No path provided' };
      const data = await fs.promises.readFile(targetPath, 'utf-8');
      return { success: true, filePath: targetPath, data: JSON.parse(data) };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
