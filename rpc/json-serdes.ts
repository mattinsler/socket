import { Serdes } from './types';

export const JsonSerdes: Serdes = {
  deserialize: <T>(value: Buffer): T => JSON.parse(value.toString('utf-8')),
  serialize: <T>(value: T): Buffer => Buffer.from(JSON.stringify(value), 'utf-8'),
};
