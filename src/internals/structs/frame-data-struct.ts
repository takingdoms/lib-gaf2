import { Struct, U16, U8, U32, I16 } from "../internal-types";
import { StructBufferIO } from "../struct-buffer-io";

export type FrameDataStruct = Struct<{
  width:            U16;  // 0~2
  height:           U16;  // 2~4
  xPos:             I16;  // 4~6
  yPos:             I16;  // 6~8
  transparencyIdx:  U8;   // 8~9
  compressed:       U8;   // 9~10
  framePointers:    U16;  // 10~12
  unknown2:         U32;  // 12~16
  ptrFrameData:     U32;  // 16~20
  unknown3:         U32;  // 20~24
}>;

export const FRAME_DATA_STRUCT_SIZE = 24;

export const FRAME_DATA_STRUCT_IO: StructBufferIO<FrameDataStruct> = {
  read: (buffer, offset) => ({
    width:            buffer.getUint16(offset + 0, true),
    height:           buffer.getUint16(offset + 2, true),
    xPos:             buffer.getInt16(offset + 4, true),
    yPos:             buffer.getInt16(offset + 6, true),
    transparencyIdx:  buffer.getUint8 (offset + 8),
    compressed:       buffer.getUint8 (offset + 9),
    framePointers:    buffer.getUint16(offset + 10, true),
    unknown2:         buffer.getUint32(offset + 12, true),
    ptrFrameData:     buffer.getUint32(offset + 16, true),
    unknown3:         buffer.getUint32(offset + 20, true),
  }),
  write: (buffer, offset, struct) => {
    buffer.setUint16(offset + 0,  struct.width,           true);
    buffer.setUint16(offset + 2,  struct.height,          true);
    buffer.setInt16 (offset + 4,  struct.xPos,            true);
    buffer.setInt16 (offset + 6,  struct.yPos,            true);
    buffer.setUint8 (offset + 8,  struct.transparencyIdx);
    buffer.setUint8 (offset + 9,  struct.compressed);
    buffer.setUint16(offset + 10, struct.framePointers,   true);
    buffer.setUint32(offset + 12, struct.unknown2,        true);
    buffer.setUint32(offset + 16, struct.ptrFrameData,    true);
    buffer.setUint32(offset + 20, struct.unknown3,        true);
  },
};
