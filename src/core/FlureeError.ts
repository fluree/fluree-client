export class FlureeError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public statusText?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public originalError?: any
  ) {
    super(message);
    this.name = 'FlureeError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FlureeError);
    }
  }
}
