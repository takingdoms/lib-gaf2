import { describe, expect, test } from '@jest/globals';
import { FrameStruct, FRAME_STRUCT_IO, FRAME_STRUCT_SIZE } from './frame-struct';
import { BufferUtils } from '../buffer-utils';

describe('frame struct', () => {
  test('should read the correct data', () => {
    const expectedStruct: FrameStruct = {
      ptrFrameData:     0x12345678, // 0~4
      duration:         0xABCDEF01, // 4~8
    };

    const widthBytesU32 = BufferUtils.intToBytesLE(expectedStruct.ptrFrameData, 4);
    const durationBytesU32 = BufferUtils.intToBytesLE(expectedStruct.duration, 4);

    const inputBuffer = new Uint8Array([
      ...widthBytesU32,
      ...durationBytesU32,
    ]);

    expect(inputBuffer.byteLength).toBe(FRAME_STRUCT_SIZE);

    const inputView = BufferUtils.createView(inputBuffer);
    const actualStruct = FRAME_STRUCT_IO.read(inputView, 0);

    expect(actualStruct).toMatchObject(expectedStruct);
  });

  test('should write the correct data', () => {
    const struct: FrameStruct = {
      ptrFrameData:     0x12345678, // 0~4
      duration:         0xABCDEF01, // 4~8
    };

    const outputBuffer = new Uint8Array(FRAME_STRUCT_SIZE);
    const outputView = BufferUtils.createView(outputBuffer);

    FRAME_STRUCT_IO.write(outputView, 0, struct);

    const ptrFrameDataBytesU32 = outputView.getUint32(0, true);
    const durationBytesU32 = outputView.getUint32(4, true);

    expect(ptrFrameDataBytesU32).toBe(struct.ptrFrameData);
    expect(durationBytesU32).toBe(struct.duration);
  });
});
