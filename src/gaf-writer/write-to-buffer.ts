import { GafWriter } from ".";
import { GafEntry, GafFrameData, GafFrameDataSingleLayer, GafResult } from "../gaf-types";
import { BufferUtils, ENTRY_STRUCT_IO, ENTRY_STRUCT_SIZE, FRAME_DATA_STRUCT_IO, FRAME_DATA_STRUCT_SIZE, FRAME_STRUCT_IO, FRAME_STRUCT_SIZE, FrameDataStruct, HEADER_STRUCT_IO, HEADER_STRUCT_SIZE } from "../internals";
import { WritingContext } from "./writing-context";

/*type WritingContext = {
  segments: Uint8Array[];
  cursor: number;
};*/

export const writeToBuffer: GafWriter = (gaf: GafResult) => {
  const ctx = new WritingContext();

  writeHeader(ctx, gaf);
  writeEntries(ctx, gaf.entries);

  return {
    buffer: ctx.createFinalBuffer(),
  };
};

function writeHeader(ctx: WritingContext, gaf: GafResult): void {
  const headerBuffer = new Uint8Array(HEADER_STRUCT_SIZE);
  const headerBufferView = BufferUtils.createView(headerBuffer);

  HEADER_STRUCT_IO.write(headerBufferView, 0, {
    idVersion:  gaf.header.idVersion,
    unknown1:   gaf.header.unknown1,
    entries:    gaf.entries.length,
  });

  ctx.pushSegment(headerBuffer);
}

function writeEntries(ctx: WritingContext, entries: GafEntry[]): void {
  const entryPointersBytesLength = entries.length * 4; // 4 = uint32
  const entryPointersBuffer = new Uint8Array(entryPointersBytesLength);

  ctx.pushSegment(entryPointersBuffer);

  const entryPointersBufferView = BufferUtils.createView(entryPointersBuffer);

  for (let entryIdx = 0; entryIdx < entries.length; entryIdx++) {
    const nextEntry = entries[entryIdx];
    const nextEntryPosition = writeEntry(ctx, nextEntry);

    entryPointersBufferView.setUint32(entryIdx * 4, nextEntryPosition, true);
  }
}

function writeEntry(ctx: WritingContext, entry: GafEntry): number {
  const entryBuffer = new Uint8Array(ENTRY_STRUCT_SIZE);
  const entryBufferView = BufferUtils.createView(entryBuffer);

  const nameBuffer = BufferUtils.writeString(entry.name, 32);

  ENTRY_STRUCT_IO.write(entryBufferView, 0, {
    frames:   entry.frames.length,
    unknown1: entry.unknown1,
    unknown2: entry.unknown2,
    name:     nameBuffer,
  });

  const currentPosition = ctx.getCurrentSize();
  ctx.pushSegment(entryBuffer);

  writeFrames(ctx, entry);

  return currentPosition;
}

function writeFrames(ctx: WritingContext, entry: GafEntry): void {
  const frameBuffers: Uint8Array[] = [];

  // 1. create a frame buffer for each frame in the entry and immediately add it to the context's
  // segments (so the frame buffer list is always contiguous)
  for (let i = 0; i < entry.frames.length; i++) {
    const buffer = new Uint8Array(FRAME_STRUCT_SIZE);

    ctx.pushSegment(buffer);
    frameBuffers.push(buffer);
  }

  // 2. fill in the frame structs for each frame buffer created above
  for (let i = 0; i < entry.frames.length; i++) {
    const frame = entry.frames[i];
    const buffer = frameBuffers[i];

    const frameDataPosition = writeFrameData(ctx, frame.frameData);

    const bufferView = BufferUtils.createView(buffer);
    FRAME_STRUCT_IO.write(bufferView, 0, {
      ptrFrameData: frameDataPosition,
      duration: frame.duration,
    });
  }
}

function writeFrameData(ctx: WritingContext, frameData: GafFrameData): number {
  const frameDataBuffer = new Uint8Array(FRAME_DATA_STRUCT_SIZE);
  const frameDataBufferView = BufferUtils.createView(frameDataBuffer);

  const currentPosition = ctx.getCurrentSize();
  ctx.pushSegment(frameDataBuffer);

  if (frameData.kind === 'single') {
    const { ptrFrameData, compressionFlag } = writeSingleLayerData(ctx, frameData);

    const frameDataStruct: FrameDataStruct = {
      width: frameData.width,
      height: frameData.height,
      xPos: frameData.xOffset,
      yPos: frameData.yOffset,
      transparencyIdx: frameData.transparencyIndex,
      compressed: compressionFlag,
      framePointers: 0,
      unknown2: frameData.unknown2,
      ptrFrameData,
      unknown3: frameData.unknown3,
    };

    FRAME_DATA_STRUCT_IO.write(frameDataBufferView, 0, frameDataStruct);

    return currentPosition;
  }

  /*
  what happens to the other stuff (like width, height, etc) when framePointers is not 0?
  aka when there are sub-layers? TODO: find out ;)
  ANSWER: looks like it uses the same stuff (width, height, etc) from its first sub-frame...
  but perhaps these things can be just ignred? TODO find out ;)
  because if they can be ignored, i can jsut fill them in with "0"s. otherwise, i'll probably
  need to change the type "GafFrameDataMultiLayer" to also include all the properties from
  "GafFrameDataSingleLayer"
  */
  // \/ this means the list of pointers to sub-layers will come right after the frame data itself
  const ptrFrameData = ctx.getCurrentSize();

  const frameDataStruct: FrameDataStruct = {
    // most data here PROBABLY doesn't matter since this is a multi-layered frameData
    width: 0,
    height: 0,
    xPos: 0,
    yPos: 0,
    transparencyIdx: 0,
    compressed: 0,
    framePointers: frameData.layers.length, // <-- matters
    unknown2: 0,
    ptrFrameData,                           // <-- matters
    unknown3: 0,
  };

  FRAME_DATA_STRUCT_IO.write(frameDataBufferView, 0, frameDataStruct);

  const subLayerPointersBytesLength = frameData.layers.length * 4; // 4 = uint32
  const subLayerPointersBuffer = new Uint8Array(subLayerPointersBytesLength);

  ctx.pushSegment(subLayerPointersBuffer);

  const entryPointersBufferView = BufferUtils.createView(subLayerPointersBuffer);

  for (let subLayerIdx = 0; subLayerIdx < frameData.layers.length; subLayerIdx++) {
    const nextSubLayer = frameData.layers[subLayerIdx];
    const nextSubLayerPosition = writeFrameData(ctx, nextSubLayer);

    entryPointersBufferView.setUint32(subLayerIdx * 4, nextSubLayerPosition, true);
  }

  return currentPosition;
}

const NEVER_COMPRESS: boolean = true;

function writeSingleLayerData(
  ctx: WritingContext,
  frameData: GafFrameDataSingleLayer,
): {
  ptrFrameData: number;
  compressionFlag: number;
} {
  const currentPosition = ctx.getCurrentSize();
  let compressionFlag: number;

  const layerData = frameData.layerData;

  if (layerData.kind === 'palette-idx') { // aka regular .gaf
    ctx.validateFormat('palette-idx');

    if (layerData.decompressed && !NEVER_COMPRESS) { // TODO
      compressionFlag = 1;

      const buffer = compressLayerData(layerData.indices, frameData);
      ctx.pushSegment(buffer);
    }
    else {
      compressionFlag = 0;

      ctx.pushSegment(layerData.indices);
    }
  }
  else { // 'raw-colors' aka .taf
    const colorData = layerData.colorData;
    compressionFlag = colorData.format === 'argb4444' ? 4 : 5;

    ctx.validateFormat('raw-colors');
    ctx.validateRawColorsFormat(colorData.format);
    ctx.pushSegment(colorData.bytes);
  }

  return {
    ptrFrameData: currentPosition,
    compressionFlag,
  };
}

const TRANSPARENCY_MASK = 0x01;
const REPEAT_MASK = 0x02;

function compressLayerData(
  indices: Uint8Array,
  frameData: GafFrameDataSingleLayer,
): Uint8Array {
  console.log(`COMPRESSING LAYER DATA!`);
  throw 'TODO compress layer data';
  /*const { width, height, transparencyIndex: transparencyIdx } = frameData;
  const compressedData: number[] = [];

  for (let y = 0; y < height; y++) {
    let x = 0;
    let count = 0;
    let lineData: number[] = [];

    while (x < width) {
      let transparentCount = 0;
      while (x < width && indices[x + y * width] === transparencyIdx && transparentCount < 0x7FFF) {
        transparentCount++;
        x++;
      }
      if (transparentCount > 0) {
        lineData.push((transparentCount << 1) | TRANSPARENCY_MASK);
        count++;
      }

      let repeatCount = 0;
      while (x < width - 1 && indices[x + y * width] === indices[x + 1 + y * width] && repeatCount < 0x3FFF) {
        repeatCount++;
        x++;
      }
      if (repeatCount > 0) {
        lineData.push((repeatCount << 2) | REPEAT_MASK);
        lineData.push(indices[x + y * width]);
        count += 2;
        x++;
      }

      let uniqueCount = 0;
      while (x < width && (uniqueCount < 0x3FFF && (x === 0 || indices[x + y * width] !== indices[x - 1 + y * width]))) {
        uniqueCount++;
        x++;
      }
      if (uniqueCount > 0) {
        lineData.push((uniqueCount << 2) | 0);
        for (let i = x - uniqueCount; i < x; i++) {
          lineData.push(indices[i + y * width]);
        }
        count += 2 + uniqueCount;
      }
    }

    compressedData.push(count & 0xFF);
    compressedData.push((count >> 8) & 0xFF);
    compressedData.push(...lineData);
  }

  return new Uint8Array(compressedData);*/
}
