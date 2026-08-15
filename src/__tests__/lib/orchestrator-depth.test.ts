import Anthropic from '@anthropic-ai/sdk';
import { runOrchestrator } from '../../orchestrator';
import type { AgentStatusEvent } from '../../orchestrator';
import type { VisaInput } from '../../types/index';

jest.mock('@anthropic-ai/sdk');

const originalDryRun = process.env.DRY_RUN;

describe('runOrchestrator — depth-based agent dispatch', () => {
  beforeAll(() => {
    process.env.DRY_RUN = 'true';
  });

  afterAll(() => {
    process.env.DRY_RUN = originalDryRun;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const input: VisaInput = {
    nationality: 'US',
    destination: 'Thailand',
    freeform: 'Planning a 60-day stay as a remote worker.',
  };

  const mockClient = () => new Anthropic() as unknown as Parameters<typeof runOrchestrator>[1];

  it('quick depth: borderRun.status is skipped — agent not dispatched', async () => {
    const envelope = await runOrchestrator(input, mockClient(), 'quick');
    expect(envelope.borderRun.status).toBe('skipped');
  });

  it('quick depth: no running or complete status events emitted for borderRun', async () => {
    const events: AgentStatusEvent[] = [];
    await runOrchestrator(input, mockClient(), 'quick', undefined, (e) => events.push(e));
    const borderRunEvents = events.filter((e) => e.agent === 'borderRun');
    expect(borderRunEvents).toHaveLength(0);
  });

  it('standard depth: borderRun.status is success — agent dispatched normally', async () => {
    const envelope = await runOrchestrator(input, mockClient(), 'standard');
    expect(envelope.borderRun.status).toBe('success');
  });

  it('deep depth: borderRun.status is success — agent dispatched normally', async () => {
    const envelope = await runOrchestrator(input, mockClient(), 'deep');
    expect(envelope.borderRun.status).toBe('success');
  });
});
