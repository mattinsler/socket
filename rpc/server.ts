import { v4 as uuid } from 'uuid';

import { Socket } from '../types';
import { RpcError, deserialize as deserializeError } from './errors';
import { JsonSerdes } from './json-serdes';
import {
  MESSAGE_TYPE,
  Serdes,
  StreamMessage,
  UnaryRequest,
  UnaryResponse,
  UnaryResponseError,
  UnaryResponseSuccess,
  isStreamMessageInitialData,
  isStreamMessageData,
  isStreamMessageError,
} from './types';

import { Definition, ServerDefinition } from './definition';
import { ServerRequestStream, createServerRequestStream } from './server-request-stream';
import { ServerResponseStream, createServerResponseStream } from './server-response-stream';

type MethodType = 'bidi' | 'client-stream' | 'server-stream' | 'unary';

function methodType({ reqStream, resStream }: { reqStream: boolean; resStream: boolean }): MethodType {
  if (reqStream && resStream) {
    return 'bidi';
  } else if (reqStream && !resStream) {
    return 'client-stream';
  } else if (!reqStream && resStream) {
    return 'server-stream';
  } else if (!reqStream && !resStream) {
    return 'unary';
  }

  throw new Error();
}

export function createRpcServer<T extends Definition>(
  protocolName: string,
  definition: T,
  creator: (socket: Socket) => ServerDefinition<T>,
  serdes: Serdes = JsonSerdes
): (socket: Socket) => void {
  const methodTypes: { [method: string]: MethodType } = {};
  for (const [methodName, defn] of Object.entries(definition)) {
    methodTypes[[protocolName, methodName].join('|')] = methodType(defn);
  }

  const unaryHandlers: {
    [method: string]: Function;
  } = {};
  const bidiStreams: {
    [stream: string]: {
      req: ServerRequestStream<any>;
      res: ServerResponseStream<any>;
    };
  } = {};

  return (socket: Socket) => {
    const implementation = creator(socket);

    for (const [methodName, handler] of Object.entries(implementation)) {
      const defn = definition[methodName];
      if (defn) {
        const key = [protocolName, methodName].join('|');

        if (defn.reqStream && defn.resStream) {
          // bidiHandlers[key] = () => {
          //   req: createServerRequestStream(),
          //   res: createServerResponseStream({
          //     serdes,
          //     socket,
          //     stream:
          //   })
          // };
        } else if (defn.reqStream && !defn.resStream) {
        } else if (!defn.reqStream && defn.resStream) {
        } else if (!defn.reqStream && !defn.resStream) {
          unaryHandlers[key] = handler;
        }
      }
    }

    socket.on('message', async (message) => {
      const type = message[0];

      if (type === MESSAGE_TYPE.UNARY_REQUEST) {
        const parsed = serdes.deserialize(message.slice(1)) as UnaryRequest;

        const handler = unaryHandlers[parsed.method];
        if (handler) {
          let response: UnaryResponse;

          try {
            const data = await handler(parsed.data);

            response = {
              data,
              id: uuid(),
              replyTo: parsed.id,
            } as UnaryResponseSuccess;
          } catch (err) {
            if (err instanceof RpcError) {
              response = {
                error: {
                  code: err.code,
                  message: err.message,
                },
                id: uuid(),
                replyTo: parsed.id,
              } as UnaryResponseError;
            } else {
              throw err;
            }
          }

          socket.send(Buffer.concat([Buffer.from([MESSAGE_TYPE.UNARY_RESPONSE]), serdes.serialize(response)]));
        } else {
          console.log(`No handler for method "${parsed.method}"`);
        }
      } else if (type === MESSAGE_TYPE.STREAM_REQUEST) {
        const parsed = serdes.deserialize(message.slice(1)) as StreamMessage;

        if (isStreamMessageInitialData(parsed)) {
          if (methodTypes[parsed.method] === 'bidi') {
            bidiStreams[parsed.stream] = {
              req: createServerRequestStream(),
              res: createServerResponseStream({
                serdes,
                socket,
                stream: parsed.stream,
              }),
            };
            bidiStreams[parsed.stream].req.emit('message', parsed.data);
          }
        } else if (isStreamMessageData(parsed)) {
          if (bidiStreams[parsed.stream]) {
            bidiStreams[parsed.stream].req.emit('message', parsed.data);
          }
        } else if (isStreamMessageError(parsed)) {
          if (bidiStreams[parsed.stream]) {
            bidiStreams[parsed.stream].req.emit('error', deserializeError(parsed.error));
          }
        }
      }
    });
  };
}
