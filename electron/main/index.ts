import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { startNextServer, stopNextServer, getServerUrl, getLogPath, setRuntimeErrorHandler } from './server';
import { setupAutoUpdater, checkForUpdates } from './updater';

/**
 * Show error dialog to user
 */
function showErrorDialog(title: string, message: string, detail?: string): void {
  dialog.showErrorBox(title, detail ? `${message}\n\n${detail}` : message);
}

/**
 * Show error page in window
 */
function showErrorPage(window: BrowserWindow, title: string, message: string, detail?: string): void {
  const errorHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #1a1a2e;
          color: #eee;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        .container {
          max-width: 800px;
          width: 100%;
        }
        .icon {
          font-size: 64px;
          margin-bottom: 24px;
        }
        h1 {
          color: #ff6b6b;
          font-size: 24px;
          margin-bottom: 16px;
        }
        .message {
          color: #ccc;
          font-size: 16px;
          margin-bottom: 24px;
        }
        .detail {
          background: #0d0d1a;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 16px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 13px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-all;
          max-height: 400px;
          overflow-y: auto;
          color: #ff8a80;
        }
        .actions {
          margin-top: 24px;
          display: flex;
          gap: 12px;
        }
        button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        button:hover { opacity: 0.8; }
        .btn-primary {
          background: #4dabf7;
          color: #000;
        }
        .btn-secondary {
          background: #333;
          color: #fff;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">⚠️</div>
        <h1>${title}</h1>
        <p class="message">${message}</p>
        ${detail ? `<pre class="detail">${detail.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>` : ''}
        <div class="actions">
          <button class="btn-primary" onclick="location.reload()">Retry</button>
          <button class="btn-secondary" onclick="require('electron').ipcRenderer.invoke('get-log-path').then(p => require('electron').shell.showItemInFolder(p))">Open Log File</button>
        </div>
      </div>
    </body>
    </html>
  `;

  window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
  window.show();
}

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

      // Setup runtime error handler to send errors to renderer
      setRuntimeErrorHandler((error) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('server-error', error);
        }
      });

      await mainWindow.loadURL(serverUrl);
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error('[Electron] Failed to start Next.js server:', error);
      showErrorPage(
        mainWindow,
        'Server Failed to Start',
        'The Next.js server failed to start. Check the error details below:',
        errorMessage
      );
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

  ipcMain.handle('get-log-path', () => {
    return getLogPath();
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
  showErrorDialog(
    'Unexpected Error',
    'An unexpected error occurred.',
    error?.message || String(error)
  );
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[Electron] Unhandled rejection:', reason);
  showErrorDialog(
    'Unexpected Error',
    'An unhandled promise rejection occurred.',
    reason?.message || String(reason)
  );
});
