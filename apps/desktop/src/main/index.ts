/**
 * FrameForge Studio: Electron Main Process
 * 
 * Provides native desktop window management, secure IPC, and FFmpeg process orchestration.
 */

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 960,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#090a0f',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f111a',
      symbolColor: '#cbd5e1',
      height: 36,
    },
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  // Native File Open Dialog IPC
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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
