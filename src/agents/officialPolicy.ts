import Anthropic from '@anthropic-ai/sdk';
import { tavilySearch } from '../tools/tavily';
import { buildOfficialPolicyPrompt } from '../prompts/officialPolicy';
import { parseJSON } from '../lib/parseJSON';
import { highestTier } from '../lib/sourceTier';
import { recordUsage } from '../lib/cost';
import type { AgentResult, OfficialPolicyOutput, VisaRequest } from '../types/index';

const MODEL = 'claude-sonnet-4-6';

export async function officialPolicyAgent(
  request: VisaRequest,
  client: Anthropic,
  depth: 'quick' | 'standard' | 'deep' = 'standard'
): Promise<AgentResult<OfficialPolicyOutput>> {
  const start = Date.now();
  const maxResults = depth === 'quick' ? 3 : depth === 'standard' ? 5 : 8;

  // Country-specific Tier 1 official immigration domains
  const officialDomains: Record<string, string[]> = {
    Thailand:    ['immigration.go.th', 'mfa.go.th', 'thaigov.go.th', 'consular.go.th'],
    Vietnam:     ['immigration.gov.vn', 'evisa.gov.vn', 'xuatnhapcanh.gov.vn', 'mofa.gov.vn'],
    Indonesia:   ['imigrasi.go.id', 'kemlu.go.id', 'evisa.imigrasi.go.id'],
    Malaysia:    ['imi.gov.my', 'kln.gov.my', 'motac.gov.my'],
    Philippines: ['immigration.gov.ph', 'dfa.gov.ph', 'evisa.gov.ph'],
    Cambodia:    ['evisa.gov.kh', 'mfaic.gov.kh', 'immigration.gov.kh'],
    Singapore:   ['ica.gov.sg', 'mfa.gov.sg', 'mom.gov.sg'],
    Laos:        ['laoevisa.gov.la', 'mofa.gov.la', 'immigration.gov.la'],
    Myanmar:     ['evisa.moip.gov.mm', 'mofa.gov.mm', 'mip.gov.mm'],
    Brunei:      ['immigration.gov.bn', 'mfa.gov.bn'],
  };
  const destDomains = officialDomains[request.normalizedDestination] ?? ['.gov'];

  try {
    const results = await tavilySearch(
      `${request.normalizedDestination} visa ${request.normalizedNationality} official immigration rules requirements 2024 2025`,
      {
        maxResults,
        domainBias: destDomains,
      }
    );

    const sourceUrls = results.map((r) => r.url);
    const sourceTier = highestTier(sourceUrls);

    const searchText = results
      .map((r) => `[${r.url}]\nTitle: ${r.title}\n${r.content}`)
      .join('\n\n---\n\n');

    const prompt = buildOfficialPolicyPrompt(request, searchText || 'No results found.');

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    recordUsage({
      agent: 'officialPolicy',
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      tavilySearches: 1,
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = parseJSON<OfficialPolicyOutput & {
      confidence: 'high' | 'medium' | 'low';
      gaps: string[];
      sourceTier: 1 | 2 | 3 | 4;
      sourceUrls: string[];
      verified: boolean;
    }>(raw);

    return {
      status: 'success',
      data: {
        visaTypes: parsed.visaTypes ?? [],
        defaultStayDuration: parsed.defaultStayDuration ?? '',
        extensionRules: parsed.extensionRules ?? '',
        fees: parsed.fees ?? '',
        applicationProcess: parsed.applicationProcess ?? '',
        notes: parsed.notes ?? [],
      },
      confidence: parsed.confidence ?? 'medium',
      gaps: parsed.gaps ?? [],
      sourceTier: parsed.sourceTier ?? sourceTier,
      sourceUrls: parsed.sourceUrls?.length ? parsed.sourceUrls : sourceUrls,
      verified: parsed.verified ?? sourceTier <= 2,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      status: 'failed',
      data: null,
      confidence: 'low',
      gaps: ['Official policy agent failed — visa rules not available'],
      sourceTier: 4,
      sourceUrls: [],
      verified: false,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
