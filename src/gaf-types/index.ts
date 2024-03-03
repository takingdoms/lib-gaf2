import { ColorData } from "../color/color-data";

export type GafFormat = 'gaf' | 'taf';

export type GafResult<T extends GafFormat = GafFormat> = {
  header: GafHeader;
  entries: GafEntry<T>[];
};

export type GafHeader = {
  idVersion: number;  // normally 0x00010100
  unknown1: number;   // normally 0x00000000
};

export type GafEntry<T extends GafFormat = GafFormat> = {
  name: string;
  frames: GafFrame<T>[];
  unknown1: number;   // normally 0x0001
  unknown2: number;   // normaly 0x00000001
};

export type GafFrame<T extends GafFormat = GafFormat> = {
  duration: number;
  frameData: GafFrameData<T>;
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

export type GafFrameDataSingleLayer<T extends GafFormat = GafFormat> = BaseGafFrameData & {
  kind: 'single';
  layerData: GafLayerData<T>;
};

/// BaseGafFrameData appears to be useless here but it's still included for struct consistency
export type GafFrameDataMultiLayer<T extends GafFormat = GafFormat> = BaseGafFrameData & {
  kind: 'multi';
  layers: GafFrameDataSingleLayer<T>[];
};

export type GafFrameData<T extends GafFormat = GafFormat> =
  | GafFrameDataSingleLayer<T>
  | GafFrameDataMultiLayer<T>;

export type GafLayerData<T extends GafFormat = GafFormat> =
  T extends 'gaf' ? GafLayerDataPaletteIndices :
  T extends 'taf' ? GafLayerDataRawColors :
  never;

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
