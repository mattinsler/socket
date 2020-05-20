import net from 'net';

import { TcpConnection } from './connection';
import { Options, isIPOptions } from './types';
import { Acceptor, Connection } from '../types';

export function tcpAcceptor(options: Options): Acceptor {
  const servers: net.Server[] = [];

  return {
    listen(onConnection: (connection: Connection) => void): Promise<void> {
      return new Promise((resolve, reject) => {
        const server = net.createServer((socket) => {
          onConnection(new TcpConnection(socket));
        });
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
