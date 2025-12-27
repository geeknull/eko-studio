import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { startNextServer, stopNextServer, getServerUrl } from './server';
import { setupAutoUpdater, checkForUpdates } from './updater';

// Disable GPU acceleration for stability
app.disableHardwareAcceleration();

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Required for preload script
    },
    show: false, // Don't show until ready
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Load the app
  loadApp();
}

async function loadApp(): Promise<void> {
  if (!mainWindow) return;

  if (isDev) {
    // Development: load from Next.js dev server
    const devUrl = process.env.ELECTRON_DEV_URL || 'http://localhost:3000';
    console.log(`[Electron] Loading dev URL: ${devUrl}`);

    try {
      await mainWindow.loadURL(devUrl);
      mainWindow.webContents.openDevTools();
    } catch (error) {
      console.error('[Electron] Failed to load dev URL:', error);
      // Retry after a delay
      setTimeout(() => loadApp(), 2000);
    }
  } else {
    // Production: start embedded Next.js server
    try {
      console.log('[Electron] Starting Next.js server...');
      const serverUrl = await startNextServer();
      console.log(`[Electron] Next.js server started at: ${serverUrl}`);
      await mainWindow.loadURL(serverUrl);
    } catch (error) {
      console.error('[Electron] Failed to start Next.js server:', error);
    }
  }
}

// IPC handlers
function setupIpcHandlers(): void {
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('get-app-path', (_, name: string) => {
    return app.getPath(name as any);
  });

  ipcMain.handle('check-for-updates', async () => {
    return checkForUpdates();
  });

  ipcMain.handle('is-packaged', () => {
    return app.isPackaged;
  });
}

// App lifecycle
app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  // Setup auto-updater in production
  if (!isDev) {
    setupAutoUpdater(mainWindow!);
  }

  app.on('activate', () => {
    // On macOS re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, apps typically stay open until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  console.log('[Electron] Shutting down...');
  await stopNextServer();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[Electron] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Electron] Unhandled rejection:', reason);
});
