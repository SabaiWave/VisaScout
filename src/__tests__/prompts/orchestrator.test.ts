import { buildOrchestratorPrompt } from '@/src/prompts/orchestrator';
import type { VisaInput } from '@/src/types/index';

const INPUT: VisaInput = {
  nationality: 'American',
  destination: 'Thailand',
  visaType: 'tourist',
  freeform: 'Planning a 30-day stay, remote worker.',
};

describe('buildOrchestratorPrompt', () => {
  it('returns PromptResult with system and user fields', () => {
    const result = buildOrchestratorPrompt(INPUT);
    expect(result).toHaveProperty('system');
    expect(result).toHaveProperty('user');
    expect(typeof result.system).toBe('string');
    expect(typeof result.user).toBe('string');
  });

  it('system block contains SECURITY instruction', () => {
    const { system } = buildOrchestratorPrompt(INPUT);
    expect(system).toContain('SECURITY');
    expect(system).toContain('<user_input>');
    expect(system).toContain('untrusted');
  });

  it('user block wraps all user fields in <user_input> tags', () => {
    const { user } = buildOrchestratorPrompt(INPUT);
    expect(user).toContain('<user_input>');
    expect(user).toContain('</user_input>');
    // User-supplied values appear inside the tags
    const open = user.indexOf('<user_input>');
    const close = user.indexOf('</user_input>');
    const inside = user.slice(open, close);
    expect(inside).toContain(INPUT.nationality);
    expect(inside).toContain(INPUT.destination);
    expect(inside).toContain(INPUT.freeform);
  });

  it('user block JSON template includes offTopic field', () => {
    const { user } = buildOrchestratorPrompt(INPUT);
    expect(user).toContain('"offTopic"');
  });

  it('system block lists all 10 supported destinations', () => {
    const { system } = buildOrchestratorPrompt(INPUT);
    const destinations = ['Thailand', 'Vietnam', 'Indonesia', 'Malaysia', 'Philippines', 'Cambodia', 'Laos', 'Myanmar', 'Singapore', 'Brunei'];
    for (const dest of destinations) {
      expect(system).toContain(dest);
    }
  });

  it('user fields do not appear in system block', () => {
    const { system } = buildOrchestratorPrompt(INPUT);
    expect(system).not.toContain(INPUT.freeform);
    expect(system).not.toContain(INPUT.visaType);
  });
});
