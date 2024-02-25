import { CharBuffer } from './internal-types';

export namespace BufferUtils {
  export function createView(buffer: Uint8Array | Uint16Array | Uint32Array): DataView {
    return new DataView(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength,
    );
  }

  export function createViewSlice(
    buffer: Uint8Array | Uint16Array | Uint32Array,
    offset: number,
    length: number,
  ): DataView {
    return new DataView(
      buffer.buffer,
      buffer.byteOffset + offset,
      length,
    );
  }

  export function copyBytes(view: DataView, offset: number, length: number): Uint8Array {
    const slice = view.buffer.slice(
      view.byteOffset + offset,
      view.byteOffset + offset + length,
    );

    return new Uint8Array(slice);
  }

  export function createSlice(buffer: Uint8Array, offset: number, length: number): Uint8Array {
    return buffer.slice(
      buffer.byteOffset + offset,
      buffer.byteOffset + offset + length,
    );
  }

  const textDecoder = new TextDecoder('ascii');

  export function readString<T extends number>(
    data: CharBuffer<T>,
    maxLength: T,
  ): string {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let nullTerminatedLength = 0;

    for (let i = 0; i < maxLength; i++) {
      nullTerminatedLength = i;
      const nextByte = view.getUint8(i);
      if (nextByte === 0)
        break;
    }

    const slice = new Uint8Array(view.buffer, view.byteOffset, nullTerminatedLength);
    return textDecoder.decode(slice);
  }

  const textEncoder = new TextEncoder();

  export function writeString<T extends number>(
    string: string,
    maxLength: T,
  ): CharBuffer<T> {
    const data = textEncoder.encode(string);

    if (data.length === maxLength) {
      data[maxLength - 1] = 0; // null terminator
      return data;
    }

    if (data.length > maxLength) {
      const result = data.slice(0, maxLength);
      result[maxLength - 1] = 0; // null terminator

      console.warn(`String is being cut off!`);
      console.warn(`Before: ${textDecoder.decode(data)}`);
      console.warn(`After: ${textDecoder.decode(result)}`)

      return result;
    }

    const charBuffer: CharBuffer<T> = new Uint8Array(maxLength);

    charBuffer.set(data, 0);
    charBuffer[maxLength - 1] = 0; // null terminator

    return charBuffer;
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
