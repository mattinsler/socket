import { v4 as uuid } from 'uuid';
import { EventEmitter } from 'events';

import { InitialMessage } from './initial-message';
import { Connection, InitialMessageOptions, Message, Socket } from './types';

const debug = require('debug')('socket');

export class AcceptorSocket extends EventEmitter implements Socket {
  private readonly _connection: Connection;

  private _initialMessage?: InitialMessageOptions;

  readonly id = uuid();

  constructor(connection: Connection) {
    super();

    this._connection = connection;

    connection.on('connected', () => this.emit('connected'));
    connection.on('disconnected', () => this.emit('disconnected'));

    connection.on('message', this._onMessage);
  }

  private _onMessage = (buffer: Buffer) => {
    debug('message', buffer);

    if (!this._initialMessage) {
      [this._initialMessage, buffer] = InitialMessage.read(buffer);
    }

    if (buffer.byteLength) {
      this.emit('message', buffer);
    }
  };

  get connect(): Promise<Socket> {
    return Promise.resolve(this);
  }

  get connected(): boolean {
    return this.connected;
  }

  get connecting(): boolean {
    return this.connecting;
  }

  get disconnected(): boolean {
    return this.disconnected;
  }

  get initialMessage(): InitialMessageOptions {
    return this._initialMessage || {};
  }

  ref() {
    this._connection.ref();
    return this;
  }

  unref() {
    this._connection.unref();
    return this;
  }

  disconnect() {
    return this._connection.disconnect();
  }

  send(message: Message) {
    debug('send', message);
    return this._connection.send(message);
  }
}
