export const MESSAGE_TYPE = {
  UNARY_REQUEST: 1,
  UNARY_RESPONSE: 2,
  STREAM_REQUEST: 3,
  STREAM_RESPONSE: 4,
};

export interface UnaryRequest {
  id: string;
  method: string;
  data: object;
}

export interface UnaryResponseError {
  id: string;
  replyTo: string;
  error: {
    code: string;
    message: string;
  };
}
export interface UnaryResponseSuccess {
  id: string;
  replyTo: string;
  data: object;
}
export type UnaryResponse = UnaryResponseError | UnaryResponseSuccess;

export function isUnaryResponseError(value: UnaryResponse): value is UnaryResponseError {
  return !!(value as UnaryResponseError).error;
}
export function isUnaryResponseSuccess(value: UnaryResponse): value is UnaryResponseSuccess {
  return !!(value as UnaryResponseSuccess).data;
}

export interface StreamMessageError {
  id: string;
  stream: string;
  error: {
    code: string;
    message: string;
  };
}
export interface StreamMessageData {
  id: string;
  stream: string;
  data: object;
}
export interface StreamMessageInitialData {
  id: string;
  stream: string;
  method: string;
  data: object;
}
export type StreamMessage = StreamMessageError | StreamMessageData | StreamMessageInitialData;

export function isStreamMessageError(value: StreamMessage): value is StreamMessageError {
  return !!(value as StreamMessageError).error;
}
export function isStreamMessageData(value: StreamMessage): value is StreamMessageData {
  return !!(value as StreamMessageData).data;
}
export function isStreamMessageInitialData(value: StreamMessage): value is StreamMessageInitialData {
  return isStreamMessageData(value) && !!(value as StreamMessageInitialData).method;
}

export interface Serdes {
  deserialize<T>(value: Buffer): T;
  serialize<T>(value: T): Buffer;
}
