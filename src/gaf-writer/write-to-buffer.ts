import { GafWriter } from ".";
import { GafEntry, GafFrameData, GafFrameDataSingleLayer, GafLayerDataPaletteIndices, GafLayerDataRawColors, GafResult } from "../gaf-types";
import { BufferUtils, ENTRY_STRUCT_IO, ENTRY_STRUCT_SIZE, FRAME_DATA_STRUCT_IO, FRAME_DATA_STRUCT_SIZE, FRAME_STRUCT_IO, FRAME_STRUCT_SIZE, FrameDataStruct, HEADER_STRUCT_IO, HEADER_STRUCT_SIZE } from "../internals";
import { compressLayerData } from "./compress-layer-data";
import { WritingContext } from "./writing-context";

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

  const base = {
    width: frameData.width,
    height: frameData.height,
    xPos: frameData.xOffset,
    yPos: frameData.yOffset,
    transparencyIdx: frameData.transparencyIndex,
    unknown2: frameData.unknown2,
    unknown3: frameData.unknown3,
  } as const;

  if (frameData.kind === 'single') {
    const { ptrFrameData, compressionFlag } = writeSingleLayerData(ctx, frameData);

    const frameDataStruct: FrameDataStruct = {
      ...base,
      compressed: compressionFlag,
      framePointers: 0,
      ptrFrameData,
    };

    FRAME_DATA_STRUCT_IO.write(frameDataBufferView, 0, frameDataStruct);

    return currentPosition;
  }

  // \/ this means the list of pointers to sub-layers will come right after the frame data itself
  const ptrFrameData = ctx.getCurrentSize();

  // TODO Find out if this \/ isn't reason for the crash when rebuilding everything
  /*
  what happens to the other stuff (like width, height, etc) when framePointers is not 0?
  aka when there are sub-layers? TODO: find out ;)
  ANSWER: it LOOKS like it uses the same stuff (width, height, etc) from its first sub-frame...
  but perhaps these things can be just ignored? TODO find out ;)
  because if they can be ignored, i can just fill them in with "0"s. otherwise, i'll probably
  need to change the type "GafFrameDataMultiLayer" to also include all the properties from
  "GafFrameDataSingleLayer"
  */
  const frameDataStruct: FrameDataStruct = {
    // most data from 'base' PROBABLY doesn't matter since this is a multi-layered frameData
    ...base,
    compressed: 0, // probably CANNOT matter since ptrFrameData doesn't point to data
    framePointers: frameData.layers.length, // <-- matters
    ptrFrameData,                           // <-- matters
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

type WrittenLayerData = {
  ptrFrameData: number;
  compressionFlag: number;
};

function writeSingleLayerData(
  ctx: WritingContext,
  frameData: GafFrameDataSingleLayer,
): WrittenLayerData {
  if (frameData.layerData.kind === 'palette-idx') { // aka regular .gaf
    return writeSingleLayerDataOfPalette(
      ctx,
      frameData.layerData,
      frameData.width,
      frameData.transparencyIndex,
    );
  }
  // else: 'raw-colors' aka .taf

  return writeSingleLayerDataOfColors(ctx, frameData.layerData);
}

function writeSingleLayerDataOfPalette(
  ctx: WritingContext,
  layerData: GafLayerDataPaletteIndices,
  width: number,
  transparencyIdx: number,
): WrittenLayerData {
  ctx.validateFormat('palette-idx');

  const cachedLayerData = ctx.layerDataCache.get(layerData, width);

  // the layerData.kind verification is PURELY for type narrowing
  if (cachedLayerData !== undefined && cachedLayerData.layerData.kind === 'palette-idx') {
    return {
      ptrFrameData: cachedLayerData.offset,
      compressionFlag: cachedLayerData.layerData.decompressed ? 1 : 0,
    };
  }

  const currentPosition = ctx.getCurrentSize();
  const compressionFlag = layerData.decompressed ? 1 : 0;

  if (compressionFlag === 1) {
    const compressedIndices = compressLayerData(layerData.indices, width, transparencyIdx);
    ctx.pushSegment(compressedIndices);
  }
  else {
    ctx.pushSegment(layerData.indices);
  }

  ctx.layerDataCache.set(currentPosition, layerData, width);

  return {
    ptrFrameData: currentPosition,
    compressionFlag,
  };
}

function writeSingleLayerDataOfColors(
  ctx: WritingContext,
  layerData: GafLayerDataRawColors,
): WrittenLayerData {
  ctx.validateFormat('raw-colors');
  ctx.validateRawColorsFormat(layerData.colorData.format);

  const compressionFlag = layerData.colorData.format === 'argb4444' ? 4 : 5;

  const cachedLayerData = ctx.layerDataCache.get(layerData);

  if (cachedLayerData !== undefined) {
    return {
      ptrFrameData: cachedLayerData.offset,
      compressionFlag,
    };
  }

  const currentPosition = ctx.getCurrentSize();
  ctx.pushSegment(layerData.colorData.bytes);

  ctx.layerDataCache.set(currentPosition, layerData);

  return {
    ptrFrameData: currentPosition,
    compressionFlag,
  };
}
