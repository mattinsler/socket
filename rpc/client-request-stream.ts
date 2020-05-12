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
  send(message: Message): Promise<void>;
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
    send(data: Message | RpcError<string>) {
      let message: StreamMessage;

      if (firstMessage) {
        if (data instanceof RpcError) {
          throw new Error(`Cannot have first message of a stream be an error`);
        }
        firstMessage = false;
        message = {
          id: uuid(),
          stream,
          method,
          data,
        } as StreamMessageInitialData;
      } else if (data instanceof RpcError) {
        message = {
          id: uuid(),
          stream,
          error: {
            code: data.code,
            message: data.message,
          },
        } as StreamMessageError;
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
