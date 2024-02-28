import { ColorData } from "../color/color-data";

export type GafResult = {
  header: GafHeader;
  entries: GafEntry[];
};

export type GafHeader = {
  idVersion: number;  // normally 0x00010100
  unknown1: number;   // normally 0x00000000
};

export type GafEntry = {
  name: string;
  frames: GafFrame[];
  unknown1: number;   // normally 0x0001
  unknown2: number;   // normaly 0x00000001
};

export type GafFrame = {
  duration: number;
  frameData: GafFrameData;
};

export type BaseGafFrameData = {
  width: number;
  height: number;
  xOffset: number;
  yOffset: number;
  transparencyIndex: number; // used only when LayerData is of type LayerDataPaletteIndices
  unknown2: number; // normally 0x00000000
  unknown3: number; // varies!!!
};

export type GafFrameDataSingleLayer = BaseGafFrameData & {
  kind: 'single';
  layerData: GafLayerData;
};

/// BaseGafFrameData appears to be useless here but it's still included for struct consistency
export type GafFrameDataMultiLayer = BaseGafFrameData & {
  kind: 'multi';
  layers: GafFrameDataSingleLayer[];
};

export type GafFrameData = GafFrameDataSingleLayer | GafFrameDataMultiLayer;

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
