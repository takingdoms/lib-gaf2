import { CharBuffer } from './internal-types';

export module BufferUtils {
  export function createView(buffer: Uint8Array | Uint16Array | Uint32Array): DataView {
    return new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
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

    const slice = new Uint8Array(view.buffer, 0, nullTerminatedLength);
    return textDecoder.decode(slice);
  }

  const textEncoder = new TextEncoder();

  export function writeString<T extends number>(
    string: string,
    maxLength: T,
  ): CharBuffer<T> {
    const data = textEncoder.encode(string);

    if (data.length === maxLength) {
      data[maxLength - 1] = 0; // null termination char
      return data;
    }

    if (data.length > maxLength) {
      // TODO warn that the string will be cut-off?
    }

    const charBuffer: CharBuffer<T> = new Uint8Array(maxLength);

    charBuffer.set(data, 0);
    charBuffer[maxLength - 1] = 0; // null termination char

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
