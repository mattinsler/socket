import { EventEmitter } from 'events';

import { RpcError } from './errors';
import { Event0, Event1, EventEmitterMethods } from '../types';

type ClientResponseStreamEvents<Message extends object> = Event0<'end'> &
  Event1<'message', Message> &
  Event1<'error', RpcError<string>>;

export interface ClientResponseStream<Message extends object>
  extends ClientResponseStreamEvents<Message>,
    EventEmitterMethods {}

export function createClientResponseStream<Message extends object>(): ClientResponseStream<Message> {
  return new EventEmitter();
}
