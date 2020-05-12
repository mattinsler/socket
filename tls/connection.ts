import tls from 'tls';
import { EventEmitter } from 'events';

import { Connection } from '../types';

export class TlsConnection extends EventEmitter implements Connection {
  private readonly socket: tls.TLSSocket;

  private _connected = false;

  constructor(socket: tls.TLSSocket) {
    super();

    this.socket = socket;
    this._connected = (socket as any).readyState === 'open';

    socket.once('close', () => {
      this._connected = false;
      this.emit('disconnected');
    });
    socket.once('error', () => {});
    socket.on('data', (buffer) => {
      this.emit('message', buffer);
    });

    if (this.connected) {
      this.emit('connected');
    } else {
      socket.on('connect', () => {
        this._connected = true;
        this.emit('connected');
      });
    }
  }

  get connected(): boolean {
    return this._connected;
  }

  get connecting(): boolean {
    return this.socket.connecting;
  }

  get disconnected(): boolean {
    return !(this.connected || this.connecting);
  }

  ref() {
    this.socket.ref();
    return this;
  }

  unref() {
    this.socket.unref();
    return this;
  }

  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      this.socket.end(() => resolve());
    });
  }

  send(buffer: Buffer): Promise<void> {
    if (!this.connected) {
      throw new Error('Connection is not connected.');
    }
    return new Promise((resolve, reject) => {
      this.socket.write(buffer, (err) => (err ? reject(err) : resolve()));
    });
  }
}
