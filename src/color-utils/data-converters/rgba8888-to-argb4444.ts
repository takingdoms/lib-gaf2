import { ColorData } from "../../color/color-data";
import { DataConverter } from "../data-converter";
import { DepthConverter, DepthConverters } from "../depth-converters";

type Options = {
  depthConvert8to4?: DepthConverter<8, 4>;
};

export const convertRGBA8888ToARGB4444: DataConverter<'rgba8888', 'argb4444', Options> = (
  input,
  imgWidth,
  imgHeight,
  options,
): ColorData<'argb4444'> => {
  const outputBytes = new Uint8Array(imgWidth * imgHeight * 2); // 2 = 2 bytes per pixel

  const convert8to4 = options.depthConvert8to4 ?? DepthConverters.round8to4;

  for (let i = 0; i < imgWidth * imgHeight; i++) {
    const inputOffset = i * 4;  // 4 = 4 bytes per pixel
    const outputOffset = i * 2; // 2 = 2 bytes per pixel

    const inputRed   = input.bytes[inputOffset + 0];
    const inputGreen = input.bytes[inputOffset + 1];
    const inputBlue  = input.bytes[inputOffset + 2];
    const inputAlpha = input.bytes[inputOffset + 3];

    const outputRed   = convert8to4(inputRed);
    const outputGreen = convert8to4(inputGreen);
    const outputBlue  = convert8to4(inputBlue);
    const outputAlpha = convert8to4(inputAlpha);

    const outputUint16 = (outputAlpha << 12) | (outputRed << 8) | (outputGreen << 4) | outputBlue;

    outputBytes[outputOffset + 0] = outputUint16 & 0xFF;
    outputBytes[outputOffset + 1] = (outputUint16 >> 8) & 0xFF;
  }

  return {
    format: 'argb4444',
    bytes: outputBytes,
  };
};

export { Options as OptionsRGBA8888ToARGB4444 };
