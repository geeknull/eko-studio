import type { LLMprovider } from '@eko-ai/eko/types';

// Extract string literal types from LLMprovider (excludes ProviderV2 object type)
type StringProvider = Extract<LLMprovider, string>;

/**
 * Get common models based on provider
 */
export function getModelOptions(provider: LLMprovider): string[] {
  // Type guard to check if provider is a string
  if (typeof provider !== 'string') {
    // ProviderV2 object type - return empty array as we don't have predefined models
    return [];
  }

  const modelsByProvider: Record<StringProvider, string[]> = {
    'openai': ['gpt-5.1', 'gpt-5-mini', 'gpt-5-nano'], // https://platform.openai.com/docs/models
    'anthropic': ['claude-sonnet-4-5-20250929', 'claude-haiku-4-5-20251001', 'claude-opus-4-5-20251101', 'claude-opus-4-1-20250805'], // https://platform.claude.com/docs/en/about-claude/models/overview
    'google': ['gemini-3-pro-preview', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'], // https://ai.google.dev/gemini-api/docs/pricing
    'aws': ['ai21.jamba-1-5-large-v1:0', 'ai21.jamba-1-5-mini-v1:0', 'amazon.nova-2-multimodal-embeddings-v1:0'], // https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html
    'openrouter': ['x-ai/grok-code-fast-1', 'anthropic/claude-sonnet-4.5', 'google/gemini-2.5-flash', ''], // https://openrouter.ai/models?order=top-weekly
    'openai-compatible': [],
    'modelscope': [],
  };
  return modelsByProvider[provider as StringProvider] || [];
}

/**
 * Get default Base URL based on provider
 */
export function getDefaultBaseURL(provider: LLMprovider): string {
  // Type guard to check if provider is a string
  if (typeof provider !== 'string') {
    // ProviderV2 object type - return empty string as we don't have predefined base URL
    return '';
  }

  const baseURLByProvider: Record<StringProvider, string> = {
    'openai': 'https://api.openai.com/v1',
    'anthropic': 'https://api.anthropic.com/v1',
    'google': 'https://generativelanguage.googleapis.com/v1',
    'aws': 'https://bedrock-runtime.us-east-1.amazonaws.com',
    'openrouter': 'https://openrouter.ai/api/v1',
    'openai-compatible': '',
    'modelscope': '',
  };
  return baseURLByProvider[provider as StringProvider] || '';
}
