export type GafFileMap = GafFileMapSection[];

export type GafFileMapSection = {
  label: GafFileMapLabel;
  pos: GafFileMapRange;
};

export type GafFileMapLabel =
  | 'header'
  | 'entry_pointer'
  | 'entry'
  | 'frame'
  | 'frame_data'
  | 'sub_frame_data_pointer'
  | 'uncompressed_palette_indices'
  | 'compressed_palette_indices'
  | 'raw_colors';

/** [offset, length] */
export type GafFileMapRange = [number, number];
