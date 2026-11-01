export interface FrameForgeAPI {
  openMediaDialog: () => Promise<string[] | null>;
  probeMedia: (filePath: string) => Promise<{ success: boolean; metadata?: any; error?: string }>;
  exportRender: (args: string[]) => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }>;
  saveProject: (filePath?: string, data?: string) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>;
  loadProject: (filePath?: string) => Promise<{ success: boolean; filePath?: string; data?: any; error?: string; canceled?: boolean }>;
  saveExportDialog: (defaultName?: string) => Promise<string | null>;
  platform: string;
}

declare global {
  interface Window {
    frameforge?: FrameForgeAPI;
  }
}
