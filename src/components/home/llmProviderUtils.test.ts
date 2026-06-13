import { describe, it, expect } from 'vitest';
import type { LLMprovider } from '@eko-ai/eko/types';
import { getModelOptions, getDefaultBaseURL } from './llmProviderUtils';

describe('getDefaultBaseURL', () => {
  it('returns the documented base URL for each string provider', () => {
    expect(getDefaultBaseURL('openai')).toBe('https://api.openai.com/v1');
    expect(getDefaultBaseURL('anthropic')).toBe('https://api.anthropic.com/v1');
    expect(getDefaultBaseURL('google')).toBe('https://generativelanguage.googleapis.com/v1');
    expect(getDefaultBaseURL('bedrock')).toBe('https://bedrock-runtime.us-east-1.amazonaws.com');
    expect(getDefaultBaseURL('openrouter')).toBe('https://openrouter.ai/api/v1');
  });

  it('returns empty string for providers without a default base URL', () => {
    expect(getDefaultBaseURL('azure')).toBe('');
    expect(getDefaultBaseURL('openai-compatible')).toBe('');
    expect(getDefaultBaseURL('modelscope')).toBe('');
  });

  it('returns empty string for a ProviderV2 (object) provider', () => {
    expect(getDefaultBaseURL({} as LLMprovider)).toBe('');
  });
});

describe('getModelOptions', () => {
  it('returns model lists for providers that define them', () => {
    expect(getModelOptions('openai')).toContain('gpt-5-nano');
    expect(getModelOptions('anthropic').length).toBeGreaterThan(0);
    expect(getModelOptions('bedrock').length).toBeGreaterThan(0);
    expect(getModelOptions('openrouter')).toContain('anthropic/claude-sonnet-4.5');
  });

  it('returns an empty list for providers without predefined models', () => {
    expect(getModelOptions('azure')).toEqual([]);
    expect(getModelOptions('openai-compatible')).toEqual([]);
    expect(getModelOptions('modelscope')).toEqual([]);
  });

  it('returns an empty list for a ProviderV2 (object) provider', () => {
    expect(getModelOptions({} as LLMprovider)).toEqual([]);
  });

  // Regression guard for the eko 4.1.3 upgrade: provider 'aws' was renamed to
  // 'bedrock'. 'aws' must no longer resolve to anything.
  it('no longer recognizes the legacy "aws" provider', () => {
    expect(getModelOptions('aws' as unknown as LLMprovider)).toEqual([]);
    expect(getDefaultBaseURL('aws' as unknown as LLMprovider)).toBe('');
  });
});
