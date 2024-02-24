import { BufferUtils } from "../buffer-utils";
import { Struct, U16, U32, CharBuffer } from "../internal-types";
import { StructBufferIO } from "../struct-buffer-io";

export type EntryStruct = Struct<{
  frames:   U16;            // 0~2
  unknown1: U16;            // 2~4
  unknown2: U32;            // 4~8
  name:     CharBuffer<32>; // 8~40
}>;

export const ENTRY_STRUCT_SIZE = 2 + 2 + 4 + 32; // 40

export const ENTRY_STRUCT_IO: StructBufferIO<EntryStruct> = {
  read: (view, offset) => ({
    frames:   view.getUint16(offset + 0, true),
    unknown1: view.getUint16(offset + 2, true),
    unknown2: view.getUint32(offset + 4, true),
    name:     BufferUtils.copyBytes(view, offset + 8, 32),
    // \/ causes a random bug that only happens sometimes
    // name:     new Uint8Array(view.buffer, offset + 8, 32),
  }),
  write: (view, offset, struct) => {
    view.setUint16(offset + 0, struct.frames,   true);
    view.setUint16(offset + 2, struct.unknown1, true);
    view.setUint32(offset + 4, struct.unknown2, true);

    for (let i = 0; i < 32; i++) {
      view.setUint8(offset + 8 + i, struct.name[i]);
    }
  },
};
