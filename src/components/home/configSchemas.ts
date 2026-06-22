import { z } from 'zod';
import { getFixedIntervalConfig, getSpeedConfig } from '@/config/replayConfig';

// Note: FileAgent was removed in eko 4.x, so AgentType only contains 'BrowserAgent'
export const AGENT_TYPES = ['BrowserAgent'] as const;

// Normal mode config schema. Mirrors the old antd Form rules:
// provider/model/apiKey required, temperature 0-2, topP 0-1, topK 1-100,
// maxTokens 1-128000, at least one agent.
export const normalConfigSchema = z.object({
  provider: z.string().min(1, 'Please select a Provider'),
  model: z.string().min(1, 'Please enter model name'),
  apiKey: z.string().min(1, 'Please enter API Key'),
  baseURL: z.string().optional(),
  temperature: z.number().min(0, 'Range: 0.0 - 2.0').max(2, 'Range: 0.0 - 2.0').optional(),
  topP: z.number().min(0, 'Range: 0.0 - 1.0').max(1, 'Range: 0.0 - 1.0').optional(),
  topK: z.number().min(1, 'Range: 1 - 100').max(100, 'Range: 1 - 100').optional(),
  maxTokens: z.number().min(1, 'Range: 1 - 128000').max(128000, 'Range: 1 - 128000').optional(),
  agents: z.array(z.enum(AGENT_TYPES)).min(1, 'Please select at least one Agent'),
});

export type NormalConfigSchema = z.infer<typeof normalConfigSchema>;

// Replay mode schema. Bounds (speed / fixedInterval) are environment-dependent,
// so build the schema from the centralized replayConfig at call time.
export function createReplayConfigSchema() {
  const speed = getSpeedConfig();
  const fixed = getFixedIntervalConfig();

  return z.object({
    playbackMode: z.enum(['realtime', 'fixed']),
    speed: z
      .number()
      .min(speed.min, `Speed must be between ${speed.min} and ${speed.max}`)
      .max(speed.max, `Speed must be between ${speed.min} and ${speed.max}`),
    fixedInterval: z
      .number()
      .min(fixed.min, `Interval must be between ${fixed.min} and ${fixed.max} ms`)
      .max(fixed.max, `Interval must be between ${fixed.min} and ${fixed.max} ms`),
  });
}

export type ReplayConfigSchema = z.infer<ReturnType<typeof createReplayConfigSchema>>;
