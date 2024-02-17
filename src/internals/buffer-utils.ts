import { CharBuffer } from './internal-types';

export module BufferUtils {
  const textDecoder = new TextDecoder('ascii');

  export function readString<T extends number>(
    buffer: DataView,
    offset: number,
    maxLength: T,
  ): CharBuffer<T> {
    let nullTerminatedLength = 0;

    for (let i = 0; i < maxLength; i++) {
      nullTerminatedLength = i;
      const nextByte = buffer.getUint8(offset + i);
      if (nextByte === 0)
        break;
    }

    const slice = new Uint8Array(buffer.buffer, offset, nullTerminatedLength);
    return {
      string: textDecoder.decode(slice),
      length: maxLength,
    };
  }

  export function createView(buffer: Uint8Array | Uint16Array | Uint32Array): DataView {
    return new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  }

  const textEncoder = new TextEncoder();

  export function writeString<T extends number>(
    buffer: DataView,
    offset: number,
    charBuffer: CharBuffer<T>,
  ): void {
    const encodedString = textEncoder.encode(charBuffer.string);

    for (let i = 0; i < encodedString.byteLength; i++) {
      buffer.setUint8(offset + i, encodedString[i]);
    }

    buffer.setUint8(offset + encodedString.byteLength, 0); // null-terminate the string
  }

  export function intToBytesLE(num: number, byteLength: number): Uint8Array {
    const maxNum = Math.pow(256, byteLength);
    if (num >= maxNum || num < 0) {
        throw new Error(`Number ${num} cannot fit into ${byteLength} bytes.`);
    }

    const bytes = new Uint8Array(byteLength);
    for (let i = 0; i < byteLength; i++) {
        bytes[i] = (num >> (i * 8)) & 0xff;
    }

    return bytes;
  }
}
