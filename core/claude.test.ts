import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class {
      messages = { create: mockCreate };
    },
  };
});

import { callClaudeJson } from './claude';

beforeEach(() => {
  mockCreate.mockReset();
  process.env.ANTHROPIC_API_KEY = 'test-key';
});

describe('callClaudeJson', () => {
  it('returns parsed JSON when Claude returns valid JSON in text block', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '{"hello":"world"}' }],
      usage: { input_tokens: 100, output_tokens: 10, cache_read_input_tokens: 0 },
    });
    const result = await callClaudeJson({
      systemPrompt: 'sys',
      userPrompt: 'user',
    });
    expect(result).toEqual({ hello: 'world' });
  });

  it('sets cache_control on system prompt', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '{}' }],
      usage: { input_tokens: 100, output_tokens: 10 },
    });
    await callClaudeJson({ systemPrompt: 'sys', userPrompt: 'user' });
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toEqual([
      { type: 'text', text: 'sys', cache_control: { type: 'ephemeral' } },
    ]);
  });

  it('uses claude-sonnet-4-6 model', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '{}' }],
      usage: { input_tokens: 100, output_tokens: 10 },
    });
    await callClaudeJson({ systemPrompt: 'sys', userPrompt: 'user' });
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe('claude-sonnet-4-6');
  });

  it('strips ```json fences if Claude wraps the response', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '```json\n{"hello":"world"}\n```' }],
      usage: { input_tokens: 100, output_tokens: 10 },
    });
    const result = await callClaudeJson({ systemPrompt: 'sys', userPrompt: 'user' });
    expect(result).toEqual({ hello: 'world' });
  });

  it('throws on malformed JSON', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'not json' }],
      usage: { input_tokens: 100, output_tokens: 10 },
    });
    await expect(
      callClaudeJson({ systemPrompt: 'sys', userPrompt: 'user' }),
    ).rejects.toThrow();
  });
});
