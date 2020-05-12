import { AcceptorSocket } from './acceptor-socket';
import { Connection, Listener, Socket, Transport } from './types';

export function createListener(transports: Transport[], onSocket?: (socket: Socket) => unknown): Listener {
  const sockets: { [id: string]: Socket } = {};
  const acceptors = transports.map((t) => t.acceptor());

  function onConnection(connection: Connection) {
    const socket = new AcceptorSocket(connection);
    sockets[socket.id] = socket;
    socket.once('disconnected', () => {
      delete sockets[socket.id];
    });

    onSocket && onSocket(socket);
  }

  return {
    async listen() {
      await Promise.all(acceptors.map((a) => a.listen(onConnection)));
    },

    async shutdown() {
      await Promise.all(acceptors.map((a) => a.shutdown()));
    },
  };
}
