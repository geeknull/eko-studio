import { app } from 'electron';
import * as path from 'path';

/**
 * Get the root path for the application
 */
export function getAppRoot(): string {
  if (app.isPackaged) {
    return process.resourcesPath;
  }
  return app.getAppPath();
}

/**
 * Get the path to the standalone Next.js build
 */
export function getStandalonePath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'standalone');
  }
  return path.join(app.getAppPath(), '.next', 'standalone');
}

/**
 * Get the path to static files
 */
export function getStaticPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'static');
  }
  return path.join(app.getAppPath(), '.next', 'static');
}

/**
 * Get the path to public files
 */
export function getPublicPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'public');
  }
  return path.join(app.getAppPath(), 'public');
}

/**
 * Get the user data directory
 */
export function getUserDataPath(): string {
  return app.getPath('userData');
}

/**
 * Get the logs directory
 */
export function getLogsPath(): string {
  return path.join(getUserDataPath(), 'logs');
}

/**
 * Get the agent-log directory
 */
export function getAgentLogPath(): string {
  return path.join(getUserDataPath(), 'agent-log');
}
