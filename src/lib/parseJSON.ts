export function parseJSON<T>(raw: string): T {
  const stripped = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(stripped) as T;
  } catch {
    // Model prepended prose before JSON — find first { and parse from there
    const jsonStart = stripped.indexOf('{');
    if (jsonStart >= 0) {
      return JSON.parse(stripped.slice(jsonStart)) as T;
    }
    throw new SyntaxError(`No valid JSON in response: ${raw.slice(0, 80)}...`);
  }
}
