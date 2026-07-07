import Anthropic from '@anthropic-ai/sdk';
import { runOrchestrator } from '../../orchestrator';
import type { VisaInput } from '../../types/index';

// Mock @anthropic-ai/sdk
jest.mock('@anthropic-ai/sdk');

const originalDryRun = process.env.DRY_RUN;

describe('Schengen detection in orchestrator', () => {
  beforeAll(() => {
    process.env.DRY_RUN = 'true';
  });

  afterAll(() => {
    process.env.DRY_RUN = originalDryRun;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets schengenMember:true when destination is Germany', async () => {
    const input: VisaInput = {
      nationality: 'US',
      destination: 'Germany',
      freeform: 'Planning to stay in Berlin',
    };

    const mockClient = new Anthropic() as unknown as jest.Mock;

    let parsedRequest: any;
    const onParsed = (req: any) => {
      parsedRequest = req;
    };

    const result = await runOrchestrator(input, mockClient as any, 'standard', onParsed);

    expect(parsedRequest).toBeDefined();
    expect(parsedRequest.schengenMember).toBe(true);
    expect(parsedRequest.region).toBe('Schengen');
    expect(result.visaRequest.schengenMember).toBe(true);
  });

  it('sets schengenMember:true when destination is Portugal', async () => {
    const input: VisaInput = {
      nationality: 'US',
      destination: 'Portugal',
      freeform: 'Looking for digital nomad visa',
    };

    const mockClient = new Anthropic() as unknown as jest.Mock;

    let parsedRequest: any;
    const onParsed = (req: any) => {
      parsedRequest = req;
    };

    const result = await runOrchestrator(input, mockClient as any, 'standard', onParsed);

    expect(parsedRequest).toBeDefined();
    expect(parsedRequest.schengenMember).toBe(true);
    expect(parsedRequest.region).toBe('Schengen');
    expect(result.visaRequest.schengenMember).toBe(true);
  });

  it('sets schengenMember:true when destination is Spain', async () => {
    const input: VisaInput = {
      nationality: 'US',
      destination: 'Spain',
      freeform: 'Interested in DNV',
    };

    const mockClient = new Anthropic() as unknown as jest.Mock;

    let parsedRequest: any;
    const onParsed = (req: any) => {
      parsedRequest = req;
    };

    const result = await runOrchestrator(input, mockClient as any, 'standard', onParsed);

    expect(parsedRequest).toBeDefined();
    expect(parsedRequest.schengenMember).toBe(true);
    expect(parsedRequest.region).toBe('Schengen');
  });

  it('sets schengenMember:true when destination is Netherlands', async () => {
    const input: VisaInput = {
      nationality: 'US',
      destination: 'Netherlands',
      freeform: 'Amsterdam relocation',
    };

    const mockClient = new Anthropic() as unknown as jest.Mock;

    let parsedRequest: any;
    const onParsed = (req: any) => {
      parsedRequest = req;
    };

    await runOrchestrator(input, mockClient as any, 'standard', onParsed);

    expect(parsedRequest).toBeDefined();
    expect(parsedRequest.schengenMember).toBe(true);
    expect(parsedRequest.region).toBe('Schengen');
  });

  it('sets schengenMember:true when destination is France', async () => {
    const input: VisaInput = {
      nationality: 'US',
      destination: 'France',
      freeform: 'Paris',
    };

    const mockClient = new Anthropic() as unknown as jest.Mock;

    let parsedRequest: any;
    const onParsed = (req: any) => {
      parsedRequest = req;
    };

    await runOrchestrator(input, mockClient as any, 'standard', onParsed);

    expect(parsedRequest).toBeDefined();
    expect(parsedRequest.schengenMember).toBe(true);
    expect(parsedRequest.region).toBe('Schengen');
  });

  it('sets schengenMember:false when destination is Japan', async () => {
    const input: VisaInput = {
      nationality: 'US',
      destination: 'Japan',
      freeform: 'Tokyo trip',
    };

    const mockClient = new Anthropic() as unknown as jest.Mock;

    let parsedRequest: any;
    const onParsed = (req: any) => {
      parsedRequest = req;
    };

    const result = await runOrchestrator(input, mockClient as any, 'standard', onParsed);

    expect(parsedRequest).toBeDefined();
    expect(parsedRequest.schengenMember).toBe(false);
    expect(parsedRequest.region).toBe('East Asia');
    expect(result.visaRequest.schengenMember).toBe(false);
  });

  it('sets schengenMember:false when destination is South Korea', async () => {
    const input: VisaInput = {
      nationality: 'US',
      destination: 'South Korea',
      freeform: 'Seoul',
    };

    const mockClient = new Anthropic() as unknown as jest.Mock;

    let parsedRequest: any;
    const onParsed = (req: any) => {
      parsedRequest = req;
    };

    await runOrchestrator(input, mockClient as any, 'standard', onParsed);

    expect(parsedRequest).toBeDefined();
    expect(parsedRequest.schengenMember).toBe(false);
    expect(parsedRequest.region).toBe('East Asia');
  });

  it('sets schengenMember:false when destination is Thailand', async () => {
    const input: VisaInput = {
      nationality: 'US',
      destination: 'Thailand',
      freeform: 'Bangkok digital nomad',
    };

    const mockClient = new Anthropic() as unknown as jest.Mock;

    let parsedRequest: any;
    const onParsed = (req: any) => {
      parsedRequest = req;
    };

    const result = await runOrchestrator(input, mockClient as any, 'standard', onParsed);

    expect(parsedRequest).toBeDefined();
    expect(parsedRequest.schengenMember).toBe(false);
    expect(parsedRequest.region).toBe('SEA');
    expect(result.visaRequest.schengenMember).toBe(false);
  });

  it('sets schengenMember:false when destination is Vietnam', async () => {
    const input: VisaInput = {
      nationality: 'US',
      destination: 'Vietnam',
      freeform: 'Hanoi',
    };

    const mockClient = new Anthropic() as unknown as jest.Mock;

    let parsedRequest: any;
    const onParsed = (req: any) => {
      parsedRequest = req;
    };

    await runOrchestrator(input, mockClient as any, 'standard', onParsed);

    expect(parsedRequest).toBeDefined();
    expect(parsedRequest.schengenMember).toBe(false);
    expect(parsedRequest.region).toBe('SEA');
  });

  it('sets region correctly for Mexico (Latin America)', async () => {
    const input: VisaInput = {
      nationality: 'US',
      destination: 'Mexico',
      freeform: 'Cancun',
    };

    const mockClient = new Anthropic() as unknown as jest.Mock;

    let parsedRequest: any;
    const onParsed = (req: any) => {
      parsedRequest = req;
    };

    await runOrchestrator(input, mockClient as any, 'standard', onParsed);

    expect(parsedRequest).toBeDefined();
    expect(parsedRequest.region).toBe('Latin America');
    expect(parsedRequest.schengenMember).toBe(false);
  });

  it('sets region correctly for Colombia (Latin America)', async () => {
    const input: VisaInput = {
      nationality: 'US',
      destination: 'Colombia',
      freeform: 'Bogota',
    };

    const mockClient = new Anthropic() as unknown as jest.Mock;

    let parsedRequest: any;
    const onParsed = (req: any) => {
      parsedRequest = req;
    };

    await runOrchestrator(input, mockClient as any, 'standard', onParsed);

    expect(parsedRequest).toBeDefined();
    expect(parsedRequest.region).toBe('Latin America');
    expect(parsedRequest.schengenMember).toBe(false);
  });

  it('maintains DRY_RUN mode throughout orchestrator execution', async () => {
    const input: VisaInput = {
      nationality: 'US',
      destination: 'Germany',
      freeform: 'test',
    };

    const mockClient = new Anthropic() as unknown as jest.Mock;

    expect(process.env.DRY_RUN).toBe('true');

    await runOrchestrator(input, mockClient as any, 'standard');

    expect(process.env.DRY_RUN).toBe('true');
  });

  it('returns VisaRequest with all required fields when Schengen destination', async () => {
    const input: VisaInput = {
      nationality: 'US',
      destination: 'Germany',
      visaType: 'Schengen C',
      freeform: 'Planning work trip',
    };

    const mockClient = new Anthropic() as unknown as jest.Mock;

    const result = await runOrchestrator(input, mockClient as any, 'standard');

    expect(result.visaRequest).toBeDefined();
    expect(result.visaRequest.nationality).toBeDefined();
    expect(result.visaRequest.normalizedNationality).toBeDefined();
    expect(result.visaRequest.normalizedDestination).toBe('Germany');
    expect(result.visaRequest.parsedSummary).toBeDefined();
    expect(result.visaRequest.schengenMember).toBe(true);
    expect(result.visaRequest.region).toBe('Schengen');
  });

  it('returns VisaRequest with all required fields when East Asia destination', async () => {
    const input: VisaInput = {
      nationality: 'US',
      destination: 'Japan',
      visaType: 'Tourist',
      freeform: 'Visiting friends',
    };

    const mockClient = new Anthropic() as unknown as jest.Mock;

    const result = await runOrchestrator(input, mockClient as any, 'standard');

    expect(result.visaRequest).toBeDefined();
    expect(result.visaRequest.normalizedDestination).toBe('Japan');
    expect(result.visaRequest.schengenMember).toBe(false);
    expect(result.visaRequest.region).toBe('East Asia');
  });

  it('returns VisaRequest with all required fields when SEA destination', async () => {
    const input: VisaInput = {
      nationality: 'US',
      destination: 'Thailand',
      freeform: 'Extended stay',
    };

    const mockClient = new Anthropic() as unknown as jest.Mock;

    const result = await runOrchestrator(input, mockClient as any, 'standard');

    expect(result.visaRequest).toBeDefined();
    expect(result.visaRequest.normalizedDestination).toBe('Thailand');
    expect(result.visaRequest.schengenMember).toBe(false);
    expect(result.visaRequest.region).toBe('SEA');
  });
});
