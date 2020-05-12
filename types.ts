import { EventEmitter } from 'events';

export type Message = Buffer;

export interface Acceptor {
  listen(onConnection: (connection: Connection) => void): Promise<void>;
  shutdown(): Promise<void>;
}

export interface Connector {
  (): Connection;
}

export interface Transport {
  acceptor(): Acceptor;
  connector(): Connector;
}

export interface Listener {
  listen(): Promise<void>;
  shutdown(): Promise<void>;
}

export interface Event0<Event extends string> {
  addListener(event: Event, listener: () => void): this;
  on(event: Event, listener: () => void): this;
  once(event: Event, listener: () => void): this;
  removeListener(event: Event, listener: () => void): this;
  off(event: Event, listener: () => void): this;
  emit(event: Event): boolean;
  prependListener(event: Event, listener: () => void): this;
  prependOnceListener(event: Event, listener: () => void): this;
}

export interface Event1<Event extends string, Type> {
  addListener(event: Event, listener: (arg: Type) => void): this;
  on(event: Event, listener: (arg: Type) => void): this;
  once(event: Event, listener: (arg: Type) => void): this;
  removeListener(event: Event, listener: (arg: Type) => void): this;
  off(event: Event, listener: (arg: Type) => void): this;
  emit(event: Event, arg: Type): boolean;
  prependListener(event: Event, listener: (arg: Type) => void): this;
  prependOnceListener(event: Event, listener: (arg: Type) => void): this;
}

export type EventEmitterMethods = Pick<
  EventEmitter,
  | 'eventNames'
  | 'getMaxListeners'
  | 'listeners'
  | 'listenerCount'
  | 'rawListeners'
  | 'removeAllListeners'
  | 'setMaxListeners'
>;

type ConnectionEvents = Event0<'connected'> & Event0<'disconnected'> & Event1<'message', Buffer>;

export interface Connection extends ConnectionEvents, EventEmitterMethods {
  readonly connected: boolean;
  readonly connecting: boolean;
  readonly disconnected: boolean;

  ref(): Connection;
  unref(): Connection;

  disconnect(): Promise<void>;
  send(buffer: Buffer): Promise<void>;
}

export interface InitialMessageOptions {
  // sends this object as the first packet after connection
  authorization?: string;
}

type SocketEvents = Event0<'connecting'> & Event0<'connected'> & Event0<'disconnected'> & Event1<'message', Message>;

export interface Socket extends SocketEvents, EventEmitterMethods {
  readonly id: string;

  readonly connected: boolean;
  readonly connecting: boolean;
  readonly disconnected: boolean;
  readonly initialMessage: InitialMessageOptions;

  readonly connect: Promise<Socket>;

  ref(): Socket;
  unref(): Socket;

  disconnect(): Promise<void>;
  send(message: Message): Promise<void>;
}
