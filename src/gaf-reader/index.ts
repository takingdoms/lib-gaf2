import { GafEntry } from "../gaf-types";
import { BufferLike } from "../internals";

export type GafReaderResult = {
  entries: GafEntry[];
};

export type GafReader = (buffer: BufferLike) => GafReaderResult;

export const readFromBuffer: GafReader = (buffer) => {
  throw 'TODO';
};
