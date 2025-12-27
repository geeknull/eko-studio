import { app } from 'electron';
import * as path from 'path';
import * as http from 'http';
import * as net from 'net';
import { ChildProcess, fork } from 'child_process';

let serverProcess: ChildProcess | null = null;
let serverPort: number = 0;

/**
 * Find an available port
 */
async function findAvailablePort(startPort: number = 3000): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => {
      // Port is in use, try next one
      resolve(findAvailablePort(startPort + 1));
    });
    server.listen(startPort, () => {
      server.close(() => {
        resolve(startPort);
      });
    });
  });
}

/**
 * Wait for server to be ready
 */
async function waitForServer(url: string, maxAttempts: number = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode === 200 || res.statusCode === 304) {
            resolve();
          } else {
            reject(new Error(`Status: ${res.statusCode}`));
          }
        });
        req.on('error', reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return false;
}

/**
 * Get the standalone server path
 */
function getStandaloneServerPath(): string {
  if (app.isPackaged) {
    // Production: server is in resources
    return path.join(process.resourcesPath, 'standalone', 'server.js');
  } else {
    // Development: use the build output
    return path.join(app.getAppPath(), '.next', 'standalone', 'server.js');
  }
}

/**
 * Start the Next.js standalone server
 */
export async function startNextServer(): Promise<string> {
  if (serverProcess) {
    return getServerUrl();
  }

  serverPort = await findAvailablePort(3000);
  const serverPath = getStandaloneServerPath();

  console.log(`[Server] Starting Next.js server on port ${serverPort}`);
  console.log(`[Server] Server path: ${serverPath}`);

  // Set environment variables for the server
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PORT: String(serverPort),
    HOSTNAME: 'localhost',
    NODE_ENV: 'production',
  };

  // Set Playwright browser path for production
  if (app.isPackaged) {
    const { getPlaywrightBrowserPath } = require('./utils/playwright');
    const browserPath = getPlaywrightBrowserPath();
    if (browserPath) {
      env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = browserPath;
    }
  }

  return new Promise((resolve, reject) => {
    try {
      serverProcess = fork(serverPath, [], {
        env,
        cwd: app.isPackaged
          ? path.join(process.resourcesPath, 'standalone')
          : path.join(app.getAppPath(), '.next', 'standalone'),
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      });

      serverProcess.stdout?.on('data', (data) => {
        console.log(`[Next.js] ${data.toString().trim()}`);
      });

      serverProcess.stderr?.on('data', (data) => {
        console.error(`[Next.js Error] ${data.toString().trim()}`);
      });

      serverProcess.on('error', (error) => {
        console.error('[Server] Failed to start server:', error);
        serverProcess = null;
        reject(error);
      });

      serverProcess.on('exit', (code) => {
        console.log(`[Server] Server exited with code ${code}`);
        serverProcess = null;
      });

      // Wait for server to be ready
      const serverUrl = `http://localhost:${serverPort}`;
      waitForServer(serverUrl).then((ready) => {
        if (ready) {
          console.log('[Server] Next.js server is ready');
          resolve(serverUrl);
        } else {
          reject(new Error('Server failed to start'));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Stop the Next.js server
 */
export async function stopNextServer(): Promise<void> {
  if (serverProcess) {
    console.log('[Server] Stopping Next.js server...');
    serverProcess.kill('SIGTERM');

    // Wait for process to exit
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        if (serverProcess) {
          serverProcess.kill('SIGKILL');
        }
        resolve();
      }, 5000);

      serverProcess?.on('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    serverProcess = null;
    console.log('[Server] Next.js server stopped');
  }
}

/**
 * Get the server URL
 */
export function getServerUrl(): string {
  return `http://localhost:${serverPort}`;
}
