export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'aws' | 'openrouter' | 'openai-compatible' | 'modelscope';

export type AgentType = 'BrowserAgent' | 'FileAgent';

export interface NormalConfig {
  // LLM Configuration
  llm: {
    provider: LLMProvider
    model: string
    apiKey: string
    config?: {
      baseURL?: string
      temperature?: number
      topP?: number
      topK?: number
      maxTokens?: number
    }
  }
  // Agents Configuration
  agents: AgentType[]
}

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
  provider: LLMProvider
  model: string[]
  apiKey: string
  baseURL?: string
  temperature?: number
  topP?: number
  topK?: number
  maxTokens?: number
  agents: AgentType[]
}
