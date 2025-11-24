import type { LLMProvider } from './NormalConfigModal';

/**
 * Get common models based on provider
 */
export function getModelOptions(provider: LLMProvider): string[] {
  const modelsByProvider: Record<LLMProvider, string[]> = {
    'openai': ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    'anthropic': ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
    'google': ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    'aws': ['anthropic.claude-v2', 'anthropic.claude-instant-v1'],
    'openrouter': ['openai/gpt-5-nano', 'anthropic/claude-sonnet-4.5', 'openai/gpt-5.1'],
    'openai-compatible': [],
    'modelscope': [],
  };
  return modelsByProvider[provider] || [];
}

/**
 * Get default Base URL based on provider
 */
export function getDefaultBaseURL(provider: LLMProvider): string {
  const baseURLByProvider: Record<LLMProvider, string> = {
    'openai': 'https://api.openai.com/v1',
    'anthropic': 'https://api.anthropic.com/v1',
    'google': 'https://generativelanguage.googleapis.com/v1',
    'aws': 'https://bedrock-runtime.us-east-1.amazonaws.com',
    'openrouter': 'https://openrouter.ai/api/v1',
    'openai-compatible': '',
    'modelscope': '',
  };
  return baseURLByProvider[provider] || '';
}

