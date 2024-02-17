import { GafEntry } from "../gaf-types";

export type GafWriterResult = {
  buffer: Uint8Array;
};

export type GafWriter = (entries: GafEntry[]) => GafWriterResult;

export const writeToBuffer: GafWriter = (entries) => {
  throw 'TODO';
};
