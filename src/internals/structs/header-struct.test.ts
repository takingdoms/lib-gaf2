import { describe, expect, test } from '@jest/globals';
import { HeaderStruct, HEADER_STRUCT_SIZE, HEADER_STRUCT_IO } from './header-struct';
import { BufferUtils } from '@/internals/buffer-utils';

describe('header struct', () => {
  test('should read the correct data', () => {
    const expectedStruct: HeaderStruct = {
      idVersion:  0x12345678, // 0~4
      entries:    0xA1B2C3D4, // 4~8
      unknown1:   0xF1F2F3F4, // 8~12
    };

    const idVersionBytesU32 = BufferUtils.intToBytesLE(expectedStruct.idVersion, 4);
    const entriesBytesU32 = BufferUtils.intToBytesLE(expectedStruct.entries, 4);
    const unknown1BytesU32 = BufferUtils.intToBytesLE(expectedStruct.unknown1, 4);

    const inputBuffer = new Uint8Array([
      ...idVersionBytesU32,
      ...entriesBytesU32,
      ...unknown1BytesU32,
    ]);

    expect(inputBuffer.byteLength).toBe(HEADER_STRUCT_SIZE);

    const inputView = BufferUtils.createView(inputBuffer);
    const actualStruct = HEADER_STRUCT_IO.read(inputView, 0);

    expect(actualStruct).toMatchObject(expectedStruct);
  });

  test('should write the correct data', () => {
    const struct: HeaderStruct = {
      idVersion:  0x12345678, // 0~4
      entries:    0xA1B2C3D4, // 4~8
      unknown1:   0xF1F2F3F4, // 8~12
    };

    const outputBuffer = new Uint8Array(HEADER_STRUCT_SIZE);
    const outputView = BufferUtils.createView(outputBuffer);

    HEADER_STRUCT_IO.write(struct, outputView, 0);

    const idVersionBytesU32 = outputView.getUint32(0, true);
    const entriesBytesU32 = outputView.getUint32(4, true);
    const unknown1BytesU32 = outputView.getUint32(8, true);

    expect(idVersionBytesU32).toBe(struct.idVersion);
    expect(entriesBytesU32).toBe(struct.entries);
    expect(unknown1BytesU32).toBe(struct.unknown1);
  });
});
