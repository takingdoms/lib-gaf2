import { GafReader } from '.';
import { Mapping } from '.';
import { REPEAT_MASK, TRANSPARENCY_MASK } from '../constants';
import { GafEntry, GafFrame, GafFrameData, GafFrameDataSingleLayer, GafHeader, GafLayerData, GafLayerDataPaletteIndices, GafLayerDataRawColors } from '../gaf-types';
import { BufferUtils, HEADER_STRUCT_IO, HEADER_STRUCT_SIZE, ENTRY_STRUCT_IO, ENTRY_STRUCT_SIZE, FRAME_STRUCT_SIZE, FRAME_STRUCT_IO, FRAME_DATA_STRUCT_IO, FRAME_DATA_STRUCT_SIZE, FrameDataStruct, HeaderStruct } from '../internals';

type ReadingContext = {
  data: DataView;
  map: Mapping.Section[];
};

export const readFromBuffer: GafReader = (buffer) => {
  let bytes = buffer;

  if (Array.isArray(bytes)) {
    bytes = new Uint8Array(bytes)
  }

  const data = BufferUtils.createView(bytes);
  const map: Mapping.Section[] = [];

  const ctx: ReadingContext = {
    data,
    map,
  };

  const headerStruct = readHeaderStruct(ctx);
  const header: GafHeader = {
    idVersion: headerStruct.idVersion,
    unknown1: headerStruct.unknown1,
  };

  const entries = readEntries(ctx, HEADER_STRUCT_SIZE, headerStruct.entries);

  return {
    gaf: {
      entries,
      header,
    },
    map,
  };
};

function readHeaderStruct(ctx: ReadingContext): HeaderStruct {
  const headerStruct = HEADER_STRUCT_IO.read(ctx.data, 0);
  ctx.map.push({
    label: 'header',
    content: headerStruct,
    offset: 0,
    length: HEADER_STRUCT_SIZE,
  });

  // TODO verify if the header.idVersion is valid!
  // expected: 0x00010100
  return headerStruct;
}

function readEntries(ctx: ReadingContext, offset: number, entryCount: number): GafEntry[] {
  const entries: GafEntry[] = [];

  for (let i = 0; i < entryCount; i++) {
    const nextEntryPointerOffset = offset + (i * 4); // * 4 = Uint32
    const nextEntryPointer = ctx.data.getUint32(nextEntryPointerOffset, true);
    ctx.map.push({
      label: 'entry_pointer',
      content: nextEntryPointer,
      offset: nextEntryPointerOffset,
      length: 4, // 4 = Uint32
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
    content: entryStruct,
    offset,
    length: ENTRY_STRUCT_SIZE,
  });

  const name = BufferUtils.readString(entryStruct.name, 32);

  const frames: GafFrame[] = [];
  const framesStartOffset = offset + ENTRY_STRUCT_SIZE;

  for (let i = 0; i < entryStruct.frames; i++) {
    const nextFrameOffset = framesStartOffset + (i * FRAME_STRUCT_SIZE);
    const nextFrameStruct = FRAME_STRUCT_IO.read(ctx.data, nextFrameOffset);
    ctx.map.push({
      label: 'frame',
      content: nextFrameStruct,
      offset: nextFrameOffset,
      length: FRAME_STRUCT_SIZE,
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
    unknown1: entryStruct.unknown1,
    unknown2: entryStruct.unknown2,
  };
}

// This doesn't seem to be documented but if the value of 'framePointers' equals 0xFF00
// then the code should behave as if it was equal to 0. Why? I have no idea.
const FRAME_POINTERS_SINGLE = 0xFF00; // aka -256 (int16) or 65280 (uint16)

function readFrameData(ctx: ReadingContext, offset: number): GafFrameData {
  const frameDataStruct = FRAME_DATA_STRUCT_IO.read(ctx.data, offset);
  ctx.map.push({
    label: 'frame_data',
    content: frameDataStruct,
    offset,
    length: FRAME_DATA_STRUCT_SIZE,
  });

  if (
    frameDataStruct.framePointers === 0 ||
    frameDataStruct.framePointers === FRAME_POINTERS_SINGLE
  ) { // then 'ptrFrameData' points to pixel data
    const layerData = readLayerData(ctx, frameDataStruct);

    return {
      kind: 'single',
      width: frameDataStruct.width,
      height: frameDataStruct.height,
      xOffset: frameDataStruct.xPos,
      yOffset: frameDataStruct.yPos,
      transparencyIndex: frameDataStruct.transparencyIdx,
      layerData,
      unknown2: frameDataStruct.unknown2,
      unknown3: frameDataStruct.unknown3,
    };
  }

  // if 'framePointers' !== 0 && 'framePointers' !== 0xFF00
  // then 'ptrFrameData' points to a list of pointers each pointing to a FRAME_DATA_STRUCT.
  // this list composes the subFrames (layers) of the current frame

  const layers: GafFrameDataSingleLayer[] = [];

  for (let i = 0; i < frameDataStruct.framePointers; i++) {
    const nextPointerOffset = frameDataStruct.ptrFrameData + (i * 4); // * 4 = Uint32
    const nextPointer = ctx.data.getUint32(nextPointerOffset, true);
    ctx.map.push({
      label: 'sub_frame_data_pointer',
      content: nextPointer,
      offset: nextPointerOffset,
      length: 4, // 4 = Uint32
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
  // const indices = new Uint8Array(ctx.data.buffer, offset, width * height);
  const indices = BufferUtils.copyBytes(ctx.data, offset, width * height);

  ctx.map.push({
    label: 'uncompressed_palette_indices',
    content: Mapping.RawBytes,
    offset,
    length: width * height,
  });

  return {
    kind: 'palette-idx',
    decompressed: false,
    indices,
  };
}

function readCompressedLayerData(
  ctx: ReadingContext,
  offset: number,
  width: number,
  height: number,
  transparencyIdx: number,
): GafLayerDataPaletteIndices {
  const { data } = ctx;
  const startOffset = offset;
  let endOffset = -1; // last offset read from (inclusive); used purely for mapping purposes

  const getUint16 = (at: number) => {
    endOffset = Math.max(endOffset, at + 1); // + 1 because Uint16 reads 2 bytes
    return data.getUint16(at, true);
  };

  const getUint8 = (at: number) => {
    endOffset = Math.max(endOffset, at);
    return data.getUint8(at);
  };

  const indices = new Uint8Array(width * height);
  indices.fill(transparencyIdx);

  const putPixel = (px: number, py: number, color: number) => {
    indices[px + py * width] = color;
  };

  for (let y = 0; y < height; y++) {
    const bytes = getUint16(offset); // aka lineLength
    offset += 2; // sizeof Uint16

    let count = 0;
    let x = 0;

    while (count < bytes) {
      const mask = getUint8(offset + count++);

      if ((mask & TRANSPARENCY_MASK) === TRANSPARENCY_MASK) {
        x += (mask >> 1);
      }
      else if ((mask & REPEAT_MASK) === REPEAT_MASK) {
        let repeat = (mask >> 2) + 1;
        while (repeat--) {
          putPixel(x++, y, getUint8(offset + count));
        }
        count++;
      }
      else {
        let read = (mask >> 2) + 1;
        while (read--) {
          putPixel(x++, y, getUint8(offset + count++));
        }
      }
    }

    offset += bytes;
  }

  if (endOffset !== -1) {
    ctx.map.push({
      label: 'compressed_palette_indices',
      content: Mapping.RawBytes,
      offset: startOffset,
      length: endOffset - startOffset + 1,
    });
  }

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
  // const bytes = new Uint8Array(ctx.data.buffer, offset, width * height * 2);
  const bytes = BufferUtils.copyBytes(ctx.data, offset, width * height * 2);

  ctx.map.push({
    label: 'raw_colors',
    content: Mapping.RawBytes,
    offset,
    length: width * height * 2,
  });

  return {
    kind: 'raw-colors',
    colorData: {
      bytes,
      format,
    },
  };
}

function debugPrintStruct(struct: Record<string, number | Uint8Array>) {
  for (const [field, value] of Object.entries(struct)) {
    if (typeof value === 'number') {
      const hex = '0x' + value.toString(16).toUpperCase().padStart(4, '0');
      console.log(`${field}: ${value} (${hex})`);
    }
    else { // DataView
      console.log(`${field}: [${value.byteLength}]`);
    }
  }
  console.log();
}
