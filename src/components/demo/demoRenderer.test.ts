import { describe, it, expect } from 'vitest';
import { resolveDemoRenderer } from './demoRenderer';

describe('resolveDemoRenderer', () => {
  it('maps text/normal to response', () => {
    expect(resolveDemoRenderer('text')).toBe('response');
    expect(resolveDemoRenderer('normal')).toBe('response');
  });
  it('maps thinking to reasoning', () => {
    expect(resolveDemoRenderer('thinking')).toBe('reasoning');
  });
  it('maps every tool_* to tool', () => {
    expect(resolveDemoRenderer('tool_streaming')).toBe('tool');
    expect(resolveDemoRenderer('tool_use')).toBe('tool');
    expect(resolveDemoRenderer('tool_result')).toBe('tool');
  });
  it('maps file to file', () => {
    expect(resolveDemoRenderer('file')).toBe('file');
  });
  it('maps workflow/agent_start/agent_result/finish/error to their custom kinds', () => {
    expect(resolveDemoRenderer('workflow')).toBe('workflow');
    expect(resolveDemoRenderer('agent_start')).toBe('agent');
    expect(resolveDemoRenderer('agent_result')).toBe('agent');
    expect(resolveDemoRenderer('finish')).toBe('finish');
    expect(resolveDemoRenderer('error')).toBe('error');
  });
  it('falls back for unknown types', () => {
    expect(resolveDemoRenderer('something_new')).toBe('fallback');
  });
});
