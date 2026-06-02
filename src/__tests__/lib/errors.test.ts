import { OffTopicError } from '@/src/lib/errors';

describe('OffTopicError', () => {
  it('is an instance of Error', () => {
    expect(new OffTopicError()).toBeInstanceOf(Error);
  });

  it('has name OffTopicError', () => {
    expect(new OffTopicError().name).toBe('OffTopicError');
  });

  it('uses default message', () => {
    expect(new OffTopicError().message).toBe(
      'Input is not related to visa travel for a supported SEA destination.'
    );
  });

  it('accepts custom message', () => {
    expect(new OffTopicError('custom').message).toBe('custom');
  });
});
