import { EventEmitter } from 'events';

import { RpcError } from './errors';
import { Event0, Event1, EventEmitterMethods } from '../types';

type ServerRequestStreamEvents<Message extends object> = Event0<'end'> &
  Event1<'message', Message> &
  Event1<'error', RpcError>;

export interface ServerRequestStream<Message extends object>
  extends ServerRequestStreamEvents<Message>,
    EventEmitterMethods {}

export function createServerRequestStream<Message extends object>(): ServerRequestStream<Message> {
  return new EventEmitter();
}
