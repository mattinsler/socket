import { v4 as uuid } from 'uuid';

import { Socket } from '../types';
import { RpcError } from './errors';
import { MESSAGE_TYPE, Serdes, StreamMessageData, StreamMessageError } from './types';

export interface ServerResponseStream<Message extends object> {
  end(): Promise<void>;
  error(err: RpcError): Promise<void>;
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
    error(err: RpcError) {
      const message = {
        id: uuid(),
        stream,
        error: {
          code: err.code,
          message: err.message,
        },
      } as StreamMessageError;

      return socket.send(Buffer.concat([Buffer.from([MESSAGE_TYPE.STREAM_RESPONSE]), serdes.serialize(message)]));
    },
    send(data: Message | RpcError) {
      const message: StreamMessageData = {
        id: uuid(),
        stream,
        data,
      };

      return socket.send(Buffer.concat([Buffer.from([MESSAGE_TYPE.STREAM_RESPONSE]), serdes.serialize(message)]));
    },
  };
}
