import { GafEntry } from '../gaf-types';
import { BufferLike } from '../internals';
import { GafFileMap } from './gaf-file-map';

export type GafReaderResult = {
  entries: GafEntry[];
  map: GafFileMap;
};

export type GafReader = (buffer: BufferLike) => GafReaderResult;

export { readFromBuffer } from './read-from-buffer';
