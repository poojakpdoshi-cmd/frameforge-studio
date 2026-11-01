/**
 * FrameForge Studio: Preload Script
 * 
 * Secure typed bridge between sandboxed UI renderer and Electron main process.
 */

import { contextBridge, ipcRenderer } from 'electron';

export interface FrameForgeAPI {
  openMediaDialog: () => Promise<string[] | null>;
  platform: string;
}

const api: FrameForgeAPI = {
  openMediaDialog: () => ipcRenderer.invoke('dialog:openMediaFile'),
  platform: process.platform,
};

contextBridge.exposeInMainWorld('frameforge', api);
