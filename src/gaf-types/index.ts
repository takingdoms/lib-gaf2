import { ColorData } from '../color/color-data';

export type GafEntry = {
  name: string;
  frames: GafFrame[];
};

export type GafFrame = {
  duration: number;
  frameData: GafFrameData;
};

export type GafFrameData = GafFrameDataSingleLayer | GafFrameDataMultiLayer;

/**
 * The frame alone contains all the data.
 * Was created from a GAF_FRAME_DATA_STRUCT where the FramePointers field was == 0.
 */
export type GafFrameDataSingleLayer = {
  kind: 'single';
  width: number;
  height: number;
  xOffset: number;
  yOffset: number;
  transparencyIndex: number; // used only when LayerData is of type LayerDataPaletteIndices
  layerData: GafLayerData;
};

/**
 * The frame is composited from multiple sub-frames.
 * Was created from a GAF_FRAME_DATA_STRUCT where the FramePointers field was != 0.
 */
export type GafFrameDataMultiLayer = {
  kind: 'multi';
  layers: GafFrameDataSingleLayer[];
};

export type GafLayerData =
  | GafLayerDataPaletteIndices
  | GafLayerDataRawColors;

export type GafLayerDataPaletteIndices = {
  kind: 'palette-idx';

  /** false = was never compressed; true = got decompressed; */
  decompressed: boolean;

  /**
   * Each value represents an index into a palette (usually from .pcx files).
   * Length should always be width * height of the FrameData it belongs to.
   * This is packed as a sequence of ROWS of the image, so, given an index into the array:
   * x = index % width
   * y = index / width
   */
  indices: Uint8Array;
};

export type GafLayerDataRawColors = {
  kind: 'raw-colors';
  colorData: ColorData<'argb1555' | 'argb4444'>;
};
