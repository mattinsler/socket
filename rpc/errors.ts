export class RpcError<Code extends string> extends Error {
  readonly code: Code;

  constructor(code: Code, message?: string) {
    super(message);
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedError extends RpcError<'UNAUTHORIZED'> {
  constructor(message?: string) {
    super('UNAUTHORIZED', message || 'Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

export const errors = {
  unauthorized: (message?: string) => new UnauthorizedError(message),
};

export interface SerializedRpcError {
  code: string;
  message: string;
}

export function deserialize({ code, message }: SerializedRpcError): RpcError<string> {
  switch (code) {
    case 'UNAUTHORIZED':
      return errors.unauthorized(message);
  }
  throw new Error(`Unknown error code: ${code}`);
}

export function serialize({ code, message }: RpcError<string>): SerializedRpcError {
  return { code, message };
}
