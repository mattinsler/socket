export const Message = {
  create(value: Buffer): Buffer {
    const header = Buffer.alloc(4);
    header.writeUInt32BE(value.byteLength);
    return Buffer.concat([header, value]);
  },

  // returns [next message, remaining buffer]
  read(value: Buffer): [Buffer | null, Buffer] {
    if (value.byteLength >= 4) {
      const length = value.readUInt32BE();
      if (value.byteLength >= 4 + length) {
        const message = value.slice(4, 4 + length);
        return [message, value.slice(4 + length)];
      }
    }

    return [null, value];
  },
};
