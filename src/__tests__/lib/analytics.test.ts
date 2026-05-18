import { trackEvent } from '../../lib/analytics';
import { log } from '../../lib/logger';

jest.mock('../../lib/logger', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('trackEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves without throwing on valid input', async () => {
    await expect(trackEvent('test.event', { userId: 'user_123' })).resolves.toBeUndefined();
  });

  it('calls log.info with event name and props', async () => {
    await trackEvent('user.signup', { userId: 'user_123' });
    expect(log.info).toHaveBeenCalledWith(
      'user.signup',
      expect.objectContaining({ event: 'user.signup', userId: 'user_123' }),
    );
  });

  it('includes ts field in every call', async () => {
    await trackEvent('brief.started', {});
    expect(log.info).toHaveBeenCalledWith(
      'brief.started',
      expect.objectContaining({ ts: expect.any(String) }),
    );
  });

  it('resolves without throwing when logger throws (failure isolation)', async () => {
    (log.info as jest.Mock).mockImplementationOnce(() => {
      throw new Error('logger unavailable');
    });
    await expect(trackEvent('test.event', {})).resolves.toBeUndefined();
  });

  it('resolves without throwing with no props argument', async () => {
    await expect(trackEvent('brief.failed')).resolves.toBeUndefined();
  });
});
