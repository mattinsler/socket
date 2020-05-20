import tls from 'tls';

import { TlsConnection } from './connection';
import { Options, isIPOptions } from './types';
import { Acceptor, Connection } from '../types';

export function tlsAcceptor(options: Options): Acceptor {
  const servers: tls.Server[] = [];

  return {
    listen(onConnection: (connection: Connection) => void): Promise<void> {
      return new Promise((resolve, reject) => {
        const server = tls.createServer(
          {
            rejectUnauthorized: false,
          },
          (socket) => {
            onConnection(new TlsConnection(socket));
          }
        );
        server.once('error', (err) => reject(err));
        server.once('listening', () => resolve());

        if (isIPOptions(options)) {
          server.listen(options.port, options.host);
        } else {
          server.listen(options.path);
        }

        servers.push(server);
      });
    },

    async shutdown(): Promise<void> {
      await Promise.all(servers.map((s) => new Promise((resolve) => s.close(() => resolve()))));
    },
  };
}
