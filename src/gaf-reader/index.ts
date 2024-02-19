import { GafEntry } from '@/gaf-types';
import { BufferLike } from '@/internals';
import * as Mapping from './mapping';

export type GafReaderResult = {
  entries: GafEntry[];
  map: Mapping.Section[];
};

export type GafReader = (buffer: BufferLike) => GafReaderResult;

export { readFromBuffer } from './read-from-buffer';
export * as Mapping from './mapping';
