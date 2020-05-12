import { v4 as uuid } from 'uuid';

import { Socket } from '../types';
import { RpcError } from './errors';
import { MESSAGE_TYPE, Serdes, StreamMessageData, StreamMessage, StreamMessageError } from './types';

export interface ServerResponseStream<Message extends object> {
  end(): Promise<void>;
  send(message: Message): Promise<void>;
}

export function createServerResponseStream<Message extends object>({
  serdes,
  socket,
  stream,
}: {
  serdes: Serdes;
  socket: Socket;
  stream: string;
}): ServerResponseStream<Message> {
  return {
    end() {
      return socket.disconnect();
    },
    send(data: Message | RpcError<string>) {
      let message: StreamMessage;

      if (data instanceof RpcError) {
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

      return socket.send(Buffer.concat([Buffer.from([MESSAGE_TYPE.STREAM_RESPONSE]), serdes.serialize(message)]));
    },
  };
}
