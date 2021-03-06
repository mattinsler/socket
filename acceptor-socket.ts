import { v4 as uuid } from 'uuid';
import { EventEmitter } from 'events';

import { Message } from './message';
import { InitialMessage } from './initial-message';
import { Connection, InitialMessageOptions, Socket } from './types';

const debug = require('debug')('socket');

export class AcceptorSocket extends EventEmitter implements Socket {
  private readonly _connection: Connection;

  private _initialMessage?: InitialMessageOptions;
  private _buffer: Buffer = Buffer.alloc(0);

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
      this._buffer = Buffer.concat([this._buffer, buffer]);
      while (true) {
        const [message, remainder] = Message.read(this._buffer);
        if (message === null) {
          break;
        }

        debug('message', message.byteLength, message);
        this.emit('message', message);

        this._buffer = remainder;
      }
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

  send(value: Buffer) {
    debug('send', value.byteLength, value);
    return this._connection.send(Message.create(value));
  }
}
