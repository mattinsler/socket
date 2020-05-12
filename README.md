# @mattinsler/socket

Easier sockets.

## Usage

#### server.ts

```typescript
import { createListener, tcp } from '@mattinsler/socket';

const listener = createListener([tcp(9000)], (socket) => {
  console.log('== new socket!');
  socket.send(Buffer.from('Hello!'));
  socket.once('disconnected', () => console.log('== disconnected!'));
});

(async () => {
  await listener.listen();
  console.log('Listening in port 9000');
})();
```

#### client.ts

```typescript
import { createSocket, tcp } from '@mattinsler/socket';

const socket = createSocket(tcp(9000));

socket.on('connected', () => console.log('= connected'));
socket.on('connecting', () => console.log('= connecting'));
socket.on('disconnected', () => console.log('= disconnected'));

socket.on('message', (message) => console.log(message.toString()));

(async () => {
  // you can optionally await the first connection
  await socket.connect;
  // this does not work for reconnects, only the first connection
  console.log('CONNECTED');
})();
```
