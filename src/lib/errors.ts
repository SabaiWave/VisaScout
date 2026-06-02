export class OffTopicError extends Error {
  constructor(message = 'Input is not related to visa travel for a supported SEA destination.') {
    super(message);
    this.name = 'OffTopicError';
  }
}
