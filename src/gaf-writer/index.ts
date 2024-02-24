import { GafResult } from "../gaf-types";

export type GafWriterResult = {
  buffer: Uint8Array;
};

export type GafWriter = (gaf: GafResult) => GafWriterResult;

export { writeToBuffer } from './write-to-buffer';
