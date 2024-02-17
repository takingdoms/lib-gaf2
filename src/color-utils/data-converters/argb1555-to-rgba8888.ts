import { ColorData } from '../../color/color-data';
import { DataConverter } from '../data-converter';
import { DepthConverter, DepthConverters } from '../depth-converters';

type Options = {
  depthConvert1to8?: DepthConverter<1, 8>;
  depthConvert5to8?: DepthConverter<5, 8>;
};

export const convertARGB1555ToRGBA8888: DataConverter<'argb1555', 'rgba8888', Options> = (
  input,
  imgWidth,
  imgHeight,
  options,
): ColorData<'rgba8888'> => {
  const outputBytes = new Uint8Array(imgWidth * imgHeight * 4); // 4 = 4 bytes per pixel

  const convert1to8 = options.depthConvert1to8 ?? DepthConverters.round1to8;
  const convert5to8 = options.depthConvert5to8 ?? DepthConverters.round5to8;

  for (let i = 0; i < imgWidth * imgHeight; i++) {
    const inputOffset = i * 2;  // 2 = 2 bytes per pixel
    const outputOffset = i * 4; // 4 = 4 bytes per pixel

    const inputByte1 = input.bytes[inputOffset + 0]; // byte for alpha + red
    const inputByte2 = input.bytes[inputOffset + 1]; // byte for green + blue

    const inputUint16 = (inputByte2 << 8) | inputByte1; // Little endian!

    const inputAlpha = (inputUint16 & 0x8000) >> 15;
    const inputRed   = (inputUint16 & 0x7C00) >> 10;
    const inputGreen = (inputUint16 & 0x03E0) >> 5;
    const inputBlue  = (inputUint16 & 0x001F) >> 0;

    const outputAlpha = convert1to8(inputAlpha);
    const outputRed   = convert5to8(inputRed);
    const outputGreen = convert5to8(inputGreen);
    const outputBlue  = convert5to8(inputBlue);

    outputBytes[outputOffset + 0] = outputRed;
    outputBytes[outputOffset + 1] = outputGreen;
    outputBytes[outputOffset + 2] = outputBlue;
    outputBytes[outputOffset + 3] = outputAlpha;
  }

  return {
    format: 'rgba8888',
    bytes: outputBytes,
  };
};

export { Options as OptionsARGB1555ToRGBA8888 };
