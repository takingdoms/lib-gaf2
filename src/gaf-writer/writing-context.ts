import { GafLayerData, GafLayerDataRawColors } from "../gaf-types";
import { LayerDataCache } from "./layer-data-cache";

export class WritingContext {
  private segments: Uint8Array[] = [];
  private totalSize = 0;
  private format: string | undefined = undefined;
  private rawColorsFormat: string | undefined = undefined;

  public readonly layerDataCache = new LayerDataCache();

  pushSegment(buffer: Uint8Array) {
    this.segments.push(buffer);
    this.totalSize += buffer.length;
  }

  getCurrentSize() {
    return this.totalSize;
  }

  createFinalBuffer() {
    const buffer = new Uint8Array(this.totalSize);

    let offset = 0;

    this.segments.forEach((segment) => {
      buffer.set(segment, offset);
      offset += segment.length;
    });

    return buffer;
  }

  validateFormat(format: GafLayerData['kind']) {
    if (this.format === undefined) {
      this.format = format;
      return;
    }

    if (this.format !== format) {
      throw new Error(`Current format doesn't match with the format of the existing context.`
        + ` \nExpected: "${this.format}"; Got: "${format}"`);
    }
  }

  validateRawColorsFormat(format: GafLayerDataRawColors['colorData']['format']) {
    if (this.rawColorsFormat === undefined) {
      this.rawColorsFormat = format;
      return;
    }

    if (this.rawColorsFormat !== format) {
      throw new Error(`Current color format doesn't match with the color format of the existing context.`
        + ` \nExpected: "${this.format}"; Got: "${format}"`);
    }
  }
}
