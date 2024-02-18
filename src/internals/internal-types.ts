import { DeepReadonly } from 'ts-essentials';

export type U8 = number;
export type U16 = number;
export type U32 = number;
export type CharBuffer<TLength extends number = number> = Uint8Array;

type StructValue =
  | U8
  | U16
  | U32
  | CharBuffer;

export type Struct<T extends Record<string, StructValue> = {}> = DeepReadonly<T>;
