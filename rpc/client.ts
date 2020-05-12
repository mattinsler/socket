import { v4 as uuid } from 'uuid';

import { Socket } from '../types';
import { JsonSerdes } from './json-serdes';
import { RpcError, deserialize as deserializeError } from './errors';
import {
  MESSAGE_TYPE,
  isStreamMessageData,
  isStreamMessageError,
  isUnaryResponseError,
  isUnaryResponseSuccess,
  Serdes,
  StreamMessage,
  UnaryResponse,
  UnaryRequest,
} from './types';

import { ClientDefinition, Definition } from './definition';
import { ClientRequestStream, createClientRequestStream } from './client-request-stream';
import { ClientResponseStream, createClientResponseStream } from './client-response-stream';

export function createRpcClient<T extends Definition>(
  protocolName: string,
  definition: T,
  serdes: Serdes = JsonSerdes
): (socket: Socket) => ClientDefinition<T> {
  const bidis: {
    [stream: string]: {
      req: ClientRequestStream<any>;
      res: ClientResponseStream<any>;
    };
  } = {};
  const unaries: {
    [id: string]: {
      reject: (err: RpcError<string>) => unknown;
      resolve: (value: any) => unknown;
    };
  } = {};

  return (socket: Socket) => {
    socket.on('message', (message) => {
      const type = message[0];

      if (type === MESSAGE_TYPE.UNARY_RESPONSE) {
        const parsed = serdes.deserialize(message.slice(1)) as UnaryResponse;
        const unary = unaries[parsed.replyTo];

        delete unaries[parsed.replyTo];
        if (isUnaryResponseError(parsed)) {
          unary.reject(deserializeError(parsed.error));
        } else if (isUnaryResponseSuccess(parsed)) {
          unary.resolve(parsed.data);
        }
      } else if (type === MESSAGE_TYPE.STREAM_RESPONSE) {
        const parsed = serdes.deserialize(message.slice(1)) as StreamMessage;
        const bidi = bidis[parsed.stream];

        if (isStreamMessageData(parsed)) {
          bidi.res.emit('message', parsed.data);
        } else if (isStreamMessageError(parsed)) {
          bidi.res.emit('error', deserializeError(parsed.error));
        }
      }
    });

    const client: any = {};

    for (const [methodName, config] of Object.entries(definition)) {
      if (config.reqStream && config.resStream) {
        client[methodName] = () => {
          const stream = uuid();
          const req = createClientRequestStream({
            method: [protocolName, methodName].join('|'),
            serdes,
            socket,
            stream,
          });
          const res = createClientResponseStream();
          bidis[stream] = { req, res };
          return [req, res];
        };
      } else if (config.reqStream && !config.resStream) {
        throw new Error('Unsupported');
      } else if (!config.reqStream && config.resStream) {
        throw new Error('Unsupported');
      } else if (!config.reqStream && !config.resStream) {
        client[methodName] = (req: object) =>
          new Promise((resolve, reject) => {
            const id = uuid();
            unaries[id] = { reject, resolve };
            const message: UnaryRequest = {
              id,
              method: [protocolName, methodName].join('|'),
              data: req,
            };

            socket.send(Buffer.concat([Buffer.from([MESSAGE_TYPE.UNARY_REQUEST]), serdes.serialize(message)]));
          });
      }
    }

    return client as ClientDefinition<T>;
  };
}
