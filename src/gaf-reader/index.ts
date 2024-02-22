import { GafEntry, GafResult } from '../gaf-types';
import { BufferLike } from '../internals';
import * as Mapping from './mapping';

export type GafReaderResult = {
  gaf: GafResult;
  map: Mapping.Section[];
};

export type GafReader = (buffer: BufferLike) => GafReaderResult;

export { readFromBuffer } from './read-from-buffer';
export * as Mapping from './mapping';
