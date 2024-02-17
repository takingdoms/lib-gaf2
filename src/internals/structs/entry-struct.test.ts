import { describe, expect, test } from '@jest/globals';
import { ENTRY_STRUCT_IO, ENTRY_STRUCT_SIZE, EntryStruct } from './entry-struct';
import { BufferUtils } from '../buffer-utils';
import { CharBuffer } from '../internal-types';

describe('entry struct', () => {
  test('should read the correct data', () => {
    const expectedStruct: EntryStruct = {
      frames:   0x1234,     // u16
      unknown1: 0x5678,     // u16
      unknown2: 0x12345678, // u32
      name: { string: 'abcdefghijklmnopqrstuvxwyz', length: 32 },
    };

    const framesBytesU16 = BufferUtils.intToBytesLE(expectedStruct.frames, 2);
    const unknown1BytesU16 = BufferUtils.intToBytesLE(expectedStruct.unknown1, 2);
    const unknown2BytesU32 = BufferUtils.intToBytesLE(expectedStruct.unknown2, 4);
    const charBytes = new Uint8Array(32);

    const charBytesView = BufferUtils.createView(charBytes);
    BufferUtils.writeString(charBytesView, 0, expectedStruct.name);

    const inputBuffer = new Uint8Array([
      ...framesBytesU16,
      ...unknown1BytesU16,
      ...unknown2BytesU32,
      ...charBytes,
    ]);

    expect(inputBuffer.byteLength).toBe(ENTRY_STRUCT_SIZE);

    const inputView = BufferUtils.createView(inputBuffer);
    const actualStruct = ENTRY_STRUCT_IO.read(inputView, 0);

    expect(actualStruct).toMatchObject(expectedStruct);
  });

  test('should write the correct data', () => {
    const struct: EntryStruct = {
      frames:   0x1234,     // u16
      unknown1: 0x5678,     // u16
      unknown2: 0x12345678, // u32
      name: { string: 'abcdefghijklmnopqrstuvxwyz', length: 32 },
    };

    const outputBuffer = new Uint8Array(ENTRY_STRUCT_SIZE);
    const outputView = BufferUtils.createView(outputBuffer);

    ENTRY_STRUCT_IO.write(struct, outputView, 0);

    const framesBytesU16 = outputView.getUint16(0, true);
    const unknown1BytesU16 = outputView.getUint16(2, true);
    const unknown2BytesU32 = outputView.getUint32(4, true);
    const charBytes = BufferUtils.readString(outputView, 8, 32);

    expect(framesBytesU16).toBe(struct.frames);
    expect(unknown1BytesU16).toBe(struct.unknown1);
    expect(unknown2BytesU32).toBe(struct.unknown2);
    expect(charBytes).toMatchObject(struct.name);
  });
});
