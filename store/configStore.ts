import { create } from 'zustand';
import { isDevelopment } from '@/utils/env';
import type { NormalConfig, ReplayConfig } from '@/types';

export interface ConfigState {
  mode: 'normal' | 'replay'
  normalConfig: NormalConfig | null
  replayConfig: ReplayConfig
  setMode: (mode: 'normal' | 'replay') => void
  setNormalConfig: (config: NormalConfig | null) => void
  setReplayConfig: (config: ReplayConfig) => void
  updateConfig: (
    mode: 'normal' | 'replay',
    normalConfig: NormalConfig | null,
    replayConfig: ReplayConfig,
  ) => void
  resetConfig: () => void
}

/**
 * Get default replay config based on environment and playback mode
 * Only fixedInterval is environment-dependent, speed remains constant
 */
function getDefaultReplayConfig(playbackMode: 'fixed' | 'realtime' = 'fixed'): ReplayConfig {
  const isDev = isDevelopment();
  // fixedInterval is only used in 'fixed' mode, but we keep a reasonable default
  // for 'realtime' mode in case user switches to 'fixed' mode later
  const defaultFixedInterval = isDev ? 1 : 30;
  return {
    playbackMode,
    speed: 1.0,
    fixedInterval: defaultFixedInterval,
  };
}

const defaultReplayConfig: ReplayConfig = getDefaultReplayConfig('fixed');

export const useConfigStore = create<ConfigState>(set => ({
  mode: 'replay',
  normalConfig: null,
  replayConfig: defaultReplayConfig,

  setMode: mode => set({ mode }),

  setNormalConfig: normalConfig => set({ normalConfig }),

  setReplayConfig: replayConfig => set({ replayConfig }),

  updateConfig: (mode, normalConfig, replayConfig) =>
    set({ mode, normalConfig, replayConfig }),

  resetConfig: () =>
    set({
      mode: 'normal',
      normalConfig: null,
      replayConfig: defaultReplayConfig,
    }),
}));
