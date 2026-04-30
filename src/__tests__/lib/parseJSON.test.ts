import { parseJSON } from '../../lib/parseJSON';

describe('parseJSON', () => {
  it('strips ```json ... ``` fences correctly', () => {
    const input = '```json\n{"key": "value"}\n```';
    expect(parseJSON<{ key: string }>(input)).toEqual({ key: 'value' });
  });

  it('strips ``` ... ``` fences without language tag', () => {
    const input = '```\n{"key": "value"}\n```';
    expect(parseJSON<{ key: string }>(input)).toEqual({ key: 'value' });
  });

  it('passes through clean JSON unchanged', () => {
    const input = '{"confidence": "high", "tier": 1}';
    expect(parseJSON<{ confidence: string; tier: number }>(input)).toEqual({
      confidence: 'high',
      tier: 1,
    });
  });

  it('handles JSON with leading/trailing whitespace', () => {
    const input = '  \n  {"key": "trimmed"}  \n  ';
    expect(parseJSON<{ key: string }>(input)).toEqual({ key: 'trimmed' });
  });

  it('handles nested objects', () => {
    const input = '```json\n{"nested": {"a": 1, "b": [1, 2, 3]}}\n```';
    expect(parseJSON<{ nested: { a: number; b: number[] } }>(input)).toEqual({
      nested: { a: 1, b: [1, 2, 3] },
    });
  });

  it('handles JSON array at root', () => {
    const input = '```json\n[{"id": 1}, {"id": 2}]\n```';
    expect(parseJSON<{ id: number }[]>(input)).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('strips only the outermost fences, not inner backticks', () => {
    const input = '```json\n{"text": "use `code` here"}\n```';
    expect(parseJSON<{ text: string }>(input)).toEqual({ text: 'use `code` here' });
  });

  it('throws on invalid JSON after stripping fences', () => {
    expect(() => parseJSON('```json\nnot valid json\n```')).toThrow();
  });

  it('throws on empty string', () => {
    expect(() => parseJSON('')).toThrow();
  });

  it('handles ```JSON (uppercase) fences', () => {
    const input = '```JSON\n{"key": "value"}\n```';
    expect(parseJSON<{ key: string }>(input)).toEqual({ key: 'value' });
  });
});
