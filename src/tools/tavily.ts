import { tavily } from '@tavily/core';

export interface TavilyResult {
  url: string;
  title: string;
  content: string;
  publishedDate?: string;
  score?: number;
}

export interface TavilySearchOptions {
  maxResults: number;
  domainBias?: string[];
  excludeDomains?: string[];
  days?: number;
}

let client: ReturnType<typeof tavily> | null = null;

function getClient(): ReturnType<typeof tavily> {
  if (!client) {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) throw new Error('TAVILY_API_KEY not set');
    client = tavily({ apiKey });
  }
  return client;
}

export async function tavilySearch(
  query: string,
  options: TavilySearchOptions
): Promise<TavilyResult[]> {
  try {
    const c = getClient();
    const params: Parameters<typeof c.search>[1] = {
      maxResults: options.maxResults,
      includeAnswer: false,
    };
    if (options.domainBias?.length) {
      params.includeDomains = options.domainBias;
    }
    if (options.excludeDomains?.length) {
      params.excludeDomains = options.excludeDomains;
    }
    if (options.days) {
      params.days = options.days;
    }

    const response = await c.search(query, params);
    return (response.results ?? []).map((r) => ({
      url: r.url,
      title: r.title,
      content: r.content,
      publishedDate: r.publishedDate,
      score: r.score,
    }));
  } catch (err) {
    console.error(`[tavily] search failed for query "${query}":`, err);
    return [];
  }
}
