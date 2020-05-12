import { Socket, Transport } from './types';
import { ConnectorSocket, CreateSocketOptions } from './connector-socket';

export function createSocket(transport: Transport, options: CreateSocketOptions = {}): Socket {
  return new ConnectorSocket(transport.connector(), options);
}
