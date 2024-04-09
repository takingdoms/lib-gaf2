import { DeepReadonly } from 'ts-essentials';

export type U8 = number;
export type I8 = number;
export type U16 = number;
export type I16 = number;
export type U32 = number;
export type I32 = number;

export type CharBuffer<TLength extends number = number> = Uint8Array;

type StructValue =
  | U8
  | I8
  | U16
  | I16
  | U32
  | I32
  | CharBuffer;

export type Struct<T extends Record<string, StructValue> = {}> = DeepReadonly<T>;
