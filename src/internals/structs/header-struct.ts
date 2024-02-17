import { Struct, U32 } from '../internal-types';
import { StructBufferIO } from '../struct-buffer-io';

export type HeaderStruct = Struct<{
  idVersion:  U32; // 0~4
  entries:    U32; // 4~8
  unknown1:   U32; // 8~12
}>;

export const HEADER_STRUCT_SIZE = 4 + 4 + 4; // 12

export const HEADER_STRUCT_IO: StructBufferIO<HeaderStruct> = {
  read: (buffer, offset) => ({
    idVersion:  buffer.getUint32(offset + 0, true),
    entries:    buffer.getUint32(offset + 4, true),
    unknown1:   buffer.getUint32(offset + 8, true),
  }),
  write: (struct, buffer, offset) => {
    buffer.setUint32(offset + 0, struct.idVersion,  true);
    buffer.setUint32(offset + 4, struct.entries,    true);
    buffer.setUint32(offset + 8, struct.unknown1,   true);
  },
};
