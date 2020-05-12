import net from 'net';

import { Options } from './types';
import { Connector } from '../types';
import { TcpConnection } from './connection';

export function tcpConnector(options: Options): Connector {
  return () => new TcpConnection(net.connect(options));
}
