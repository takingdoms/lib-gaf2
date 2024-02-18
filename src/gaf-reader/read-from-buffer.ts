import { GafReader } from '.';
import { GafEntry, GafFrame, GafFrameData, GafFrameDataSingleLayer, GafLayerData, GafLayerDataPaletteIndices, GafLayerDataRawColors } from '../gaf-types';
import { BufferUtils, ENTRY_STRUCT_IO, ENTRY_STRUCT_SIZE, FRAME_DATA_STRUCT_IO, FRAME_DATA_STRUCT_SIZE, FRAME_STRUCT_IO, FrameDataStruct, HEADER_STRUCT_IO, HEADER_STRUCT_SIZE } from '../internals';
import { GafFileMap } from './gaf-file-map';

type ReadingContext = {
  data: DataView;
  map: GafFileMap;
};

export const readFromBuffer: GafReader = (buffer) => {
  let bytes = buffer;

  if (Array.isArray(bytes)) {
    bytes = new Uint8Array(bytes)
  }

  const data = BufferUtils.createView(bytes);
  const map: GafFileMap = [];

  const ctx: ReadingContext = {
    data,
    map,
  };

  const entries = readEntries(ctx);

  return {
    entries,
    map,
  };
};

function readEntries(ctx: ReadingContext): GafEntry[] {
  const headerStruct = HEADER_STRUCT_IO.read(ctx.data, 0);
  ctx.map.push({
    label: 'header',
    pos: [0, HEADER_STRUCT_SIZE],
  });

  const entries: GafEntry[] = [];

  for (let i = 0; i < headerStruct.entries; i++) {
    const nextEntryPointerOffset = HEADER_STRUCT_SIZE + (i * 4); // * 4 = Uint32
    const nextEntryPointer = ctx.data.getUint32(nextEntryPointerOffset, true);
    ctx.map.push({
      label: 'entry_pointer',
      pos: [nextEntryPointerOffset, 4], // 4 = Uint32
    });

    const entry = readEntry(ctx, nextEntryPointer);
    entries.push(entry);
  }

  return entries;
}

function readEntry(ctx: ReadingContext, offset: number): GafEntry {
  const entryStruct = ENTRY_STRUCT_IO.read(ctx.data, offset);
  ctx.map.push({
    label: 'entry',
    pos: [offset, ENTRY_STRUCT_SIZE],
  });

  const name = BufferUtils.readString(entryStruct.name, 32);

  const frames: GafFrame[] = [];
  const framesStartOffset = offset + ENTRY_STRUCT_SIZE;

  for (let i = 0; i < entryStruct.frames; i++) {
    const nextFrameOffset = framesStartOffset + (i * FRAME_DATA_STRUCT_SIZE);
    const nextFrameStruct = FRAME_STRUCT_IO.read(ctx.data, nextFrameOffset);
    ctx.map.push({
      label: 'frame',
      pos: [nextFrameOffset, FRAME_DATA_STRUCT_SIZE],
    });

    const frameData = readFrameData(ctx, nextFrameStruct.ptrFrameData);

    frames.push({
      frameData,
      duration: nextFrameStruct.duration,
    });
  }

  return {
    frames,
    name,
  };
}

function readFrameData(ctx: ReadingContext, offset: number): GafFrameData {
  const frameDataStruct = FRAME_DATA_STRUCT_IO.read(ctx.data, offset);
  ctx.map.push({
    label: 'frame_data',
    pos: [offset, FRAME_DATA_STRUCT_SIZE],
  });

  if (frameDataStruct.framePointers === 0) { // then 'ptrFrameData' points to pixel data
    const layerData = readLayerData(ctx, frameDataStruct);

    return {
      kind: 'single',
      width: frameDataStruct.width,
      height: frameDataStruct.height,
      xOffset: frameDataStruct.xPos,
      yOffset: frameDataStruct.yPos,
      transparencyIndex: frameDataStruct.transparencyIdx,
      layerData,
    };
  }

  // if 'framePointers' !== 0 then 'ptrFrameData' points to a list of pointers each pointing to a
  // FRAME_DATA_STRUCT. this list composes the subFrames (layers) of the current frame

  const layers: GafFrameDataSingleLayer[] = [];

  for (let i = 0; i < frameDataStruct.framePointers; i++) {
    const nextPointerOffset = frameDataStruct.ptrFrameData + (i * 4); // * 4 = Uint32
    const nextPointer = ctx.data.getUint32(nextPointerOffset, true);
    ctx.map.push({
      label: 'sub_frame_data_pointer',
      pos: [nextPointerOffset, 4], // 4 = Uint32
    });

    const nextFrameData = readFrameData(ctx, nextPointer);

    if (nextFrameData.kind === 'multi') {
      throw new Error(`MultiLayer frame data cannot contain other MultiLayer frame data.`);
    }

    layers.push(nextFrameData);
  }

  return {
    kind: 'multi',
    layers,
  };
}

function readLayerData(ctx: ReadingContext, frameDataStruct: FrameDataStruct): GafLayerData {
  const { compressed, ptrFrameData, width, height, transparencyIdx } = frameDataStruct;

  if (compressed === 0) {
    return readUncompressedLayerData(ctx, ptrFrameData, width, height);
  }

  if (compressed === 1) {
    return readCompressedLayerData(ctx, ptrFrameData, width, height, transparencyIdx);
  }

  if (compressed === 4) {
    return readRawColors(ctx, ptrFrameData, width, height, 'argb4444');
  }

  if (compressed === 5) {
    return readRawColors(ctx, ptrFrameData, width, height, 'argb1555');
  }

  throw new Error(`Unknown compression flag: ${compressed}`);
}

function readUncompressedLayerData(
  ctx: ReadingContext,
  offset: number,
  width: number,
  height: number,
): GafLayerDataPaletteIndices {
  const indices = new Uint8Array(ctx.data.buffer, offset, width * height);

  ctx.map.push({
    label: 'uncompressed_palette_indices',
    pos: [offset, width * height],
  });

  return {
    kind: 'palette-idx',
    decompressed: false,
    indices,
  };
}

const TRANSPARENCY_MASK = 0x01;
const REPEAT_MASK = 0x02;

function readCompressedLayerData(
  ctx: ReadingContext,
  offset: number,
  width: number,
  height: number,
  transparencyIdx: number,
): GafLayerDataPaletteIndices {
  const { data } = ctx;
  const startOffset = offset;

  const indices = new Uint8Array(width * height);
  indices.fill(transparencyIdx);

  const putPixel = (px: number, py: number, color: number) => {
    indices[px + py * width] = color;
  };

  for (let y = 0; y < height; y++) {
    const bytes = data.getUint16(offset, true); // aka lineLength
    offset += 2; // sizeof Uint16

    let count = 0;
    let x = 0;

    while (count < bytes) {
      const mask = data.getUint8(offset + count++);

      if ((mask & TRANSPARENCY_MASK) === TRANSPARENCY_MASK) {
        x += (mask >> 1);
      }
      else if ((mask & REPEAT_MASK) === REPEAT_MASK) {
        let repeat = (mask >> 2) + 1;
        while (repeat--) {
          putPixel(x++, y, data.getUint8(offset + count));
        }
        count++;
      }
      else {
        let read = (mask >> 2) + 1;
        while (read--) {
          putPixel(x++, y, data.getUint8(offset + count++));
        }
      }
    }

    offset += bytes;
  }

  ctx.map.push({
    label: 'compressed_palette_indices',
    pos: [startOffset, width * height],
  });

  return {
    kind: 'palette-idx',
    decompressed: true,
    indices,
  };
}

function readRawColors(
  ctx: ReadingContext,
  offset: number,
  width: number,
  height: number,
  format: GafLayerDataRawColors['colorData']['format'],
): GafLayerDataRawColors {
  // * 2 because each pixel uses 16 bits (as either '4444' or '1555' adds up to 16)
  const bytes = new Uint8Array(ctx.data.buffer, offset, width * height * 2);

  ctx.map.push({
    label: 'raw_colors',
    pos: [offset, width * height * 2],
  });

  return {
    kind: 'raw-colors',
    colorData: {
      bytes,
      format,
    },
  };
}
