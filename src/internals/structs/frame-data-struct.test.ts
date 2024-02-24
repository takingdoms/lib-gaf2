import { describe, expect, test } from '@jest/globals';
import { FrameDataStruct, FRAME_DATA_STRUCT_IO, FRAME_DATA_STRUCT_SIZE } from './frame-data-struct';
import { BufferUtils } from '../buffer-utils';

describe('frame data struct', () => {
  test('should read the correct data', () => {
    const expectedStruct: FrameDataStruct = {
      width:            0x1234,     // 0~2
      height:           0x5678,     // 2~4
      xPos:             0xA1B2,     // 4~6
      yPos:             0xC1D2,     // 6~8
      transparencyIdx:  0xAB,       // 8~9
      compressed:       0xCD,       // 9~10
      framePointers:    0xF1F2,     // 10~12
      unknown2:         0x12345678, // 12~16
      ptrFrameData:     0x87654321, // 16~20
      unknown3:         0xA1B2C3D4, // 20~24
    };

    const widthBytesU16 = BufferUtils.intToBytesLE(expectedStruct.width, 2);
    const heightBytesU16 = BufferUtils.intToBytesLE(expectedStruct.height, 2);
    const xPosBytesU16 = BufferUtils.intToBytesLE(expectedStruct.xPos, 2);
    const yPosBytesU16 = BufferUtils.intToBytesLE(expectedStruct.yPos, 2);
    const transparencyIdxBytesU8 = BufferUtils.intToBytesLE(expectedStruct.transparencyIdx, 1);
    const compressedBytesU8 = BufferUtils.intToBytesLE(expectedStruct.compressed, 1);
    const framePointersBytesU16 = BufferUtils.intToBytesLE(expectedStruct.framePointers, 2);
    const unknown2BytesU32 = BufferUtils.intToBytesLE(expectedStruct.unknown2, 4);
    const ptrFrameDataBytesU32 = BufferUtils.intToBytesLE(expectedStruct.ptrFrameData, 4);
    const unknown3BytesU32 = BufferUtils.intToBytesLE(expectedStruct.unknown3, 4);

    const inputBuffer = new Uint8Array([
      ...widthBytesU16,
      ...heightBytesU16,
      ...xPosBytesU16,
      ...yPosBytesU16,
      ...transparencyIdxBytesU8,
      ...compressedBytesU8,
      ...framePointersBytesU16,
      ...unknown2BytesU32,
      ...ptrFrameDataBytesU32,
      ...unknown3BytesU32,
    ]);

    expect(inputBuffer.byteLength).toBe(FRAME_DATA_STRUCT_SIZE);

    const inputView = BufferUtils.createView(inputBuffer);
    const actualStruct = FRAME_DATA_STRUCT_IO.read(inputView, 0);

    expect(actualStruct).toMatchObject(expectedStruct);
  });

  test('should write the correct data', () => {
    const struct: FrameDataStruct = {
      width:            0x1234,     // 0~2
      height:           0x5678,     // 2~4
      xPos:             0xA1B2,     // 4~6
      yPos:             0xC1D2,     // 6~8
      transparencyIdx:  0xAB,       // 8~9
      compressed:       0xCD,       // 9~10
      framePointers:    0xF1F2,     // 10~12
      unknown2:         0x12345678, // 12~16
      ptrFrameData:     0x87654321, // 16~20
      unknown3:         0xA1B2C3D4, // 20~24
    };

    const outputBuffer = new Uint8Array(FRAME_DATA_STRUCT_SIZE);
    const outputView = BufferUtils.createView(outputBuffer);

    FRAME_DATA_STRUCT_IO.write(outputView, 0, struct);

    const widthBytesU16 = outputView.getUint16(0, true);
    const heightBytesU16 = outputView.getUint16(2, true);
    const xPosBytesU16 = outputView.getUint16(4, true);
    const yPosBytesU16 = outputView.getUint16(6, true);
    const transparencyIdxBytesU8 = outputView.getUint8(8);
    const compressedBytesU8 = outputView.getUint8(9);
    const framePointersBytesU16 = outputView.getUint16(10, true);
    const unknown2BytesU32 = outputView.getUint32(12, true);
    const ptrFrameDataBytesU32 = outputView.getUint32(16, true);
    const unknown3BytesU32 = outputView.getUint32(20, true);

    expect(widthBytesU16).toBe(struct.width);
    expect(heightBytesU16).toBe(struct.height);
    expect(xPosBytesU16).toBe(struct.xPos);
    expect(yPosBytesU16).toBe(struct.yPos);
    expect(transparencyIdxBytesU8).toBe(struct.transparencyIdx);
    expect(compressedBytesU8).toBe(struct.compressed);
    expect(framePointersBytesU16).toBe(struct.framePointers);
    expect(unknown2BytesU32).toBe(struct.unknown2);
    expect(ptrFrameDataBytesU32).toBe(struct.ptrFrameData);
    expect(unknown3BytesU32).toBe(struct.unknown3);
  });
});
