/* eslint-disable @typescript-eslint/no-explicit-any */
export class HttpError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body: any) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}

export class ApplicationError extends Error {
  errorCode: string;
  details: any;
  constructor(message: string, errorCode: string, details: any) {
    super(message);
    this.name = 'ApplicationError';
    this.errorCode = errorCode;
    this.details = details;
  }
}
