#!/usr/bin/env node

/**
 * Copy Playwright Chromium browser to the build directory
 * This script should be run before electron-builder
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const DEST_DIR = path.join(PROJECT_ROOT, 'playwright-browsers');

// Get the platform to build for
const platform = process.argv[2] || process.platform;

console.log(`[Copy Browsers] Platform: ${platform}`);
console.log(`[Copy Browsers] Destination: ${DEST_DIR}`);

// Find Playwright browsers directory
function findPlaywrightBrowsers() {
  // Try common locations
  const locations = [
    // macOS/Linux
    path.join(process.env.HOME || '', 'Library/Caches/ms-playwright'),
    path.join(process.env.HOME || '', '.cache/ms-playwright'),
    // Windows
    path.join(process.env.LOCALAPPDATA || '', 'ms-playwright'),
    // Project local (from pnpm)
    path.join(PROJECT_ROOT, 'node_modules/playwright-core/.local-browsers'),
    path.join(PROJECT_ROOT, 'node_modules/playwright/.local-browsers'),
  ];

  for (const loc of locations) {
    if (fs.existsSync(loc)) {
      console.log(`[Copy Browsers] Found Playwright browsers at: ${loc}`);
      return loc;
    }
  }

  return null;
}

// Get the chromium directory name for the platform
function getChromiumSubdir(platform) {
  switch (platform) {
    case 'darwin':
      return 'chrome-mac';
    case 'win32':
      return 'chrome-win';
    case 'linux':
      return 'chrome-linux';
    default:
      return null;
  }
}

// Copy directory recursively, handling symlinks
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isSymbolicLink()) {
      // Copy symlink as symlink
      const linkTarget = fs.readlinkSync(srcPath);
      try {
        fs.symlinkSync(linkTarget, destPath);
      } catch (e) {
        // Symlink may already exist
        if (e.code !== 'EEXIST') throw e;
      }
    } else if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
      // Preserve executable permissions
      const stats = fs.statSync(srcPath);
      fs.chmodSync(destPath, stats.mode);
    }
    // Skip sockets, fifos, and other special files
  }
}

async function main() {
  // Ensure Playwright browsers are installed
  console.log('[Copy Browsers] Ensuring Playwright browsers are installed...');
  try {
    execSync('npx playwright install chromium', { stdio: 'inherit', cwd: PROJECT_ROOT });
  } catch (error) {
    console.warn('[Copy Browsers] Warning: Could not install Playwright browsers');
  }

  // Find browsers
  const browsersDir = findPlaywrightBrowsers();
  if (!browsersDir) {
    console.error('[Copy Browsers] Error: Could not find Playwright browsers directory');
    console.error('[Copy Browsers] Please run: npx playwright install chromium');
    process.exit(1);
  }

  // Find chromium directory
  const entries = fs.readdirSync(browsersDir);
  const chromiumDir = entries.find(e => e.startsWith('chromium-'));

  if (!chromiumDir) {
    console.error('[Copy Browsers] Error: Could not find chromium directory');
    process.exit(1);
  }

  const chromiumPath = path.join(browsersDir, chromiumDir);
  const chromiumSubdir = getChromiumSubdir(platform);

  if (!chromiumSubdir) {
    console.error(`[Copy Browsers] Error: Unsupported platform: ${platform}`);
    process.exit(1);
  }

  const srcPath = path.join(chromiumPath, chromiumSubdir);
  if (!fs.existsSync(srcPath)) {
    console.error(`[Copy Browsers] Error: Chromium not found for platform at: ${srcPath}`);
    process.exit(1);
  }

  // Clean destination
  if (fs.existsSync(DEST_DIR)) {
    console.log('[Copy Browsers] Cleaning existing browsers directory...');
    fs.rmSync(DEST_DIR, { recursive: true });
  }

  // Create destination structure
  const destChromiumDir = path.join(DEST_DIR, chromiumDir);
  fs.mkdirSync(destChromiumDir, { recursive: true });

  // Copy chromium
  const destPath = path.join(destChromiumDir, chromiumSubdir);
  console.log(`[Copy Browsers] Copying from: ${srcPath}`);
  console.log(`[Copy Browsers] Copying to: ${destPath}`);

  copyDir(srcPath, destPath);

  console.log('[Copy Browsers] Done!');

  // Print size
  const size = execSync(`du -sh "${DEST_DIR}"`, { encoding: 'utf-8' }).trim();
  console.log(`[Copy Browsers] Total size: ${size}`);
}

main().catch(console.error);
