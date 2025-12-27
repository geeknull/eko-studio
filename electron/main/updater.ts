import { autoUpdater, UpdateCheckResult } from 'electron-updater';
import { BrowserWindow, dialog } from 'electron';

let mainWindow: BrowserWindow | null = null;

/**
 * Setup auto-updater
 */
export function setupAutoUpdater(window: BrowserWindow): void {
  mainWindow = window;

  // Configure auto-updater
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // Log updates
  autoUpdater.logger = {
    info: (message) => console.log('[AutoUpdater]', message),
    warn: (message) => console.warn('[AutoUpdater]', message),
    error: (message) => console.error('[AutoUpdater]', message),
    debug: (message) => console.log('[AutoUpdater Debug]', message),
  };

  // Event handlers
  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for updates...');
    sendStatusToWindow('checking-for-update');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version);
    sendStatusToWindow('update-available', info);

    // Prompt user to download
    dialog
      .showMessageBox(mainWindow!, {
        type: 'info',
        title: 'Update Available',
        message: `A new version (${info.version}) is available. Would you like to download it now?`,
        buttons: ['Download', 'Later'],
        defaultId: 0,
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.downloadUpdate();
        }
      });
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[AutoUpdater] No updates available');
    sendStatusToWindow('update-not-available', info);
  });

  autoUpdater.on('error', (error) => {
    console.error('[AutoUpdater] Error:', error);
    sendStatusToWindow('error', { message: error.message });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent.toFixed(2)}%`;
    console.log('[AutoUpdater]', logMessage);
    sendStatusToWindow('download-progress', progressObj);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Update downloaded:', info.version);
    sendStatusToWindow('update-downloaded', info);

    // Prompt user to install
    dialog
      .showMessageBox(mainWindow!, {
        type: 'info',
        title: 'Update Ready',
        message: `Version ${info.version} has been downloaded. Would you like to install it now? The application will restart.`,
        buttons: ['Install Now', 'Later'],
        defaultId: 0,
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  // Check for updates on startup (after a delay)
  setTimeout(() => {
    checkForUpdates();
  }, 3000);
}

/**
 * Send update status to renderer
 */
function sendStatusToWindow(status: string, data?: any): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', { status, data });
  }
}

/**
 * Manually check for updates
 */
export async function checkForUpdates(): Promise<UpdateCheckResult | null> {
  try {
    return await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error('[AutoUpdater] Failed to check for updates:', error);
    return null;
  }
}
