import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import * as net from 'net';
import { ChildProcess, fork } from 'child_process';

// Log file path
const logDir = app.isPackaged ? app.getPath('logs') : path.join(__dirname, '../../logs');
const logFile = path.join(logDir, 'nextjs-server.log');

function ensureLogDir(): void {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

function writeLog(level: string, message: string): void {
  ensureLogDir();
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level}] ${message}\n`;
  fs.appendFileSync(logFile, logLine);
  console.log(`[Next.js ${level}] ${message}`);
}

export function getLogPath(): string {
  return logFile;
}

// Callback for runtime errors
let onRuntimeError: ((error: string) => void) | null = null;

export function setRuntimeErrorHandler(handler: (error: string) => void): void {
  onRuntimeError = handler;
}

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

  writeLog('INFO', `Starting Next.js server on port ${serverPort}`);
  writeLog('INFO', `Server path: ${serverPath}`);

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
    let stderrOutput = '';
    let resolved = false;

    try {
      serverProcess = fork(serverPath, [], {
        env,
        cwd: app.isPackaged
          ? path.join(process.resourcesPath, 'standalone')
          : path.join(app.getAppPath(), '.next', 'standalone'),
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      });

      serverProcess.stdout?.on('data', (data) => {
        writeLog('INFO', data.toString().trim());
      });

      serverProcess.stderr?.on('data', (data) => {
        const output = data.toString().trim();
        writeLog('ERROR', output);
        stderrOutput += output + '\n';
        // Send runtime errors to handler (after server is running)
        if (resolved && onRuntimeError) {
          onRuntimeError(output);
        }
      });

      serverProcess.on('error', (error) => {
        writeLog('ERROR', `Failed to start server: ${error.message}`);
        serverProcess = null;
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      });

      serverProcess.on('exit', (code) => {
        writeLog('INFO', `Server exited with code ${code}`);
        serverProcess = null;
        // If process exits before we resolve, it's an error
        if (!resolved && code !== 0) {
          resolved = true;
          reject(new Error(`Server process exited with code ${code}\n${stderrOutput}`));
        }
      });

      // Wait for server to be ready
      const serverUrl = `http://localhost:${serverPort}`;
      waitForServer(serverUrl).then((ready) => {
        if (!resolved) {
          resolved = true;
          if (ready) {
            writeLog('INFO', 'Next.js server is ready');
            resolve(serverUrl);
          } else {
            reject(new Error(`Server failed to start after waiting\n${stderrOutput}`));
          }
        }
      });
    } catch (error) {
      if (!resolved) {
        resolved = true;
        reject(error);
      }
    }
  });
}

/**
 * Stop the Next.js server
 */
export async function stopNextServer(): Promise<void> {
  if (serverProcess) {
    writeLog('INFO', 'Stopping Next.js server...');
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
    writeLog('INFO', 'Next.js server stopped');
  }
}

/**
 * Get the server URL
 */
export function getServerUrl(): string {
  return `http://localhost:${serverPort}`;
}
