import { v4 as uuid } from 'uuid';
import { EventEmitter } from 'events';

import { Backoff, fibonacci } from './backoff';
import { InitialMessage } from './initial-message';
import { Connection, Connector, Message, Socket, InitialMessageOptions } from './types';

const debug = require('debug')('socket');

export type CreateSocketOptions = InitialMessageOptions;

export class ConnectorSocket extends EventEmitter implements Socket {
  private readonly _connector: Connector;
  private readonly _options: CreateSocketOptions;

  private _backoff: Backoff;
  private _connectPromise: Promise<Socket>;

  private _connected = false;
  private _connecting = true;
  private _connection?: Connection;

  private _unref = false;
  private _shouldReconnect = true;

  readonly id = uuid();
  readonly initialMessage: InitialMessageOptions;

  constructor(connector: Connector, options: CreateSocketOptions) {
    super();

    this._connector = connector;
    this._options = options;
    this._backoff = fibonacci(this._connect, 5000);
    this.initialMessage = options;

    this._connectPromise = new Promise((resolve) => {
      // resolve on first connect
      this.once('connected', () => resolve(this));
    });

    this._backoff.trigger();
  }

  private _connect = () => {
    this._connected = false;
    this._connecting = true;
    this.emit('connecting');

    // start connecting
    const connection = this._connector();

    if (this._unref) {
      connection.unref();
    }

    connection.once('connected', async () => {
      this._backoff.cancel();

      // check shouldReconnect again?

      this._connection = connection;
      connection.on('message', this._onMessage);

      this._connected = true;
      this._connecting = false;
      this.emit('connected');

      // handle initial messages...

      const initialMessage = InitialMessage.create(this._options);

      if (initialMessage.length) {
        await connection.send(initialMessage);
      }

      this._processQueue();
    });
    connection.once('disconnected', () => {
      delete this._connection;
      connection.off('message', this._onMessage);

      this._connected = false;

      if (this._shouldReconnect) {
        this._backoff.trigger();
      } else {
        this.emit('disconnected');
      }
    });
  };

  private _onMessage = (buffer: Buffer) => {
    debug('message', buffer);
    this.emit('message', buffer);
  };

  get connect(): Promise<Socket> {
    return this._connectPromise;
  }

  get connected(): boolean {
    return this._connected;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get disconnected(): boolean {
    return !(this._connected || this._connecting);
  }

  ref() {
    this._unref = false;

    if (this._connection) {
      this._connection.ref();
    }

    return this;
  }

  unref() {
    this._unref = true;

    if (this._connection) {
      this._connection.unref();
    }

    return this;
  }

  disconnect() {
    this._shouldReconnect = false;
    if (this._connection) {
      return this._connection.disconnect();
    } else {
      return Promise.resolve();
    }
  }

  private _queue: {
    message: Message;
    reject: (err: Error) => unknown;
    resolve: () => unknown;
  }[] = [];

  private _processQueue = async () => {
    // if !this._shouldReconnect then reject sends...
    while (this._connection && this._queue.length) {
      const { message, resolve } = this._queue[0];
      try {
        await this._connection.send(message);
        this._queue.shift();
        resolve();
      } catch (err) {
        // what now?
        console.error(err);
      }
    }
  };

  send(message: Message) {
    debug('send', message);

    return new Promise<void>((resolve, reject) => {
      this._queue.push({ message, reject, resolve });
      this._processQueue();
    });
  }
}
