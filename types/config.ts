import type { LLMConfig, LLMprovider } from '@eko-ai/eko/types';

export type AgentType = 'BrowserAgent' | 'FileAgent';

// NormalConfig uses LLMConfig from @eko-ai/eko, but restricts apiKey and baseURL to string (not function)
export interface NormalConfig {
  // LLM Configuration - using LLMConfig from @eko-ai/eko
  llm: Omit<LLMConfig, 'apiKey' | 'config'> & {
    apiKey: string // Restrict to string only (not function) for our use case
    config?: Omit<NonNullable<LLMConfig['config']>, 'baseURL'> & {
      baseURL?: string // Restrict to string only (not function) for our use case
    }
  }
  // Agents Configuration
  agents: AgentType[]
}

// Re-export LLMprovider for convenience (can also import directly from '@eko-ai/eko/types')
export type { LLMprovider };

export interface ReplayConfig {
  playbackMode: 'realtime' | 'fixed'
  speed: number
  fixedInterval: number
}

// Form values types (for Ant Design Form)
export interface ReplayConfigFormValues {
  playbackMode: 'realtime' | 'fixed'
  speed: number
  fixedInterval: number
}

export interface NormalConfigFormValues {
  provider: LLMprovider
  model: string // Changed from string[] to string since we only need one model
  apiKey: string
  baseURL?: string
  temperature?: number
  topP?: number
  topK?: number
  maxTokens?: number
  agents: AgentType[]
}
