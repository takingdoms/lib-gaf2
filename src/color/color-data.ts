import { ColorDataFormat } from './color-data-format';

export type ColorData<TFormat extends ColorDataFormat = ColorDataFormat> = {
  format: TFormat;
  bytes: Uint8Array;
};

export module ColorData {
  export function validateDimensions(
    colorData: ColorData,
    imgWidth: number,
    imgHeight: number,
  ): boolean {
    const bytesPerPixel = ColorDataFormat.FORMAT_TO_BYTES[colorData.format];

    const expectedLengthBits = imgWidth * imgHeight * bytesPerPixel;
    const actualLengthBits = colorData.bytes.length;

    return expectedLengthBits === actualLengthBits;
  }
}
