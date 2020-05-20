export type ErrorCode = 'BAD_REQUEST' | 'UNAUTHORIZED' | 'UNKNOWN';

export class RpcError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message?: string) {
    super(message);
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends RpcError {
  constructor(message?: string) {
    super('BAD_REQUEST', message || 'Bad Request');
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends RpcError {
  constructor(message?: string) {
    super('UNAUTHORIZED', message || 'Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

export class UnknownError extends RpcError {
  constructor(message?: string) {
    super('UNKNOWN', message || 'Unknown');
    this.name = 'UnknownError';
  }
}

export const errors = {
  badRequest: (message?: string) => new BadRequestError(message),
  unauthorized: (message?: string) => new UnauthorizedError(message),
  unknown: (message?: string) => new UnknownError(message),
};

export interface SerializedRpcError {
  code: ErrorCode;
  message: string;
}

export function deserialize({ code, message }: SerializedRpcError): RpcError {
  switch (code) {
    case 'BAD_REQUEST':
      return errors.badRequest(message);
    case 'UNAUTHORIZED':
      return errors.unauthorized(message);
    case 'UNKNOWN':
      return errors.unknown(message);
  }
}

export function serialize({ code, message }: RpcError): SerializedRpcError {
  return { code, message };
}
