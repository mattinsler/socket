import { v4 as uuid } from 'uuid';

import { Socket } from '../types';
import { RpcError } from './errors';
import {
  MESSAGE_TYPE,
  Serdes,
  StreamMessageData,
  StreamMessageInitialData,
  StreamMessage,
  StreamMessageError,
} from './types';

export interface ClientRequestStream<Message extends object> {
  end(): Promise<void>;
  error(err: RpcError): Promise<void>;
  send(message: Message | RpcError): Promise<void>;
}

export function createClientRequestStream<Message extends object>({
  method,
  serdes,
  socket,
  stream,
}: {
  method: string;
  serdes: Serdes;
  socket: Socket;
  stream: string;
}): ClientRequestStream<Message> {
  let firstMessage = true;

  return {
    end() {
      return socket.disconnect();
    },
    error(err: RpcError) {
      if (firstMessage) {
        throw new Error(`Cannot have first message of a stream be an error`);
      }

      const message = {
        id: uuid(),
        stream,
        error: {
          code: err.code,
          message: err.message,
        },
      } as StreamMessageError;

      return socket.send(Buffer.concat([Buffer.from([MESSAGE_TYPE.STREAM_REQUEST]), serdes.serialize(message)]));
    },
    send(data: Message) {
      let message: StreamMessage;

      if (firstMessage) {
        firstMessage = false;
        message = {
          id: uuid(),
          stream,
          method,
          data,
        } as StreamMessageInitialData;
      } else {
        message = {
          id: uuid(),
          stream,
          data,
        } as StreamMessageData;
      }

      return socket.send(Buffer.concat([Buffer.from([MESSAGE_TYPE.STREAM_REQUEST]), serdes.serialize(message)]));
    },
  };
}
