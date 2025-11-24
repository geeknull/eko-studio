import { create } from 'zustand';
import { NormalConfig } from '@/components/home/NormalConfigModal';
import { ReplayConfig } from '@/components/home/ReplayConfigModal';

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

const defaultReplayConfig: ReplayConfig = {
  playbackMode: 'realtime',
  speed: 1.0,
  fixedInterval: 100,
};

export const useConfigStore = create<ConfigState>(set => ({
  mode: 'normal',
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
