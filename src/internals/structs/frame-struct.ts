import { Struct, U32 } from '@/internals/internal-types';
import { StructBufferIO } from '@/internals/struct-buffer-io';

export type FrameStruct = Struct<{
  ptrFrameData: U32;  // 0~4
  duration:     U32;  // 4~8
}>;

export const FRAME_STRUCT_SIZE = 4 + 4; // 8

export const FRAME_STRUCT_IO: StructBufferIO<FrameStruct> = {
  read: (buffer, offset) => ({
    ptrFrameData: buffer.getUint32(offset + 0, true),
    duration:     buffer.getUint32(offset + 4, true),
  }),
  write: (struct, buffer, offset) => {
    buffer.setUint32(offset + 0, struct.ptrFrameData, true);
    buffer.setUint32(offset + 4, struct.duration, true);
  },
};
