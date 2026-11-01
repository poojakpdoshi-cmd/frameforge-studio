/**
 * FrameForge Studio: Preload Script
 * 
 * Secure typed bridge between sandboxed UI renderer and Electron main process.
 */

import { contextBridge, ipcRenderer } from 'electron';

export interface FrameForgeAPI {
  openMediaDialog: (presetPaths?: string[]) => Promise<string[] | null>;
  saveExportDialog: (defaultName?: string, presetPath?: string) => Promise<string | null>;
  probeMedia: (filePath: string) => Promise<{ success: boolean; metadata?: any; error?: string }>;
  exportRender: (args: string[]) => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }>;
  saveProject: (filePath?: string, data?: string) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>;
  loadProject: (filePath?: string) => Promise<{ success: boolean; filePath?: string; data?: any; error?: string; canceled?: boolean }>;
  platform: string;
}

const api: FrameForgeAPI = {
  openMediaDialog: (presetPaths?: string[]) => ipcRenderer.invoke('dialog:openMediaFile', presetPaths),
  saveExportDialog: (defaultName?: string, presetPath?: string) => ipcRenderer.invoke('dialog:saveExportFile', defaultName, presetPath),
  probeMedia: (filePath: string) => ipcRenderer.invoke('media:probe', filePath),
  exportRender: (args: string[]) => ipcRenderer.invoke('render:export', args),
  saveProject: (filePath?: string, data?: string) => ipcRenderer.invoke('project:save', filePath, data),
  loadProject: (filePath?: string) => ipcRenderer.invoke('project:load', filePath),
  platform: process.platform,
};

contextBridge.exposeInMainWorld('frameforge', api);

declare global {
  interface Window {
    frameforge?: FrameForgeAPI;
  }
}
