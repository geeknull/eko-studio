import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Get the Playwright Chromium executable path based on platform
 */
export function getPlaywrightBrowserPath(): string | undefined {
  if (!app.isPackaged) {
    // Development: let Playwright find the browser automatically
    return undefined;
  }

  const browsersDir = path.join(process.resourcesPath, 'playwright-browsers');

  // Find chromium directory
  if (!fs.existsSync(browsersDir)) {
    console.warn('[Playwright] Browsers directory not found:', browsersDir);
    return undefined;
  }

  const entries = fs.readdirSync(browsersDir);
  const chromiumDir = entries.find((entry) => entry.startsWith('chromium-'));

  if (!chromiumDir) {
    console.warn('[Playwright] Chromium directory not found in:', browsersDir);
    return undefined;
  }

  const chromiumPath = path.join(browsersDir, chromiumDir);

  // Platform-specific executable path
  let executablePath: string;

  switch (process.platform) {
    case 'darwin':
      // macOS: Chromium.app/Contents/MacOS/Chromium
      executablePath = path.join(
        chromiumPath,
        'chrome-mac',
        'Chromium.app',
        'Contents',
        'MacOS',
        'Chromium'
      );
      break;

    case 'win32':
      // Windows: chrome.exe
      executablePath = path.join(chromiumPath, 'chrome-win', 'chrome.exe');
      break;

    case 'linux':
      // Linux: chrome
      executablePath = path.join(chromiumPath, 'chrome-linux', 'chrome');
      break;

    default:
      console.warn('[Playwright] Unsupported platform:', process.platform);
      return undefined;
  }

  if (!fs.existsSync(executablePath)) {
    console.warn('[Playwright] Chromium executable not found:', executablePath);
    return undefined;
  }

  console.log('[Playwright] Using Chromium at:', executablePath);
  return executablePath;
}

/**
 * Get all required environment variables for Playwright in production
 */
export function getPlaywrightEnv(): Record<string, string> {
  const env: Record<string, string> = {};

  const browserPath = getPlaywrightBrowserPath();
  if (browserPath) {
    env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = browserPath;
  }

  // Disable browser downloads in production
  env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1';

  return env;
}
