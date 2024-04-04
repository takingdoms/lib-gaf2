import { ColorData } from "../../color/color-data";
import { DataConverter } from "../data-converter";
import { DepthConverter, DepthConverters } from "../depth-converters";

type Options = {
  depthConvert8to5?: DepthConverter<8, 5>;
  depthConvert8to1?: DepthConverter<8, 1>;
};

export const convertRGBA8888ToARGB1555: DataConverter<'rgba8888', 'argb1555', Options> = (
  input,
  imgWidth,
  imgHeight,
  options,
): ColorData<'argb1555'> => {
  const outputBytes = new Uint8Array(imgWidth * imgHeight * 2); // 2 = 2 bytes per pixel

  const convert8to5 = options.depthConvert8to5 ?? DepthConverters.round8to5;
  const convert8to1 = options.depthConvert8to1 ?? DepthConverters.transparentOrOne8to1;

  for (let i = 0; i < imgWidth * imgHeight; i++) {
    const inputOffset = i * 4;  // 4 = 4 bytes per pixel
    const outputOffset = i * 2; // 2 = 2 bytes per pixel

    const inputRed   = input.bytes[inputOffset + 0];
    const inputGreen = input.bytes[inputOffset + 1];
    const inputBlue  = input.bytes[inputOffset + 2];
    const inputAlpha = input.bytes[inputOffset + 3];

    const outputRed   = convert8to5(inputRed);
    const outputGreen = convert8to5(inputGreen);
    const outputBlue  = convert8to5(inputBlue);
    const outputAlpha = convert8to1(inputAlpha);

    const outputUint16 = (outputAlpha << 15) | (outputRed << 10) | (outputGreen << 5) | outputBlue;

    outputBytes[outputOffset + 0] = outputUint16 & 0xFF;
    outputBytes[outputOffset + 1] = (outputUint16 >> 8) & 0xFF;
  }

  return {
    format: 'argb1555',
    bytes: outputBytes,
  };
};

export { Options as OptionsRGBA8888ToARGB1555 };
