import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

/**
 * Expose protected methods that allow the renderer process to use
 * the ipcRenderer without exposing the entire object
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),
  getAppPath: (name: string): Promise<string> => ipcRenderer.invoke('get-app-path', name),
  isPackaged: (): Promise<boolean> => ipcRenderer.invoke('is-packaged'),
  getLogPath: (): Promise<string> => ipcRenderer.invoke('get-log-path'),

  // Updates
  checkForUpdates: (): Promise<any> => ipcRenderer.invoke('check-for-updates'),
  onUpdateStatus: (callback: (event: IpcRendererEvent, data: any) => void) => {
    ipcRenderer.on('update-status', callback);
    return () => ipcRenderer.removeListener('update-status', callback);
  },

  // Server errors
  onServerError: (callback: (event: IpcRendererEvent, error: string) => void) => {
    ipcRenderer.on('server-error', callback);
    return () => ipcRenderer.removeListener('server-error', callback);
  },

  // Platform info
  platform: process.platform,
  arch: process.arch,
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      getAppPath: (name: string) => Promise<string>;
      isPackaged: () => Promise<boolean>;
      getLogPath: () => Promise<string>;
      checkForUpdates: () => Promise<any>;
      onUpdateStatus: (callback: (event: IpcRendererEvent, data: any) => void) => () => void;
      onServerError: (callback: (event: IpcRendererEvent, error: string) => void) => () => void;
      platform: NodeJS.Platform;
      arch: string;
    };
  }
}
