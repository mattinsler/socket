import { Options } from './types';
import { Transport } from '../types';

function parseHostAndPort(value: string): Options {
  if (value.startsWith('.') || value.startsWith('/')) {
    return { path: value };
  }

  const match = value.match(/^((?<host>[^:]+):)?(?<port>[0-9]+)$/);
  if (!match) {
    throw new Error();
  }
  return {
    host: match.groups!.host,
    port: Number(match.groups!.port),
  };
}

export function tcp(hostAndPort: string): Transport;
export function tcp(options: Options): Transport;
export function tcp(arg: string | Options): Transport {
  const options = typeof arg === 'string' ? parseHostAndPort(arg) : arg;

  return {
    acceptor() {
      return require('./acceptor').tcpAcceptor(options);
    },
    connector() {
      return require('./connector').tcpConnector(options);
    },
  };
}
