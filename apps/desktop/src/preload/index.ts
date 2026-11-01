/**
 * FrameForge Studio: Preload Script
 * 
 * Secure typed bridge between sandboxed UI renderer and Electron main process.
 */

import { contextBridge, ipcRenderer } from 'electron';

export interface FrameForgeAPI {
  openMediaDialog: () => Promise<string[] | null>;
  probeMedia: (filePath: string) => Promise<any>;
  exportRender: (args: string[]) => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }>;
  saveProject: (filePath: string, data: string) => Promise<{ success: boolean; error?: string }>;
  loadProject: (filePath: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  platform: string;
}

const api: FrameForgeAPI = {
  openMediaDialog: () => ipcRenderer.invoke('dialog:openMediaFile'),
  probeMedia: (filePath: string) => ipcRenderer.invoke('media:probe', filePath),
  exportRender: (args: string[]) => ipcRenderer.invoke('render:export', args),
  saveProject: (filePath: string, data: string) => ipcRenderer.invoke('project:save', filePath, data),
  loadProject: (filePath: string) => ipcRenderer.invoke('project:load', filePath),
  platform: process.platform,
};

contextBridge.exposeInMainWorld('frameforge', api);
