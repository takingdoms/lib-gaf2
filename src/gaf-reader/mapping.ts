import * as Internals from '../internals';
import { U32 } from '../internals/internal-types';

export type BaseSection<TLabel extends string = string, TContent = any> = {
  label: TLabel;
  content: TContent;
  offset: number;
  length: number;
};

/**
 * Indicates that the section points to raw data into the bytes of the original file.
 * Technically, every other content type also comes from raw bytes. But they're small enough (
 * simple Structs) and can be conveniently passed into the 'content' property.
*/
export const RawBytes = Symbol();
export type RawBytes = typeof RawBytes;

export type HeaderSection = BaseSection<'header', Internals.HeaderStruct>;
export type EntryPointerSection = BaseSection<'entry_pointer', U32>;
export type EntrySection = BaseSection<'entry', Internals.EntryStruct>;
export type FrameSection = BaseSection<'frame', Internals.FrameStruct>;
export type FrameDataSection = BaseSection<'frame_data', Internals.FrameDataStruct>;
export type SubFrameDataPointerSection = BaseSection<'sub_frame_data_pointer', U32>;
export type UncompPalIndicesSection = BaseSection<'uncompressed_palette_indices', RawBytes>;
export type CompPalIndicesSection = BaseSection<'compressed_palette_indices', RawBytes>;
export type RawColors = BaseSection<'raw_colors', RawBytes>;

export type Section =
  | HeaderSection
  | EntryPointerSection
  | EntrySection
  | FrameSection
  | FrameDataSection
  | SubFrameDataPointerSection
  | UncompPalIndicesSection
  | CompPalIndicesSection
  | RawColors;
