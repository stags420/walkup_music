export type HttpErrorKind = 'network' | 'timeout' | 'http';

export class HttpError extends Error {
  readonly kind: HttpErrorKind;
  readonly status?: number;
  readonly cause?: unknown;

  constructor(params: {
    kind: HttpErrorKind;
    message: string;
    status?: number;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = 'HttpError';
    this.kind = params.kind;
    this.status = params.status;
    this.cause = params.cause;
  }
}
