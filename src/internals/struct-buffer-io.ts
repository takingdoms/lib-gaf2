import { Struct } from './internal-types';

export type StructBufferReader<T extends Struct> =
  (buffer: DataView, offset: number) => T;

export type StructBufferWriter<T extends Struct> =
  (buffer: DataView, offset: number, struct: T) => void;

export type StructBufferIO<T extends Struct> = {
  read: StructBufferReader<T>;
  write: StructBufferWriter<T>;
};
