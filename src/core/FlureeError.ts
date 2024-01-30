export class FlureeError extends Error {
  constructor(message: string, public readonly code?: number) {
    super(message);
    this.name = 'FlureeError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FlureeError);
    }
  }
}
