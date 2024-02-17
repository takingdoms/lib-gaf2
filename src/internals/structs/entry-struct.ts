import { CharBuffer, Struct, U16, U32 } from '../internal-types';
import { StructBufferIO } from '../struct-buffer-io';
import { BufferUtils } from '../buffer-utils';

export type EntryStruct = Struct<{
  frames:   U16;            // 0~2
  unknown1: U16;            // 2~4
  unknown2: U32;            // 4~8
  name:     CharBuffer<32>; // 8~40
}>;

export const ENTRY_STRUCT_SIZE = 2 + 2 + 4 + 32; // 40

export const ENTRY_STRUCT_IO: StructBufferIO<EntryStruct> = {
  read: (buffer, offset) => ({
    frames:   buffer.getUint16(offset + 0, true),
    unknown1: buffer.getUint16(offset + 2, true),
    unknown2: buffer.getUint32(offset + 4, true),
    name:     BufferUtils.readString(buffer, offset + 8, 32),
  }),
  write: (struct, buffer, offset) => {
    buffer.setUint16(offset + 0, struct.frames,   true);
    buffer.setUint16(offset + 2, struct.unknown1, true);
    buffer.setUint32(offset + 4, struct.unknown2, true);
    BufferUtils.writeString(buffer, offset + 8, struct.name);
  },
};
