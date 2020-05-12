import { ClientRequestStream } from './client-request-stream';
import { ClientResponseStream } from './client-response-stream';
import { ServerRequestStream } from './server-request-stream';
import { ServerResponseStream } from './server-response-stream';

export interface RpcDefinition<
  // @ts-ignore
  Req extends object,
  // @ts-ignore
  Res extends object,
  IsReqStream extends boolean,
  IsResStream extends boolean
> {
  reqStream: IsReqStream;
  resStream: IsResStream;
}

export interface RpcDefinitionFn {
  <Req extends object, Res extends object>(): RpcDefinition<Req, Res, false, false>;
  <Req extends object, Res extends object>(opts: { reqStream: true }): RpcDefinition<Req, Res, true, false>;
  <Req extends object, Res extends object>(opts: { reqStream: false }): RpcDefinition<Req, Res, false, false>;
  <Req extends object, Res extends object>(opts: { resStream: true }): RpcDefinition<Req, Res, false, true>;
  <Req extends object, Res extends object>(opts: { resStream: false }): RpcDefinition<Req, Res, false, false>;
  <Req extends object, Res extends object>(opts: { reqStream: false; resStream: false }): RpcDefinition<
    Req,
    Res,
    false,
    false
  >;
  <Req extends object, Res extends object>(opts: { reqStream: true; resStream: false }): RpcDefinition<
    Req,
    Res,
    true,
    false
  >;
  <Req extends object, Res extends object>(opts: { reqStream: false; resStream: true }): RpcDefinition<
    Req,
    Res,
    false,
    true
  >;
  <Req extends object, Res extends object>(opts: { reqStream: true; resStream: true }): RpcDefinition<
    Req,
    Res,
    true,
    true
  >;
}

export type ClientMethodDefinition<T> = T extends RpcDefinition<
  infer Req,
  infer Res,
  infer IsReqStream,
  infer IsResStream
>
  ? IsReqStream extends true
    ? IsResStream extends true
      ? () => [ClientRequestStream<Req>, ClientResponseStream<Res>]
      : () => [ClientRequestStream<Req>, Promise<Res>]
    : IsResStream extends true
    ? (req: Req) => ClientResponseStream<Res>
    : (req: Req) => Promise<Res>
  : never;

export type ClientDefinition<T extends object> = {
  [K in keyof T]: ClientMethodDefinition<T[K]>;
};

export type ServerMethodDefinition<T> = T extends RpcDefinition<
  infer Req,
  infer Res,
  infer IsReqStream,
  infer IsResStream
>
  ? IsResStream extends true
    ? IsReqStream extends true
      ? (req: ServerRequestStream<Req>, res: ServerResponseStream<Res>) => void
      : (req: Req, res: ServerResponseStream<Res>) => void
    : IsReqStream extends true
    ? (req: ServerRequestStream<Req>) => Promise<Res>
    : (req: Req) => Promise<Res>
  : never;

export type ServerDefinition<T extends object> = {
  [K in keyof T]: ServerMethodDefinition<T[K]>;
};

export interface Definition {
  [method: string]: RpcDefinition<object, object, boolean, boolean>;
}

export function createDefinition<T extends Definition>(fn: (rpc: RpcDefinitionFn) => T): T {
  return fn((defn: any = {}) => ({
    reqStream: defn.reqStream === undefined ? false : defn.reqStream,
    resStream: defn.resStream === undefined ? false : defn.resStream,
  }));
}
