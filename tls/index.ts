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

export function tls(hostAndPort: string): Transport;
export function tls(options: Options): Transport;
export function tls(arg: string | Options): Transport {
  const options = typeof arg === 'string' ? parseHostAndPort(arg) : arg;

  return {
    acceptor() {
      return require('./acceptor').tlsAcceptor(options);
    },
    connector() {
      return require('./connector').tlsConnector(options);
    },
  };
}
