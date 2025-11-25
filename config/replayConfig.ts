import { isDevelopment } from '@/utils/env';

/**
 * Replay configuration constants
 * Centralized configuration for replay mode settings
 */

/**
 * Get fixedInterval configuration based on environment
 */
export function getFixedIntervalConfig() {
  const isDev = isDevelopment();
  return {
    // Default values
    default: isDev ? 1 : 30,
    // Validation ranges
    min: isDev ? 0 : 10,
    max: 60000,
    // Step for input controls
    step: 1,
  };
}

/**
 * Get speed configuration
 * Speed is not environment-dependent
 */
export function getSpeedConfig() {
  return {
    // Default value
    default: 1.0,
    // Validation ranges
    min: 0.1,
    max: 100,
    // Step for input controls
    step: 0.1,
    // Precision for display
    precision: 1,
  };
}

/**
 * Get default replay config based on playback mode
 */
export function getDefaultReplayConfig(playbackMode: 'fixed' | 'realtime' = 'fixed') {
  const fixedIntervalConfig = getFixedIntervalConfig();
  const speedConfig = getSpeedConfig();

  return {
    playbackMode,
    speed: speedConfig.default,
    fixedInterval: fixedIntervalConfig.default,
  };
}
