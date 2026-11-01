/**
 * FrameForge Studio: Electron Main Process
 * 
 * Provides native desktop window management, secure IPC, and FFmpeg/FFprobe process orchestration.
 */

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 960,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#090a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
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
  createWindow();

  // 1. Native File Open Dialog
  ipcMain.handle('dialog:openMediaFile', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Video & Audio Media',
          extensions: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'wav', 'mp3', 'aac', 'png', 'jpg'],
        },
      ],
    });
    return result.filePaths;
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
      return JSON.parse(stdout);
    } catch (err: any) {
      return { error: err.message };
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
  ipcMain.handle('project:save', async (_event, filePath: string, projectData: string) => {
    try {
      await fs.promises.writeFile(filePath, projectData, 'utf-8');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('project:load', async (_event, filePath: string) => {
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8');
      return { success: true, data: JSON.parse(data) };
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
