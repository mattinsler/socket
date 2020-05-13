import { InitialMessageOptions } from './types';

const PREAMBLE = Buffer.from([0, 1, 2, 3]);

const TYPES = {
  1: 'AUTHORIZATION',
  AUTHORIZATION: 1,
};

function initialMessageOptionsFromMessages(messages: Buffer[]): InitialMessageOptions {
  const options: InitialMessageOptions = {};

  for (const message of messages) {
    switch (message[0]) {
      case TYPES.AUTHORIZATION:
        options.authorization = message.slice(1).toString();
        break;
    }
  }

  return options;
}

function messagesFromInitialMessageOptions(options: InitialMessageOptions): Buffer[] {
  const messages: Buffer[] = [];

  if (options.authorization) {
    messages.push(Buffer.concat([Buffer.from([TYPES.AUTHORIZATION]), Buffer.from(options.authorization)]));
  }

  return messages;
}

export const InitialMessage = {
  PREAMBLE,
  TYPES,

  create(options: InitialMessageOptions): Buffer {
    const messages = messagesFromInitialMessageOptions(options);
    if (messages.length === 0) {
      return Buffer.allocUnsafe(0);
    }

    // 1 byte                   : number of messages
    // 2 bytes for each message : length of message
    const initialMessage = Buffer.allocUnsafe(1 + 2 * messages.length);

    initialMessage.writeUInt8(messages.length);
    messages.forEach((buffer, idx) => {
      initialMessage.writeUInt16BE(buffer.byteLength, 1 + idx * 2);
    });

    return Buffer.concat([PREAMBLE, initialMessage, ...messages]);
  },

  read(buffer: Buffer): [InitialMessageOptions, Buffer] {
    if (buffer.slice(0, PREAMBLE.length).compare(PREAMBLE) !== 0) {
      return [{}, buffer];
    }

    const numMessages = buffer.readUInt8(PREAMBLE.length);
    const messageLengths = new Array(numMessages)
      .fill(0)
      .map((_, idx) => buffer.readUInt16BE(PREAMBLE.length + 1 + 2 * idx));

    let start = PREAMBLE.length + 1 + 2 * numMessages;
    const options = initialMessageOptionsFromMessages(
      messageLengths.map((len) => {
        const msg = buffer.slice(start, start + len);
        start += len;
        return msg;
      })
    );

    return [options, buffer.slice(start)];
  },
};
