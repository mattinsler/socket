import tls from 'tls';

import { Options } from './types';
import { Connector } from '../types';
import { TlsConnection } from './connection';

export function tlsConnector(options: Options): Connector {
  return () => new TlsConnection(tls.connect(options));
}
