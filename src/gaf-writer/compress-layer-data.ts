export function compressLayerData(
  data: Uint8Array,
  width: number,
  transparencyIdx: number,
): Uint8Array {
  const output = new OutputStream();

  let cursor = 0;

  while (true) {
    const nextRow = data.subarray(cursor, cursor + width);
    cursor += nextRow.length;

    if (nextRow.length === 0) {
      break; // it's over
    }

    if (nextRow.length !== width) {
      throw new Error(`Not enough bytes for next row.`);
    }

    const compressedRow = compressRow(nextRow, transparencyIdx);

    output.writeUint16LE(compressedRow.length);
    output.writeBytes([...compressedRow]);
  }

  return new Uint8Array(output.data);
}

function compressRow(input: Uint8Array, transparencyIdx: number): Uint8Array {
  const output = new OutputStream();

  let byteBuffer: number[] = [];

  let rleInfo = nextRleInfo(input);

  // if the row is completely transparent, skip writing it altogether
  if (rleInfo.value === transparencyIdx && rleInfo.cursor === input.length) {
    return output.toUint8Array();
  }

  while (rleInfo.runLength > 0) {
    if (rleInfo.value === transparencyIdx) {
      dumpAllBuffer(byteBuffer, output);
      byteBuffer = [];
      rleInfo.runLength = encodeTransparencyRun(rleInfo.runLength, output);

      if (rleInfo.runLength > 0) {
        continue;
      }
    }
    else if ((byteBuffer.length === 0 && rleInfo.runLength === 2) || rleInfo.runLength >= 3) {
      dumpAllBuffer(byteBuffer, output);
      byteBuffer = [];
      rleInfo.runLength = encodeValueRun(rleInfo.value, rleInfo.runLength, output);

      if (rleInfo.runLength > 0) {
        continue;
      }
    }
    else {
      for (let i = 0; i < rleInfo.runLength; i++) {
        byteBuffer.push(rleInfo.value);
      }
    }

    rleInfo = nextRleInfo(input, rleInfo.cursor);
  }

  dumpAllBuffer(byteBuffer, output);
  return output.toUint8Array();
}

function dumpAllBuffer(byteBuffer: number[], output: OutputStream): void {
  for (let i = 0; i < byteBuffer.length; i += 64) {
    const count = Math.min(64, byteBuffer.length - i);
    const firstByte = castToByte((count - 1) << 2);
    output.writeByte(firstByte);
    for (let j = 0; j < count; j++) {
      output.writeByte(byteBuffer[i + j]);
    }
  }
}

function encodeTransparencyRun(runLength: number, output: OutputStream) {
  const count = Math.min(runLength, 127);
  const firstByte = castToByte((count << 1) | 1); // replace "| 1" with "| TRANSPARENCY_MASK" ?
  output.writeByte(firstByte);
  return runLength - count;
}

function encodeValueRun(value: number, runLength: number, output: OutputStream) {
  const count = Math.min(runLength, 64);
  const firstByte = castToByte(((count - 1) << 2) | 2); // replace "| 2" with "| REPEAT_MASK" ?
  output.writeByte(firstByte);
  output.writeByte(value);
  return runLength - count;
}

function nextRleInfo(input: Uint8Array, cursor = 0) {
  if (cursor === input.length) {
    return { value: 0, runLength: 0, cursor };
  }

  const prevValue = input[cursor];
  cursor += 1;

  let count = 1;
  for (cursor; cursor < input.length; cursor++) {
    const newValue = input[cursor];

    if (newValue !== prevValue) {
      return { value: prevValue, runLength: count, cursor };
    }

    count++;
  }

  return { value: prevValue, runLength: count, cursor };
}

function castToByte(num: number) {
  return num & 0xFF;
}

function validateU16(num: number) {
  if (num < 0) {
    throw new Error(`Invalid unsigned integer: "${num}".`);
  }

  if (num > 0xFFFF) {
    throw new Error(`Number "${num}" doesn't fit into 16-bits (2 bytes).`
      + ` Your image is possibly too large?`);
  }
}

class OutputStream {
  constructor(
    private _data: number[] = [],
  ) {}

  get data(): readonly number[] {
    return this._data;
  }

  writeByte(byte: number) {
    this._data.push(byte);
  }

  writeUint16LE(short: number) {
    validateU16(short);

    this._data.push(short & 0xFF);
    this._data.push((short >> 8) & 0xFF);
  }

  writeBytes(bytes: readonly number[]) {
    this._data.push(...bytes);
  }

  toUint8Array() {
    return new Uint8Array(this._data);
  }
}
